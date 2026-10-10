const { body, param, query } = require('express-validator');
const validateRequest = require('./validateRequest');

const productFields = [
    'title',
    'name',
    'categoryId',
    'description',
    'images',
    'options',
    'variants',
    'isFeatured',
    'isActive',
];

const createProductFields = [
    ...productFields,
    'price',
    'stock',
    'sku',
    'compareAtPrice',
    'simplePrice',
    'simpleStock',
    'simpleSku',
    'simpleCompareAtPrice',
    'isSimple',
];

function validateProductFields(value, fields, requireFields) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Product details must be an object');
    }

    const keys = Object.keys(value);
    const unsupported = keys.filter((key) => !fields.includes(key));
    if (unsupported.length > 0) {
        throw new Error(`Product contains unsupported fields: ${unsupported.join(', ')}`);
    }

    if (requireFields) {
        const hasTitleOrName = Boolean((value.title && String(value.title).trim()) || (value.name && String(value.name).trim()));
        if (!hasTitleOrName) {
            throw new Error('Product title or name is required');
        }
        if (!value.categoryId) {
            throw new Error('Product categoryId is required');
        }
    }

    if (!requireFields && keys.length === 0) {
        throw new Error('At least one product field is required');
    }
    return true;
}

const validateProduct = [
    body().custom((value) => {
        validateProductFields(value, createProductFields, true);

        // Normalize title from name if name was provided
        if (!value.title && value.name) {
            value.title = value.name;
        }

        // Support simple products (price & stock passed directly or via simplePrice / simpleStock)
        const price = value.price !== undefined ? value.price : value.simplePrice;
        const stock = value.stock !== undefined ? value.stock : value.simpleStock;

        if (Array.isArray(value.variants) && value.variants.length === 0 &&
            (price === undefined || stock === undefined)) {
            throw new Error('Top-level price and stock are required when variants are empty');
        }
        if (value.variants === undefined &&
            (price === undefined || stock === undefined)) {
            throw new Error('Top-level price and stock are required when variants are omitted');
        }
        return true;
    }),
    body('title')
        .optional()
        .isString()
        .withMessage('Product title must be a string')
        .trim(),
    body('name')
        .optional()
        .isString()
        .withMessage('Product name must be a string')
        .trim(),
    body('categoryId')
        .isMongoId()
        .withMessage('Valid categoryId is required'),
    body('description')
        .optional()
        .isString()
        .withMessage('Product description must be a string')
        .trim(),
    body('images')
        .optional()
        .isArray()
        .withMessage('Product images must be an array'),
    body('images.*')
        .optional()
        .isString()
        .withMessage('Each product image must be a string'),
    body('options')
        .optional()
        .isArray()
        .withMessage('Product options must be an array'),
    body('options.*.name')
        .optional()
        .isString()
        .withMessage('Option name must be a string'),
    body('options.*.values')
        .optional()
        .isArray()
        .withMessage('Option values must be an array of strings'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Product price must be a nonnegative number')
        .toFloat(),
    body('stock')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Product stock must be a nonnegative number')
        .toFloat(),
    body('variants')
        .optional()
        .isArray()
        .withMessage('Product variants must be an array'),
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
        .withMessage('Product title cannot be empty'),
    body('name')
        .optional()
        .isString()
        .withMessage('Product name must be a string')
        .trim(),
    body('categoryId')
        .optional()
        .isMongoId()
        .withMessage('Invalid category ID'),
    body('description')
        .optional()
        .isString()
        .withMessage('Product description must be a string')
        .trim(),
    body('images')
        .optional()
        .isArray()
        .withMessage('Product images must be an array'),
    body('images.*')
        .optional()
        .isString()
        .withMessage('Each product image must be a string'),
    body('options')
        .optional()
        .isArray()
        .withMessage('Product options must be an array'),
    body('variants')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Product must have at least one variant when updating variants'),
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
        .isIn(['newest', 'price_asc', 'price_desc', 'popular'])
        .withMessage('Invalid product sort order'),
    query().custom((value) => {
        if (
            value.minPrice !== undefined &&
            value.maxPrice !== undefined &&
            Number(value.minPrice) > Number(value.maxPrice)
        ) {
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
