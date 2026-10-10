const mongoose = require('mongoose');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const { success, error } = require('../utils/responses');
const { createProductFilter, recomputeProductSummary, generateVariantSku } = require('../utils/product');

function prepareVariantPayload(rawVariant, productTitle, index = 1) {
    const variant = { ...rawVariant };

    // Support legacy color and size if passed
    if (!variant.attributes || typeof variant.attributes !== 'object') {
        variant.attributes = {};
    }
    if (variant.color && !variant.attributes['اللون']) {
        variant.attributes['اللون'] = variant.color;
    }
    if (variant.size && !variant.attributes['المقاس']) {
        variant.attributes['المقاس'] = variant.size;
    }

    // Auto-generate SKU if omitted
    if (!variant.sku || !String(variant.sku).trim()) {
        variant.sku = generateVariantSku(productTitle, variant.attributes, index);
    } else {
        variant.sku = String(variant.sku).trim().toUpperCase();
    }

    variant.price = Number(variant.price) || 0;
    variant.stock = Number(variant.stock) || 0;
    if (variant.compareAtPrice !== undefined && variant.compareAtPrice !== null) {
        variant.compareAtPrice = Number(variant.compareAtPrice);
    }

    return variant;
}

async function createProductDocuments(productData, rawVariants, session = null) {
    const options = session ? { session } : {};
    let product = null;

    try {
        [product] = await Product.create([productData], options);

        const variantsToCreate = (rawVariants || []).map((raw, idx) => {
            const prepared = prepareVariantPayload(raw, product.title, idx + 1);
            return {
                ...prepared,
                productId: product._id,
            };
        });

        const createdVariants = await Variant.create(variantsToCreate, options);

        // Recompute minPrice, maxPrice, totalStock, inStock on the product
        await recomputeProductSummary(product._id, session);

        const freshProduct = await Product.findById(product._id)
            .populate('storeId', 'name logo address')
            .populate('categoryId', 'title slug icon')
            .session(session || null)
            .lean();

        return {
            ...freshProduct,
            variants: createdVariants.map((v) => v.toObject()),
        };
    } catch (err) {
        if (!session && product) {
            try {
                await Variant.deleteMany({ productId: product._id });
                await Product.deleteOne({ _id: product._id });
            } catch (cleanupErr) {
                console.error('Rollback cleanup error in createProductDocuments:', cleanupErr);
            }
        }
        throw err;
    }
}

async function updateProductDocuments({ id, storeId, productUpdates, variants, session = null }) {
    const options = session ? { session } : {};
    const productQuery = Product.findOne({ _id: id, storeId, isDeleted: { $ne: true } });
    if (session) productQuery.session(session);
    const product = await productQuery;
    if (!product) return null;

    let originalVariantIds = [];

    if (variants && Array.isArray(variants)) {
        const originalVariants = await Variant.find({ productId: product._id })
            .select('_id')
            .session(session || null)
            .lean();
        originalVariantIds = originalVariants.map((v) => v._id);

        const requestedExistingIds = variants
            .filter((v) => v._id)
            .map((v) => String(v._id));

        const existingFound = await Variant.find({
            _id: { $in: requestedExistingIds },
            productId: product._id,
        }).session(session || null);

        if (existingFound.length !== requestedExistingIds.length) {
            const err = new Error('One or more variants do not belong to this product');
            err.statusCode = 400;
            throw err;
        }

        try {
            const newVariantsPayload = variants
                .filter((v) => !v._id)
                .map((raw, idx) => {
                    const prepared = prepareVariantPayload(raw, productUpdates?.title || product.title, idx + 1);
                    return {
                        ...prepared,
                        productId: product._id,
                        isActive: product.isActive,
                        isSuspended: product.isSuspended,
                    };
                });

            const createdVariants = newVariantsPayload.length > 0
                ? await Variant.create(newVariantsPayload, options)
                : [];

            const updatedVariantIds = [];

            for (const v of variants.filter((item) => item._id)) {
                const updates = { ...v };
                delete updates._id;

                if (updates.sku) updates.sku = String(updates.sku).trim().toUpperCase();
                if (updates.price !== undefined) updates.price = Number(updates.price);
                if (updates.stock !== undefined) updates.stock = Number(updates.stock);

                const updated = await Variant.findOneAndUpdate(
                    { _id: v._id, productId: product._id },
                    { $set: updates },
                    { new: true, runValidators: true, ...options }
                );

                if (updated) {
                    updatedVariantIds.push(updated._id);
                }
            }

            const retainedIds = [
                ...updatedVariantIds,
                ...createdVariants.map((v) => v._id),
            ];

            // Remove deleted variants
            await Variant.deleteMany(
                {
                    productId: product._id,
                    _id: { $nin: retainedIds },
                },
                options
            );
        } catch (err) {
            if (!session) {
                try {
                    await Variant.deleteMany({
                        productId: product._id,
                        _id: { $nin: originalVariantIds },
                    });
                } catch (cleanupErr) {
                    console.error('Rollback cleanup error in updateProductDocuments:', cleanupErr);
                }
            }
            throw err;
        }
    }

    if (productUpdates && Object.keys(productUpdates).length > 0) {
        Object.assign(product, productUpdates);
        await product.save(options);
    }

    // Always recompute summary after updates
    await recomputeProductSummary(product._id, session);

    const updatedProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo address')
        .populate('categoryId', 'title slug icon')
        .session(session || null)
        .lean();

    updatedProduct.variants = await Variant.find({ productId: product._id })
        .session(session || null)
        .lean();

    return updatedProduct;
}

async function getProductDetails(req, res, next, admin = false) {
    try {
        const filter = { _id: req.params.id, isDeleted: { $ne: true } };
        if (!admin) {
            filter.isActive = true;
            filter.isSuspended = false;
        }

        const product = await Product.findOne(filter)
            .populate('storeId', 'name logo address balance')
            .populate('categoryId', 'title slug icon')
            .lean();

        if (!product) {
            return error(res, 404, 'Product not found');
        }

        const variantFilter = { productId: product._id };
        if (!admin) {
            variantFilter.isActive = true;
            variantFilter.isSuspended = { $ne: true };
        }

        product.variants = await Variant.find(variantFilter).lean();
        return success(res, 200, { product });
    } catch (err) {
        return next(err);
    }
}

async function listProducts(req, res, next, admin = false, sellerStoreId = null) {
    try {
        const {
            page = 1,
            limit = 20,
            sort = 'newest',
        } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

        const productFilter = createProductFilter(req.query, admin);
        if (sellerStoreId) {
            productFilter.storeId = sellerStoreId;
        }

        // Direct MongoDB index sorting
        const sortOptions = {};
        if (sort === 'price_asc') {
            sortOptions.minPrice = 1;
        } else if (sort === 'price_desc') {
            sortOptions.maxPrice = -1;
        } else {
            sortOptions.createdAt = -1;
        }
        sortOptions._id = -1;

        const [total, products] = await Promise.all([
            Product.countDocuments(productFilter),
            Product.find(productFilter)
                .sort(sortOptions)
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .populate('storeId', 'name logo address')
                .populate('categoryId', 'title slug icon')
                .lean(),
        ]);

        // Attach variants for the returned page documents only
        const pageProductIds = products.map((p) => p._id);
        const variants = await Variant.find({
            productId: { $in: pageProductIds },
            isActive: true,
            isSuspended: { $ne: true },
        }).lean();

        const variantsMap = new Map();
        variants.forEach((v) => {
            const key = String(v.productId);
            if (!variantsMap.has(key)) variantsMap.set(key, []);
            variantsMap.get(key).push(v);
        });

        const orderedProducts = products.map((p) => ({
            ...p,
            variants: variantsMap.get(String(p._id)) || [],
        }));

        return success(res, 200, {
            products: orderedProducts,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize) || 1,
            },
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    createProductDocuments,
    updateProductDocuments,
    getProductDetails,
    listProducts,
    prepareVariantPayload,
};