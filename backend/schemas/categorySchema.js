const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');

function slugify(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0621-\u064A-]+/g, '')
        .replace(/--+/g, '-');
}

const validateCategory = [
    body('slug')
        .optional()
        .isString()
        .withMessage('Category slug must be a string'),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('Category title is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category title must be between 2 and 100 characters')
        .customSanitizer((title, { req }) => {
            req.body.slug = slugify(req.body.slug || title);
            return title;
        }),

    body('topCategoryId')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('topCategoryId must be a valid Mongo id'),

    body('topCategoryId').customSanitizer((value) => value || null),

    body('order')
        .default(0)
        .isNumeric()
        .withMessage('Category order must be numeric')
        .toFloat(),

    body('icon')
        .default('')
        .isString()
        .withMessage('Category icon must be a string')
        .trim(),
];

const validateCategorySlug = [
    param('slug')
        .trim()
        .notEmpty()
        .withMessage('Category slug is required')
        .customSanitizer(slugify),
    validateRequest,
];

validateCategory.push(validateRequest);

module.exports = {
    validateCategory,
    validateCategorySlug,
};
