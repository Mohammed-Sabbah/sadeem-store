'use client';

import React from 'react';

interface ProductMediaSectionProps {
  images: string[];
  isUploadingImages: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: FileList | File[]) => void;
  onRemoveImage: (index: number) => void;
}

export function ProductMediaSection({
  images,
  isUploadingImages,
  fileInputRef,
  onFilesSelected,
  onRemoveImage,
}: ProductMediaSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
        <div>
          <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
            <span>🖼️</span> معرض صور المنتج
          </h2>
          <p className="text-[11px] text-brand-muted mt-0.5">
            الصورة الأولى هي الصورة الافتراضية الرئيسية للمنتج
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-canvas hover:bg-brand-canvas-alt text-brand-dark border border-brand-border/70 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
        >
          <span>📷</span> إضافة صور
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
        multiple
        accept="image/*"
        className="hidden"
      />

      {isUploadingImages && (
        <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-brand-primary animate-pulse bg-brand-canvas/40 rounded-xl border border-dashed border-brand-primary/40">
          <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span>جارٍ ضغط الصور محلياً للملاءمة السريعة...</span>
        </div>
      )}

      {images.length === 0 && !isUploadingImages ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-brand-border/80 hover:border-brand-primary/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-brand-canvas/20 hover:bg-brand-canvas/40 group"
        >
          <div className="w-12 h-12 rounded-full bg-brand-canvas flex items-center justify-center mx-auto mb-3 text-xl group-hover:scale-105 transition-transform">
            📸
          </div>
          <p className="text-xs font-bold text-brand-dark mb-1">انقر هنا لرفع صور واضحة للمنتج</p>
          <p className="text-[11px] text-brand-muted leading-relaxed">
            يتم ضغط الصور تلقائياً في المتصفح لضمان سرعة التصفح لزبائن غزة
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden border border-brand-border/70 bg-brand-canvas/40 group shadow-2xs"
            >
              <img
                src={img}
                alt={`صورة ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {idx === 0 && (
                <span className="absolute bottom-1.5 right-1.5 bg-brand-dark/90 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                  الرئيسية
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="حذف الصورة"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
