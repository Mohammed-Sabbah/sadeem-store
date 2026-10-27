const { body, header, param, query } = require('express-validator');
const validateRequest = require('./validateRequest');
const {
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS_VALUES,
    WALLET_TRANSACTION_TYPE_VALUES,
} = require('../constants/enums');

const moneyField = (field, label) =>
    body(field)
        .exists()
        .withMessage(`${label} is required`)
        .bail()
        .isFloat({ min: 0.01, max: 100000000, allow_leading_zeroes: false })
        .withMessage(`${label} must be a valid positive amount`)
        .bail()
        .custom((value) => {
            const amount = Number(value);
            return Number.isFinite(amount) && Math.round(amount * 100) === amount * 100;
        })
        .withMessage(`${label} must have at most two decimal places`);

const validateIdempotencyKey = [
    header('Idempotency-Key')
        .isString().withMessage('Idempotency-Key header is required')
        .bail()
        .trim()
        .notEmpty().withMessage('Idempotency-Key header is required')
        .bail()
        .isLength({ min: 8, max: 128 })
        .withMessage('Idempotency-Key must be between 8 and 128 characters'),
    validateRequest,
];

const validateWalletHistory = [
    query('offset')
        .optional()
        .isInt({ min: 0, max: 1000000 })
        .withMessage('Offset must be a non-negative integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('type')
        .optional()
        .isIn(WALLET_TRANSACTION_TYPE_VALUES)
        .withMessage('Unsupported transaction type'),
    query('status')
        .optional()
        .isIn(TRANSACTION_STATUS_VALUES)
        .withMessage('Unsupported transaction status'),
    query('balanceType')
        .optional()
        .isIn(BALANCE_TYPE_VALUES)
        .withMessage('Unsupported balance type'),
    validateRequest,
];

const validateWalletTransactionFilters = [
    query('offset')
        .optional()
        .isInt({ min: 0, max: 1000000 })
        .withMessage('Offset must be a non-negative integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('type')
        .optional()
        .isIn(WALLET_TRANSACTION_TYPE_VALUES)
        .withMessage('Unsupported transaction type'),
    query('status')
        .optional()
        .isIn(TRANSACTION_STATUS_VALUES)
        .withMessage('Unsupported transaction status'),
    query('balanceType')
        .optional()
        .isIn(BALANCE_TYPE_VALUES)
        .withMessage('Unsupported balance type'),
    query('createdFrom')
        .optional()
        .isISO8601()
        .withMessage('Created from must be a valid date'),
    query('createdTo')
        .optional()
        .isISO8601().withMessage('Created to must be a valid date')
        .bail()
        .custom((value, { req }) => !req.query.createdFrom || new Date(value) >= new Date(req.query.createdFrom))
        .withMessage('Created to must be on or after created from'),
    query('userId')
        .optional()
        .isMongoId()
        .withMessage('Invalid user id'),
    query('walletId')
        .optional()
        .isMongoId()
        .withMessage('Invalid wallet id'),
    validateRequest,
];

const validateWalletTransactionId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid transaction id'),
    validateRequest,
];

module.exports = {
    validateIdempotencyKey,
    validateWalletHistory,
    validateWalletTransactionFilters,
    validateWalletTransactionId,
    moneyField
};
