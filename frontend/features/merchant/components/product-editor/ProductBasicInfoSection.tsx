'use client';

import React from 'react';
import type { CategoryItem } from '@/features/store/services/taxonomy.service';

interface ProductBasicInfoSectionProps {
  title: string;
  onTitleChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  categories: CategoryItem[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
  isLoadingCategories: boolean;
  hasOptions: boolean;
}

export function ProductBasicInfoSection({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  categories,
  categoryId,
  onCategoryChange,
  isLoadingCategories,
  hasOptions,
}: ProductBasicInfoSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
        <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
          <span>📦</span> البيانات الأساسية للمنتج
        </h2>
        <span className="text-[11px] font-bold text-brand-muted bg-brand-canvas px-2.5 py-1 rounded-full border border-brand-border/50">
          خطوة 1 من 3
        </span>
      </div>

      <div className="space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1.5">
            القسم التصنيفي <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              disabled={isLoadingCategories || hasOptions}
              className={`w-full h-11 px-3.5 bg-brand-canvas/60 border rounded-xl text-xs font-bold text-brand-dark focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer ${
                hasOptions ? 'opacity-60 cursor-not-allowed border-brand-border/40' : 'border-brand-border/70 hover:border-brand-primary/40'
              }`}
            >
              {isLoadingCategories ? (
                <option value="">جارٍ تحميل الأقسام...</option>
              ) : categories.length === 0 ? (
                <option value="">لا توجد أقسام مسجلة</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.title}
                  </option>
                ))
              )}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted text-xs">
              ▼
            </div>
          </div>
          {hasOptions && (
            <p className="mt-1.5 text-[11px] text-brand-muted flex items-center gap-1.5">
              <span>🔒</span> تم قفل القسم نظراً لوجود خيارات أو أصناف مخصصة. لمسحها غيّر القسم عبر زر إعادة الضبط.
            </p>
          )}
        </div>

        {/* Product Title */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1.5">
            اسم المنتج في متجر سَدِيم <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="مثال: هودي قطن سديمي فاخر مع جيوب مخفية"
            className="w-full h-11 px-3.5 bg-brand-canvas/50 border border-brand-border/70 rounded-xl text-xs font-bold text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
          />
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1.5">
            وصف المنتج والمواصفات التشغيلية
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            placeholder="اكتب وصفاً جذاباً ومختصراً يتضمن الخامات، تعليمات الاستخدام، والمميزات..."
            className="w-full p-3.5 bg-brand-canvas/50 border border-brand-border/70 rounded-xl text-xs text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
