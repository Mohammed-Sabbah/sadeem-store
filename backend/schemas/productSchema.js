const { body, param, query } = require('express-validator');
const validateRequest = require('./validateRequest');

const productFields = ['title', 'description', 'images', 'variants'];

function validateProductFields(value, fields, requireFields) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Product details must be an object');
    }

    const keys = Object.keys(value);
    if (keys.some((key) => !fields.includes(key))) {
        throw new Error('Product contains unsupported fields');
    }
    if (requireFields && !['title', 'description', 'variants'].every((field) => keys.includes(field))) {
        throw new Error('Product title, description, and variants are required');
    }
    if (!requireFields && keys.length === 0) {
        throw new Error('At least one product field is required');
    }
    return true;
}

const validateProduct = [
    body().custom((value) => validateProductFields(value, productFields, true)),
    body('title')
        .isString()
        .withMessage('Product title must be a string')
        .trim()
        .notEmpty()
        .withMessage('Product title is required'),
    body('description')
        .isString()
        .withMessage('Product description must be a string')
        .trim()
        .notEmpty()
        .withMessage('Product description is required'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Product images must be an array'),
    body('images.*')
        .optional()
        .isString()
        .withMessage('Each product image must be a string'),
    body('variants')
        .isArray({ min: 1 })
        .withMessage('Product must have at least one variant'),
    validateRequest,
];

const validateProductUpdate = [
    body().custom((value) => validateProductFields(value, productFields, false)),
    body('title')
        .optional()
        .isString()
        .withMessage('Product title must be a string')
        .trim()
        .notEmpty()
        .withMessage('Product title is required'),
    body('description')
        .optional()
        .isString()
        .withMessage('Product description must be a string')
        .trim()
        .notEmpty()
        .withMessage('Product description is required'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Product images must be an array'),
    body('images.*')
        .optional()
        .isString()
        .withMessage('Each product image must be a string'),
    body('variants')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Product must have at least one variant'),
    validateRequest,
];

const validateProductId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid product ID'),
    validateRequest,
];

const validateProductFilters = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
    query('storeId')
        .optional()
        .isMongoId()
        .withMessage('Invalid store ID'),
    query('categoryId')
        .optional()
        .isMongoId()
        .withMessage('Invalid category ID'),
    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string')
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search must be at most 100 characters'),
    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
        .toBoolean(),
    query('isSuspended')
        .optional()
        .isBoolean()
        .withMessage('isSuspended must be a boolean')
        .toBoolean(),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('minPrice must be a nonnegative number')
        .toFloat(),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('maxPrice must be a nonnegative number')
        .toFloat(),
    query('inStock')
        .optional()
        .isBoolean()
        .withMessage('inStock must be a boolean')
        .toBoolean(),
    query('sort')
        .optional()
        .isIn(['newest', 'price_asc', 'price_desc'])
        .withMessage('Invalid product sort order'),
    query().custom((value) => {
        if (value.minPrice !== undefined && value.maxPrice !== undefined &&
            Number(value.minPrice) > Number(value.maxPrice)) {
            throw new Error('minPrice cannot exceed maxPrice');
        }
        return true;
    }),
    validateRequest,
];

function validateStatusFields(allowedFields, message) {
    return body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Product status must be an object');
        }

        const keys = Object.keys(value);
        if (keys.length === 0 || keys.some((key) => !allowedFields.includes(key))) {
            throw new Error(message);
        }
        return true;
    });
}

const validateProductAvailability = [
    validateStatusFields(['isActive'], 'Provide isActive only'),
    body('isActive')
        .exists()
        .isBoolean()
        .withMessage('isActive must be a boolean')
        .toBoolean(),
    validateRequest,
];

const validateAdminProductStatus = [
    validateStatusFields(
        ['isSuspended', 'suspensionReason'],
        'Provide isSuspended and an optional suspensionReason'
    ),
    body('isSuspended')
        .exists()
        .isBoolean()
        .withMessage('isSuspended must be a boolean')
        .toBoolean(),
    body('suspensionReason')
        .optional()
        .isString()
        .withMessage('Suspension reason must be a string')
        .trim()
        .notEmpty()
        .withMessage('Suspension reason cannot be empty')
        .isLength({ max: 500 })
        .withMessage('Suspension reason must be at most 500 characters'),
    body().custom((value) => {
        if (value.isSuspended === true && !value.suspensionReason?.trim()) {
            throw new Error('A clear suspension reason is required when suspending a product');
        }
        return true;
    }),
    validateRequest,
];

module.exports = {
    validateProduct,
    validateProductUpdate,
    validateProductId,
    validateProductFilters,
    validateProductAvailability,
    validateAdminProductStatus,
};
