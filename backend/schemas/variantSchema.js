const { body } = require('express-validator');
const validateRequest = require('./validateRequest');
const { isMoney } = require('../utils/money');

const variantFields = [
    '_id',
    'sku',
    'attributes',
    'attrKey',
    'image',
    'images',
    'color',
    'size',
    'stock',
    'price',
    'compareAtPrice',
    'isActive',
];

function validateVariants(value, allowExisting) {
    if (!Array.isArray(value)) {
        throw new Error('Product variants must be an array');
    }

    if (value.length > 100) {
        throw new Error('Maximum 100 variants allowed per product');
    }

    for (const variant of value) {
        if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
            throw new Error('Each variant must be an object');
        }

        const unsupported = Object.keys(variant).filter((key) => !variantFields.includes(key));
        if (unsupported.length > 0) {
            throw new Error(`Variant contains unsupported fields: ${unsupported.join(', ')}`);
        }

        const hasId = Object.prototype.hasOwnProperty.call(variant, '_id');
        if (hasId && (!allowExisting || !/^[0-9a-fA-F]{24}$/.test(String(variant._id)))) {
            throw new Error(allowExisting ? 'Invalid variant ID' : 'Variant id is not allowed when creating a product');
        }
        if (allowExisting && hasId && Object.keys(variant).length === 1) {
            throw new Error('At least one variant field is required for an update');
        }
        if (!hasId && (variant.stock === undefined || variant.price === undefined)) {
            throw new Error('New variants require stock and price');
        }

        // Validate Money on price
        if (variant.price !== undefined && variant.price !== null) {
            const numPrice = Number(variant.price);
            if (!Number.isFinite(numPrice) || numPrice < 0 || !isMoney(numPrice)) {
                throw new Error('Variant price must be a nonnegative money value with at most 2 decimal places');
            }
        }

        // Validate Money on compareAtPrice
        if (variant.compareAtPrice !== undefined && variant.compareAtPrice !== null && String(variant.compareAtPrice).trim() !== '') {
            const numCompare = Number(variant.compareAtPrice);
            if (!Number.isFinite(numCompare) || numCompare < 0 || !isMoney(numCompare)) {
                throw new Error('Variant compareAtPrice must be a nonnegative money value with at most 2 decimal places');
            }
        }

        // Validate Stock Integer
        if (variant.stock !== undefined && variant.stock !== null) {
            const numStock = Number(variant.stock);
            if (!Number.isInteger(numStock) || numStock < 0) {
                throw new Error('Variant stock must be a non-negative integer');
            }
        }

        for (const field of ['image', 'color', 'size', 'sku']) {
            if (variant[field] !== undefined && variant[field] !== null && typeof variant[field] !== 'string') {
                throw new Error(`Variant ${field} must be a string`);
            }
        }

        if (variant.images !== undefined && variant.images !== null) {
            if (!Array.isArray(variant.images) || !variant.images.every((img) => typeof img === 'string')) {
                throw new Error('Variant images must be an array of strings');
            }
        }

        if (variant.attributes !== undefined && variant.attributes !== null) {
            if (typeof variant.attributes !== 'object' || Array.isArray(variant.attributes)) {
                throw new Error('Variant attributes must be a key-value object');
            }
        }
    }
    return true;
}

const validateVariant = [
    body('variants')
        .optional()
        .custom((value) => validateVariants(value, false)),
    validateRequest,
];

const validateVariantUpdate = [
    body('variants')
        .optional()
        .custom((value) => validateVariants(value, true)),
    validateRequest,
];

module.exports = {
    validateVariant,
    validateVariantUpdate,
};
