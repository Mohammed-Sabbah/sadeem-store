# 05: إدارة الفئات والتصنيفات وخصائص المتغيرات

**What to build:**
شاشة إدارة الفئات والتصنيفات `app/admin/categories/page.tsx` لعرض شجرة الأقسام المعتمدة في سَدِيم وخصائص متغيراتها (`variantAttributes`). تتيح إضافة قسم جديد، تعديل الاسم والوصف والخصائص، وتفعيل أو حذف القسم مع حماية الأقسام المرتبطة بمنتجات نشطة.

**Blocked by:** 01 (غلاف لوحة الإدارة وشريط التنقل الكوني الهادئ).

**Status:** resolved

- [x] تعريف خدمات الفئات في `features/admin/services/adminCategory.service.ts` (مدمجة في `admin.service.ts`).
- [x] إنشاء خطافات `useAdminCategoriesQuery` و `useAdminCategoryMutations`.
- [x] بناء جدول وشبكة الفئات المعمارية `AdminCategoryGrid.tsx`.
- [x] بناء نافذة إضافة/تعديل فئة جديدة مع منشئ الخصائص `AdminCategoryModal.tsx`.
- [x] تأكيد وحماية حذف الفئات مع التحقق من الارتباطات `AdminCategoryDeleteModal.tsx`.

## Resolution

- تم بناء شاشة إدارة الفئات والتصنيفات `app/admin/categories/page.tsx` مع فلاتر البحث والحالة.
- تم بناء دوال التحقق وتوليد المفاتيح النقية في `features/admin/utils/categoryAdminUtils.ts` واختبارها بـ 3 اختبارات وحدة ناجحة.
- تم بناء شبكة بطاقات الفئات `AdminCategoryGrid.tsx` لعرض شجرة الأقسام ومفتاح التنشيط والتعطيل وقائمة خصائص المتغيرات.
- تم بناء نافذة إضافة وتعديل الفئات `AdminCategoryModal.tsx` متضمنة منشئ خصائص المتغيرات مع التحقق الصارم من الحقول المتوافقة مع الباك إند.
- تم بناء نافذة تأكيد الحذف `AdminCategoryDeleteModal.tsx` وربط الطفرات مع إبطال الكاش التلقائي.
- تم التحقق من سلامة الأنواع البرمجية بـ تايب سكريبت (0 errors) واجتياز كافة الاختبارات.
