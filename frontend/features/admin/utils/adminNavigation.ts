import type { AdminNavItem } from '../types/admin.types';

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'الرئيسية والنبض',
    href: '/admin',
    status: 'active',
  },
  {
    id: 'stores',
    label: 'شبكة المتاجر',
    href: '/admin/stores',
    status: 'active',
  },
  {
    id: 'products',
    label: 'رقابة الكتالوج',
    href: '/admin/products',
    status: 'active',
  },
  {
    id: 'categories',
    label: 'إدارة الفئات',
    href: '/admin/categories',
    status: 'active',
  },
  {
    id: 'orders',
    label: 'الطلبات والتوزيع',
    href: '/admin/orders',
    status: 'deferred',
    badge: 'بانتظار الطلبات',
  },
  {
    id: 'couriers',
    label: 'مناديب التوصيل',
    href: '/admin/couriers',
    status: 'deferred',
    badge: 'قريباً',
  },
  {
    id: 'customers',
    label: 'الزبائن والمحافظ',
    href: '/admin/customers',
    status: 'deferred',
    badge: 'قريباً',
  },
  {
    id: 'finances',
    label: 'الخزينة والتسويات',
    href: '/admin/finances',
    status: 'deferred',
    badge: 'قريباً',
  },
];
