'use client';

import React from 'react';

interface AdminCategoryGridProps {
  categories: any[];
  onEdit: (category: any) => void;
  onDelete: (categoryId: string, title: string) => void;
  onToggleActive: (category: any) => void;
  isBusy?: boolean;
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
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-base font-black text-brand-dark truncate">
                    {cat.title}
                  </h3>
                  <span className="text-[10px] font-mono font-medium text-brand-muted block dir-ltr text-right">
                    /{cat.slug}
                  </span>
                </div>

                {/* Status Toggle Switch */}
                <div className="flex items-center gap-1.5 shrink-0">
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
                  <span className="text-[10px] font-bold text-brand-muted">
                    {isActive ? 'نشط' : 'معطل'}
                  </span>
                </div>
              </div>

              {/* Variant Attributes Preview */}
              <div className="pt-2 border-t border-brand-border/40 space-y-1.5">
                <span className="text-[10px] font-bold text-brand-muted block">
                  خصائص المتغيرات ({attributes.length}):
                </span>
                {attributes.length === 0 ? (
                  <span className="text-[11px] text-brand-muted/70 block">
                    صنف موحد (بدون أبعاد مخصصة)
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {attributes.map((attr: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-surface text-brand-dark border border-brand-border"
                      >
                        <span>{attr.name}</span>
                        <span className="text-[9px] text-brand-muted font-mono opacity-80">
                          ({attr.type || 'String'})
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-brand-muted">
                كود: <span className="font-mono text-brand-dark">{cat._id?.slice(-6)}</span>
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
