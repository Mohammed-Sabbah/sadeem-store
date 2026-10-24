'use client';

import React from 'react';

interface AdminCategoryGridProps {
  categories: any[];
  onEdit: (category: any) => void;
  onDelete: (categoryId: string, title: string) => void;
  onToggleActive: (category: any) => void;
  isBusy?: boolean;
}

function getArabicType(type?: string): string {
  switch (type) {
    case 'Number':
      return 'رقم';
    case 'Boolean':
      return 'نعم / لا';
    default:
      return 'نص';
  }
}

export const AdminCategoryGrid: React.FC<AdminCategoryGridProps> = ({
  categories,
  onEdit,
  onDelete,
  onToggleActive,
  isBusy = false,
}) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-brand-surface/30 rounded-2xl border border-brand-border">
        <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-border text-brand-muted flex items-center justify-center mx-auto mb-3.5 shadow-2xs text-xl">
          📂
        </div>
        <h3 className="text-sm font-black text-brand-dark mb-1">لا توجد فئات مسجلة</h3>
        <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
          لم يتم العثور على أي تصنيفات في كتالوج سَدِيم. يمكنك البدء بإضافة الفئة الأولى الآن.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-almarai text-right">
      {categories.map((cat) => {
        const isActive = cat.isActive !== false;
        const attributes = cat.variantAttributes || [];

        return (
          <div
            key={cat._id}
            className="bg-brand-card rounded-2xl border border-brand-border p-5 space-y-4 shadow-2xs hover:border-brand-primary/40 transition-all flex flex-col justify-between"
          >
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-brand-dark truncate">
                      {cat.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-brand-muted/80 block dir-ltr text-right">
                    /{cat.slug}
                  </span>
                </div>

                {/* Status Toggle Switch */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold ${isActive ? 'text-brand-trust' : 'text-brand-muted'}`}>
                    {isActive ? 'نشط' : 'معطل'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleActive(cat)}
                    disabled={isBusy}
                    className={`w-10 h-5.5 inline-flex items-center rounded-full p-0.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-40 ${
                      isActive ? 'bg-brand-trust justify-start' : 'bg-brand-border justify-end'
                    }`}
                    title={isActive ? 'تعطيل الفئة' : 'تفعيل الفئة'}
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-brand-card shadow-2xs" />
                  </button>
                </div>
              </div>

              {/* Variant Attributes & Values */}
              <div className="pt-3 border-t border-brand-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-brand-dark">
                    خصائص المتغيرات ({attributes.length})
                  </span>
                </div>

                {attributes.length === 0 ? (
                  <span className="text-[11px] text-brand-muted block py-1">
                    صنف قياسي موحد بدون خصائص متغيرات
                  </span>
                ) : (
                  <div className="space-y-2">
                    {attributes.map((attr: any, idx: number) => {
                      const typeArabic = getArabicType(attr.type);
                      const values = Array.isArray(attr.values) ? attr.values : [];

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-brand-surface/70 border border-brand-border/60 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-brand-dark">
                              {attr.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-card text-brand-muted border border-brand-border">
                              {typeArabic}
                            </span>
                          </div>

                          {values.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              {values.slice(0, 5).map((v: string, vIdx: number) => (
                                <span
                                  key={vIdx}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-card text-brand-dark border border-brand-border/80"
                                >
                                  {v}
                                </span>
                              ))}
                              {values.length > 5 && (
                                <span className="text-[10px] font-bold text-brand-primary px-1">
                                  +{values.length - 5} خيارات
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-brand-muted block">
                              خيارات حرة للتاجر عند الإضافة
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-brand-muted">
                {isActive ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    متاح بالمتجر
                  </span>
                ) : (
                  <span className="text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                    موقوف مؤقتاً
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(cat)}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cat._id, cat.title)}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-xl border border-brand-border text-xs font-bold text-brand-muted hover:text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
