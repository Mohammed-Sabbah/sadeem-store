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
    query('offset').optional().isInt({ min: 0, max: 1000000 }).withMessage('Offset must be a non-negative integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(WALLET_TRANSACTION_TYPE_VALUES).withMessage('Unsupported transaction type'),
    query('status').optional().isIn(TRANSACTION_STATUS_VALUES).withMessage('Unsupported transaction status'),
    query('balanceType').optional().isIn(BALANCE_TYPE_VALUES).withMessage('Unsupported balance type'),
    validateRequest,
];

const validateWalletTransactionFilters = [
    query('offset').optional().isInt({ min: 0, max: 1000000 }).withMessage('Offset must be a non-negative integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(WALLET_TRANSACTION_TYPE_VALUES).withMessage('Unsupported transaction type'),
    query('status').optional().isIn(TRANSACTION_STATUS_VALUES).withMessage('Unsupported transaction status'),
    query('balanceType').optional().isIn(BALANCE_TYPE_VALUES).withMessage('Unsupported balance type'),
    query('createdFrom').optional().isISO8601().withMessage('Created from must be a valid date'),
    query('createdTo')
        .optional()
        .isISO8601().withMessage('Created to must be a valid date')
        .bail()
        .custom((value, { req }) => !req.query.createdFrom || new Date(value) >= new Date(req.query.createdFrom))
        .withMessage('Created to must be on or after created from'),
    query('userId').optional().isMongoId().withMessage('Invalid user id'),
    query('walletId').optional().isMongoId().withMessage('Invalid wallet id'),
    validateRequest,
];

const validateWalletTransactionId = [
    param('id').isMongoId().withMessage('Invalid transaction id'),
    validateRequest,
];

// Deposit
const validateDepositAction = [
    param('id')
        .isMongoId()
        .withMessage('Invalid transaction id'),
    body('rejectReason')
        .optional({ nullable: true })
        .isString().withMessage('Rejection reason must be a string')
        .bail().trim().isLength({ max: 500 })
        .withMessage('Rejection reason is too long'),
    validateRequest,
];

const validateDepositRequest = [
    moneyField('amount', 'Deposit amount'),
    body('proofImage')
        .custom((value, { req }) => (
            Boolean(req.file) || (typeof value === 'string' && value.trim().length > 0)
        ))
        .withMessage('Transfer proof image is required'),
    body('proofImage')
        .if((_, { req }) => !req.file)
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('Transfer proof image must be a valid URL'),
    body('referenceId')
        .optional({ nullable: true })
        .isString().withMessage('Payment reference must be a string')
        .bail().trim().isLength({ max: 200 })
        .withMessage('Payment reference is too long'),
    body('description')
        .optional({ nullable: true })
        .isString().withMessage('Description must be a string')
        .bail().trim().isLength({ max: 500 })
        .withMessage('Description is too long'),
    validateRequest,
];

const validateDepositApproval = [
    param('id')
        .isMongoId()
        .withMessage('Invalid transaction id'),
    body('proofReviewed')
        .custom((value) => value === true || value === 'true')
        .withMessage('Confirm that you reviewed the deposit proof'),
    body('amount')
        .optional()
        .isFloat({ min: 0.01, max: 100000000, allow_leading_zeroes: false })
        .withMessage('Approved deposit amount must be greater than zero')
        .bail()
        .custom((value) => Math.round(Number(value) * 100) === Number(value) * 100)
        .withMessage('Approved amount must have at most two decimal places'),
    validateRequest,
];

// Withdrawal
const validateWithdrawalRequest = [
    moneyField('amount', 'Withdrawal amount'),
    body('payoutDetails')
        .exists()
        .withMessage('Payout details are required')
        .bail()
        .isObject({ strict: true })
        .withMessage('Payout details must be an object')
        .bail()
        .custom((value) => {
            if (Array.isArray(value)) return false;
            return Buffer.byteLength(JSON.stringify(value), 'utf8') <= 2000;
        })
        .withMessage('Payout details are invalid or too large'),
    body('payoutDetails.bankName')
        .exists()
        .withMessage('Bank name is required')
        .bail()
        .isString()
        .withMessage('Bank name must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Bank name cannot be empty')
        .bail()
        .isLength({ max: 100 })
        .withMessage('Bank name must not exceed 100 characters'),
    body('payoutDetails.accountNumber')
        .exists()
        .withMessage('Account number is required')
        .bail()
        .isString()
        .withMessage('Account number must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Account number cannot be empty')
        .bail()
        .isLength({ max: 50 })
        .withMessage('Account number must not exceed 50 characters'),
    body('payoutDetails.accountName')
        .exists()
        .withMessage('Account name is required')
        .bail()
        .isString()
        .withMessage('Account name must be a string')
        .bail()
        .trim()
        .notEmpty()
        .withMessage('Account name cannot be empty')
        .bail()
        .isLength({ max: 100 })
        .withMessage('Account name must not exceed 100 characters'),
    validateRequest,
];

const validateWithdrawalAction = [
    param('id').isMongoId().withMessage('Invalid transaction id'),
    body('rejectReason')
        .optional({ nullable: true })
        .isString().withMessage('Rejection reason must be a string')
        .bail().trim().isLength({ max: 500 })
        .withMessage('Rejection reason is too long'),
    body('payoutReference')
        .optional({ nullable: true })
        .isString().withMessage('Payout reference must be a string')
        .bail().trim().isLength({ max: 200 })
        .withMessage('Payout reference is too long'),
    validateRequest,
];

module.exports = {
    validateDepositRequest,
    validateDepositAction,
    validateDepositApproval,
    validateIdempotencyKey,
    validateWalletHistory,
    validateWalletTransactionFilters,
    validateWalletTransactionId,
    validateWithdrawalRequest,
    validateWithdrawalAction,
};
