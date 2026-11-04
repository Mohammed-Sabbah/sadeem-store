'use client';

import React, { useState } from 'react';
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
  onMoveImage?: (fromIndex: number, toIndex: number) => void;
  onSetCoverImage?: (index: number) => void;
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
  onMoveImage,
  onSetCoverImage,
}: ProductInfoAndMediaCardProps) {
  // حالة السحب والإفلات المباشر على أجهزة سطح المكتب (HTML5 Native Drag)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number, e: React.DragEvent) => {
    setDraggedIndex(idx);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== idx) {
      setDragOverIndex(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== idx && onMoveImage) {
      onMoveImage(draggedIndex, idx);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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

      {/* Images Gallery with Reordering & Apple-style Direct Manipulation */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
            <span>صور الصنف</span>
            <span className="text-red-500">*</span>
            <span className="text-[10px] font-normal text-brand-muted">
              (حتى 5 صور، الأولى هي الغلاف الأساسي)
            </span>
          </label>
          <span className="text-[10px] font-bold text-brand-muted">{images.length} / 5 صور</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {images.map((imgUrl, idx) => {
            const isCover = idx === 0;
            const isDragged = draggedIndex === idx;
            const isOver = dragOverIndex === idx && draggedIndex !== idx;

            return (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(idx, e)}
                onDragOver={(e) => handleDragOver(idx, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(idx, e)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square rounded-2xl overflow-hidden border bg-brand-surface group shadow-2xs transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
                  isDragged
                    ? 'opacity-40 scale-95 border-brand-primary border-dashed'
                    : isOver
                    ? 'ring-2 ring-brand-primary ring-offset-2 scale-102 border-brand-primary'
                    : isCover
                    ? 'border-brand-primary/60 ring-1 ring-brand-primary/30 shadow-xs'
                    : 'border-brand-border/80 hover:border-brand-border hover:shadow-sm'
                }`}
              >
                {/* Product Image */}
                <img
                  src={imgUrl}
                  alt={`صورة الصنف ${idx + 1}`}
                  className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105"
                />

                {/* Cover Badge on #1 */}
                {isCover && (
                  <span className="absolute top-2 right-2 bg-brand-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs border border-white/20 flex items-center gap-1 z-10 pointer-events-none">
                    <span className="text-[10px]">★</span>
                    <span>الغلاف</span>
                  </span>
                )}

                {/* Numeric Sequence Badge (#1, #2, ...) */}
                <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold flex items-center justify-center border border-white/10 z-10 pointer-events-none">
                  {idx + 1}
                </span>

                {/* Apple-style Translucent Control Dock (Ergonomic for Thumb on Mobile & Mouse on Desktop) */}
                <div className="absolute bottom-2 inset-x-1.5 bg-black/65 backdrop-blur-md border border-white/15 rounded-xl p-1 flex items-center justify-between gap-1 z-10 transition-opacity">
                  {/* Shift Forward / Right in RTL (Toward Cover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveImage?.(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    title="تقديم الصورة للأمام"
                    aria-label="تقديم الصورة للأمام"
                    className="w-6 h-6 rounded-lg text-white hover:bg-white/20 active:scale-90 flex items-center justify-center text-xs font-bold transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  >
                    →
                  </button>

                  {/* Make Cover Button or Cover Status */}
                  {!isCover && onSetCoverImage ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetCoverImage(idx);
                      }}
                      title="تعيين كصورة الغلاف الأولى"
                      aria-label="تعيين كصورة الغلاف الأولى"
                      className="px-1.5 h-6 rounded-lg bg-amber-500/25 hover:bg-amber-500 text-amber-200 hover:text-white active:scale-95 text-[9px] font-black flex items-center gap-1 transition-all cursor-pointer border border-amber-400/30 shrink-0"
                    >
                      <span>★</span>
                      <span>غلاف</span>
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold text-white/60 px-1 truncate pointer-events-none select-none">
                      الرئيسية
                    </span>
                  )}

                  {/* Shift Backward / Left in RTL (Away from Cover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveImage?.(idx, idx + 1);
                    }}
                    disabled={idx === images.length - 1}
                    title="تأخير الصورة للخلف"
                    aria-label="تأخير الصورة للخلف"
                    className="w-6 h-6 rounded-lg text-white hover:bg-white/20 active:scale-90 flex items-center justify-center text-xs font-bold transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                  >
                    ←
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage(idx);
                    }}
                    title="حذف الصورة"
                    aria-label="حذف الصورة"
                    className="w-6 h-6 rounded-lg text-white/80 hover:text-white hover:bg-red-600/80 active:scale-90 flex items-center justify-center text-[10px] transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Images Slot */}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImages}
              className="aspect-square rounded-2xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary/60 bg-brand-surface/30 hover:bg-brand-surface/60 transition-all flex flex-col items-center justify-center gap-1.5 text-brand-muted hover:text-brand-primary cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isUploadingImages ? (
                <span className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-xl">📷</span>
                  <span className="text-[11px] font-bold">+ إضافة صورة</span>
                  <span className="text-[9px] text-brand-muted">متبقي {5 - images.length}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Quiet Educational Hint */}
        {images.length > 1 && (
          <p className="text-[11px] text-brand-muted mt-2.5 flex items-center gap-1.5 select-none">
            <span className="text-brand-primary font-bold">✦</span>
            <span>
              يمكنك سحب الصور بالماوس لتغيير ترتيبها، أو استخدام أزرار الأسهم وزر «غلاف» للتحكم السريع بلمسة واحدة.
            </span>
          </p>
        )}

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
