const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const validateRequest = require('./validateRequest');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

const activeGovernorates = Object.values(GAZA_REGIONS)
    .filter((region) => region.isActive)
    .map((region) => region.id);

const validateSellerStore = [
    body('store.name')
        .trim()
        .notEmpty()
        .withMessage('Store name is required')
        .isLength({ min: 2, max: 150 })
        .withMessage('Store name must be between 2 and 150 characters'),

    body('store.categoryId')
        .trim()
        .notEmpty()
        .withMessage('Store category is required'),

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

    body('store.address')
        .isObject()
        .withMessage('Store address must be an object'),
    body('store.address.governorate')
        .trim()
        .isIn(activeGovernorates)
        .withMessage('Store governorate is invalid or unavailable for registration'),
    body('store.address.city')
        .trim()
        .custom((city, { req }) => {
            const governorate = req.body.store?.address?.governorate;
            const region = GAZA_REGIONS[governorate];
            return Boolean(region && region.cities.some((regionCity) => regionCity.id === city));
        })
        .withMessage('Store city must belong to an available governorate'),
    body('store.address.detailedAddress')
        .trim()
        .notEmpty()
        .withMessage('Detailed store address is required')
        .isLength({ min: 5 })
        .withMessage('Detailed store address must be at least 5 characters'),

    // Mandatory GPS Coordinates within Gaza Bounds
    body('store.address.coordinates')
        .notEmpty()
        .withMessage('Store GPS coordinates are mandatory')
        .isObject()
        .withMessage('Store coordinates must be an object'),
    body('store.address.coordinates.lat')
        .notEmpty()
        .withMessage('Store GPS latitude is mandatory')
        .isFloat({ min: 31.18, max: 31.62 })
        .withMessage('Latitude must be within Gaza Strip (31.18 - 31.62)')
        .toFloat(),
    body('store.address.coordinates.lng')
        .notEmpty()
        .withMessage('Store GPS longitude is mandatory')
        .isFloat({ min: 34.15, max: 34.60 })
        .withMessage('Longitude must be within Gaza Strip (34.15 - 34.60)')
        .toFloat(),
    body('store.address.isDefault')
        .optional()
        .isBoolean()
        .withMessage('Address isDefault must be a boolean')
        .toBoolean(),

    body('store').customSanitizer((store, { req }) => {
        const storeInput = store || {};
        const userInput = req.body.user || {};
        const address = storeInput.address || {};

        return {
            ...storeInput,
            categoryIdIsObjectId: mongoose.Types.ObjectId.isValid(storeInput.categoryId),
            address: {
                ...address,
                isDefault: address.isDefault ?? false,
            },
            logo: storeInput.logo || '',
            description: storeInput.description || '',
            phoneNumber: storeInput.phoneNumber || userInput.phoneNumber,
        };
    }),
];

const validateStoreId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid store ID'),
    validateRequest,
];

validateSellerStore.push(validateRequest);

module.exports = {
    validateSellerStore,
    validateStoreId,
};
