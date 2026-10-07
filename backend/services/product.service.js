const Product = require("../models/Product");
const Variant = require("../models/Variant");
const { success } = require("../utils/responses")
const { getCategoryStoreIds } = require("../utils/category")
const { createProductFilter } = require("../utils/product")

async function createProductDocuments(productData, variants, session) {
    const options = session ? { session } : {};
    let product;

    try {
        [product] = await Product.create([productData], options);
        const createdVariants = await Variant.create(
            variants.map((variant) => ({
                productId: product._id,
                ...variant
            })),
            options
        );

        return {
            ...product.toObject(),
            variants: createdVariants.map((variant) => variant.toObject()),
        };
    } catch (err) {
        if (!session && product) {
            const cleanupErrors = [];

            try {
                await Variant.deleteMany({ productId: product._id });
            } catch (cleanupError) {
                cleanupErrors.push(cleanupError);
            }

            try {
                await Product.deleteOne({ _id: product._id });
            } catch (cleanupError) {
                cleanupErrors.push(cleanupError);
            }

            if (cleanupErrors.length > 0) {
                throw new AggregateError(
                    [err, ...cleanupErrors],
                    'Product creation failed and rollback cleanup was incomplete'
                );
            }
        }

        throw err;
    }
}

async function updateProductDocuments({ id, storeId, productUpdates, variants, session }) {
    const options = session ? { session } : {};
    const productQuery = Product.findOne({ _id: id, storeId, isDeleted: { $ne: true } });
    if (session) productQuery.session(session);
    const product = await productQuery;
    if (!product) return null;

    let originalVariantIds = [];
    if (variants) {
        const originalVariantsQuery = Variant.find({ productId: product._id }).select('_id');
        if (session) originalVariantsQuery.session(session);
        const originalVariants = await originalVariantsQuery.lean();
        originalVariantIds = originalVariants.map((variant) => variant._id);

        const requestedIds = variants.filter((variant) => variant._id).map((variant) => variant._id);
        const requestedExistingQuery = Variant.find({
            _id: { $in: requestedIds },
            productId: product._id,
        });
        if (session) requestedExistingQuery.session(session);
        const requestedExisting = await requestedExistingQuery;

        if (requestedExisting.length !== requestedIds.length) {
            const ownershipError = new Error('Variant does not belong to this product');
            ownershipError.statusCode = 400;
            throw ownershipError;
        }

        try {
            const newVariants = variants.filter((variant) => !variant._id);
            const createdVariants = newVariants.length
                ? await Variant.create(
                    newVariants.map((variant) => ({
                        ...variant,
                        productId: product._id,
                        isActive: product.isActive,
                        isSuspended: product.isSuspended,
                        suspensionReason: product.suspensionReason,
                    })),
                    options
                )
                : [];
            const updatedVariantIds = [];

            for (const variant of variants.filter((item) => item._id)) {
                const updates = { ...variant };
                delete updates._id;
                const updateOptions = { new: true, runValidators: true, ...options };
                const updatedVariant = await Variant.findOneAndUpdate(
                    { _id: variant._id, productId: product._id },
                    { $set: updates },
                    updateOptions
                );
                if (!updatedVariant) {
                    const ownershipError = new Error('Variant does not belong to this product');
                    ownershipError.statusCode = 400;
                    throw ownershipError;
                }
                updatedVariantIds.push(updatedVariant._id);
            }

            const retainedVariantIds = [
                ...updatedVariantIds,
                ...createdVariants.map((variant) => variant._id),
            ];
            await Variant.deleteMany(
                {
                    productId: product._id,
                    _id: { $nin: retainedVariantIds },
                },
                options
            );
        } catch (err) {
            if (!session) {
                try {
                    await Variant.deleteMany(
                        {
                            productId: product._id,
                            _id: { $nin: originalVariantIds },
                        }
                    );
                } catch (cleanupError) {
                    throw new AggregateError(
                        [err, cleanupError],
                        'Variant update failed and rollback cleanup was incomplete'
                    );
                }
            }
            throw err;
        }
    }

    if (Object.keys(productUpdates).length > 0) {
        Object.assign(product, productUpdates);
        await product.save(options);
    }

    const updatedProduct = await Product.findById(product._id)
        .populate('storeId', 'name logo categoryId')
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
            .populate('storeId', 'name logo categoryId')
            .lean();

        if (!product) {
            return error(res, 404, 'Product not found');
        }

        product.variants = await Variant.find({ productId: product._id }).lean();
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
            minPrice,
            maxPrice,
            inStock,
            sort = 'newest',
            categoryId,
            storeId,
        } = req.query;
        const pageNumber = Number(page);
        const pageSize = Number(limit);
        const productFilter = createProductFilter(req.query, admin);
        if (sellerStoreId) {
            productFilter.storeId = sellerStoreId;
        }

        if (categoryId) {
            productFilter.storeId = {
                $in: await getCategoryStoreIds(categoryId, sellerStoreId || storeId),
            };
        }

        const variantFilter = {};
        if (minPrice !== undefined || maxPrice !== undefined) {
            variantFilter.price = {};
            if (minPrice !== undefined) variantFilter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) variantFilter.price.$lte = Number(maxPrice);
        }
        if (inStock !== undefined) {
            variantFilter.stock = inStock ? { $gt: 0 } : { $lte: 0 };
        }

        const priceDirection = sort === 'price_desc' ? -1 : 1;
        const orderByPrice = sort === 'price_asc' || sort === 'price_desc';
        const hasVariantFilters = Object.keys(variantFilter).length > 0;
        let products;
        let total;

        if (!hasVariantFilters && !orderByPrice) {
            [total, products] = await Promise.all([
                Product.countDocuments(productFilter),
                Product.find(productFilter)
                    .sort({ createdAt: -1, _id: -1 })
                    .skip((pageNumber - 1) * pageSize)
                    .limit(pageSize)
                    .populate('storeId', 'name logo categoryId')
                    .lean(),
            ]);
        } else {
            const matchingVariants = await Variant.find(variantFilter)
                .sort({ price: priceDirection, _id: 1 })
                .select('productId price')
                .lean();
            const matchingPrices = new Map();
            matchingVariants.forEach((variant) => {
                const id = String(variant.productId);
                if (!matchingPrices.has(id)) matchingPrices.set(id, variant.price);
            });

            const matchingProductFilter = {
                ...productFilter,
                _id: { $in: [...matchingPrices.keys()] },
            };

            if (orderByPrice) {
                const matchingProducts = await Product.find(matchingProductFilter)
                    .select('_id')
                    .lean();
                const ids = matchingProducts
                    .map((product) => product._id)
                    .sort((left, right) => {
                        const priceDifference =
                            (matchingPrices.get(String(left)) - matchingPrices.get(String(right))) *
                            priceDirection;
                        return priceDifference || String(left).localeCompare(String(right));
                    });
                total = ids.length;
                const pageIds = ids.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
                products = await Product.find({ _id: { $in: pageIds } })
                    .populate('storeId', 'name logo categoryId')
                    .lean();
                const productsById = new Map(products.map((product) => [String(product._id), product]));
                products = pageIds.map((id) => productsById.get(String(id))).filter(Boolean);
            } else {
                [total, products] = await Promise.all([
                    Product.countDocuments(matchingProductFilter),
                    Product.find(matchingProductFilter)
                        .sort({ createdAt: -1, _id: -1 })
                        .skip((pageNumber - 1) * pageSize)
                        .limit(pageSize)
                        .populate('storeId', 'name logo categoryId')
                        .lean(),
                ]);
            }
        }

        const ids = products.map((product) => product._id);
        const variants = await Variant.find({ productId: { $in: ids } }).lean();
        const variantsByProductId = new Map();
        variants.forEach((variant) => {
            const key = String(variant.productId);
            const productVariants = variantsByProductId.get(key) || [];
            productVariants.push(variant);
            variantsByProductId.set(key, productVariants);
        });
        const orderedProducts = products.map((product) => ({
            ...product,
            variants: variantsByProductId.get(String(product._id)) || [],
        }));

        return success(res, 200, {
            products: orderedProducts,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize),
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
}