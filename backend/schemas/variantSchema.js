const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');
const { APPROVE_STATUS, APPROVE_STATUS_VALUES, STATUS_VALUES } = require('../constants/enums');

function validateVariantFields({
    partial = false,
    path = '',
    defaultAttributes = true,
    includeRequestValidation = true,
    when,
} = {}) {
    const field = (name) => {
        const validator = body(path ? `${path}.${name}` : name);
        return when ? validator.if((_, { req }) => when(req)) : validator;
    };
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
        (when
            ? body(path ? `${path}.attributes.*` : 'attributes.*').if((_, { req }) => when(req))
            : body(path ? `${path}.attributes.*` : 'attributes.*'))
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

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function validateArrayOfObjects(value, message) {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error(message);
    }
    if (value.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
        throw new Error('Each variant must be an object');
    }
    return true;
}

function validateAttributes(attributes) {
    if (
        !attributes ||
        typeof attributes !== 'object' ||
        Array.isArray(attributes) ||
        Object.keys(attributes).some((key) => !key.trim() || /[.$]/.test(key)) ||
        Object.values(attributes).some((value) => !(
            (typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 80) ||
            (typeof value === 'number' && Number.isFinite(value)) ||
            typeof value === 'boolean'
        ))
    ) {
        throw new Error('Variant attributes or their values are invalid');
    }
}

const validateVariantIds = [
    param('id').isMongoId().withMessage('Product ID must be a valid Mongo id'),
    param('variantId').isMongoId().withMessage('Variant ID must be a valid Mongo id'),
    validateRequest,
];

const validateVariantBatchIds = [
    body().custom((ids) => {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('Variant IDs must be a non-empty array');
        }
        if (ids.some((id) => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id))) {
            throw new Error('Each variant ID must be a valid Mongo id');
        }
        return true;
    }),
    validateRequest,
];

const validateCreateVariant = [
    body().custom((variants, { req }) => {
        validateArrayOfObjects(variants, 'Variants must be a non-empty array');
        const allowedFields = ['price', 'stock', 'attributes', 'image'];
        if (variants.some((variant) => Object.keys(variant).some((field) => !allowedFields.includes(field)))) {
            throw new Error('Variant contains unsupported fields');
        }
        const files = Array.isArray(req.files) ? req.files : [];
        const withoutImageUrl = variants.filter((variant) => variant.image === undefined).length;
        if (files.length > withoutImageUrl) {
            throw new Error('Provide no more than one uploaded image per variant without an image URL');
        }
        return true;
    }),
    body('*.image')
        .optional()
        .isString()
        .withMessage('Variant image must be a URL string')
        .bail()
        .isLength({ max: 2048 })
        .withMessage('Variant image URL must be at most 2048 characters'),
    ...validateVariantFields({
        path: '*',
        includeRequestValidation: false,
        when: (req) => Array.isArray(req.body),
    }),
    validateRequest,
];

const validateVariantPatch = [
    body().custom((updates, { req }) => {
        validateArrayOfObjects(updates, 'Variant updates must be a non-empty array');
        const allowedFields = ['variantId', 'price', 'stock', 'attributes', 'image', 'status'];
        const withoutImageUrl = updates.filter((variant) => variant.image === undefined).length;
        if (req.files?.length > withoutImageUrl) {
            throw new Error('Provide no more than one uploaded image per variant without an image URL');
        }

        for (const variant of updates) {
            if (typeof variant.variantId !== 'string' || !/^[a-f\d]{24}$/i.test(variant.variantId)) {
                throw new Error('Each variant update must have a valid variantId');
            }
            if (Object.keys(variant).some((field) => !allowedFields.includes(field))) {
                throw new Error('Variant update contains unsupported fields');
            }
            if (!['price', 'stock', 'attributes', 'image', 'status'].some((field) => variant[field] !== undefined)) {
                throw new Error('Provide price, stock, attributes, image, or status to update');
            }
            if (variant.price !== undefined && (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0.01)) {
                throw new Error('Price must be greater than zero');
            }
            if (variant.stock !== undefined && (!Number.isInteger(Number(variant.stock)) || Number(variant.stock) < 0)) {
                throw new Error('Stock must be a non-negative whole number');
            }
            if (variant.status !== undefined && !STATUS_VALUES.includes(variant.status)) {
                throw new Error('Variant status is invalid');
            }
            if (variant.image !== undefined && (
                typeof variant.image !== 'string' ||
                !isHttpUrl(variant.image) ||
                variant.image.length > 2048
            )) {
                throw new Error('Variant image must be an HTTP(S) URL of at most 2048 characters');
            }
            if (variant.attributes !== undefined) validateAttributes(variant.attributes);
        }
        return true;
    }),
    validateRequest,
];

const validateVariantApproval = [
    body().custom((updates) => {
        validateArrayOfObjects(updates, 'Approval updates must be a non-empty array');
        for (const variant of updates) {
            if (typeof variant.variantId !== 'string' || !/^[a-f\d]{24}$/i.test(variant.variantId)) {
                throw new Error('Each approval update must have a valid variantId');
            }
            if (!APPROVE_STATUS_VALUES.includes(variant.approveStatus)) {
                throw new Error('Variant approval status is invalid');
            }
            if (variant.approveStatus === APPROVE_STATUS.REJECTED && (
                typeof variant.reason !== 'string' ||
                !variant.reason.trim() ||
                variant.reason.trim().length > 1000
            )) {
                throw new Error('Rejection reason is required and must be at most 1000 characters');
            }
            if (Object.keys(variant).some((field) => !['variantId', 'approveStatus', 'reason'].includes(field))) {
                throw new Error('Approval update contains unsupported fields');
            }
        }
        return true;
    }),
    validateRequest,
];

module.exports = {
    validateVariantPatch,
    validateVariantApproval,
    validateCreateVariant,
    validateVariantIds,
    validateVariantBatchIds,
    validateVariantFields,
};
