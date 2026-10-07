const { body } = require('express-validator');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

const governorateCodes = Object.keys(GAZA_REGIONS);

function createAddressesValidator(path) {
    return [
        body(path)
            .optional()
            .isArray()
            .withMessage('Addresses must be an array'),
        body(`${path}.*`)
            .isObject()
            .withMessage('Address must be an object'),
        body(`${path}.*.governorate`)
            .optional()
            .isIn(governorateCodes)
            .withMessage('Address governorate is invalid'),
        body(`${path}.*.city`)
            .optional()
            .custom((city, { req, path: fieldPath }) => {
                const addressPath = fieldPath
                    .replace(/\[(\d+)\]/g, '.$1')
                    .split('.')
                    .slice(0, -1);
                const address = addressPath.reduce((value, key) => value?.[key], req.body);
                const governorate = address?.governorate || 'central';
                const region = GAZA_REGIONS[governorate];
                return Boolean(region && region.cities.some((regionCity) => regionCity.id === city));
            })
            .withMessage('Address city must belong to the selected governorate'),
        body(`${path}.*.detailedAddress`)
            .trim()
            .notEmpty()
            .withMessage('Detailed address is required')
            .isLength({ min: 5 })
            .withMessage('Detailed address must be at least 5 characters'),
        body(`${path}.*.coordinates`)
            .optional()
            .isObject()
            .withMessage('Address coordinates must be an object'),
        body(`${path}.*.coordinates.lat`)
            .optional()
            .isFloat()
            .withMessage('Address latitude must be a number')
            .toFloat(),
        body(`${path}.*.coordinates.lng`)
            .optional()
            .isFloat()
            .withMessage('Address longitude must be a number')
            .toFloat(),
        body(`${path}.*.isDefault`)
            .optional()
            .isBoolean()
            .withMessage('Address isDefault must be a boolean')
            .toBoolean(),
    ];
}

module.exports = {
    createAddressesValidator,
};
