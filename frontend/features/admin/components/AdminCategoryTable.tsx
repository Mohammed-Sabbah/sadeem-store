'use client';

import React from 'react';
import Link from 'next/link';

interface AdminCategoryTableProps {
  categories: any[];
  onEdit: (category: any) => void;
  onDelete: (categoryId: string, title: string) => void;
  onToggleActive: (category: any) => void;
  isBusy?: boolean;
}

export const AdminCategoryTable: React.FC<AdminCategoryTableProps> = ({
  categories,
  onEdit,
  onDelete,
  onToggleActive,
  isBusy = false,
}) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-brand-surface/30 rounded-2xl border border-brand-border font-almarai">
        <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-border text-brand-muted flex items-center justify-center mx-auto mb-3.5 shadow-2xs text-xl">
          📂
        </div>
        <h3 className="text-sm font-black text-brand-dark mb-1">لا توجد فئات مسجلة</h3>
        <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
          لم يتم العثور على أي تصنيفات تتطابق مع البحث الحالي.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border shadow-2xs overflow-hidden font-almarai text-right">
      {/* 1. Desktop High-Density Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-brand-surface/80 border-b border-brand-border text-brand-muted font-bold select-none">
            <tr>
              <th className="py-3 px-5 min-w-[200px]">اسم الفئة والمسار</th>
              <th className="py-3 px-4 min-w-[220px]">خصائص المتغيرات</th>
              <th className="py-3 px-4 w-36">كتالوج الأصناف</th>
              <th className="py-3 px-4 w-28 text-center">الحالة</th>
              <th className="py-3 px-4 w-36 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {categories.map((cat) => {
              const isActive = cat.isActive !== false;
              const attributes = cat.variantAttributes || [];

              return (
                <tr key={cat._id} className="hover:bg-brand-surface/60 transition-colors group">
                  {/* Title & Slug */}
                  <td className="py-3.5 px-5">
                    <div className="space-y-0.5">
                      <div className="font-black text-brand-dark text-sm">
                        {cat.title}
                      </div>
                      <div className="text-[11px] font-mono text-brand-muted/80 dir-ltr text-right">
                        /{cat.slug}
                      </div>
                    </div>
                  </td>

                  {/* Attributes & Values preview */}
                  <td className="py-3.5 px-4">
                    {attributes.length === 0 ? (
                      <span className="text-[11px] text-brand-muted font-medium">
                        صنف قياسي (بدون سمات)
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-brand-surface text-brand-dark border border-brand-border">
                          {attributes.length} {attributes.length === 1 ? 'سمة' : 'سمات'}
                        </span>
                        {attributes.slice(0, 2).map((a: any, aIdx: number) => (
                          <span
                            key={aIdx}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-surface/60 text-brand-muted border border-brand-border/60"
                          >
                            {a.name} ({Array.isArray(a.values) ? a.values.length : 0})
                          </span>
                        ))}
                        {attributes.length > 2 && (
                          <span className="text-[10px] font-bold text-brand-primary">
                            +{attributes.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Products Drilldown Link */}
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/admin/products?categoryId=${cat._id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-muted hover:text-brand-primary transition-colors py-1 px-2 rounded-lg hover:bg-brand-surface"
                      title="استعراض المنتجات المندرجة تحت هذه الفئة"
                    >
                      <span>أصناف الفئة</span>
                      <span className="text-[10px]">↗</span>
                    </Link>
                  </td>

                  {/* Active Toggle Switch */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleActive(cat)}
                        disabled={isBusy}
                        className={`w-9 h-5 inline-flex items-center rounded-full p-0.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-40 ${
                          isActive ? 'bg-brand-trust justify-start' : 'bg-brand-border justify-end'
                        }`}
                        title={isActive ? 'تعطيل الفئة' : 'تفعيل الفئة'}
                      >
                        <span className="w-4 h-4 rounded-full bg-brand-card shadow-2xs" />
                      </button>
                      <span className={`text-[10px] font-bold min-w-[28px] ${isActive ? 'text-brand-trust' : 'text-brand-muted'}`}>
                        {isActive ? 'نشط' : 'معطل'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(cat)}
                        disabled={isBusy}
                        className="px-2.5 py-1 rounded-lg border border-brand-border text-[11px] font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(cat._id, cat.title)}
                        disabled={isBusy}
                        className="px-2.5 py-1 rounded-lg border border-brand-border text-[11px] font-bold text-brand-muted hover:text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Compact Cards List */}
      <div className="md:hidden divide-y divide-brand-border/40">
        {categories.map((cat) => {
          const isActive = cat.isActive !== false;
          const attributes = cat.variantAttributes || [];

          return (
            <div key={cat._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="font-black text-brand-dark text-sm truncate">
                    {cat.title}
                  </div>
                  <div className="text-[11px] font-mono text-brand-muted/80 dir-ltr text-right">
                    /{cat.slug}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleActive(cat)}
                    disabled={isBusy}
                    className={`w-9 h-5 inline-flex items-center rounded-full p-0.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-40 ${
                      isActive ? 'bg-brand-trust justify-start' : 'bg-brand-border justify-end'
                    }`}
                    title={isActive ? 'تعطيل الفئة' : 'تفعيل الفئة'}
                  >
                    <span className="w-4 h-4 rounded-full bg-brand-card shadow-2xs" />
                  </button>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-brand-trust' : 'text-brand-muted'}`}>
                    {isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="text-[11px] text-brand-muted">
                  {attributes.length === 0 ? (
                    'صنف قياسي (0 سمات)'
                  ) : (
                    <span className="font-bold text-brand-dark">
                      {attributes.length} سمات: {attributes.map((a: any) => a.name).join('، ')}
                    </span>
                  )}
                </div>

                <Link
                  href={`/admin/products?categoryId=${cat._id}`}
                  className="text-[11px] font-bold text-brand-primary hover:underline shrink-0"
                >
                  الأصناف ↗
                </Link>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/40">
                <button
                  type="button"
                  onClick={() => onEdit(cat)}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cat._id, cat.title)}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold text-brand-muted hover:text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
