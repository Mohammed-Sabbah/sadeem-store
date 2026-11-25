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

const validateCreateStorePayout = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID'),
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Payout data must be an object');
        }
        if (Object.keys(value).some((field) => field !== 'amount')) {
            throw new Error('Payout contains unsupported fields');
        }
        return true;
    }),
    body('amount')
        .exists()
        .withMessage('Payout amount is required')
        .bail()
        .isFloat({ min: 0.01, max: 100000000 })
        .withMessage('Payout amount must be a valid positive amount')
        .bail()
        .custom((value) => Number.isFinite(Number(value)) &&
            Math.round(Number(value) * 100) === Number(value) * 100)
        .withMessage('Payout amount must have at most two decimal places')
        .toFloat(),
    validateRequest,
];

module.exports = {
    validateSellerStore,
    validateStoreId,
    validateCreateStorePayout,
};
