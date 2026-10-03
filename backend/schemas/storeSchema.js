const { body } = require('express-validator');

const storeSchema = [
    body('store.name')
        .trim()
        .notEmpty()
        .withMessage('Store name is required')
        .isLength({ min: 2, max: 150 })
        .withMessage('Store name must be between 2 and 150 characters'),

    body('store.categoryId')
        .trim()
        .notEmpty()
        .withMessage('Store category is required')
        .isMongoId()
        .withMessage('Store categoryId must be a valid Mongo id'),

    body('store.logo').optional().isString().withMessage('Store logo must be a string'),
    body('store.description').optional().isString().withMessage('Store description must be a string'),
    body('store.address').optional().isString().withMessage('Store address must be a string'),
    body('store.phoneNumber')
        .optional()
        .trim()
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage('Store phone number is invalid'),
];

module.exports = {
    storeSchema,
};
