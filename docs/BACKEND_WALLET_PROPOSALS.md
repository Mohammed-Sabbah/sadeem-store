# وثيقة مقترحات وتحسينات الباك إند لمنظومة المحفظة (Backend Wallet RFC & Proposals)

> **الموجّه إليه:** مهندس الباك إند المسؤول عن منظومة `backend` في متجر سَدِيم  
> **المُعِد:** فريق واجهات المستخدم (Frontend Team)  
> **الحالة:** مسودة للمراجعة والتقييم المعماري (Draft for Review & Evaluation)  
> **المرجع المعماري:** [ADR 0011: هندسة واجهات المحفظة وحوكمة التدقيق المالي](0011-wallet-admin-governance-and-customer-ux.md)  
> **التاريخ:** 2 نوفمبر 2026  

---

## 1. الملخص التنفيذي (Executive Summary)

خلال ربط واجهات الزبون (`/account/wallet`) ولوحة الإدارة والتدقيق المالي (`/admin/wallet`) مع نقاط النهاية الحالية في الخادم، ظهرت حالتان ميدانيتان بحاجة إلى دراسة معمارية ومواءمة على مستوى قاعدة البيانات والـ API:
1. **تحديد وسيلة التحويل المستخدمة من الزبون:** يحتاج المدقق المالي في لوحة الإدارة إلى معرفة البنك أو المحفظة التي اختارها الزبون (جوال باي، بال باي، بنك فلسطين، البنك الإسلامي الفلسطيني) لمطابقتها فوراً مع كشف الحساب البنكي دون الاعتماد فقط على القراءة اليدوية للإشعار المرفوع.
2. **انعكاس تصحيح الإدارة لمبلغ الشحن:** عندما يخطئ الزبون في كتابة المبلغ (مثلاً أدخل 50 ₪ بينما الإيصال الفعلي 45 ₪)، يقوم الآدمن بتعديل المبلغ إلى 45 ₪ واعتماده. رصيد المحفظة يرتفع بالفعل بـ 45 ₪، ولكن مستند المعاملة في قاعدة البيانات يظل محتفظاً بالـ 50 ₪ القديمة، مما يخلق تضارباً في سجل حركات الزبون مقارنة برصيده الحقيقي.

نضع بين أيديكم هذا المقترح لتقييمه واعتماد ما ترونه مناسباً وفق الهيكلية البرمجية المعتمدة للباك إند دون إجراء أي تعديل مباشر من طرفنا.

---

## 2. المسألة الأولى: حفظ وسيلة الدفع / التحويل (Payment Rail / Channel)

### أ. الوضع الحالي
* في مخطط `WalletTransaction`: يتوفر حقل `referenceId: { type: String }`.
* **ملاحظة معمارية هامة:** تبين لنا أن حقل `referenceId` مستخدم في منطق العمليات لربط رقم الطلب `orderId` عند الشراء المباشر من المحفظة (`WALLET_TRANSACTION_TYPE.PURCHASE`).
* لذلك، **لا نوصي أبداً بإعادة استخدام حقل `referenceId` لتخزين اسم البنك** في عمليات الإيداع، تفادياً لأي تضارب دلالي (Semantic Conflict) أو كسر للعلاقات المرجعية مع الطلبات.

### ب. المقترح الفني
إضافة حقل مستقل مخصص لقناة التحويل في نموذج `WalletTransaction`:
```javascript
// في backend/models/WalletTransaction.js
paymentRail: {
    type: String,
    enum: ['JAWWAL_PAY', 'PALPAY', 'BOP', 'PIB', 'CASH', 'OTHER'],
    default: null,
    trim: true,
}
```

### ج. نقاط التعديل المقترحة في الـ API
1. **في `backend/schemas/depositSchema.js`:**
   إضافة التحقق من الحقل اختيارياً في `validateDepositRequest`:
   ```javascript
   body('paymentRail')
       .optional({ nullable: true })
       .isString().trim()
       .isIn(['JAWWAL_PAY', 'PALPAY', 'BOP', 'PIB', 'CASH', 'OTHER'])
       .withMessage('Invalid payment rail')
   ```
2. **في `backend/controllers/deposit.controller.js`:**
   استقبال `paymentRail` وتمريره لخدمة الإيداع:
   ```javascript
   async function createDepositRequest(req, res, next) {
       try {
           const deposit = await createDeposit({
               userId: req.user._id,
               amount: req.body.amount,
               proofImage: req.body.proofImage,
               paymentRail: req.body.paymentRail,
           });
           ...
   ```
3. **في `backend/services/deposit.service.js`:**
   تمرير `paymentRail` إلى `createTransaction`.

---

## 3. المسألة الثانية: تسجيل المبلغ المصحح من الإدارة (Corrected Deposit Amount)

### أ. الوضع الحالي
في ملف `backend/services/deposit.service.js` داخل دالة `approveDeposit`:
```javascript
// سطر 40
const depositAmount = amount ?? deposit.amount;
await increaseWalletBalance({
    userId: deposit.userId,
    walletId: deposit.walletId,
    withdrawableBalance: depositAmount
}, session);

// سطر 51
const updates = {
    status: TRANSACTION_STATUS.APPROVED,
    verifiedBy
};
await updateTransaction({ transactionId: deposit._id, query, updates }, session);
```
**الملاحظة:**
يتم زيادة رصيد المحفظة بالقيمة الجديدة `depositAmount`، ولكن كائن `updates` لا يحدّث حقل `amount` في مستند `WalletTransaction`!
نتيجة ذلك: عندما يستعلم تطبيق العميل عن الحركات عبر `GET /api/wallet/user/transactions`، يقرأ المستند القديم ويظهر له الرقم الخاطئ الذي أدخله، بينما رصيد محفظته يعكس المبلغ المصحح.

### ب. المقترح الفني
1. تحديث `amount` في كائن `updates` ليأخذ قيمة `depositAmount` المعتمدة فعلياً.
2. لحفظ القيمة الأصلية التي ادعاها الزبون (لأغراض التدقيق المحاسبي ومراجعة النزاعات)، نقترح إضافة حقل اختياري `requestedAmount` أو `originalAmount`:

```javascript
// في backend/models/WalletTransaction.js
requestedAmount: {
    type: Number,
    default: null,
    validate: {
        validator: (value) => value === null || (Number.isFinite(value) && Math.round(value * 100) === value * 100),
        message: 'Requested amount must have at most two decimal places',
    },
}
```

3. عند إنشاء الطلب في `createDeposit`:
   - يتم تعيين `amount: pureAmount` و `requestedAmount: pureAmount`.
4. عند موافقة الآدمن بمبلغ مصحح في `approveDeposit`:
   ```javascript
   const depositAmount = (amount !== undefined && amount !== null)
       ? parsePositiveMoney(amount)
       : deposit.amount;

   const updates = {
       status: TRANSACTION_STATUS.APPROVED,
       verifiedBy,
       amount: depositAmount, // يضمن مطابقة الحركة مع رصيد المحفظة
       requestedAmount: deposit.requestedAmount ?? deposit.amount, // يحفظ المبلغ السابق المدعى
       isProofReviewed: true,
       reviewedAt: new Date(),
   };
   ```

---

## 4. جاهزية الفرونت إند والتوافق العكسي (Backward Compatibility)

* واجهات الفرونت إند الحالية (صفحة الزبون ولوحة الإدارة) مصممة بأسلوب **البرمجة الدفاعية (Defensive UI)**:
  - إذا توفر الحقل الجديد `paymentRail` أو أي تفاصيل إضافية تعرضها فوراً، وإذا لم تتوفر تتعامل بسلاسة ودون انهيار.
  - إذا توفر حقل `requestedAmount` وكان مختلفاً عن `amount`، تبرز الواجهة للزبون إشعاراً لطيفاً يوضح أن الإدارة قامت بتصحيح المبلغ المعتمد.
  - لم يتم فرض أي كسر للتوافق العكسي (Zero Breaking Changes).

---

## 5. قرار مهندس الباك إند المطلوب
يرجى من زميلنا مراجعة النقطتين أعلاه واختيار:
- [ ] اعتماد التسميات المقترحة (`paymentRail`, `requestedAmount`).
- [ ] أو اقتراح أسماء بديلة تناسب النمط العام للباك إند (مثلاً `channel` بدلاً من `paymentRail`، أو `claimedAmount` بدلاً من `requestedAmount`) وإعلامنا بها لتوحيدها فوراً في الـ Typescript Types بالفرونت إند.
