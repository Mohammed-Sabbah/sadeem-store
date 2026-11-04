# دليل إصلاحات الـ Authentication (Backend Fixes)

هذا الملف يحتوي على المشاكل المكتشفة في طبقة المصادقة (Auth) بالباك إند مع الحل البرمجي الجاهز لكل مشكلة.

---

## 1. تقليص صلاحية Access Token إلى 15 دقيقة
* **الملف:** `backend/config/cookies.js` (السطر 9)
* **المشكلة:** القيمة الحالية `15 * 30 * 60` تعادل **7.5 ساعات (27,000 ثانية)**. هذا يجعل التوكن صالحاً للعمل لساعات حتى لو قام المستخدم بتسجيل الخروج.
* **الحل:** استبدال السطر بما يلي:
```javascript
// 15 دقيقة فقط (بالثواني)
const accessTokenTTL = 15 * 60; 
```

---

## 2. ترتيب فحص حساب التاجر عند تسجيل الدخول
* **الملف:** `backend/controllers/authController.js` (الأسطر 148–164)
* **المشكلة:** التاجر الجديد يُسجَّل بحالة `user.status = 'pendingApproval'`. عند محاولته الدخول، يصطدم أولاً بشرط `if (user.status !== STATUS.ACTIVE)` فيرجع له خطأ `401: User account is inactive`، ولا يصل إطلاقاً لشرط فحص المتجر الذي يرجع رسالة `Your merchant store is pending admin approval`.
* **الحل:** نقل فحص المتجر **قبل** فحص حالة المستخدم العامة:

```javascript
// استبدال الأسطر 148-164 في authController.js بالتالي:

// 1. فحص التاجر أولاً إذا كان الحساب لتاجر
if (user.role === ROLE.SELLER) {
    const store = await Store.findOne({ ownerId: user._id });
    if (!store) {
        return error(res, 401, 'Store not found');
    }

    if (store.approveStatus === APPROVE_STATUS.PENDING) {
        return error(res, 403, 'Your merchant store is pending admin approval');
    }

    if (store.approveStatus === APPROVE_STATUS.REJECTED) {
        return error(res, 403, 'Your merchant store has been rejected by admin');
    }
}

// 2. فحص حالة التفعيل العامة للحساب
if (user.status !== STATUS.ACTIVE) {
    return error(res, 401, 'User account is inactive');
}
```

---

## 3. مفاتيح خدمة الإيميل (Resend) والـ Fallback في التطوير
* **الملفات:** `backend/.env` و `backend/utils/email.js`
* **المشكلة:** الـ `.env` لا يحتوي على مفاتيح Resend، ودالة `sendEmail` ترمي `Error` يوقف السيرفر بخطأ 500 عند طلب "نسيت كلمة المرور".
* **الحل:**
1. إضافة المتغيرات في `backend/.env`:
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM=Sadeem <onboarding@resend.dev>
```
2. تعديل دالة `sendEmail` في `backend/utils/email.js` لتطبع الكود في الـ Console أثناء التطوير بدلاً من رمي خطأ:
```javascript
async function sendEmail(email, otp) {
    const { RESEND_API_KEY, RESEND_FROM, NODE_ENV } = process.env;

    // في بيئة التطوير، إذا لم تتوفر المفاتيح نطبع الكود بالكونسول لعدم كسر الفلو
    if (!RESEND_API_KEY || !RESEND_FROM) {
        if (NODE_ENV !== 'production') {
            console.log(`\x1b[33m[DEV OTP EMAIL]\x1b[0m To: ${email} | Code: ${otp}`);
            return;
        }
        throw new Error('Resend configuration is missing');
    }

    const resend = new Resend(RESEND_API_KEY);
    const result = await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: 'Password reset code',
        text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    if (result.error) {
        throw new Error(result.error.message);
    }
}
```

---

## 4. إضافة مسار "تغيير كلمة المرور" (Change Password)
* **المشكلة:** لا يوجد Endpoint للمستخدم المسجل دخول لتغيير كلمة المرور من حسابه.
* **الحل:**
1. إضافة الدالة في `backend/controllers/authController.js`:
```javascript
async function changePassword(req, res, next) {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return error(res, 400, 'Current and new passwords are required');
        }

        if (newPassword.length < 8) {
            return error(res, 400, 'New password must be at least 8 characters');
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return error(res, 404, 'User not found');
        }

        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            return error(res, 400, 'Current password is incorrect');
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        return success(res, 200, { message: 'Password changed successfully' });
    } catch (err) {
        return next(err);
    }
}

// ولا تنس تصديرها:
// module.exports = { ..., changePassword };
```

2. ربط المسار في `backend/routes/authRoutes.js`:
```javascript
// استيراد changePassword من authController
router.post('/change-password', authenticate, changePassword);
```

---

## 5. تقييد CORS في الإنتاج (Security)
* **الملف:** `backend/app.js` (الأسطر 10–15)
* **المشكلة:** استخدام `origin: true` مع `credentials: true` يسمح لأي نطاق خارجي بقراءة الكوكيز وإجراء طلبات نيابة عن المستخدم (CSRF risk).
* **الحل:**
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
```

---

## 6. تزامن موافقة المتجر مع تفعيل حساب التاجر (Transaction)
* **الملف:** `backend/controllers/storeController.js` (دالة `approveStore` السطور 41–70)
* **المشكلة:** تحديث المتجر إلى `approved` وتحديث المستخدم إلى `active` يتمان كعمليتين منفصلتين؛ إذا فشل تحديث المستخدم يظل معلقاً رغم قبول المتجر.
* **الحل:** تنفيذ الخطوتين داخل `withMongoTransaction`:
```javascript
async function approveStore(req, res, next) {
    const { id } = req.params;
    if (!id) return error(res, 400, 'Store ID is required');

    try {
        const updatedStore = await withMongoTransaction(async (session) => {
            const store = await Store.findOneAndUpdate(
                { _id: id, isDeleted: false, approveStatus: APPROVE_STATUS.PENDING },
                { $set: { approveStatus: APPROVE_STATUS.APPROVED, status: STATUS.ACTIVE } },
                { new: true, runValidators: true, session }
            );

            if (!store) {
                return null;
            }

            if (store.ownerId) {
                await User.findByIdAndUpdate(
                    store.ownerId, 
                    { $set: { status: STATUS.ACTIVE } },
                    { session }
                );
            }

            return store;
        });

        if (!updatedStore) {
            return error(res, 404, 'Store not found or not pending approval');
        }

        return success(res, 200, {
            message: 'Store approved successfully',
            store: updatedStore.toObject ? updatedStore.toObject() : updatedStore,
        });
    } catch (err) {
        return next(err);
    }
}
```
