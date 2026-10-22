'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { IconX } from '@/components/ui/icons';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ isOpen, onClose, title, description, children, className }: DrawerProps) {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      setCurrentY(0);
    }
  }, [isOpen, onClose]);

  // Touch drag-to-dismiss behavior (iOS / Vaul style)
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 120) {
      onClose();
    }
    setStartY(null);
    setCurrentY(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Surface Sheet */}
      <div
        ref={sheetRef}
        style={{
          transform: currentY > 0 ? `translateY(${currentY}px)` : undefined,
          transition: startY === null ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
        className={cn(
          'relative z-10 w-full md:max-w-xl bg-white rounded-t-[20px] md:rounded-[16px] border border-brand-border shadow-2xl flex flex-col max-h-[85vh] font-almarai overflow-hidden',
          className
        )}
      >
        {/* iOS Drag Handle */}
        <div
          className="pt-3 pb-2 flex flex-col items-center justify-center md:hidden cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/60">
          <div>
            {title && <h3 className="text-base font-extrabold text-brand-dark leading-tight">{title}</h3>}
            {description && <p className="text-xs text-brand-muted mt-0.5">{description}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto overscroll-contain flex-1 text-sm text-brand-dark leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
