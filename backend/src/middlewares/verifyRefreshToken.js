const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const RefreshToken = require('../models/refreshToken.model');
const User = require('../models/user.model');
const { error, serverError } = require('../utils/responses');

module.exports = async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return error(res, 401, 'رمز التجديد غير متوفر، يرجى تسجيل الدخول مجدداً');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'sadeem_super_secret_jwt_key_2026');

    const tokenDoc = await RefreshToken.findById(decoded.tokenId);
    if (!tokenDoc) {
      return error(res, 401, 'جلسة التجديد غير موجودة أو منتهية الصلاحية');
    }

    // Reuse Detection: If a revoked token is presented, revoke all sessions for this user!
    if (tokenDoc.revoked) {
      await RefreshToken.updateMany({ userId: decoded.userId }, { revoked: true });
      return error(res, 401, 'تم إلغاء الجلسة لأسباب أمنية، يرجى تسجيل الدخول مجدداً');
    }

    // Validate hash
    const isMatched = await bcrypt.compare(refreshToken, tokenDoc.tokenHash);
    if (!isMatched) {
      return error(res, 401, 'رمز التجديد غير صالح');
    }

    // Verify user is still active and not banned (Fixing Zemam vulnerability)
    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted || user.status !== 'active') {
      await RefreshToken.updateMany({ userId: decoded.userId }, { revoked: true });
      return error(res, 403, 'الحساب غير متاح أو قيد المراجعة');
    }

    req.userId = decoded.userId;
    req.oldTokenDoc = tokenDoc;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, 'انتهت صلاحية جلسة التجديد بالكامل');
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 401, 'رمز التجديد غير صالح');
    }
    return serverError(res, err);
  }
};
