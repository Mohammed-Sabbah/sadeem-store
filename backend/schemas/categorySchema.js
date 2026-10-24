const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');
const { slugify } = require('../utils/category');
const { ATTRIBUTE_VALUE_TYPE, ATTRIBUTE_VALUE_TYPE_VALUES } = require('../constants/enums');

const validateCategory = (partial = false) => [
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Category data must be an object');
        }
        const allowedFields = ['title', 'variantAttributes'];
        if (partial) allowedFields.push('isActive');
        if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
            throw new Error('Category contains unsupported fields');
        }
        if (partial && !Object.keys(value).length) {
            throw new Error('Provide at least one category field to update');
        }
        return true;
    }),

    body('title')
        .if((_, { req }) => !partial || (req.body && req.body.title !== undefined))
        .isString()
        .withMessage('Category title must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Category title is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category title must be between 2 and 100 characters')
        .custom((title) => Boolean(slugify(title)))
        .withMessage('Category title must produce a non-empty slug'),

    body('isActive')
        .if((_, { req }) => partial && req.body && req.body.isActive !== undefined)
        .isBoolean()
        .withMessage('Category isActive must be a boolean')
        .bail()
        .toBoolean(),

    body('variantAttributes')
        .if((_, { req }) => !partial || (req.body && req.body.variantAttributes !== undefined))
        .default([])
        .isArray({ max: 20 })
        .withMessage('Variant attributes must be an array with at most 20 items')
        .bail()
        .custom((attributes) => {
            if (!attributes.every((attribute) =>
                attribute &&
                typeof attribute === 'object' &&
                !Array.isArray(attribute) &&
                typeof attribute.name === 'string' &&
                typeof attribute.key === 'string' &&
                Object.keys(attribute).every((field) => ['name', 'key', 'type', 'values'].includes(field))
            )) {
                throw new Error('Each variant attribute must contain a name and key, and only optional type and values');
            }
            const keys = attributes.map((attribute) => attribute.key.trim().toLowerCase());
            if (new Set(keys).size !== keys.length) {
                throw new Error('Variant attribute keys must be unique');
            }
            return true;
        }),

    body('variantAttributes.*.name')
        .isString()
        .withMessage('Variant attribute name must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Variant attribute name is required')
        .isLength({ max: 50 })
        .withMessage('Variant attribute name must be at most 50 characters')
        .custom((name) => !/[.$]/.test(name))
        .withMessage('Variant attribute names cannot contain dots or dollar signs'),

    body('variantAttributes.*.key')
        .isString()
        .withMessage('Variant attribute key must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Variant attribute key is required')
        .isLength({ max: 50 })
        .withMessage('Variant attribute key must be at most 50 characters')
        .custom((key) => !/[.$]/.test(key))
        .withMessage('Variant attribute keys cannot contain dots or dollar signs'),

    body('variantAttributes.*.type')
        .default(ATTRIBUTE_VALUE_TYPE.STRING)
        .isIn(ATTRIBUTE_VALUE_TYPE_VALUES)
        .withMessage(`Variant attribute type must be one of: ${ATTRIBUTE_VALUE_TYPE_VALUES.join(', ')}`),

    body('variantAttributes').customSanitizer((attributes = []) =>
        Array.isArray(attributes)
            ? attributes
                .filter((attribute) => attribute && typeof attribute === 'object')
                .map(({ name, key, type, values }) => ({
                    name: typeof name === 'string' ? name.trim() : '',
                    key: typeof key === 'string' ? key.trim() : '',
                    type: ATTRIBUTE_VALUE_TYPE_VALUES.includes(type)
                        ? type
                        : ATTRIBUTE_VALUE_TYPE.STRING,
                    values: Array.isArray(values)
                        ? Array.from(new Set(values.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim())))
                        : [],
                }))
            : []
    ),

    validateRequest
];

const validateCategorySlug = [
    param('slug')
        .trim()
        .notEmpty()
        .withMessage('Category slug is required')
        .customSanitizer(slugify),
    validateRequest,
];

const validateCategoryId = [
    param('id').isMongoId().withMessage('Category ID must be a valid Mongo id'),
    validateRequest,
];

const validateCategoryVariantAttribute = [
    param('id').isMongoId().withMessage('Category ID must be a valid Mongo id'),
    param('attributeKey')
        .trim()
        .notEmpty()
        .withMessage('Variant attribute key is required'),
    validateRequest,
];

module.exports = {
    validateCategory,
    validateCategorySlug,
    validateCategoryId,
    validateCategoryVariantAttribute,
};
