const router = require('express').Router();
const {
  register,
  registerMerchant,
  login,
  refreshToken,
  logout,
  getMe,
} = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/verifyToken');
const verifyRefreshToken = require('../middlewares/verifyRefreshToken');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public routes (Rate limited against brute force)
router.post('/register', authLimiter, register);
router.post('/register-merchant', authLimiter, registerMerchant);
router.post('/login', authLimiter, login);

// Refresh & Logout
router.post('/refresh-token', verifyRefreshToken, refreshToken);
router.post('/logout', logout);

// Protected session route
router.get('/me', verifyToken, getMe);

module.exports = router;
