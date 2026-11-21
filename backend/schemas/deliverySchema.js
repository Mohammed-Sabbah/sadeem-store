const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');

const validateDeliveryTaskId = [
    param("id")
        .isMongoId()
        .withMessage("Delivery task ID must be a valid Mongo ID"),
    validateRequest,
];

const validateDeliveryCalculation = [
    body('stores')
        .exists()
        .withMessage('Stores list is required')
        .isArray()
        .withMessage('Stores list is required'),
    validateRequest,
];

module.exports = {
    validateDeliveryTaskId,
    validateDeliveryCalculation,
};
