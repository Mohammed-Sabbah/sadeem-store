'use client';

import React from 'react';

interface ProductGalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentImage?: string;
  onSelectImage: (imgUrl: string) => void;
  onClearImage: () => void;
}

export function ProductGalleryPickerModal({
  isOpen,
  onClose,
  images,
  currentImage,
  onSelectImage,
  onClearImage,
}: ProductGalleryPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right font-almarai">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <h3 className="text-xs font-black text-brand-dark">اختر صورة لهذا الصنف من المعرض</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted hover:text-brand-dark text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {images.length === 0 ? (
            <div className="p-4 rounded-xl bg-brand-canvas text-center text-xs text-brand-muted font-bold">
              لا توجد صور مرفوعة في المعرض بعد. أضف صوراً أولاً في قسم صور المنتج.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
              {images.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelectImage(imgUrl);
                    onClose();
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-102 ${
                    currentImage === imgUrl
                      ? 'border-brand-primary ring-2 ring-brand-primary/30'
                      : 'border-brand-border hover:border-brand-primary/60'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  {currentImage === imgUrl && (
                    <span className="absolute top-1 right-1 bg-brand-primary text-white text-[9px] font-black px-1 rounded-sm">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-brand-border/60 text-xs font-bold">
          {currentImage ? (
            <button
              type="button"
              onClick={() => {
                onClearImage();
                onClose();
              }}
              className="text-red-600 hover:underline cursor-pointer"
            >
              إلغاء تخصيص الصورة
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-brand-border bg-brand-canvas text-brand-dark text-xs font-bold hover:bg-brand-canvas-alt transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
