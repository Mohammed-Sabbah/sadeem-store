const router = require('express').Router();
const {
    register,
    registerSeller,
    login,
    refresh,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
} = require('../controllers/authController');
const { getMe } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
    validateRegisterUser,
    validateSellerRegistration,
    validateLoginUser,
    validateForgotPassword,
    validateVerifyOtp,
    validateResetPassword,
    validateRefreshToken,
} = require('../schemas/userSchema');
const { validateSellerStore } = require('../schemas/storeSchema');

// 1. Current User Profile Session
router.get('/me', authenticate, getMe);

// 2. Authentication & Registration (Protected by authLimiter)
router.post('/register', authLimiter, validateRegisterUser, register);
router.post('/register/seller', authLimiter, [...validateSellerRegistration, ...validateSellerStore], registerSeller);
router.post('/login', authLimiter, validateLoginUser, login);
router.post('/logout', logout);

// 3. Password Recovery Flow (Protected by strict passwordResetLimiter)
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, forgotPassword);
router.post('/verify-otp', passwordResetLimiter, validateVerifyOtp, verifyOtp);
router.post('/reset-password', passwordResetLimiter, validateResetPassword, resetPassword);

// 4. Token Refresh
router.post('/refresh', validateRefreshToken, refresh);

module.exports = router;
