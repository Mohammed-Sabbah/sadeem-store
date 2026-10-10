'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { merchantService } from '@/features/merchant/services/merchant.service';
import type { StoreProfile } from '@/features/merchant/types/merchant.types';

export default function MerchantPendingApprovalPage() {
  const router = useRouter();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await merchantService.getStoreProfile();
      if (res.data) {
        setStore(res.data);
        if (res.data.approveStatus === 'approved') {
          router.replace('/merchant/dashboard');
          return;
        }
      }
    } catch (err) {
      console.error('Failed fetching store status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const handleSimulateApproval = () => {
    const updated = merchantService.updateLocalStoreApproval('approved');
    setStore(updated);
    router.replace('/merchant/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-10 h-10 border-2 border-[#B8621B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-zinc-500">جارٍ التحقق من حالة اعتماد متجرك...</p>
      </div>
    );
  }

  const isRejected = store?.approveStatus === 'rejected';

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-12 px-2 text-right">
      {/* Dev Mode Helper Banner */}
      <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-2.5 mb-6 text-xs text-amber-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="font-bold">
            هذه الشاشة مخصصة للمتاجر التي لم يتم اعتمادها بعد (Pending Approval).
          </span>
        </div>
        <button
          type="button"
          onClick={handleSimulateApproval}
          className="font-black px-3 py-1 rounded-lg bg-amber-900 text-white hover:bg-amber-800 transition-colors cursor-pointer text-[11px]"
          title="خاص بالمطورين والمدققين لاعتماد المتجر والدخول الفوري للداشبورد"
        >
          ⚡ تفعيل واعتماد المتجر فوراً (Dev Mode)
        </button>
      </div>

      {/* Main Status Container */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Top Status Banner */}
        <div className="p-6 sm:p-10 border-b border-zinc-100 bg-gradient-to-b from-zinc-50/50 to-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black ${
                  isRejected
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-amber-50 text-[#B8621B] border border-amber-200'
                }`}
              >
                {isRejected ? '✕' : '⏳'}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                      isRejected
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-amber-100/80 text-amber-900 border-amber-300/80'
                    }`}
                  >
                    {isRejected ? 'طلب غير مكتمل' : 'قيد المراجعة والمطابقة الميدانية'}
                  </span>
                  <span className="text-[11px] text-zinc-400">•</span>
                  <span className="text-[11px] font-bold text-zinc-500">المحافظة الوسطى</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 m-0 tracking-tight">
                  {isRejected
                    ? 'اعتذار عن قبول المتجر حالياً'
                    : 'طلب انضمام متجرك قيد التدقيق التشغيلي'}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 m-0 leading-relaxed max-w-xl">
                  {isRejected
                    ? 'يرجى مراجعة فريق العمليات لتعديل بيانات المتجر أو التأكد من النطاق الجغرافي داخل المحافظة الوسطى.'
                    : 'يقوم فريق عمليات سَدِيم بمراجعة تفاصيل المحل وجدولة نقطة الاستلام ضمن مسارات المندوبين لطرد الـ 8 شيكل الموحد.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchStatus}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
            >
              <span>تحديث الحالة</span>
              <span>🔄</span>
            </button>
          </div>
        </div>

        {/* Store Summary Strip */}
        <div className="px-6 sm:px-10 py-5 bg-zinc-50/60 border-b border-zinc-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block mb-0.5 font-bold">اسم المتجر المسجل:</span>
              <strong className="text-zinc-900 font-black text-sm">{store?.name || 'متجر مسجل'}</strong>
            </div>

            <div>
              <span className="text-zinc-400 block mb-0.5 font-bold">النطاق والمدينة:</span>
              <strong className="text-zinc-800 font-bold">
                {store?.address?.city === 'deir_albalah' ? 'دير البلح' : store?.address?.city || 'المحافظة الوسطى'}
              </strong>
            </div>

            <div>
              <span className="text-zinc-400 block mb-0.5 font-bold">نقطة الاستلام والـ GPS:</span>
              <span className="font-mono text-[11px] text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200 inline-block">
                {store?.address?.coordinates
                  ? `${store.address.coordinates.lat.toFixed(4)}, ${store.address.coordinates.lng.toFixed(4)}`
                  : 'معتمدة على الخريطة'}
              </span>
            </div>
          </div>
        </div>

        {/* 3-Step Operations Progress */}
        <div className="p-6 sm:p-10 space-y-6">
          <h2 className="text-sm font-black text-zinc-900 m-0">
            مراحل تدقيق وتفعيل متجرك على منصة سَدِيم:
          </h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <h3 className="text-xs font-black text-zinc-900 m-0 mb-0.5">
                  1. استلام الطلب وتأكيد الحدود الجغرافية
                </h3>
                <p className="text-[11px] text-zinc-600 m-0 leading-relaxed">
                  تم التحقق آلياً من تواجد المتجر داخل المحافظة الوسطى (مركز التوزيع والربط الميداني لشبكة سَدِيم).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 animate-pulse">
                2
              </div>
              <div>
                <h3 className="text-xs font-black text-zinc-900 m-0 mb-0.5">
                  2. مطابقة نقطة الاستلام مع مسارات المندوبين
                </h3>
                <p className="text-[11px] text-zinc-600 m-0 leading-relaxed">
                  يقوم فريق العمليات بمطابقة عنوان المحل لجدولة استلام الطرود الموحدة بتسعيرة الـ 8 شيكل الثابتة.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 opacity-60">
              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h3 className="text-xs font-black text-zinc-700 m-0 mb-0.5">
                  3. فتح لوحة التاجر وبدء البيع فورياً
                </h3>
                <p className="text-[11px] text-zinc-500 m-0 leading-relaxed">
                  بمجرد اعتماد المتجر، ستتمكن تلقائياً من الوصول إلى لوحة الكتالوج وإدارة المنتجات والمخزون.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Support Strip */}
        <div className="px-6 sm:px-10 py-5 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500">
            تحتاج مساعدة أو استعجال المطابقة الميدانية؟ تواصل مع فريق العمليات: <strong className="text-zinc-900">0599-000-000</strong>
          </div>

          <Link
            href="/"
            className="text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 px-4 py-2 rounded-xl no-underline transition-colors shadow-2xs"
          >
            تصفح المتجر كمتسوق ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
