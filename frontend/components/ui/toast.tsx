'use client';

import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';
import { IconCheck, IconX, IconShieldCheck } from '@/components/ui/icons';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'trust' | 'error' | 'default';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string, action?: ToastItem['action']) => void;
  trust: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...item, id };
      setToasts((prev) => [...prev.slice(-2), newToast]); // keep max 3 visible toasts

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string, action?: ToastItem['action']) => {
      addToast({ title, description, variant: 'success', action });
    },
    [addToast]
  );

  const trust = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: 'trust' });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, variant: 'error' });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, trust, error }}>
      {children}

      {/* Floating Stacked Toasts Container (Sonner-style) */}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 start-1/2 -translate-x-1/2 md:start-6 md:translate-x-0 z-50 flex flex-col gap-2 pointer-events-none w-[92vw] max-w-md font-almarai"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-[12px] bg-white/95 backdrop-blur-md border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2',
              t.variant === 'trust'
                ? 'border-brand-trust/30 text-brand-dark'
                : t.variant === 'error'
                ? 'border-red-200 text-red-900'
                : 'border-brand-border/80 text-brand-dark'
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white',
                  t.variant === 'trust' ? 'bg-brand-trust' : t.variant === 'error' ? 'bg-red-600' : 'bg-brand-primary'
                )}
              >
                {t.variant === 'trust' ? (
                  <IconShieldCheck size={16} />
                ) : t.variant === 'error' ? (
                  <IconX size={16} />
                ) : (
                  <IconCheck size={16} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold truncate">{t.title}</p>
                {t.description && <p className="text-[11px] text-brand-muted truncate mt-0.5">{t.description}</p>}
              </div>
            </div>

            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  removeToast(t.id);
                }}
                className="shrink-0 text-xs font-extrabold text-brand-primary hover:text-brand-primary-hover px-2.5 py-1 rounded-[6px] hover:bg-brand-primary-soft transition-colors cursor-pointer"
              >
                {t.action.label}
              </button>
            )}

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-full transition-colors cursor-pointer"
              aria-label="إغلاق التنبيه"
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const fallbackToast: ToastContextType = {
  toast: () => {},
  success: () => {},
  trust: () => {},
  error: () => {},
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return fallbackToast;
  }
  return context;
}
