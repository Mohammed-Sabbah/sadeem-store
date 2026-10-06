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

router.post('/register', validateRegisterUser, register);
router.post('/register/seller', [...validateSellerRegistration, ...validateSellerStore], registerSeller);
router.post('/login', validateLoginUser, login);
router.post('/logout', logout);

router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-otp', validateVerifyOtp, verifyOtp);
router.post('/reset-password', validateResetPassword, resetPassword);

router.post('/refresh', validateRefreshToken, refresh);

module.exports = router;
