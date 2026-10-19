const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');
const { APPROVE_STATUS, APPROVE_STATUS_VALUES, STATUS_VALUES } = require('../constants/enums');
function validateVariantFields(partial = false) {
    return [
        body('price')
            .if((_, { req }) => !partial || (req.body && req.body.price !== undefined))
            .isFloat({ min: 0.01 })
            .withMessage('Price must be greater than zero')
            .toFloat(),
        body('stock')
            .if((_, { req }) => !partial || (req.body && req.body.stock !== undefined))
            .isInt({ min: 0 })
            .withMessage('Stock must be a non-negative whole number')
            .toInt(),
        body('attributes')
            .if((_, { req }) => !partial || (req.body && req.body.attributes !== undefined))
            .default({})
            .isObject({ values: true })
            .withMessage('Variant attributes must be an object')
            .bail(),
        body('attributes.*')
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
}

const validateVariantIds = [
    param('id').isMongoId().withMessage('Product ID must be a valid Mongo id'),
    param('variantId').isMongoId().withMessage('Variant ID must be a valid Mongo id'),
    validateRequest,
];

const validateVariantPatch = [
    body().custom((value, { req }) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Variant data must be an object');
        }
        const hasImage = req.file || (req.files && req.files.length > 0) || value.images;
        if (!hasImage && !['price', 'stock', 'attributes'].some((field) => value[field] !== undefined)) {
            throw new Error('Provide price, stock, or attributes to update');
        }
        if (Object.keys(value).some((field) => !['price', 'stock', 'attributes', 'images'].includes(field))) {
            throw new Error('Variant status and approval can only be changed through their dedicated routes');
        }
        return true;
    }),
    ...validateVariantFields(true),
];

const validateVariantApproval = [
    body('approveStatus')
        .isIn(APPROVE_STATUS_VALUES)
        .withMessage('Variant approval status is invalid'),
    body('reason')
        .if((_, { req }) => req.body && req.body.approveStatus === APPROVE_STATUS.REJECTED)
        .isString()
        .withMessage('Rejection reason must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Rejection reason is required')
        .isLength({ max: 1000 })
        .withMessage('Rejection reason must be at most 1000 characters'),
    validateRequest,
];

const validateVariantStatus = [
    body('status')
        .isIn(STATUS_VALUES)
        .withMessage('Variant status is invalid'),
    validateRequest,
];

const validateCreateVariant = [
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Variant data must be an object');
        }
        if (Object.keys(value).some((field) => !['price', 'stock', 'attributes', 'images'].includes(field))) {
            throw new Error('Variant contains unsupported fields');
        }
        return true;
    }),
    body('images')
        .optional()
        .isArray({ min: 1, max: 1 })
        .withMessage('A variant can have only one image')
        .bail(),
    body('images.*')
        .isString()
        .withMessage('Variant image URL must be a string')
        .bail()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Variant image must be an HTTP(S) URL')
        .isLength({ max: 2048 })
        .withMessage('Variant image URL must be at most 2048 characters'),
    ...validateVariantFields(),
];

module.exports = {
    validateVariantPatch,
    validateVariantApproval,
    validateCreateVariant,
    validateVariantIds,
    validateVariantFields,
    validateVariantStatus,
};