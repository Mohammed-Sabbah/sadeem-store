const { body } = require('express-validator');
const { GAZA_REGIONS } = require('../constants/gaza-regions');

const regionIds = GAZA_REGIONS.map((region) => region.id);

function hasValue(value) {
    return value !== undefined &&
        value !== null &&
        !(typeof value === 'string' && value.trim() === '');
}

function createAddressesValidator(path, type = "array") {
    if (type !== 'array' && type !== 'object') {
        throw new TypeError('Address validator type must be "array" or "object"');
    }

    const addressPath = type === 'array' ? `${path}.*` : path;
    const containerValidator = type === 'array'
        ? body(path)
            .isArray({ min: 1 })
            .withMessage('At least one address is required')
        : null;
    const coordinatesValidator = body(`${addressPath}.coordinates`);
    const latitudeValidator = body(`${addressPath}.coordinates.lat`);
    const longitudeValidator = body(`${addressPath}.coordinates.lng`);

    if (type === 'array') {
        coordinatesValidator.optional();
        latitudeValidator.optional();
        longitudeValidator.optional();
    } else {
        coordinatesValidator
            .exists({ values: 'null' })
            .withMessage('Address coordinates are required')
            .bail();
        latitudeValidator
            .notEmpty()
            .withMessage('Address latitude is required')
            .bail();
        longitudeValidator
            .notEmpty()
            .withMessage('Address longitude is required')
            .bail();
    }

    coordinatesValidator
        .isObject({ strict: true })
        .withMessage('Address coordinates must be an object');
    latitudeValidator
        .isFloat({ min: -90, max: 90 })
        .withMessage('Address latitude must be a number')
        .toFloat();
    longitudeValidator
        .isFloat({ min: -180, max: 180 })
        .withMessage('Address longitude must be a number')
        .toFloat();

    return [
        ...(containerValidator ? [containerValidator] : []),
        body(addressPath)
            .isObject({ strict: true })
            .withMessage('Address must be an object')
            .bail()
            .custom((address) => {
                const hasRegion = hasValue(address.region);
                const hasCity = hasValue(address.city);

                if (!hasRegion || !hasCity) {
                    throw new Error('Address Region and city are required');
                }

                return true;
            }),
        body(`${addressPath}.region`)
            .isIn(regionIds)
            .withMessage('Address Region is invalid'),
        body(`${addressPath}.city`)
            .custom((city, { req, path: fieldPath }) => {
                const addressPath = fieldPath
                    .replace(/\[(\d+)\]/g, '.$1')
                    .split('.')
                    .slice(0, -1);
                const address = addressPath.reduce((value, key) => value?.[key], req.body);
                const region = GAZA_REGIONS.find((item) => item.id === address?.region);
                return Boolean(region && region.cities.some((regionCity) => regionCity.id === city));
            })
            .withMessage('Address city must belong to the selected region'),
        body(`${addressPath}.detailedAddress`)
            .isString()
            .withMessage('Detailed address must be a string')
            .bail()
            .trim()
            .isLength({ min: 5 })
            .withMessage('Detailed address must be at least 5 characters'),
        coordinatesValidator,
        latitudeValidator,
        longitudeValidator,
        body(`${addressPath}.isDefault`)
            .optional()
            .isBoolean()
            .withMessage('Address isDefault must be a boolean')
            .toBoolean(),
    ];
}

module.exports = {
    createAddressesValidator,
};
