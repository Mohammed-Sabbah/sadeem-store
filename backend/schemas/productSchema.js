const { body, param, query } = require('express-validator');
const { APPROVE_STATUS, APPROVE_STATUS_VALUES, STATUS_VALUES } = require('../constants/enums');
const validateRequest = require('./validateRequest');
const { validateVariantFields } = require('./variantSchema');

function isSafeImageReference(value) {
    if (value.startsWith('/') && !value.startsWith('//')) return true;
    try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
    } catch {
        return false;
    }
}

const validateProductId = [
    param('id')
        .isMongoId()
        .withMessage('Product ID must be a valid Mongo id'),
    validateRequest,
];

const validatePublicProductQuery = [
    query('categoryId')
        .optional()
        .isMongoId()
        .withMessage('Category ID must be a valid Mongo id'),
    query('storeId')
        .optional()
        .isMongoId()
        .withMessage('Store ID must be a valid Mongo id'),
    validateRequest,
];

const validateCreateProduct = [
    body().custom((value, { req }) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Product data must be an object');
        }
        const allowedFields = ['title', 'description', 'categoryId', 'images', 'price', 'stock', 'variants'];
        if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
            throw new Error('Product contains unsupported fields');
        }
        if ((!req.files || req.files.length === 0) && !value.images) {
            throw new Error('At least one product image is required');
        }
        return true;
    }),
    body('title')
        .isString()
        .withMessage('Product title must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Product title is required')
        .isLength({ max: 160 })
        .withMessage('Product title must be at most 160 characters'),
    body('description')
        .optional()
        .isString()
        .withMessage('Product description must be a string')
        .bail()
        .trim()
        .isLength({ max: 3000 })
        .withMessage('Product description must be at most 3000 characters'),
    body('categoryId')
        .isMongoId()
        .withMessage('A valid product category is required'),
    body('images')
        .optional()
        .isArray({ min: 1, max: 5 })
        .withMessage('Provide between 1 and 5 product images')
        .bail(),
    body('images.*')
        .isString()
        .withMessage('Product image URLs must be strings')
        .bail()
        .custom(isSafeImageReference)
        .withMessage('Product image must be an HTTP(S) URL or a local site path')
        .isLength({ max: 2048 })
        .withMessage('Product image URL must be at most 2048 characters'),
    body('variants')
        .optional()
        .customSanitizer((value) => {
            if (typeof value !== 'string') return value;
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        })
        .isArray()
        .withMessage('Variants must be an array'),
    body('variants.*')
        .custom((value) => {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                throw new Error('Each variant must be an object');
            }
            const unsupportedFields = Object.keys(value)
                .filter((field) => !['attributes', 'price', 'stock', 'image'].includes(field));
            if (unsupportedFields.length) {
                throw new Error(`Variant contains unsupported fields: ${unsupportedFields.join(', ')}`);
            }
            if (value.image !== undefined && (typeof value.image !== 'string' || !isSafeImageReference(value.image))) {
                throw new Error('Variant image must be a valid image URL');
            }
            return true;
        }),
    body('variants.*.image')
        .optional()
        .isString()
        .withMessage('Variant image must be a string')
        .bail()
        .custom(isSafeImageReference)
        .withMessage('Variant image must be an HTTP(S) URL or a local site path')
        .isLength({ max: 2048 })
        .withMessage('Variant image URL must be at most 2048 characters'),
    ...validateVariantFields({
        path: 'variants.*',
        defaultAttributes: false,
        includeRequestValidation: false,
    }),
    body('price')
        .if((_, { req }) => !Array.isArray(req.body.variants) || req.body.variants.length === 0)
        .isFloat({ min: 0.01 })
        .withMessage('Price must be greater than zero')
        .toFloat(),
    body('stock')
        .if((_, { req }) => !Array.isArray(req.body.variants) || req.body.variants.length === 0)
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative whole number')
        .toInt(),
    validateRequest,
];

const validateUpdateProduct = [
    body()
        .custom((value, { req }) => {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                throw new Error('Product data must be an object');
            }
            const editableFields = ['title', 'description', 'categoryId', 'images', 'existingImages'];
            const hasUploadedImages = req.files && req.files.length > 0;
            if (!hasUploadedImages && !editableFields.some((field) => value[field] !== undefined)) {
                throw new Error('Provide at least one product field to update');
            }
            if (Object.keys(value).some((field) => !editableFields.includes(field))) {
                throw new Error('Product status and approval can only be changed through their dedicated routes');
            }
            return true;
        }),
    body('title')
        .optional()
        .isString()
        .withMessage('Product title must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Product title cannot be empty')
        .isLength({ max: 160 })
        .withMessage('Product title must be at most 160 characters'),
    body('description')
        .optional()
        .isString()
        .withMessage('Product description must be a string')
        .bail()
        .trim()
        .isLength({ max: 3000 })
        .withMessage('Product description must be at most 3000 characters'),
    body('categoryId')
        .optional()
        .isMongoId()
        .withMessage('Category ID must be a valid Mongo id'),
    body('images')
        .optional()
        .isArray({ min: 1, max: 5 })
        .withMessage('Provide between 1 and 5 product images')
        .bail(),
    body('images.*')
        .isString()
        .withMessage('Product image URLs must be strings')
        .bail()
        .custom(isSafeImageReference)
        .withMessage('Product image must be an HTTP(S) URL or a local site path')
        .isLength({ max: 2048 })
        .withMessage('Product image URL must be at most 2048 characters'),
    body('existingImages')
        .optional()
        .customSanitizer((val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        })
        .isArray({ max: 5 })
        .withMessage('Existing images must be an array of at most 5 URLs'),
    body('existingImages.*')
        .optional()
        .isString()
        .withMessage('Existing image URL must be a string')
        .bail()
        .custom(isSafeImageReference)
        .withMessage('Existing image must be an HTTP(S) URL or local path')
        .isLength({ max: 2048 })
        .withMessage('Image URL must be at most 2048 characters'),
    validateRequest,
];

const validateProductStatus = [
    body('status')
        .isIn(STATUS_VALUES)
        .withMessage('Product status is invalid'),
    validateRequest,
];

const validateProductApproval = [
    body('approveStatus')
        .isIn(APPROVE_STATUS_VALUES)
        .withMessage('Product approval status is invalid'),
    body('rejectReason')
        .if((_, { req }) => req.body && req.body.approveStatus === APPROVE_STATUS.REJECTED)
        .isString()
        .withMessage('Reject reason must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Reject reason is required')
        .isLength({ max: 1000 })
        .withMessage('Reject reason must be at most 1000 characters'),
    validateRequest,
];

module.exports = {
    validateProductId,
    validatePublicProductQuery,
    validateCreateProduct,
    validateUpdateProduct,
    validateProductStatus,
    validateProductApproval,
};
