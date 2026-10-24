# Wayfinder Map: لوحة إدارة سَدِيم (Admin Dashboard)

## Destination

بناء لوحة إدارة مركزية متكاملة لشبكة سَدِيم في المحافظة الوسطى، تعتمد نفس الفلسفة البصرية والمعمارية لداشبورد التاجر، وتقدم إدارة كاملة للمتاجر، المنتجات، والفئات، مع شريط جانبي هادئ وقابل للطي.

## Notes

- **Domain**: متجر سَدِيم — إدارة المنصة المركزية والرقابة الميدانية.
- **Architecture**:
  - `poteto-mode` & `codebase-design`: وحدات نقية، عزل المنطق في Domain Hooks، وتجريد الفلاتر بدوال نقية مع اختبارات وحدة.
  - `vercel-react-best-practices`: قراءة مباشرة من Server Cache عبر TanStack Query مع إبطال فوري عند الطفرات.
  - **Tokens & Aesthetic**: مطابقة تامة لـ `app/tokens.css` وفلسفة الفخامة الكونية الهادئة.
  - **Security**: حماية مسارات `/admin/*` والتحقق من صلاحية الإدارة (`role === 'admin'`).

## Decisions so far

- [ADR 0001: المعمارية العامة للوحة تحكم إدارة سَدِيم](../../docs/adr/0001-admin-dashboard-architecture.md): شريط جانبي قابل للطي لسطح المكتب مع درج للجوال ونمط الفخامة الكونية الهادئة.
- [ADR 0002: النموذج المالي ونظام التوزيع اللوجستي](../../docs/adr/0002-financial-and-dispatch-model.md): عمولة مبيعات + حصة توصيل، وتوزيع يدوي مناطقي.
- [ADR 0003: نطاق المرحلة الأولى للوحة تحكم الإدارة](../../docs/adr/0003-admin-phase-1-scope.md): التركيز على المتاجر، المنتجات، والفئات، مع تأجيل الطلبات والمناديب والمحافظ بهدوء.
- [ADR 0004: نمط التفاعل والنوافذ في لوحة الإدارة](../../docs/adr/0004-admin-dialog-and-drilldown-pattern.md): النمط الهجين للنوافذ السريعة مع صفحات للتفاصيل العميقة.

## Tickets (Frontier)

- [01: غلاف لوحة الإدارة وشريط التنقل الكوني الهادئ (Resolved)](issues/01-admin-shell-and-navigation.md)
- [02: لوحة النبض والمؤشرات السريعة (Resolved)](issues/02-admin-overview-pulse.md)
- [03: إدارة شبكة المتاجر واعتماد طلبات الانضمام (Resolved)](issues/03-stores-network-and-approval.md)
- [04: رقابة الكتالوج والأصناف وتجميد المنتجات (Resolved)](issues/04-products-catalog-governance.md)
- [05: إدارة الفئات والتصنيفات وخصائص المتغيرات (Resolved)](issues/05-categories-management.md)
- [06: التحقق الشامل وتكامل الواجهات والأنواع (Resolved)](issues/06-integration-and-polish.md)
