'use client';

import React, { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 flex items-end md:items-center md:justify-center ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={`w-full max-w-lg bg-brand-surface rounded-t-2xl md:rounded-2xl border border-brand-border shadow-2xl flex flex-col max-h-[85vh] transition-all duration-300 font-almarai ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 md:translate-y-0 md:scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Pull Handle (Mobile) */}
        <div className="pt-3 pb-1 flex justify-center md:hidden cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border">
          <h3 className="text-sm md:text-base font-extrabold text-brand-dark">{title}</h3>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-black/5 text-sm font-bold transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
