const rateLimit = require('express-rate-limit');

// Strict rate limit for login / register to prevent brute-force
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'محاولات دخول كثيرة جداً، يرجى الانتظار بضع دقائق والمحاولة مجدداً.',
  },
});
