# سَدِيم (Sadeem) — سوق محلي موثوق (المحافظة الوسطى)

> منصة تجارة إلكترونية متعددة التجار في قطاع غزة مبنية وفق فلسفة **الفخامة الكونية الهادئة (Cosmic Quiet Luxury)** مع نظام **الطرد الموحد (8 شيكل)** والمعاينة قبل الدفع.

---

## 📁 هيكلية المشروع (Monorepo Structure)

```text
Sadeem-store/
├── frontend/             # Next.js 16 (Turbopack) + React 19 + Tailwind CSS v4
│   ├── app/              # App Router (Home, Cart, Checkout, PDP, Auth, Merchant Join)
│   ├── components/       # UI Components & AppShell
│   ├── context/          # AuthContext & CartContext
│   ├── features/auth/    # React Hook Form + Zod Schemas + Custom Hooks
│   ├── shared/lib/       # Core API Client (Silent Token Refresh via HttpOnly Cookies)
│   └── next.config.ts    # API Proxy Rewrites to Backend
│
├── backend/              # Node.js + Express.js + MongoDB (Mongoose)
│   ├── src/
│   │   ├── config/       # MongoDB Connection
│   │   ├── controllers/  # Auth & Merchant Approval Controllers
│   │   ├── middlewares/  # JWT Verification, Refresh Token Rotation, Rate Limiter
│   │   ├── models/       # User, Merchant, RefreshToken Models
│   │   ├── routes/       # Auth & Merchant Route Handlers
│   │   └── server.js     # Express App Entry Point
│   └── package.json
│
└── README.md
```

---

## 🚀 تشغيل المشروع محلياً

### 1. تشغيل الباك إند (Express API)
```bash
cd backend
npm install
npm run dev
# يعمل الخادم على http://localhost:5000
```

### 2. تشغيل الفرونت إند (Next.js)
```bash
cd frontend
npm install
npm run dev
# يعمل الموقع على http://localhost:3000
```

---

## 🔐 دورة الأمان والـ Auth
1. **HttpOnly Cookies:** تخزين رموز `token` (صلاحية 15 دقيقة) و `refreshToken` (صلاحية 30 يوماً) في كوكيز محمية لا يمكن قراءتها من الجافاسكريبت لحماية المحفظة الرقمية.
2. **التجديد الصامت (Silent Token Refresh):** يقوم ملف `frontend/shared/lib/coreApi.ts` بتجديد التوكن تلقائياً عند انتهاء صلاحيته دون مقاطعة الزبون.
3. **كشف سرقة الجلسة (Reuse Detection):** إذا استُخدم رمز تجديد ملغي، تُبطل جميع جلسات الحساب فوراً.
4. **حماية التخمين (Rate Limiting):** مسارات الدخول والتسجيل محمية من محاولات التخمين وهجمات Brute-force.

---

## 🏬 دورة تسجيل واعتماد التجار (Merchant Approval Flow)
* يسجل التاجر عبر صفحة `/merchant/join` متضمنة اسم المتجر، المالك، الهاتف، المدينة، والتصنيف.
* يتم إنشاء حساب التاجر بحالة **`pending_approval`** ولا يستطيع الدخول كتاجر فاعل قبل موافقة الإدارة.
* تعتمد الإدارة المتجر عبر لوحة التحكم من خلال مسار `PATCH /api/merchants/:id/approve` فتتحول الحالة إلى `active` ويصبح المتجر موثقاً.
