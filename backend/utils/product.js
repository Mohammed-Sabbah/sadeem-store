const mongoose = require('mongoose');
const { escapeRegex } = require('./index');
const { roundMoney } = require('./money');
const { STATUS, APPROVE_STATUS } = require('../constants/enums');

function createProductFilter(query, admin = false, storeId = null) {
    const filter = { isDeleted: false };

    if (storeId) {
        filter.storeId = new mongoose.Types.ObjectId(storeId);
        if (query.status) filter.status = query.status;
        if (query.approveStatus) filter.approveStatus = query.approveStatus;
    } else if (admin) {
        if (query.status) filter.status = query.status;
        if (query.approveStatus) filter.approveStatus = query.approveStatus;
        if (query.isActive !== undefined) filter.isActive = query.isActive === 'true' || query.isActive === true;
        if (query.isSuspended !== undefined) filter.isSuspended = query.isSuspended === 'true' || query.isSuspended === true;
        if (query.storeId) filter.storeId = new mongoose.Types.ObjectId(query.storeId);
    } else {
        // Public Storefront Filter: Active & Approved Only
        filter.status = STATUS.ACTIVE;
        filter.approveStatus = APPROVE_STATUS.APPROVED;
        filter.isActive = true;
        filter.isSuspended = false;
        if (query.storeId) filter.storeId = new mongoose.Types.ObjectId(query.storeId);
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

    const searchQuery = query.search || query.q;
    if (searchQuery) {
        const search = new RegExp(escapeRegex(searchQuery), 'i');
        filter.$or = [{ title: search }, { description: search }];
    }

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

    // احتساب ملخص الأسعار والمخزون للأصناف النشطة والموثقة وغير المحذوفة
    const [summary] = await Variant.aggregate([
        {
            $match: {
                productId: objectId,
                isDeleted: false,
                status: STATUS.ACTIVE,
                approveStatus: APPROVE_STATUS.APPROVED,
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

    // التحقق من وجود أي أصناف غير محذوفة (حتى لو كانت بانتظار الموافقة أو غير نشطة)
    const anyNonDeletedVariant = await Variant.findOne({
        productId: objectId,
        isDeleted: false,
    }).session(session || null);

    const minPrice = roundMoney(summary?.minPrice ?? 0);
    const maxPrice = roundMoney(summary?.maxPrice ?? 0);
    const totalStock = summary?.totalStock ?? 0;
    const inStock = totalStock > 0;

    const updateFields = {
        minPrice,
        maxPrice,
        totalStock,
        inStock,
    };

    // إذا لم يعد هناك أي صنف قائم للمنتج، يتم تحويل حالة المنتج إلى غير نشط
    if (!anyNonDeletedVariant) {
        updateFields.status = STATUS.IN_ACTIVE;
        updateFields.isActive = false;
    }

    await Product.updateOne(
        { _id: productId },
        { $set: updateFields },
        options
    );

    return { minPrice, maxPrice, totalStock, inStock };
}

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
                const cleaned = v.replace(/[^a-zA-Z0-9]/g, '');
                return cleaned ? cleaned.slice(0, 4).toUpperCase() : 'VAL';
            });

        attrPart = values.slice(0, 3).join('-');
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `SDM-${cleanPrefix}${attrPart ? `-${attrPart}` : ''}-${index}-${randomSuffix}`;
}

function normalizeAttributes(attributes, definitions = []) {
    const entries = attributes instanceof Map
        ? Array.from(attributes.entries())
        : Object.entries(attributes || {});
    const hasValues = entries.some(([, value]) => String(value || '').trim());

    if (!hasValues || !definitions || definitions.length === 0) {
        const cleanObj = Object.create(null);
        for (const [name, val] of entries) {
            if (val !== undefined && val !== null && String(val).trim()) {
                cleanObj[name.trim()] = String(val).trim();
            }
        }
        return { attributes: cleanObj, error: null };
    }

    const definitionByName = new Map(
        definitions.map((definition) => [definition.name.trim().toLowerCase(), definition])
    );
    const normalized = Object.create(null);

    for (const [name, value] of entries) {
        const definition = definitionByName.get(name.trim().toLowerCase());
        if (!definition) {
            return { attributes: null, error: `Variant attribute "${name}" is not available for this category` };
        }

        const allowedValue = definition.values.find(
            (candidate) => candidate.trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        if (!allowedValue) {
            return {
                attributes: null,
                error: `"${value}" is not an allowed value for "${definition.name}"`,
            };
        }
        normalized[definition.name] = allowedValue;
    }

    return { attributes: normalized, error: null };
}

function getVariantKey(attributes) {
    const entries = attributes instanceof Map
        ? Array.from(attributes.entries())
        : Object.entries(attributes || {});
    return entries
        .filter(([, v]) => v !== undefined && v !== null && String(v).trim())
        .map(([name, value]) => [name.toLowerCase().trim(), String(value).toLowerCase().trim()])
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, value]) => `${name}:${value}`)
        .join('|') || 'default';
}

function findDuplicateVariant(variants, attributes, excludeId = null) {
    const key = getVariantKey(attributes);
    return variants.find((variant) =>
        variant.isDeleted === false &&
        String(variant._id) !== String(excludeId || '') &&
        getVariantKey(variant.attributes) === key
    );
}

function hasVariantAttributes(attributes) {
    if (!attributes) return false;
    return attributes instanceof Map
        ? attributes.size > 0
        : Object.keys(attributes).length > 0;
}

function toProductResponse(product, variants = null) {
    const result = product.toObject
        ? product.toObject({ flattenMaps: true })
        : { ...product };

    let rawVariants = variants;
    if (!rawVariants && Array.isArray(result.variants)) {
        rawVariants = result.variants;
    }

    if (Array.isArray(rawVariants)) {
        result.variants = rawVariants
            .filter((v) => v.isDeleted !== true)
            .map((v) => {
                const varObj = v.toObject ? v.toObject({ flattenMaps: true }) : { ...v };
                let attrs = varObj.attributes;
                if (attrs instanceof Map) {
                    attrs = Object.fromEntries(attrs);
                } else if (!attrs || typeof attrs !== 'object') {
                    attrs = {};
                }
                return {
                    ...varObj,
                    attributes: attrs,
                };
            });
    }

    return result;
}

module.exports = {
    createProductFilter,
    recomputeProductSummary,
    generateVariantSku,
    normalizeAttributes,
    getVariantKey,
    findDuplicateVariant,
    hasVariantAttributes,
    toProductResponse,
};