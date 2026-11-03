'use client';

import React, { useState, useEffect } from 'react';
import { formatFileSize } from '../utils/imageCompression';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  originalSize?: number;
  compressedSize?: number;
  savedPercentage?: number;
  title?: string;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  originalSize,
  compressedSize,
  savedPercentage,
  title = 'معاينة إشعار التحويل المالي',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 font-almarai text-right"
      onClick={onClose}
    >
      <div
        className="bg-brand-card rounded-2xl border border-brand-border shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-surface/80">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-brand-dark m-0">{title}</h3>
            {originalSize !== undefined && compressedSize !== undefined && (
              <div className="flex items-center gap-2 text-[11px] text-brand-muted">
                <span>الحجم قبل: <strong className="text-brand-dark">{formatFileSize(originalSize)}</strong></span>
                <span>←</span>
                <span>بعد الضغط: <strong className="text-brand-trust">{formatFileSize(compressedSize)}</strong></span>
                {savedPercentage !== undefined && savedPercentage > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-brand-trust-soft text-brand-trust border border-[var(--brand-trust-border)] font-black text-[10px]">
                    وفر {savedPercentage}%
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-lg border border-brand-border bg-brand-card p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="w-7 h-7 flex items-center justify-center text-brand-muted hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-transform active:scale-90"
                title="تصغير"
              >
                −
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 text-[10px] font-black text-brand-dark hover:text-brand-primary"
                title="إعادة ضبط"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="w-7 h-7 flex items-center justify-center text-brand-muted hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold transition-transform active:scale-90"
                title="تكبير"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-card flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="إغلاق"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body / Image Viewport */}
        <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-900/10 min-h-[320px] max-h-[68vh]">
          <div
            className="transition-transform duration-200 ease-out origin-center select-none"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="إشعار التحويل المالي"
              className="max-w-full max-h-[64vh] object-contain rounded-xl shadow-md border border-brand-border"
              loading="lazy"
            />
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="p-3 border-t border-brand-border bg-brand-surface/60 text-center">
          <p className="text-[11px] text-brand-muted m-0">
            تأكد من وضوح رقم المعاملة المرجعي وقيمة المبلغ المالي وتاريخ التحويل قبل إرسال الطلب لضمان الاعتماد الفوري.
          </p>
        </div>
      </div>
    </div>
  );
};
