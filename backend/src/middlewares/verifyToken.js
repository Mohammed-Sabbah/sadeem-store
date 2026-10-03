const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { error, serverError } = require('../utils/responses');

module.exports = async (req, res, next) => {
  let token = req.cookies?.token;

  // Also support Authorization header for mobile/external API clients
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return error(res, 401, 'يرجى تسجيل الدخول للمتابعة');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sadeem_super_secret_jwt_key_2026');
    const user = await User.findById(decoded._id);

    if (!user || user.isDeleted) {
      return error(res, 401, 'الحساب غير موجود أو تم حذفه');
    }

    if (user.status === 'pending_approval') {
      return error(res, 403, 'حساب التاجر قيد المراجعة والاعتماد من قبل إدارة سَدِيم');
    }

    if (user.status !== 'active') {
      return error(res, 403, 'الحساب معطل حالياً، يرجى التواصل مع إدارة سَدِيم');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, 'انتهت صلاحية الجلسة، يرجى التجديد');
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 401, 'رمز التحقق غير صالح');
    }
    return serverError(res, err);
  }
};
