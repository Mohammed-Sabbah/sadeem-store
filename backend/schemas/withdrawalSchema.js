const { body, param } = require("express-validator")
const validateRequest = require("./validateRequest")
const { moneyField } = require("./walletSchema")

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
    param('id')
        .isMongoId()
        .withMessage('Invalid transaction id'),
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
    validateWithdrawalRequest,
    validateWithdrawalAction
}