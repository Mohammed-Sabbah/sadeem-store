const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');
const { createAddressesValidator } = require('./addressValidator');

const validateSellerStore = [
    body('store.name')
        .trim()
        .notEmpty()
        .withMessage('Store name is required')
        .isLength({ min: 2, max: 150 })
        .withMessage('Store name must be between 2 and 150 characters'),

    body('store.logo')
        .optional()
        .isString()
        .withMessage('Store logo must be a string')
        .trim(),
    body('store.description')
        .optional()
        .isString()
        .withMessage('Store description must be a string')
        .trim(),
    body('store.phoneNumber')
        .optional()
        .trim()
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage('Store phone number is invalid'),
    ...createAddressesValidator("store.address", "object"),
    body('store').customSanitizer((store, { req }) => {
        const storeInput = store || {};
        const storeFields = { ...storeInput };
        delete storeFields.categoryId;
        delete storeFields.categoryIdIsObjectId;
        const userInput = req.body.user || {};
        const address = storeInput.address || {};

        return {
            ...storeFields,
            address: {
                ...address,
                isDefault: address.isDefault ?? false,
            },
            logo: storeInput.logo || '',
            description: storeInput.description || '',
            phoneNumber: storeInput.phoneNumber || userInput.phoneNumber,
        };
    }),
    validateRequest,
];

const validateStoreId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID'),
    validateRequest,
];

module.exports = {
    validateSellerStore,
    validateStoreId,
};
