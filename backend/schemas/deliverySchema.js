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
        .exists()
        .withMessage('At least one order ID is required')
        .bail()
        .isArray({ min: 1, max: 100 })
        .withMessage('Order IDs must contain between 1 and 100 items')
        .bail()
        .custom((ids) => new Set(ids.map((id) => id.toString())).size === ids.length)
        .withMessage('Duplicate order IDs are not allowed'),
    body('orderIds.*')
        .isMongoId()
        .withMessage('Each order ID must be a valid Mongo ID'),
    body('driverId')
        .exists()
        .withMessage('Driver ID is required')
        .bail()
        .isMongoId()
        .withMessage('Driver ID must be a valid Mongo ID'),
    body('amount')
        .exists()
        .withMessage('Delivery amount is required')
        .bail()
        .isFloat({ min: 0, max: 100000000 })
        .withMessage('Delivery amount must be a non-negative number')
        .bail()
        .custom((value) => Number.isFinite(Number(value)) &&
            Math.round(Number(value) * 100) === Number(value) * 100)
        .withMessage('Delivery amount must have at most two decimal places')
        .toFloat(),
    body('deliveryLocation')
        .exists()
        .withMessage('Delivery location is required')
        .bail()
        .isString()
        .withMessage('Delivery location must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Delivery location is required')
        .bail()
        .isLength({ max: 500 })
        .withMessage('Delivery location must not exceed 500 characters'),
    validateRequest,
];

const validateCreateFinalDeliveryTask = [
    validateDeliveryTaskBody(['orderGroupId', 'driverId', 'amount', 'pickupLocation']),
    body('orderGroupId')
        .exists()
        .withMessage('Order group ID is required')
        .bail()
        .isMongoId()
        .withMessage('Order group ID must be a valid Mongo ID'),
    body('driverId')
        .exists()
        .withMessage('Driver ID is required')
        .bail()
        .isMongoId()
        .withMessage('Driver ID must be a valid Mongo ID'),
    body('amount')
        .exists()
        .withMessage('Delivery amount is required')
        .bail()
        .isFloat({ min: 0, max: 100000000 })
        .withMessage('Delivery amount must be a non-negative number')
        .bail()
        .custom((value) => Number.isFinite(Number(value)) &&
            Math.round(Number(value) * 100) === Number(value) * 100)
        .withMessage('Delivery amount must have at most two decimal places')
        .toFloat(),
    body('pickupLocation')
        .exists()
        .withMessage('Pickup location is required')
        .bail()
        .isString()
        .withMessage('Pickup location must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Pickup location is required')
        .bail()
        .isLength({ max: 500 })
        .withMessage('Pickup location must not exceed 500 characters'),
    validateRequest,
];

const validateDriverId = [
    param("id")
        .isMongoId()
        .withMessage("Driver ID must be a valid Mongo ID"),
    validateRequest,
];

const validateCreateDriverPayout = [
    param("id")
        .isMongoId()
        .withMessage("Driver ID must be a valid Mongo ID"),
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
    validateDriverId,
    validateCreateCollectingDeliveryTask,
    validateCreateFinalDeliveryTask,
    validateCreateDriverPayout,
    validateDeliveryCalculation,
};
