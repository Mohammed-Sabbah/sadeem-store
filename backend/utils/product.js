const mongoose = require('mongoose');
const { escapeRegex } = require('./index');

function createProductFilter(query, admin = false) {
    const filter = { isDeleted: { $ne: true } };

    if (admin) {
        if (query.isActive !== undefined) filter.isActive = query.isActive === 'true' || query.isActive === true;
        if (query.isSuspended !== undefined) filter.isSuspended = query.isSuspended === 'true' || query.isSuspended === true;
    } else {
        filter.isActive = true;
        filter.isSuspended = false;
    }

    if (query.storeId) {
        filter.storeId = new mongoose.Types.ObjectId(query.storeId);
    }

    if (query.categoryId) {
        filter.categoryId = new mongoose.Types.ObjectId(query.categoryId);
    }

    if (query.inStock !== undefined) {
        const inStockBool = query.inStock === 'true' || query.inStock === true || query.inStock === 1 || query.inStock === '1';
        filter.inStock = inStockBool;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        const priceFilter = {};
        if (query.minPrice !== undefined) priceFilter.$gte = Number(query.minPrice);
        if (query.maxPrice !== undefined) priceFilter.$lte = Number(query.maxPrice);
        filter.minPrice = priceFilter;
    }

    if (query.search) {
        const search = new RegExp(escapeRegex(query.search), 'i');
        filter.$or = [{ title: search }, { description: search }];
    }

    return filter;
}

async function recomputeProductSummary(productId, session = null) {
    const Product = require('../models/Product');
    const Variant = require('../models/Variant');

    const options = session ? { session } : {};
    const objectId = new mongoose.Types.ObjectId(productId);

    const [summary] = await Variant.aggregate([
        {
            $match: {
                productId: objectId,
                isActive: true,
                isSuspended: { $ne: true },
            },
        },
        {
            $group: {
                _id: null,
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                totalStock: { $sum: '$stock' },
                count: { $sum: 1 },
            },
        },
    ]).session(session || null);

    const minPrice = summary?.minPrice ?? 0;
    const maxPrice = summary?.maxPrice ?? 0;
    const totalStock = summary?.totalStock ?? 0;
    const inStock = totalStock > 0;

    await Product.updateOne(
        { _id: productId },
        {
            $set: {
                minPrice,
                maxPrice,
                totalStock,
                inStock,
            },
        },
        options
    );

    return { minPrice, maxPrice, totalStock, inStock };
}

function generateVariantSku(productTitle, attributes = {}, index = 1) {
    const titlePart = (productTitle || 'ITEM')
        .replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '')
        .slice(0, 4)
        .toUpperCase() || 'PROD';

    let attrPart = '';
    if (attributes && typeof attributes === 'object') {
        const values = attributes instanceof Map
            ? [...attributes.values()]
            : Object.values(attributes);
        attrPart = values
            .filter(Boolean)
            .map((v) => String(v).slice(0, 3).toUpperCase())
            .join('-');
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `SDM-${titlePart}${attrPart ? `-${attrPart}` : ''}-${index}-${randomSuffix}`;
}

module.exports = {
    createProductFilter,
    recomputeProductSummary,
    generateVariantSku,
};