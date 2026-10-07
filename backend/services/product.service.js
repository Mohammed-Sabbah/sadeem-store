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
                ...variant,
                productId: product._id,
                isActive: product.isActive,
                isSuspended: product.isSuspended,
                suspensionReason: product.suspensionReason,
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
    const productQuery = Product.findOne({ _id: id, storeId });
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
        const filter = { _id: req.params.id };
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

async function listProducts(req, res, next, admin = false) {
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

        if (categoryId) {
            productFilter.storeId = { $in: await getCategoryStoreIds(categoryId, storeId) };
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
        const productPipeline = [
            { $match: productFilter },
            {
                $lookup: {
                    from: Variant.collection.name,
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$productId', '$$productId'] },
                                ...variantFilter,
                            },
                        },
                        { $sort: { price: priceDirection, _id: 1 } },
                        { $project: { _id: 1, price: 1, stock: 1 } },
                    ],
                    as: 'matchingVariants',
                },
            },
            { $match: { 'matchingVariants.0': { $exists: true } } },
            { $addFields: { sortPrice: { $arrayElemAt: ['$matchingVariants.price', 0] } } },
            {
                $sort: orderByPrice
                    ? { sortPrice: priceDirection, _id: 1 }
                    : { createdAt: -1, _id: -1 },
            },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    products: [
                        { $skip: (pageNumber - 1) * pageSize },
                        { $limit: pageSize },
                        { $project: { _id: 1 } },
                    ],
                },
            },
        ];

        const [result] = await Product.aggregate(productPipeline);
        const ids = result.products.map((product) => product._id);
        const total = result.metadata.length ? result.metadata[0].total : 0;
        const [products, variants] = await Promise.all([
            Product.find({ _id: { $in: ids } })
                .populate('storeId', 'name logo categoryId')
                .lean(),
            Variant.find({ productId: { $in: ids } }).lean(),
        ]);
        const variantsByProductId = new Map();
        variants.forEach((variant) => {
            const key = String(variant.productId);
            const productVariants = variantsByProductId.get(key) || [];
            productVariants.push(variant);
            variantsByProductId.set(key, productVariants);
        });
        const productsById = new Map(products.map((product) => [String(product._id), product]));
        const orderedProducts = ids
            .map((id) => productsById.get(String(id)))
            .filter(Boolean)
            .map((product) => ({
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