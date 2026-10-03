const { body, cookie } = require('express-validator');

const registerUserSchema = [
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
        .matches(/^\+?[0-9\s()-]{8,20}$/)
        .withMessage('Phone number is invalid'),

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
        .withMessage('Password must be at least 8 characters long'),
];

const sellerRegistrationUserSchema = [
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
        .withMessage('Seller password must be at least 8 characters long'),
];

const loginSchema = [
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

const forgotPasswordSchema = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid')
        .normalizeEmail(),
];

const verifyOtpSchema = [
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

const resetPasswordSchema = [
    cookie('passwordResetToken')
        .exists()
        .withMessage('Reset token is required')
        .notEmpty()
        .withMessage('Reset token is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
];

const refreshTokenSchema = [
    cookie('refreshToken')
        .exists()
        .withMessage('Refresh token is required')
        .notEmpty()
        .withMessage('Refresh token is required'),
];

module.exports = {
    registerUserSchema,
    sellerRegistrationUserSchema,
    loginSchema,
    forgotPasswordSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    refreshTokenSchema,
};
