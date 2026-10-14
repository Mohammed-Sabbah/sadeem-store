const { body } = require('express-validator');
const validateRequest = require('./validateRequest');
const { isMoney } = require('../utils/money');

const variantFields = [
    '_id',
    'id',
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
    'status',
    'productId',
    'storeId',
    'approveStatus',
    'isDeleted',
    'isSuspended',
    'suspensionReason',
    'createdAt',
    'updatedAt',
    '__v',
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

        const rawId = variant._id || variant.id;
        const hasId = rawId !== undefined && rawId !== null;
        if (hasId && (!allowExisting || !/^[0-9a-fA-F]{24}$/.test(String(rawId)))) {
            throw new Error(allowExisting ? 'Invalid variant ID' : 'Variant id is not allowed when creating a product');
        }
        if (allowExisting && hasId) {
            const nonMetaKeys = Object.keys(variant).filter(
                (k) => !['_id', 'id', 'productId', 'storeId', 'createdAt', 'updatedAt', '__v'].includes(k)
            );
            if (nonMetaKeys.length === 0) {
                throw new Error('At least one variant field is required for an update');
            }
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
            for (const [key, val] of Object.entries(variant.attributes)) {
                if (typeof val !== 'string' || !val.trim()) {
                    throw new Error('Variant attribute values must be non-empty strings');
                }
                if (val.trim().length > 80) {
                    throw new Error('Variant attribute values must be at most 80 characters');
                }
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

const { param } = require('express-validator');
const { APPROVE_STATUS_VALUES } = require('../constants/enums');

const validateVariantIds = [
    param('id').isMongoId().withMessage('Product ID must be a valid Mongo id'),
    param('variantId').isMongoId().withMessage('Variant ID must be a valid Mongo id'),
    validateRequest,
];

const validateCreateVariant = [
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Variant data must be an object');
        }
        return true;
    }),
    body('price')
        .exists()
        .withMessage('Variant price is required')
        .isFloat({ min: 0.01 })
        .withMessage('Price must be greater than zero')
        .custom((val) => isMoney(val))
        .withMessage('Variant price must have at most 2 decimal places')
        .toFloat(),
    body('stock')
        .exists()
        .withMessage('Variant stock is required')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative whole number')
        .toInt(),
    body('attributes')
        .optional()
        .default({})
        .isObject({ values: true })
        .withMessage('Variant attributes must be an object'),
    body('attributes.*')
        .optional()
        .isString()
        .withMessage('Variant attribute values must be strings')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Variant attribute values cannot be empty')
        .isLength({ max: 80 })
        .withMessage('Variant attribute values must be at most 80 characters'),
    body('sku')
        .optional()
        .isString()
        .trim(),
    body('compareAtPrice')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Variant compareAtPrice must be a non-negative number')
        .custom((val) => isMoney(val))
        .withMessage('Variant compareAtPrice must have at most 2 decimal places'),
    validateRequest,
];

const validateVariantPatch = [
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Variant patch data must be an object');
        }
        const patchFields = ['price', 'stock', 'compareAtPrice', 'attributes', 'sku', 'image', 'images', 'status', 'isActive'];
        const keys = Object.keys(value);
        if (keys.length === 0) {
            throw new Error('Provide at least one variant field to update');
        }
        if (keys.some((k) => !patchFields.includes(k))) {
            throw new Error('Variant contains unsupported fields');
        }
        return true;
    }),
    body('price')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Price must be greater than zero')
        .custom((val) => isMoney(val))
        .withMessage('Variant price must have at most 2 decimal places')
        .toFloat(),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative whole number')
        .toInt(),
    body('compareAtPrice')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Variant compareAtPrice must be a non-negative number')
        .custom((val) => isMoney(val))
        .withMessage('Variant compareAtPrice must have at most 2 decimal places'),
    body('attributes')
        .optional()
        .isObject({ values: true })
        .withMessage('Variant attributes must be an object'),
    body('attributes.*')
        .optional()
        .isString()
        .withMessage('Variant attribute values must be strings')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Variant attribute values cannot be empty')
        .isLength({ max: 80 })
        .withMessage('Variant attribute values must be at most 80 characters'),
    validateRequest,
];

const validateVariantApproval = [
    body('approveStatus')
        .exists()
        .withMessage('approveStatus is required')
        .isIn(APPROVE_STATUS_VALUES)
        .withMessage(`approveStatus must be one of: ${APPROVE_STATUS_VALUES.join(', ')}`),
    validateRequest,
];

module.exports = {
    validateVariant,
    validateVariantUpdate,
    validateVariantIds,
    validateCreateVariant,
    validateVariantPatch,
    validateVariantApproval,
};
