# سَدِيم (Sadeem) — توثيق واجهات برمجة التطبيقات (API Documentation)

المسار الأساسي (Base Path): `/api`  
ترسل وتستقبل كافة الطلبات بصيغة `Content-Type: application/json`.  
المسارات المحددة بـ **Seller** تتطلب حساب تاجر موثق، والمسارات المحددة بـ **Admin** تتطلب صلاحيات مدير المنصة.

---

## 1. الفلسفة المعمارية لمنظومة المنتجات والأصناف (Product Architecture)
تعتمد المنصة على نمذجة عالية الأداء تدمج بين وضعين تشغيليين:
1. **نمط الحفظ الجماعي الذري (Atomic Batch Matrix Mode):** مخصص لاستوديو التاجر (`POST /products` أو `PATCH /products/:id`) لحفظ مصفوفة الخيارات والأصناف دفعة واحدة بمعاملة ذرية (Mongoose Transaction & Automatic Rollback).
2. **نمط العمليات المفردة (Granular Sub-resource Mode):** مخصص لإدارة المخازن، التعديل السريع، أو ماسحات الباركود (`/products/:id/variants`) مع احتساب تلقائي وفوري لملخص الأسعار والمخزون (`minPrice`, `maxPrice`, `totalStock`, `inStock`).

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
      "sku": "SDM-DRS-BLK-S-101",
      "price": 180,
      "compareAtPrice": 220,
      "stock": 10
    },
    {
      "attributes": { "color": "أسود", "size": "M" },
      "sku": "SDM-DRS-BLK-M-102",
      "price": 180,
      "stock": 15
    },
    {
      "attributes": { "color": "عنابي", "size": "S" },
      "sku": "SDM-DRS-BUR-S-103",
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
  "image": "https://example.com/perfume.jpg",
  "price": 120,
  "stock": 25,
  "sku": "SDM-PRF-100ML-001"
}
```

---

## 3. مسارات الأصناف المفردة (Variant Sub-resources)

| الطريقة | المسار | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `POST` | `/products/:id/variants` | تاجر (Seller) | إضافة صنف جديد مفرد للمنتج واحتساب الملخص آلياً |
| `PATCH` | `/products/:id/variants/:variantId` | تاجر (Seller) | تعديل سعر، مخزون، أو خصائص صنف محدد واحتساب الملخص |
| `DELETE` | `/products/:id/variants/:variantId` | تاجر (Seller) | حذف ناعم (Soft Delete) للصنف واستثناؤه من المخزون |
| `PATCH` | `/products/:id/variants/:variantId/status` | تاجر (Seller) | تعديل حالة الصنف: `{"status": "inActive"}` |
| `PATCH` | `/products/admin/:id/variants/:variantId/approval` | مدير (Admin) | مراجعة واعتماد الصنف: `{"approveStatus": "approved"}` |

### أمثلة طلبات الأصناف المفردة:

#### إضافة صنف جديد (Add Variant):
`POST /api/products/:id/variants`

```json
{
  "attributes": {
    "color": "أزرق نيلي",
    "size": "L"
  },
  "price": 195,
  "stock": 12,
  "sku": "SDM-DRS-BLU-L-104"
}
```

#### تعديل صنف مفرد (Update Variant):
`PATCH /api/products/:id/variants/:variantId`

```json
{
  "price": 185,
  "stock": 20,
  "compareAtPrice": 210
}
```

---

## 4. مسارات الأقسام والتصنيفات (Categories Endpoints)

| الطريقة | المسار | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | عام (Public) | جلب قائمة كافة الأقسام النشطة |
| `GET` | `/categories/:slug` | عام (Public) | جلب تفاصيل قسم محدد بالـ Slug |
| `POST` | `/categories` | مدير (Admin) | إنشاء قسم جديد وتحديد خصائصه المسموحة |
| `PATCH` | `/categories/:id` | مدير (Admin) | تعديل بيانات القسم وخصائصه مع فحص التوافقية |
| `DELETE` | `/categories/:id/variant-attributes/:attributeName` | مدير (Admin) | حذف خاصية مسموحة من القسم بعد التأكد من عدم كسر المنتجات |
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
      "name": "color",
      "values": ["أسود", "أبيض", "عنابي", "كحلي"]
    },
    {
      "name": "size",
      "values": ["S", "M", "L", "XL"]
    }
  ]
}
```

---

## 5. القيم الثابتة المعتمدة (Enums Reference)

* **حالات الحسابات (ROLE):** `admin`, `seller`, `user`, `courier`
* **حالات النشاط (STATUS):** `active`, `inActive`
* **حالات الاعتماد (APPROVE_STATUS):** `pending`, `approved`, `rejected`
