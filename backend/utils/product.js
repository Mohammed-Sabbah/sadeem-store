const mongoose = require('mongoose');
const { escapeRegex } = require('./index');
const { roundMoney } = require('./money');

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

    // فلترة الخيارات السريعة عبر Product.options (e.g. optionKey=color & optionValue=red)
    if (query.optionKey && query.optionValue) {
        filter.options = {
            $elemMatch: {
                key: String(query.optionKey).toLowerCase().trim(),
                values: String(query.optionValue).trim(),
            },
        };
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

    const minPrice = roundMoney(summary?.minPrice ?? 0);
    const maxPrice = roundMoney(summary?.maxPrice ?? 0);
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

/**
 * توليد كود SKU تلقائي مفهوم يعتمد على القيم الحقيقية (وليس المفاتيح العشوائية)
 * Format: SDM-{CAT}-{ATTR_VALS}-{INDEX}-{RANDOM}
 */
function generateVariantSku(categoryCodeOrTitle = 'ITEM', attributes = {}, index = 1) {
    const cleanPrefix = (categoryCodeOrTitle || 'ITEM')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase() || 'PROD';

    let attrPart = '';
    if (attributes && typeof attributes === 'object') {
        const entries = attributes instanceof Map
            ? [...attributes.entries()]
            : Object.entries(attributes);

        const values = entries
            .map(([, v]) => String(v || '').trim())
            .filter(Boolean)
            .map((v) => {
                // إزالة المحارف غير اللاتينية/الأرقام أو اختصارها
                const cleaned = v.replace(/[^a-zA-Z0-9]/g, '');
                return cleaned ? cleaned.slice(0, 4).toUpperCase() : 'VAL';
            });

        attrPart = values.slice(0, 3).join('-');
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `SDM-${cleanPrefix}${attrPart ? `-${attrPart}` : ''}-${index}-${randomSuffix}`;
}

module.exports = {
    createProductFilter,
    recomputeProductSummary,
    generateVariantSku,
};