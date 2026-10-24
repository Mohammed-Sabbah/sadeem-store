'use client';

import React from 'react';
import type { CategoryItem } from '@/features/store/services/taxonomy.service';
import type { ProductItem } from '../../types/merchant.types';
import type { ProductEditorMode } from '../../types/product-studio.types';

interface ProductInfoAndMediaCardProps {
  mode: ProductEditorMode;
  product?: ProductItem | null;
  title: string;
  setTitle: (value: string) => void;
  categoryId: string;
  onCategoryChange: (newId: string) => void;
  categories: CategoryItem[];
  isLoadingCategories: boolean;
  hasOptions: boolean;
  description: string;
  setDescription: (value: string) => void;
  images: string[];
  isUploadingImages: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

export function ProductInfoAndMediaCard({
  mode,
  product,
  title,
  setTitle,
  categoryId,
  onCategoryChange,
  categories,
  isLoadingCategories,
  hasOptions,
  description,
  setDescription,
  images,
  isUploadingImages,
  fileInputRef,
  onFilesSelected,
  onRemoveImage,
}: ProductInfoAndMediaCardProps) {
  return (
    <section className="bg-white rounded-2xl border border-brand-border/70 p-5 sm:p-7 shadow-xs space-y-5">
      <div className="border-b border-brand-border/40 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
            1
          </span>
          <h2 className="text-sm font-black text-brand-dark">معلومات الصنف ومعرض الصور</h2>
        </div>
        <span className="text-[10px] font-bold text-brand-muted">
          {mode === 'edit' && product?._id ? `المعرف: ${product._id.slice(-6)}` : 'حقول أساسية'}
        </span>
      </div>

      {/* Desktop 2-Column Inline Row: Title & Category Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Title */}
        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1.5">
            اسم الصنف <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              mode === 'edit'
                ? 'مثال: فستان سهرة حرير كحلي'
                : 'مثال: قميص كتان طبيعي بيج أو زيت زيتون بكر معصرة 2026'
            }
            className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
          {mode === 'create' && (
            <p className="text-[10px] text-brand-muted mt-1">
              اكتب اسماً واضحاً ومميزاً يصف الصنف بدقة لزبائن المتجر.
            </p>
          )}
        </div>

        {/* Unified Category Selection Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-brand-dark">
              قسم الصنف <span className="text-red-500">*</span>
            </label>
            {hasOptions && (
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                لتغيير القسم، يرجى حذف الخيارات أدناه أولاً
              </span>
            )}
          </div>
          {isLoadingCategories ? (
            <div className="h-11 rounded-xl bg-brand-surface/40 animate-pulse border border-brand-border/60" />
          ) : (
            <div className="relative">
              <select
                value={categoryId}
                disabled={hasOptions}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted text-xs">
                ▼
              </div>
            </div>
          )}
          {hasOptions ? (
            <p className="text-[10px] text-amber-700 font-bold mt-1">
              لتغيير القسم، يرجى حذف الخيارات والتوليفات أولاً.
            </p>
          ) : (
            <p className="text-[10px] text-brand-muted mt-1">
              يحدد القسم تلقائياً الخيارات والصفات المتاحة لهذا الصنف وفق قاعدة بيانات سَدِيم.
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-brand-dark block mb-1.5">
          وصف الصنف والمواصفات <span className="text-brand-muted text-[10px]">(اختياري)</span>
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="اكتب تفاصيل القماش، الحجم، المنشأ، أو طريقة الاستخدام لمساعدة الزبون على اتخاذ القرار..."
          className="w-full p-3.5 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
        />
      </div>

      {/* Images Gallery */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-brand-dark">
            صور الصنف <span className="text-red-500">*</span>{' '}
            <span className="text-[10px] font-normal text-brand-muted">
              (حتى 5 صور، الأولى هي الغلاف)
            </span>
          </label>
          <span className="text-[10px] font-bold text-brand-muted">{images.length} / 5 صور</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden border border-brand-border/80 bg-brand-surface group shadow-2xs"
            >
              <img src={imgUrl} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 right-1 bg-brand-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                  غلاف
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute bottom-1 left-1 bg-black/70 hover:bg-red-600 text-white rounded-lg p-1 text-[10px] transition-colors cursor-pointer"
                title="حذف الصورة"
              >
                ✕
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImages}
              className="aspect-square rounded-xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary/60 bg-brand-surface/30 hover:bg-brand-surface/60 transition-all flex flex-col items-center justify-center gap-1 text-brand-muted hover:text-brand-primary cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isUploadingImages ? (
                <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-lg">📷</span>
                  <span className="text-[10px] font-bold">+ إضافة</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFilesSelected}
          className="hidden"
        />
      </div>
    </section>
  );
}
