const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');
const { slugify } = require('../utils/category');

const validateCategory = (partial = false) => [
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Category data must be an object');
        }
        const allowedFields = ['title', 'slug', 'icon', 'order', 'topCategoryId', 'allowedOptions', 'variantAttributes'];
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

    body('slug')
        .optional()
        .isString()
        .withMessage('Category slug must be a string')
        .trim(),

    body('icon')
        .optional()
        .isString()
        .withMessage('Category icon must be a string')
        .trim(),

    body('order')
        .optional()
        .isNumeric()
        .withMessage('Category order must be numeric')
        .toFloat(),

    body('topCategoryId')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('topCategoryId must be a valid Mongo id')
        .customSanitizer((v) => v || null),

    body('allowedOptions')
        .optional()
        .isArray()
        .withMessage('allowedOptions must be an array of option keys'),

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
                Array.isArray(attribute.values) &&
                Object.keys(attribute).every((field) => ['name', 'values'].includes(field))
            )) {
                throw new Error('Each variant attribute must contain only a name and allowed values');
            }
            const names = attributes.map((attribute) => attribute.name.trim().toLowerCase());
            if (new Set(names).size !== names.length) {
                throw new Error('Variant attribute names must be unique');
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

    body('variantAttributes.*.values')
        .isArray({ min: 1, max: 100 })
        .withMessage('Each variant attribute must have between 1 and 100 allowed values')
        .bail()
        .custom((values) => {
            if (values.some((value) => typeof value !== 'string' || !value.trim())) {
                throw new Error('Variant attribute values must be non-empty strings');
            }
            const normalizedValues = values.map((value) => value.trim().toLowerCase());
            if (new Set(normalizedValues).size !== normalizedValues.length) {
                throw new Error('Variant attribute values must be unique');
            }
            return true;
        }),

    body('variantAttributes').customSanitizer((attributes = []) =>
        Array.isArray(attributes)
            ? attributes
                .filter((attribute) => attribute && typeof attribute === 'object')
                .map(({ name, values }) => ({
                    name: typeof name === 'string' ? name.trim() : '',
                    values: Array.isArray(values)
                        ? values.map((value) => typeof value === 'string' ? value.trim() : value)
                        : [],
                }))
            : []
    ),

    validateRequest,
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
    param('attributeName')
        .trim()
        .notEmpty()
        .withMessage('Variant attribute name is required'),
    validateRequest,
];

module.exports = {
    validateCategory,
    validateCategorySlug,
    validateCategoryId,
    validateCategoryVariantAttribute,
};
