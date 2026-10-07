const { body } = require('express-validator');
const validateRequest = require('./validateRequest');

const variantFields = ['_id', 'image', 'color', 'size', 'stock', 'price'];

function validateVariants(value, allowExisting) {
    if (!Array.isArray(value)) {
        throw new Error('Product variants must be an array');
    }

    for (const variant of value) {
        if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
            throw new Error('Each variant must be an object');
        }
        if (Object.keys(variant).some((key) => !variantFields.includes(key))) {
            throw new Error('Variant contains unsupported fields');
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
        for (const field of ['stock', 'price']) {
            if (variant[field] !== undefined &&
                (variant[field] === '' || !Number.isFinite(Number(variant[field])) ||
                    Number(variant[field]) < 0)) {
                throw new Error(`Variant ${field} must be a nonnegative number`);
            }
        }
        for (const field of ['image', 'color', 'size']) {
            if (variant[field] !== undefined && typeof variant[field] !== 'string') {
                throw new Error(`Variant ${field} must be a string`);
            }
        }
    }
    return true;
}

const validateVariant = [
    body('variants.*.image')
        .optional()
        .isString()
        .withMessage('Variant image must be a string'),
    body('variants.*.color')
        .optional()
        .isString()
        .withMessage('Variant color must be a string'),
    body('variants.*.size')
        .optional()
        .isString()
        .withMessage('Variant size must be a string'),
    body('variants.*.stock')
        .exists()
        .withMessage('Variant stock is required')
        .isFloat({ min: 0 })
        .withMessage('Variant stock must be a nonnegative number')
        .toFloat(),
    body('variants.*.price')
        .exists()
        .withMessage('Variant price is required')
        .isFloat({ min: 0 })
        .withMessage('Variant price must be a nonnegative number')
        .toFloat(),
    body('variants').custom((value) => validateVariants(value, false)),
    validateRequest,
];

const validateVariantUpdate = [
    body('variants.*._id')
        .optional()
        .isMongoId()
        .withMessage('Invalid variant ID'),
    body('variants.*.image')
        .optional()
        .isString()
        .withMessage('Variant image must be a string'),
    body('variants.*.color')
        .optional()
        .isString()
        .withMessage('Variant color must be a string'),
    body('variants.*.size')
        .optional()
        .isString()
        .withMessage('Variant size must be a string'),
    body('variants.*.stock')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Variant stock must be a nonnegative number')
        .toFloat(),
    body('variants.*.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Variant price must be a nonnegative number')
        .toFloat(),
    body('variants')
        .optional()
        .custom((value) => validateVariants(value, true)),
    validateRequest,
];

module.exports = {
    validateVariant,
    validateVariantUpdate,
};
