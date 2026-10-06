const { body } = require('express-validator');
const validateRequest = require('./validateRequest');

const validateDeliveryCalculation = [
    body('stores')
        .exists()
        .withMessage('Stores list is required')
        .isArray()
        .withMessage('Stores list is required'),
    validateRequest,
];

module.exports = {
    validateDeliveryCalculation,
};
