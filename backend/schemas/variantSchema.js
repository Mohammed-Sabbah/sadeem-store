const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');
const { APPROVE_STATUS, APPROVE_STATUS_VALUES, STATUS_VALUES } = require('../constants/enums');
function validateVariantFields({
    partial = false,
    path = '',
    defaultAttributes = true,
    includeRequestValidation = true,
} = {}) {
    const field = (name) => body(path ? `${path}.${name}` : name);
    const attributesField = field('attributes')
        .if((_, { req }) => !partial || (req.body && req.body.attributes !== undefined));
    if (defaultAttributes) {
        attributesField.default({});
    }

    const fields = [
        field('price')
            .if((_, { req }) => !partial || (req.body && req.body.price !== undefined))
            .isFloat({ min: 0.01 })
            .withMessage('Price must be greater than zero')
            .toFloat(),
        field('stock')
            .if((_, { req }) => !partial || (req.body && req.body.stock !== undefined))
            .isInt({ min: 0 })
            .withMessage('Stock must be a non-negative whole number')
            .toInt(),
        attributesField
            .isObject({ values: true })
            .withMessage('Variant attributes must be an object')
            .bail()
            .custom((attributes) => {
                if (Object.keys(attributes).some((key) => !key.trim() || /[.$]/.test(key))) {
                    throw new Error('Variant attribute keys must be non-empty and cannot contain dots or dollar signs');
                }
                return true;
            }),
        body(path ? `${path}.attributes.*` : 'attributes.*')
            .custom((value) => {
                if (typeof value === 'string') {
                    if (!value.trim()) {
                        throw new Error('String variant attribute values cannot be empty');
                    }
                    if (value.trim().length > 80) {
                        throw new Error('String variant attribute values must be at most 80 characters');
                    }
                    return true;
                }
                if (typeof value === 'number' && Number.isFinite(value)) return true;
                if (typeof value === 'boolean') return true;
                throw new Error('Variant attribute values must be strings, finite numbers, or booleans');
            })
            .customSanitizer((value) => typeof value === 'string' ? value.trim() : value),
    ];
    if (includeRequestValidation) fields.push(validateRequest);
    return fields;
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
        const hasUploadedImage = Array.isArray(req.files) && req.files.length > 0;
        const hasImage = hasUploadedImage || value.image !== undefined;
        if (!hasImage && !['price', 'stock', 'attributes'].some((field) => value[field] !== undefined)) {
            throw new Error('Provide price, stock, or attributes to update');
        }
        if (hasUploadedImage && value.image !== undefined) {
            throw new Error('Provide either an image URL or one uploaded image, not both');
        }
        if (Object.keys(value).some((field) => !['price', 'stock', 'attributes', 'image'].includes(field))) {
            throw new Error('Variant status and approval can only be changed through their dedicated routes');
        }
        return true;
    }),
    body('image')
        .if((value) => value !== undefined)
        .isString()
        .withMessage('Variant image must be a URL string')
        .bail()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Variant image must be an HTTP(S) URL')
        .isLength({ max: 2048 })
        .withMessage('Variant image URL must be at most 2048 characters'),
    ...validateVariantFields({ partial: true }),
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
    body().custom((value, { req }) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Variant data must be an object');
        }
        const unsupportedFields = Object.keys(value)
            .filter((field) => !['price', 'stock', 'attributes', 'image'].includes(field));
        if (unsupportedFields.length) {
            throw new Error(`Variant contains unsupported fields: ${unsupportedFields.join(', ')}`);
        }
        const hasUploadedImage = Array.isArray(req.files) && req.files.length === 1;
        if ((req.files && req.files.length > 1) || (hasUploadedImage && value.image !== undefined)) {
            throw new Error('Provide either an image URL or one uploaded image, not both');
        }
        return true;
    }),
    body('image')
        .if((value, { req }) => value !== undefined && (!req.files || req.files.length === 0))
        .isString()
        .withMessage('Variant image must be a URL string')
        .bail()
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