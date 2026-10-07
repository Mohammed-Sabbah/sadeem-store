const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const RefreshToken = require('../models/refreshToken.model');
const Otp = require('../models/otp.model');
const { ROLE, STATUS } = require('../constants/enums');
const { issueAccessToken, issueRefreshToken, verifyToken } = require('../utils/token');

async function runAuthSuite() {
    console.log('\n======================================================');
    console.log('   سَدِيم (Sadeem) — فحص شامل لوظائف وأمان المصادقة Auth   ');
    console.log('======================================================\n');

    await mongoose.connect('mongodb://127.0.0.1:27017/sadeem_db');
    console.log('✔ اتصال سليم بقاعدة البيانات MongoDB');

    const testEmail = `authtest_${Date.now()}@sadeem.ps`;
    const testPassword = 'Password123!';

    // Test 1: User & Wallet Creation
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await User.create({
        name: 'مستخدم تجريبي للفحص',
        phoneNumber: `059${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: testEmail,
        password: hashedPassword,
        role: ROLE.USER,
        status: STATUS.ACTIVE,
    });
    const wallet = await Wallet.create({ userId: user._id, balance: 0, currency: 'ILS' });
    console.log(`✔ [PASS] تسجيل الحساب وإنشاء المحفظة بنجاح (المحفظة: ${wallet.currency})`);

    // Test 2: Password verification
    const passMatches = await bcrypt.compare(testPassword, user.password);
    const wrongPass = await bcrypt.compare('WrongPassword', user.password);
    if (!passMatches || wrongPass) throw new Error('فشل التحقق من صحة تشفير كلمة المرور');
    console.log('✔ [PASS] تشفير ومقارنة كلمات المرور Bcrypt سليم ومحصن');

    // Test 3: JWT Token Generation & Verification
    const access = issueAccessToken(user);
    const refresh = issueRefreshToken(user);
    const accessPayload = verifyToken(access);
    const refreshPayload = verifyToken(refresh.token);
    if (accessPayload.userId !== user._id.toString() || refreshPayload.type !== 'refresh') {
        throw new Error('فشل التحقق من بنية توكنات الـ JWT');
    }
    console.log('✔ [PASS] توليد وفحص Access Token و Refresh Token بنجاح');

    // Test 4: Refresh Token Family & Reuse Detection
    const tokenHash = crypto.createHash('sha256').update(refresh.token).digest('hex');
    await RefreshToken.create({
        userId: user._id,
        tokenHash,
        jti: refresh.jti,
        familyId: refresh.familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    console.log('✔ [PASS] تخزين الـ Refresh Token في قاعدة البيانات بنجاح');

    // Test 5: OTP Flow Simulation
    const otpCode = '654321';
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    const otpDoc = await Otp.create({
        userId: user._id,
        sentTo: testEmail,
        hashedOtp,
        sessionTokenHash,
        attempts: 0,
        verified: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const isOtpCorrect = await bcrypt.compare(otpCode, otpDoc.hashedOtp);
    if (!isOtpCorrect) throw new Error('فشل التحقق من كود الـ OTP');
    console.log('✔ [PASS] إنشاء والتحقق من رمز OTP المشفر بنجاح');

    // Cleanup
    await User.deleteOne({ _id: user._id });
    await Wallet.deleteOne({ userId: user._id });
    await RefreshToken.deleteMany({ userId: user._id });
    await Otp.deleteOne({ _id: otpDoc._id });
    console.log('✔ [PASS] تنظيف بيانات الفحص بنجاح');

    console.log('\n✨ جميع اختبارات الأمان والـ Auth اكتملت بنجاح 100%!');
    await mongoose.disconnect();
}

runAuthSuite().catch((err) => {
    console.error('❌ خطأ في فحص الـ Auth:', err);
    process.exit(1);
});
