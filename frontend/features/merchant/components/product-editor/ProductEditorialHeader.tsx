'use client';

import React from 'react';
import Link from 'next/link';
import type { ProductItem } from '../../types/merchant.types';
import type { ProductEditorMode } from '../../types/product-studio.types';

interface ProductEditorialHeaderProps {
  mode: ProductEditorMode;
  product?: ProductItem | null;
  isProductActive: boolean;
  onToggleActive?: () => void;
  onDelete?: () => void;
  onSave: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  successMessage?: string | null;
  onClearSuccess?: () => void;
}

export function ProductEditorialHeader({
  mode,
  product,
  isProductActive,
  onToggleActive,
  onDelete,
  onSave,
  isSubmitting,
  errorMessage,
  onClearError,
  successMessage,
  onClearSuccess,
}: ProductEditorialHeaderProps) {
  const isRejected = mode === 'edit' && product?.approveStatus === 'rejected';

  return (
    <div className="space-y-4">
      {/* Top Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-brand-border/60">
        <div className="flex items-center gap-3">
          <Link
            href="/merchant/dashboard"
            className="w-9 h-9 rounded-xl border border-brand-border/80 flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors shrink-0 shadow-2xs"
            title="العودة للوحة التاجر"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-brand-dark">
                {mode === 'edit' ? 'تعديل الصنف' : 'إضافة صنف جديد'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                سَدِيم
              </span>
              {mode === 'edit' && (
                isRejected ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    موقوف إدارياً
                  </span>
                ) : isProductActive ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    معروض للزبائن
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    متوقف مؤقتاً
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              {mode === 'edit'
                ? 'عدّل الأسعار والمخزون والتفاصيل مع التحديث المباشر للمتجر'
                : 'أدخل تفاصيل الصنف بدقة؛ المتجر الموثوق يحظى بثقة زبائن غزة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {mode === 'edit' && (
            <>
              {/* Active Status Switcher */}
              {isRejected ? (
                <div
                  className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs select-none"
                  title="لا يمكن تفعيل الصنف لأنه موقوف إدارياً بواسطة إدارة سَدِيم"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>موقوف إدارياً</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onToggleActive}
                  className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                    isProductActive
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isProductActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{isProductActive ? 'الصنف معروض' : 'الصنف معطل'}</span>
                </button>
              )}

              {/* Delete Trigger */}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="h-9 px-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs active:scale-95"
                  title="حذف هذا الصنف نهائياً"
                >
                  حذف الصنف
                </button>
              )}
            </>
          )}

          {/* Save / Submit Button */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="h-9 sm:h-10 px-5 sm:px-6 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <span>{mode === 'edit' ? 'حفظ التعديلات' : 'نشر الصنف'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Admin Rejection Callout */}
      {isRejected && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border border-red-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-red-800">تم إيقاف هذا الصنف إدارياً من قبل إدارة سَدِيم</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200/60 text-red-800">
                  غير معروض للزبائن
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {product?.rejectReason ? (
                  <>
                    <strong className="font-bold">سبب الإيقاف الموضح من الإدارة: </strong>
                    <span className="font-bold underline decoration-red-300 underline-offset-2">{product.rejectReason}</span>
                  </>
                ) : (
                  'لم يتم تدوين سبب محدد للإيقاف. يرجى تعديل الصنف ليتوافق مع سياسات منصة سَدِيم أو التواصل مع الإدارة.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="text-red-600 hover:text-red-900 text-sm font-black p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{successMessage}</span>
          </div>
          {onClearSuccess && (
            <button
              type="button"
              onClick={onClearSuccess}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-black p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
