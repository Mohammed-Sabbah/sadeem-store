const { body, param, query } = require('express-validator');
const { APPROVE_STATUS_VALUES, STATUS_VALUES } = require('../constants/enums');
const validateRequest = require('./validateRequest');
const { validateVariantFields, validateVariantIds, validateCreateVariant, validateVariantApproval } = require("./variantSchema")

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
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Product data must be an object');
        }
        const allowedFields = ['title', 'description', 'categoryId', 'image', 'price', 'stock'];
        if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
            throw new Error('Product contains unsupported fields');
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
    body('image')
        .isString()
        .withMessage('Product logo must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Product logo is required')
        .bail()
        .custom(isSafeImageReference)
        .withMessage('Product logo must be an HTTP(S) URL or a local site path')
        .isLength({ max: 2048 })
        .withMessage('Product logo URL must be at most 2048 characters'),
    ...validateVariantFields(),
];

const validateUpdateProduct = [
    body()
        .custom((value) => {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                throw new Error('Product data must be an object');
            }
            const editableFields = ['title', 'description', 'categoryId', 'image'];
            if (!editableFields.some((field) => value[field] !== undefined)) {
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
    body('image')
        .optional()
        .isString()
        .withMessage('Product logo must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Product logo cannot be empty')
        .bail()
        .custom(isSafeImageReference)
        .withMessage('Product logo must be an HTTP(S) URL or a local site path')
        .isLength({ max: 2048 })
        .withMessage('Product logo URL must be at most 2048 characters'),
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
    validateRequest,
];

module.exports = {
    validateProductId,
    validatePublicProductQuery,
    validateVariantIds,
    validateCreateProduct,
    validateUpdateProduct,
    validateCreateVariant,
    validateVariantFields,
    validateProductStatus,
    validateVariantApproval,
    validateProductApproval,
};
