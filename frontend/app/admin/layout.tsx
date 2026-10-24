import React from 'react';
import type { Metadata } from 'next';
import { AdminShell } from '@/features/admin/components/AdminShell';

export const metadata: Metadata = {
  title: 'محطة القيادة والإدارة | سَدِيم',
  description: 'لوحة التحكم المركزية لمنصة سَدِيم في المحافظة الوسطى',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
