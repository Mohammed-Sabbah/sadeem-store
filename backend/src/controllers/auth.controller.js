const User = require('../models/user.model');
const Merchant = require('../models/merchant.model');
const RefreshToken = require('../models/refreshToken.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { success, error, serverError } = require('../utils/responses');

// Helpers
const generateAccessToken = (user) => {
  const payload = {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    status: user.status,
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'sadeem_super_secret_jwt_key_2026', {
    expiresIn: '15m',
  });
};

const createRefreshToken = async (userId) => {
  // Revoke previous tokens for hygiene
  await RefreshToken.updateMany({ userId }, { revoked: true });

  const tokenDoc = await RefreshToken.create({ userId });
  const rawToken = jwt.sign(
    { userId, tokenId: tokenDoc._id },
    process.env.JWT_SECRET || 'sadeem_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );

  const tokenHash = await bcrypt.hash(rawToken, 10);
  tokenDoc.tokenHash = tokenHash;
  await tokenDoc.save();

  return rawToken;
};

const setCookie = (res, name, value, maxAgeMs) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(name, value, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  });
};

const clearAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

/**
 * 1. Customer Registration (Fast 3-field signup)
 */
exports.register = async (req, res) => {
  const { name, identifier, password, city } = req.body;

  try {
    if (!name || !identifier || !password) {
      return error(res, 400, 'يرجى ملء جميع الحقول المطلوبة (الاسم، رقم الجوال أو البريد، كلمة المرور)');
    }

    const cleanName = name.trim();
    const cleanId = identifier.trim();

    if (password.length < 6) {
      return error(res, 400, 'يجب ألا تقل كلمة المرور عن 6 خانات');
    }

    const isEmail = cleanId.includes('@');
    const isPhone = /^(\+?970|0)?5[96]\d{7}$/.test(cleanId.replace(/[\s-]/g, ''));

    if (!isEmail && !isPhone) {
      return error(res, 400, 'يرجى إدخال رقم جوال فلسطيني صالح (059xxxxxxx) أو بريد إلكتروني');
    }

    // Check existing
    const existingUser = await User.findOne({
      $or: [
        ...(isPhone ? [{ phone: cleanId }] : []),
        ...(isEmail ? [{ email: cleanId.toLowerCase() }] : []),
      ],
      isDeleted: false,
    });

    if (existingUser) {
      return error(res, 409, 'رقم الجوال أو البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      phone: isPhone ? cleanId : `temp_${Date.now()}`,
      email: isEmail ? cleanId.toLowerCase() : undefined,
      password: hashedPassword,
      role: 'customer',
      status: 'active',
      city: city || 'دير البلح',
      walletBalance: 0,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await createRefreshToken(user._id);

    setCookie(res, 'token', accessToken, 15 * 60 * 1000); // 15 mins
    setCookie(res, 'refreshToken', refreshToken, 30 * 24 * 60 * 60 * 1000); // 30 days

    return success(
      res,
      201,
      {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          city: user.city,
          walletBalance: user.walletBalance,
        },
      },
      'تم إنشاء الحساب بنجاح'
    );
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * 2. Dedicated Merchant Registration (Requires Admin Approval)
 */
exports.registerMerchant = async (req, res) => {
  const { name, phone, email, password, storeName, category, city, storeAddress } = req.body;

  try {
    if (!name || !phone || !password || !storeName) {
      return error(res, 400, 'يرجى ملء جميع الحقول الإلزامية لطلب انضمام المتجر');
    }

    const cleanPhone = phone.trim();
    const isPhoneValid = /^(\+?970|0)?5[96]\d{7}$/.test(cleanPhone.replace(/[\s-]/g, ''));
    if (!isPhoneValid) {
      return error(res, 400, 'يرجى إدخال رقم جوال فلسطيني صالح للتواصل والتحقق');
    }

    // Check if phone or email already in use
    const existing = await User.findOne({
      $or: [
        { phone: cleanPhone },
        ...(email ? [{ email: email.trim().toLowerCase() }] : []),
      ],
      isDeleted: false,
    });

    if (existing) {
      return error(res, 409, 'رقم الجوال أو البريد الإلكتروني مسجل مسبقاً في النظام');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with pending_approval status
    const user = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim().toLowerCase() : undefined,
      password: hashedPassword,
      role: 'merchant',
      status: 'pending_approval', // NOT active until admin approves!
      city: city || 'دير البلح',
      address: storeAddress || '',
      walletBalance: 0,
    });

    // Create Merchant Profile
    const merchant = await Merchant.create({
      ownerId: user._id,
      storeName: storeName.trim(),
      category: category || 'أزياء وملابس',
      city: city || 'دير البلح',
      storeAddress: storeAddress || '',
      phone: cleanPhone,
      status: 'pending_approval',
    });

    user.merchantId = merchant._id;
    await user.save();

    // Do NOT log the merchant in yet (status is pending)
    return success(
      res,
      201,
      {
        merchantId: merchant._id,
        status: 'pending_approval',
        storeName: merchant.storeName,
      },
      'تم استلام طلب انضمام متجرك بنجاح! سيتم تفعيل حسابك فور مراجعة واعتماد إدارة سَدِيم.'
    );
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * 3. Login (Phone or Email + Password)
 */
exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    if (!identifier || !password) {
      return error(res, 400, 'يرجى إدخال رقم الجوال/البريد الإلكتروني وكلمة المرور');
    }

    const cleanId = identifier.trim();
    const isEmail = cleanId.includes('@');

    const user = await User.findOne({
      $or: [
        { phone: cleanId },
        ...(isEmail ? [{ email: cleanId.toLowerCase() }] : []),
      ],
      isDeleted: false,
    });

    if (!user) {
      return error(res, 401, 'بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مجدداً');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 401, 'بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مجدداً');
    }

    // Check Account Status
    if (user.status === 'pending_approval') {
      return error(
        res,
        403,
        'طلب انضمام متجرك قيد المراجعة والاعتماد من قبل إدارة سَدِيم. سنتواصل معك هاتفياً للتحقق وتفعيل المتجر.'
      );
    }

    if (user.status !== 'active') {
      return error(res, 403, 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة منصة سَدِيم');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await createRefreshToken(user._id);

    setCookie(res, 'token', accessToken, 15 * 60 * 1000);
    setCookie(res, 'refreshToken', refreshToken, 30 * 24 * 60 * 60 * 1000);

    return success(
      res,
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          city: user.city,
          address: user.address,
          walletBalance: user.walletBalance,
        },
      },
      'تم تسجيل الدخول بنجاح'
    );
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * 4. Silent Token Refresh (Auto rotation + ban check)
 */
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.isDeleted || user.status !== 'active') {
      clearAuthCookies(res);
      return error(res, 403, 'الجلسة ملغاة أو الحساب غير متاح');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await createRefreshToken(user._id);

    setCookie(res, 'token', newAccessToken, 15 * 60 * 1000);
    setCookie(res, 'refreshToken', newRefreshToken, 30 * 24 * 60 * 60 * 1000);

    return success(
      res,
      200,
      { expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
      'تم تجديد الجلسة بنجاح'
    );
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * 5. Logout
 */
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'sadeem_super_secret_jwt_key_2026');
        if (decoded?.tokenId) {
          await RefreshToken.findByIdAndUpdate(decoded.tokenId, { revoked: true });
        }
      } catch {
        // Token was invalid, proceed
      }
    }

    clearAuthCookies(res);
    return success(res, 200, {}, 'تم تسجيل الخروج بنجاح');
  } catch (err) {
    return serverError(res, err);
  }
};

/**
 * 6. Current User Session (GET /api/auth/me)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('merchantId');
    return success(res, 200, { user }, 'بيانات الحساب الحالية');
  } catch (err) {
    return serverError(res, err);
  }
};
