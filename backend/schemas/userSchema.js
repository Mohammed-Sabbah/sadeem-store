const { body, cookie, query } = require('express-validator');
const validateRequest = require('./validateRequest');
const { createAddressesValidator } = require('./addressValidator');
const { ROLE_VALUES, STATUS_VALUES } = require('../constants/enums');

const validateRegisterUser = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),

    body('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^(\+?970|0)?5[96]\d{7}$/)
        .withMessage('Phone number must be a valid Palestinian mobile number (059 or 056)'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),

    ...createAddressesValidator('addresses'),
];

const validateSellerRegistration = [
    body('user.name')
        .trim()
        .notEmpty()
        .withMessage('Seller name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Seller name must be between 2 and 100 characters'),

    body('user.phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Seller phone number is required')
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage('Seller phone number is invalid'),

    body('user.email')
        .trim()
        .notEmpty()
        .withMessage('Seller email is required')
        .isEmail()
        .withMessage('Seller email is invalid')
        .normalizeEmail(),

    body('user.password')
        .notEmpty()
        .withMessage('Seller password is required')
        .isLength({ min: 8 })
        .withMessage('Seller password must be at least 8 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),

    ...createAddressesValidator('user.addresses'),
];

const validateLoginUser = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),
];

const validateVerifyOtp = [
    cookie('passwordResetToken')
        .exists()
        .withMessage('Password reset session is required')
        .notEmpty()
        .withMessage('Password reset session is required'),

    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must be 6 digits'),
];

const validateResetPassword = [
    cookie('passwordResetToken')
        .exists()
        .withMessage('Reset token is required')
        .notEmpty()
        .withMessage('Reset token is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
];

const validateRefreshToken = [
    cookie('refreshToken')
        .exists()
        .withMessage('Refresh token is required')
        .notEmpty()
        .withMessage('Refresh token is required'),
];

const validateCreateDriver = [
    body().custom((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Driver data must be an object');
        }

        if (Object.keys(value).some((field) => !['name', 'phoneNumber', 'email'].includes(field))) {
            throw new Error('Driver creation contains unsupported fields');
        }

        return true;
    }),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Driver name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Driver name must be between 2 and 100 characters'),
    body('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Driver phone number is required')
        .matches(/^(\+?970|0)?5[96]\d{7}$/)
        .withMessage('Driver phone number must be a valid Palestinian mobile number'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Driver email is required')
        .isEmail()
        .withMessage('Driver email is invalid')
        .normalizeEmail(),
];

const validateListUsers = [
    query('role')
        .optional()
        .isIn(ROLE_VALUES)
        .withMessage('Unsupported user role'),
    query('status')
        .optional()
        .isIn(STATUS_VALUES)
        .withMessage('Unsupported user status'),
    query('isDeleted')
        .optional()
        .isBoolean()
        .withMessage('isDeleted must be a boolean')
        .toBoolean(),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search must be between 1 and 100 characters'),
    query('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name filter must be between 1 and 100 characters'),
    query('email')
        .optional()
        .trim()
        .isLength({ min: 1, max: 254 })
        .withMessage('Email filter must be between 1 and 254 characters'),
    query('phoneNumber')
        .optional()
        .trim()
        .isLength({ min: 1, max: 30 })
        .withMessage('Phone number filter must be between 1 and 30 characters'),
    query('createdFrom')
        .optional()
        .isISO8601()
        .withMessage('Created from must be a valid date'),
    query('createdTo')
        .optional()
        .isISO8601()
        .withMessage('Created to must be a valid date')
        .bail()
        .custom((value, { req }) => !req.query.createdFrom ||
            new Date(value) >= new Date(req.query.createdFrom))
        .withMessage('Created to must be on or after created from'),
    query('page')
        .optional()
        .isInt({ min: 1, max: 1000000 })
        .withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'name', 'email', 'phoneNumber', 'status', 'role'])
        .withMessage('Unsupported sort field'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    validateRequest,
];

validateRegisterUser.push(validateRequest);
validateSellerRegistration.push(validateRequest);
validateLoginUser.push(validateRequest);
validateForgotPassword.push(validateRequest);
validateVerifyOtp.push(validateRequest);
validateResetPassword.push(validateRequest);
validateRefreshToken.push(validateRequest);
validateCreateDriver.push(validateRequest);

module.exports = {
    validateRegisterUser,
    validateSellerRegistration,
    validateLoginUser,
    validateForgotPassword,
    validateVerifyOtp,
    validateResetPassword,
    validateRefreshToken,
    validateCreateDriver,
    validateListUsers,
};
