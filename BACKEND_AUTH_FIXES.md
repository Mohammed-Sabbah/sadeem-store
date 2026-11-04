# دليل إصلاحات الـ Authentication (Backend Fixes)

> تم إنشاء هذا الملف كنسخة مباشرة في جذر المشروع. النسخة الأصلية موجودة في: [`backend/AUTH_FIXES.md`](./backend/AUTH_FIXES.md).

راجع الملف [`backend/AUTH_FIXES.md`](./backend/AUTH_FIXES.md) لمعرفة التعديلات المطلوبة بالسطر والكود الجاهز لكل مشكلة في الباك إند:
1. تقليص صلاحية Access Token إلى 15 دقيقة (`config/cookies.js`).
2. ترتيب فحص حساب التاجر عند تسجيل الدخول لإظهار "بانتظار الموافقة" (`controllers/authController.js`).
3. إعدادات Resend مع Dev Fallback لعدم كسر السيرفر (`utils/email.js` + `.env`).
4. إضافة مسار تغيير كلمة المرور للمستخدم المسجل `POST /api/auth/change-password`.
5. ضبط CORS وحصره بالـ Production على النطاق المعتمد (`app.js`).
6. تزامن موافقة المتجر مع تفعيل التاجر عبر `withMongoTransaction` (`controllers/storeController.js`).
