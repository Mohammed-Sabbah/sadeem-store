const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');

const validateDeliveryTaskBody = (allowedFields) => body().custom((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Delivery task data must be an object');
    }

    if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
        throw new Error('Delivery task contains unsupported fields');
    }

    return true;
});

const validateDeliveryTaskId = [
    param("id")
        .isMongoId()
        .withMessage("Delivery task ID must be a valid Mongo ID"),
    validateRequest,
];

const validateCreateCollectingDeliveryTask = [
    validateDeliveryTaskBody(['orderIds', 'driverId', 'amount', 'deliveryLocation']),
    body('orderIds')
        .isArray({ min: 1 })
        .withMessage('At least one order ID is required'),
    body('orderIds.*')
        .isMongoId()
        .withMessage('Each order ID must be a valid Mongo ID'),
    body('driverId')
        .isMongoId()
        .withMessage('Driver ID must be a valid Mongo ID'),
    body('amount')
        .isFloat({ min: 0 })
        .withMessage('Delivery amount must be a non-negative number')
        .toFloat(),
    body('deliveryLocation')
        .isString()
        .withMessage('Delivery location must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Delivery location is required'),
    validateRequest,
];

const validateCreateFinalDeliveryTask = [
    validateDeliveryTaskBody(['orderGroupId', 'driverId', 'amount', 'pickupLocation']),
    body('orderGroupId')
        .isMongoId()
        .withMessage('Order group ID must be a valid Mongo ID'),
    body('driverId')
        .isMongoId()
        .withMessage('Driver ID must be a valid Mongo ID'),
    body('amount')
        .isFloat({ min: 0 })
        .withMessage('Delivery amount must be a non-negative number')
        .toFloat(),
    body('pickupLocation')
        .isString()
        .withMessage('Pickup location must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Pickup location is required'),
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
    validateCreateCollectingDeliveryTask,
    validateCreateFinalDeliveryTask,
    validateDeliveryCalculation,
};
