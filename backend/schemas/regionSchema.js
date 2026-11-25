const { body, param, query } = require('express-validator');
const validateRequest = require('./validateRequest');

const regionIdPattern = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;

const validateRegionScope = [
    query('scope')
        .optional()
        .isIn(['hub', 'merchant', 'delivery', 'customer'])
        .withMessage('Invalid region scope'),
    validateRequest,
];

function regionIdParam() {
    return param('id')
        .trim()
        .toLowerCase()
        .matches(regionIdPattern)
        .withMessage('Invalid region id');
}

function cityIdParam() {
    return param('cityId')
        .trim()
        .toLowerCase()
        .matches(regionIdPattern)
        .withMessage('Invalid city id');
}

const validateRegionId = [
    regionIdParam(),
    validateRequest,
];

const validateRegionCityIds = [
    regionIdParam(),
    cityIdParam(),
    validateRequest,
];

function validateCenterFields() {
    return [
        body('center')
            .isObject({ strict: true })
            .withMessage('Center must be an object')
            .bail()
            .custom((center) => {
                if (Object.keys(center).some((field) => !['lat', 'lng'].includes(field))) {
                    throw new Error('Center contains unsupported fields');
                }
                return true;
            }),
        body('center.lat')
            .isFloat({ min: -90, max: 90 })
            .withMessage('Center latitude must be between -90 and 90')
            .toFloat(),
        body('center.lng')
            .isFloat({ min: -180, max: 180 })
            .withMessage('Center longitude must be between -180 and 180')
            .toFloat(),
    ];
}

function validateCenterBody() {
    return [
        body().custom((value) => {
            if (!value || Array.isArray(value) || typeof value !== 'object' ||
                Object.keys(value).length !== 1 || !Object.prototype.hasOwnProperty.call(value, 'center')) {
                throw new Error('Provide only the center field');
            }
            return true;
        }),
        ...validateCenterFields(),
        validateRequest,
    ];
}

function validateBodyFields(allowedFields, label) {
    return body().custom((value) => {
        if (!value || Array.isArray(value) || typeof value !== 'object' ||
            Object.keys(value).some((field) => !allowedFields.includes(field))) {
            throw new Error(`${label} contains unsupported fields`);
        }
        return true;
    });
}

const validateCreateRegion = [
    validateBodyFields(['id', 'name', 'center', 'isActive'], 'Region'),
    body('id')
        .isString()
        .withMessage('Region id must be a string')
        .bail()
        .trim()
        .toLowerCase()
        .matches(regionIdPattern)
        .withMessage('Region id must contain only letters, numbers, underscores, or hyphens'),
    body('name')
        .isString()
        .withMessage('Region name must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Region name is required')
        .isLength({ max: 100 })
        .withMessage('Region name must be at most 100 characters'),
    ...validateCenterFields(),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('Region isActive must be a boolean')
        .toBoolean(),
    validateRequest,
];

const validateCreateCity = [
    regionIdParam(),
    validateBodyFields(['id', 'name', 'center'], 'City'),
    body('id')
        .isString()
        .withMessage('City id must be a string')
        .bail()
        .trim()
        .toLowerCase()
        .matches(regionIdPattern)
        .withMessage('City id must contain only letters, numbers, underscores, or hyphens'),
    body('name')
        .isString()
        .withMessage('City name must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('City name is required')
        .isLength({ max: 100 })
        .withMessage('City name must be at most 100 characters'),
    ...validateCenterFields(),
    validateRequest,
];

const validateRegionStatus = [
    body().custom((value) => {
        if (!value || Array.isArray(value) || typeof value !== 'object' ||
            Object.keys(value).length !== 1 || !Object.prototype.hasOwnProperty.call(value, 'isActive')) {
            throw new Error('Provide only the isActive field');
        }
        return true;
    }),
    body('isActive')
        .isBoolean()
        .withMessage('Region isActive must be a boolean')
        .toBoolean(),
    validateRequest,
];

const validateRegionCenter = [
    regionIdParam(),
    ...validateCenterBody(),
];

const validateCityCenter = [
    ...validateRegionCityIds.slice(0, -1),
    ...validateCenterBody(),
];

module.exports = {
    validateRegionScope,
    validateRegionId,
    validateRegionCityIds,
    validateCreateRegion,
    validateCreateCity,
    validateRegionStatus,
    validateRegionCenter,
    validateCityCenter,
};
