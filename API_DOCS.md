# سَدِيم (Sadeem) — توثيق واجهات برمجة التطبيقات (API Documentation)

المسار الأساسي (Base Path): `/api`  
ترسل وتستقبل الطلبات عادةً بصيغة `Content-Type: application/json`، باستثناء طلبات رفع الصور التي تستخدم `multipart/form-data`.

المسارات المحددة بـ **Seller** تتطلب حساب تاجر موثق، والمسارات المحددة بـ **Admin** تتطلب صلاحيات مدير المنصة.

---

## 1. الفلسفة المعمارية لمنظومة المنتجات والأصناف (Product Architecture)
تعتمد المنصة على نمذجة عالية الأداء تدمج بين وضعين تشغيليين:
1. **نمط الحفظ الجماعي الذري (Atomic Batch Matrix Mode):** مخصص لاستوديو التاجر (`POST /products` أو `PATCH /products/:id`) لحفظ مصفوفة الخيارات والأصناف دفعة واحدة بمعاملة ذرية (Mongoose Transaction & Automatic Rollback).
2. **نمط الدُفعات (Batch Sub-resource Mode):** جميع عمليات الأصناف تمر عبر `/products/:id/variants` بمصفوفة JSON واحدة (إضافة، تعديل، حذف، أو اعتماد)، مع احتساب تلقائي وفوري لملخص الأسعار والمخزون (`minPrice`, `maxPrice`, `totalStock`, `inStock`).

---

## 2. مسارات المنتجات (Products Endpoints)

| الطريقة | المسار | الصلاحية | الوصف وملخص الطلب |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | عام (Public) | جلب المنتجات المعتمدة والنشطة مع الترقيم والفلترة والبحث والفرز |
| `GET` | `/products/:id` | عام (Public) | جلب تفاصيل منتج معتمد مع أصنافه غير المحذوفة |
| `GET` | `/products/seller` | تاجر (Seller) | جلب منتجات المتجر الحالي (مع إحصاءات كل صنف) |
| `GET` | `/products/mine` | تاجر (Seller) | مسار بديل لجلب منتجات المتجر الحالي |
| `GET` | `/products/admin` | مدير (Admin) | جلب كافة المنتجات في المنصة (بما فيها المعلقة والموقوفة) |
| `GET` | `/products/admin/:id` | مدير (Admin) | جلب تفاصيل أي منتج للمراجعة الإدارية |
| `POST` | `/products` | تاجر (Seller) | إنشاء منتج جديد (يدعم الأصناف الفردية أو مصفوفة كاملة) |
| `PATCH` | `/products/:id` | تاجر (Seller) | تعديل بيانات المنتج ومصفوفة أصنافه دفعة واحدة |
| `PATCH` | `/products/:id/status` | تاجر (Seller) | تفعيل أو إيقاف المنتج: `{"status": "inActive"}` |
| `PATCH` | `/products/admin/:id/approval` | مدير (Admin) | اعتماد أو رفض المنتج: `{"approveStatus": "approved"}` |
| `DELETE` | `/products/:id` | تاجر/مدير | حذف ناعم للمنتج وكافة أصنافه التابعة |

### معلمات التصفية والاستعلام لـ `GET /products`:
* `page`: رقم الصفحة (افتراضي: 1)
* `limit`: عدد العناصر بالصفحة (افتراضي: 20، حد أقصى: 100)
* `categoryId`: معرف التصنيف
* `storeId`: معرف المتجر
* `minPrice` / `maxPrice`: فلترة نطاق السعر المحسوب والمفهرس
* `inStock`: فلترة توفر المخزون (`true` / `false`)
* `search` أو `q`: بحث نصي في العنوان والوصف
* `sort`: ترتيب النتائج (`newest`, `price-asc`, `price-desc`)

---

### أمثلة طلبات المنتجات:

#### 1. إنشاء منتج بمصفوفة أصناف (Product Studio Batch Matrix):
`POST /api/products`

```json
{
  "title": "فستان السديم الحريري",
  "description": "فستان سهرة من الحرير الطبيعي الفاخر مع تطريز يدوي",
  "categoryId": "64f000000000000000000001",
  "images": [
    "https://example.com/dress-1.jpg",
    "https://example.com/dress-2.jpg"
  ],
  "options": [
    {
      "key": "color",
      "label": "اللون",
      "type": "COLOR",
      "values": ["أسود", "عنابي"]
    },
    {
      "key": "size",
      "label": "المقاس",
      "type": "SIZE",
      "values": ["S", "M"]
    }
  ],
  "variants": [
    {
      "attributes": { "color": "أسود", "size": "S" },
      "image": "https://example.com/dress-black-s.jpg",
      "price": 180,
      "stock": 10
    },
    {
      "attributes": { "color": "أسود", "size": "M" },
      "image": "https://example.com/dress-black-m.jpg",
      "price": 180,
      "stock": 15
    },
    {
      "attributes": { "color": "عنابي", "size": "S" },
      "image": "https://example.com/dress-burgundy-s.jpg",
      "price": 200,
      "stock": 8
    }
  ]
}
```

#### 2. إنشاء منتج بسيط (Simple Single-Variant Product):
`POST /api/products`

```json
{
  "title": "عطر الليل السديمي 100 مل",
  "description": "عطر فاخر برائحة العود المعتق والكهرمان",
  "categoryId": "64f000000000000000000002",
  "images": ["https://example.com/perfume.jpg"],
  "price": 120,
  "stock": 25
}
```

---

## 3. مسارات الأصناف (Variant Sub-resources)

تعمل جميع المسارات التالية بنمط الدُفعات فقط: يرسل الطلب مصفوفة JSON، وتُتحقق جميع العناصر قبل حفظ أي منها. لا توجد مسارات مفردة مثل `/:variantId`.

| الطريقة | المسار | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `POST` | `/products/:id/variants` | تاجر (Seller) | إضافة صنف واحد أو عدة أصناف |
| `PATCH` | `/products/:id/variants` | تاجر (Seller) | تعديل عدة أصناف؛ كل عنصر يتضمن `variantId` |
| `DELETE` | `/products/:id/variants` | تاجر (Seller) | حذف عدة أصناف ناعماً؛ الأصناف المحذوفة مسبقاً يتم تخطيها |
| `PATCH` | `/products/:id/variants/approval` | مدير (Admin) | مراجعة واعتماد أو رفض عدة أصناف |

### أمثلة طلبات الأصناف:

#### إضافة أصناف جديدة (Create Variants):
`POST /api/products/:id/variants`

```json
[
  {
    "attributes": { "color": "أزرق", "size": "M" },
    "price": 185,
    "stock": 20,
    "image": "https://example.com/dress-blue-m.jpg"
  }
]
```

#### تعديل عدة أصناف (Update Variants):
`PATCH /api/products/:id/variants`

```json
[
  {
    "variantId": "64f000000000000000000001",
    "price": 185,
    "stock": 20,
    "status": "active",
    "attributes": { "color": "أزرق", "size": "M" }
  }
]
```

#### حذف عدة أصناف:
`DELETE /api/products/:id/variants`

```json
["64f000000000000000000001", "64f000000000000000000002"]
```

#### مراجعة عدة أصناف:
`PATCH /api/products/:id/variants/approval`

```json
[
  { "variantId": "64f000000000000000000001", "approveStatus": "approved" },
  { "variantId": "64f000000000000000000002", "approveStatus": "rejected", "reason": "الصورة غير واضحة" }
]
```

### رفع صور المنتجات والأصناف

تستخدم طلبات الصور `multipart/form-data` مع نفس المسارات والصلاحيات:

| المسار | اسم حقل الملف | الحد |
| :--- | :--- | :--- |
| `POST /api/products` و`PATCH /api/products/:id` | `images` (يتكرر لكل صورة) | من صورة واحدة إلى 5 صور عند الإنشاء، وبحد أقصى 5 صور في التعديل |

الصيغ المقبولة هي JPEG وPNG وWebP، بحد أقصى 5 ميغابايت لكل صورة. استبدال صور المنتج عبر التعديل يحدّث قائمة الصور كاملة؛ عدم إرسال ملفات جديدة يحافظ على الصور الحالية.

بالنسبة للأصناف، مسارات `/products/:id/variants` تستقبل مصفوفة JSON فقط ولا تدعم `multipart/form-data` لرفع ملفات الأصناف. أرسل رابط صورة واحداً في الحقل `image` داخل كل عنصر، أو احذفه ليستخدم الخادم صورة المنتج الأولى. عند إنشاء منتج بصنف بسيط، تُستخدم الصورة الأولى للمنتج كصورة الصنف. عدم إرسال صورة عند تعديل الصنف يحافظ على صورته الحالية.

مثال إنشاء منتج باستخدام `FormData`:

```js
const formData = new FormData();
formData.append('title', 'فستان السديم الحريري');
formData.append('categoryId', categoryId);
formData.append('price', '180');
formData.append('stock', '10');
formData.append('images', firstImageFile);
formData.append('images', secondImageFile);

await fetch('/api/products', {
  method: 'POST',
  body: formData,
  credentials: 'include',
});
```

أرسل حقول المنتج النصية ضمن `FormData` أيضاً. لا تضبط ترويسة `Content-Type` يدوياً حتى يضيف المتصفح حدّ `multipart/form-data` تلقائياً. أما الأصناف فتُرسل كمصفوفة JSON عبر طلباتها المخصصة، وصورها كروابط URL.

---

## 4. مسارات الأقسام والتصنيفات (Categories Endpoints)

| الطريقة | المسار | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | عام (Public) | جلب قائمة كافة الأقسام النشطة |
| `GET` | `/categories/:slug` | عام (Public) | جلب تفاصيل قسم محدد بالـ Slug |
| `POST` | `/categories` | مدير (Admin) | إنشاء قسم جديد وتحديد خصائصه المسموحة |
| `PATCH` | `/categories/:id` | مدير (Admin) | تعديل بيانات القسم وخصائصه مع فحص التوافقية |
| `DELETE` | `/categories/:id/variant-attributes/:attributeKey` | مدير (Admin) | حذف خاصية مسموحة من القسم بعد التأكد من عدم كسر المنتجات |
| `DELETE` | `/categories/:id` | مدير (Admin) | حذف قسم (يُمنع إذا كان يحتوي على منتجات قائمة) |

### أمثلة طلبات الأقسام:

#### إنشاء قسم جديد:
`POST /api/categories`

```json
{
  "title": "أزياء نسائية فاخرة",
  "icon": "sparkles",
  "variantAttributes": [
    {
      "name": "اللون",
      "key": "color",
      "type": "String"
    },
    {
      "name": "المقاس",
      "key": "size",
      "type": "String"
    }
  ]
}
```

`key` is the stable identifier used in variant `attributes` objects and must be unique within the category. `name` is the user-facing label. `type` is one of `String`, `Number`, or `Boolean` (default `String`); each variant supplies its own value for that key, and the value must match its declared type. For example, a variant may use `"attributes": { "color": "أسود", "size": "M" }`, while a numeric attribute can use `"attributes": { "weight": 1.5 }`.

---

## 5. القيم الثابتة المعتمدة (Enums Reference)

* **حالات الحسابات (ROLE):** `admin`, `seller`, `user`, `courier`
* **حالات النشاط (STATUS):** `active`, `inActive`
* **حالات الاعتماد (APPROVE_STATUS):** `pending`, `approved`, `rejected`
