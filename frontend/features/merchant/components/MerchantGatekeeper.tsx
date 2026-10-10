'use client';

import React from 'react';
import Link from 'next/link';
import type { StoreProfile } from '../types/merchant.types';

interface MerchantGatekeeperProps {
  store: StoreProfile;
  onRefresh: () => void;
  onSimulateApproval?: () => void;
}

export default function MerchantGatekeeper({
  store,
  onRefresh,
  onSimulateApproval,
}: MerchantGatekeeperProps) {
  const isRejected = store.approveStatus === 'rejected';

  return (
    <div className="max-w-[840px] mx-auto px-4 py-8 sm:py-16 font-almarai text-right">
      <div className="bg-brand-card rounded-2xl border border-brand-border/80 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Status Icon & Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-brand-border/60">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isRejected ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-brand-primary-soft text-brand-primary border border-brand-primary-border'
            }`}>
              {isRejected ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1 ${
                isRejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-900 border border-amber-200/60'
              }`}>
                {isRejected ? 'طلب غير مكتمل' : 'قيد المراجعة والمطابقة الميدانية'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-brand-dark m-0 tracking-tight">
                {isRejected ? 'اعتذار عن قبول المتجر حالياً' : 'طلب انضمام متجرك قيد المراجعة'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-border text-brand-muted hover:text-brand-dark hover:bg-brand-bg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث الحالة
            </button>
          </div>
        </div>

        {/* Store Summary Card */}
        <div className="bg-brand-surface rounded-xl p-4 sm:p-5 border border-brand-border-subtle mb-8">
          <div className="text-xs font-bold text-brand-subtle mb-3">تفاصيل المتجر المسجل:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-brand-muted block mb-0.5">اسم المتجر:</span>
              <strong className="text-brand-dark font-black text-sm">{store.name}</strong>
            </div>
            <div>
              <span className="text-brand-muted block mb-0.5">النطاق الجغرافي:</span>
              <strong className="text-brand-dark font-bold">
                {store.address?.city || 'دير البلح'} · المحافظة الوسطى
              </strong>
            </div>
            <div>
              <span className="text-brand-muted block mb-0.5">نقطة الـ GPS:</span>
              <span className="text-brand-dark font-mono font-medium text-[11px] bg-white px-2 py-0.5 rounded border border-brand-border inline-block">
                {store.address?.coordinates ? `${store.address.coordinates.lat.toFixed(4)}, ${store.address.coordinates.lng.toFixed(4)}` : 'معتمدة'}
              </span>
            </div>
          </div>
        </div>

        {/* Operational 3-Step Timeline */}
        <div className="mb-8">
          <h2 className="text-sm font-black text-brand-dark mb-4">مراحل تدقيق وتفعيل متجرك على سَدِيم:</h2>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                ✓
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-brand-dark">1. استلام الطلب وتأكيد الحدود الجغرافية</div>
                <div className="text-[11px] text-brand-muted leading-relaxed">
                  تم التحقق آلياً من تواجد المتجر داخل المحافظة الوسطى (مركز التوزيع والربط الميداني).
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 animate-pulse">
                2
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-brand-dark">2. مطابقة نقطة الاستلام مع مسارات المندوبين</div>
                <div className="text-[11px] text-brand-muted leading-relaxed">
                  يقوم فريق العمليات بمطابقة عنوان المحل لجدولة استلام الطرود الموحدة بتسعيرة الـ 8 شيكل الثابتة.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-brand-bg text-brand-subtle flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-brand-subtle">3. فتح لوحة التاجر وبدء البيع فورياً</div>
                <div className="text-[11px] text-brand-subtle leading-relaxed">
                  بمجرد الاعتماد، ستتمكن من إضافة المنتجات، وتحديد المتغيرات والأسعار، واستقبال الطلبيات مباشرة.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Support */}
        <div className="pt-6 border-t border-brand-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-brand-muted">
            تحتاج مساعدة أو استعجال المطابقة؟ تواصل مع فريق العمليات: <strong className="text-brand-dark">0599-000-000</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/"
              className="text-center w-full sm:w-auto px-4 py-2.5 rounded-lg border border-brand-border text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-brand-bg transition-colors no-underline"
            >
              العودة للمتجر
            </Link>

            {onSimulateApproval && (
              <button
                type="button"
                onClick={onSimulateApproval}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-colors shadow-2xs cursor-pointer"
                title="خاص بالمطورين والمدققين لاختبار اللوحة فوراً"
              >
                ⚡ اعتماد تجريبي فوري (Dev Mode)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
