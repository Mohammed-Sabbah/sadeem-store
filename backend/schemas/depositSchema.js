const { body, param } = require("express-validator")
const validateRequest = require("./validateRequest")
const { moneyField } = require("./walletSchema")

const validateDepositAction = [
    param('id')
        .isMongoId()
        .withMessage('Invalid transaction id'),
    body('rejectReason')
        .optional({ nullable: true })
        .isString()
        .withMessage('Rejection reason must be a string')
        .bail()
        .trim()
        .isLength({ max: 500 })
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

module.exports = {
    validateDepositAction,
    validateDepositRequest,
    validateDepositApproval,
}