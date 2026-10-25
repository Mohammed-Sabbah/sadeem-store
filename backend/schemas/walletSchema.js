const { body, param, query } = require('express-validator');
const validateRequest = require('./validateRequest');
const {
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS_VALUES,
    WALLET_TRANSACTION_TYPE_VALUES,
} = require('../constants/enums');

const validateDepositRequest = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Deposit amount must be greater than zero'),
    body('proofImage')
        .notEmpty()
        .withMessage('Transfer proof image is required')
        .isString()
        .withMessage('Transfer proof image must be a string'),
    body('referenceId')
        .optional()
        .isString()
        .withMessage('Payment reference must be a string')
        .trim(),
    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),
    validateRequest,
];

const validateDepositAction = [
    param('id').isMongoId().withMessage('Invalid transaction id'),
    body('rejectReason')
        .optional()
        .isString()
        .withMessage('Rejection reason must be a string')
        .trim(),
    validateRequest,
];

const validateWalletHistory = [
    query('offset')
        .optional()
        .isInt({ min: 0 })
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
        .isInt({ min: 0 })
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
        .isISO8601()
        .withMessage('Created to must be a valid date')
        .bail()
        .custom((value, { req }) => (
            !req.query.createdFrom || new Date(value) >= new Date(req.query.createdFrom)
        ))
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
    param('id').isMongoId().withMessage('Invalid transaction id'),
    validateRequest,
];

const validateWithdrawalRequest = [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Withdrawal amount must be greater than zero'),
    body('payoutDetails')
        .optional()
        .isObject()
        .withMessage('Payout details must be an object'),
    validateRequest,
];

const validateWithdrawalAction = [
    param('id').isMongoId().withMessage('Invalid transaction id'),
    body('rejectReason')
        .optional()
        .isString()
        .withMessage('Rejection reason must be a string')
        .trim(),
    body('payoutReference')
        .optional()
        .isString()
        .withMessage('Payout reference must be a string')
        .trim(),
    validateRequest,
];

module.exports = {
    validateDepositRequest,
    validateDepositAction,
    validateWalletHistory,
    validateWalletTransactionFilters,
    validateWalletTransactionId,
    validateWithdrawalRequest,
    validateWithdrawalAction,
};
