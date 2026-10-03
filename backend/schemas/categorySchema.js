const { body } = require('express-validator');

const categorySchema = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Category title is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category title must be between 2 and 100 characters'),

    body('topCategoryId')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('topCategoryId must be a valid Mongo id'),
];

module.exports = {
    categorySchema,
};
