/**
 * Standardized API Response Helpers
 */
exports.success = (res, statusCode = 200, data = {}, message = 'نجحت العملية') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

exports.error = (res, statusCode = 400, message = 'حدث خطأ في الطلب', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

exports.serverError = (res, err = null) => {
  if (err && process.env.NODE_ENV !== 'production') {
    console.error('[Server Error]:', err);
  }
  return res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً',
  });
};
