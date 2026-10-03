'use client';

import React from 'react';
import Link from 'next/link';
import { useMerchantJoin } from '@/features/auth/hooks/useMerchantJoin';

export default function MerchantJoinPage() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    submitted,
    registeredStoreName,
    registeredPhone,
  } = useMerchantJoin();

  return (
    <main className="max-w-[1240px] mx-auto px-4 pt-4 pb-24 md:pb-16 font-almarai">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-dark">انضم كتاجر معتمد في سَدِيم</h1>
          <span className="text-xs md:text-sm text-brand-muted mt-1 block">
            وسّع مبيعاتك في المحافظة الوسطى بدعم لوجستي وتسويقي متكامل
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-brand-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-lg border border-brand-border bg-brand-surface shrink-0"
        >
          <span>←</span>
          <span>الرئيسية</span>
        </Link>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: VALUE PROPOSITION & 3 PILLARS */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-7 shadow-xs">
            <span className="text-xs font-extrabold text-brand-primary bg-[var(--brand-primary-soft)] border border-[var(--brand-primary-border)] px-3 py-1 rounded-full inline-block mb-3">
              ● شراكة نمو للمتاجر والحرفيين في الوسطى
            </span>
            <h2 className="text-base sm:text-xl font-black text-brand-dark mb-3 leading-snug">
              ركّز على جودة بضاعتك، ونحن نتولى التسويق والتوصيل الميداني للزبائن
            </h2>
            <p className="text-xs md:text-sm text-brand-muted leading-relaxed mb-5">
              انضم إلى شبكة المتاجر المحلية المعتمدة في المحافظة الوسطى. نوفر لك واجهة عرض رقمية فاخرة، نظام طرد موحد، وتسوية مالية فورية عند تسليم كل طلب.
            </p>

            {/* 3 Pillars */}
            <div className="flex flex-col gap-3">
              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-4 flex gap-3.5 items-center">
                <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-primary shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs md:text-sm text-brand-dark block">
                    أسطول توصيل ميداني بدون تكلفة عليك
                  </strong>
                  <span className="text-[11px] text-brand-muted block mt-0.5">
                    مندوبو سَدِيم يستلمون المنتج من باب محلك ويسلمونه للزبون ضمن طرد موحد.
                  </span>
                </div>
              </div>

              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-4 flex gap-3.5 items-center">
                <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-trust shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs md:text-sm text-brand-dark block">
                    تسويات مالية دورية ومباشرة
                  </strong>
                  <span className="text-[11px] text-brand-muted block mt-0.5">
                    تحصيل المبالغ كاش أو جوال باي وتسليم أرباحك دورياً دون تأخير.
                  </span>
                </div>
              </div>

              <div className="bg-brand-card border border-brand-border/60 rounded-xl p-4 flex gap-3.5 items-center">
                <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-primary shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs md:text-sm text-brand-dark block">
                    واجهة متجر احترافية لعلامتك
                  </strong>
                  <span className="text-[11px] text-brand-muted block mt-0.5">
                    صفحة متجر مخصصة مع صور منسقة تعكس موثوقية وجودة منتجاتك.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: REGISTRATION FORM */}
        <div className="lg:col-span-6 bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-7 shadow-xs">
          {submitted ? (
            <div className="text-center py-8 px-2">
              <div className="w-16 h-16 rounded-full bg-[var(--brand-trust-soft)] border-2 border-brand-trust flex items-center justify-center mx-auto mb-4 text-brand-trust">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-black text-brand-dark mb-2">
                تم استلام طلب انضمام «{registeredStoreName || 'متجرك'}» بنجاح!
              </h3>
              <p className="text-xs md:text-sm text-brand-muted max-w-sm mx-auto mb-5 leading-relaxed">
                حسابك قيد المراجعة والاعتماد من قبل إدارة سَدِيم. سيتواصل معك فريق التوثيق خلال 24 ساعة عبر الهاتف ({registeredPhone}) لترتيب الزيارة الميدانية وتفعيل حساب متجرك في المنصة.
              </p>
              <Link
                href="/"
                className="inline-block bg-brand-primary text-white hover:brightness-110 px-5 py-2.5 rounded-lg text-xs md:text-sm font-extrabold shadow-sm transition-all"
              >
                العودة للرئيسية
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-brand-dark mb-1">
                  نموذج طلب التوثيق والانضمام كتاجر
                </h3>
                <p className="text-xs text-brand-muted">
                  الحساب لن يتفعل تلقائياً، بل يُعتمد بعد مراجعة الإدارة والتأكد من مطابقة شروط الجودة الميدانية.
                </p>
              </div>

              {errors.root && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {errors.root.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    اسم المتجر / الورشة <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('storeName')}
                    placeholder="مثال: ورشة الفخار الأصيل"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-dark text-xs font-almarai outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                  {errors.storeName && (
                    <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.storeName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    اسم المسؤول / التاجر <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="الاسم الثلاثي"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-dark text-xs font-almarai outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    رقم الهاتف (واتساب للتواصل) <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    {...register('phone')}
                    placeholder="059xxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-dark text-xs font-almarai text-right outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    المدينة في الوسطى <span className="text-brand-primary">*</span>
                  </label>
                  <select
                    {...register('city')}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-dark text-xs font-almarai outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="دير البلح">دير البلح</option>
                    <option value="مخيم النصيرات">مخيم النصيرات</option>
                    <option value="الزوايدة">الزوايدة</option>
                    <option value="مخيم المغازي">مخيم المغازي</option>
                    <option value="مخيم البريج">مخيم البريج</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    نوع المنتجات الأساسية <span className="text-brand-primary">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-dark text-xs font-almarai outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="أزياء وملابس">أزياء وملابس</option>
                    <option value="مؤونة وضيافة">مؤونة وضيافة وزيوت بلدية</option>
                    <option value="طاقة وإلكترونيات">طاقة وإنارة وبدائل وبطاريات</option>
                    <option value="عطور وعناية">عطور وعناية وصابون طبيعي</option>
                    <option value="حرف وخزف">حرف وخزف وفخار يدوي</option>
                    <option value="أغذية ومعجنات">أغذية ومعجنات طازجة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    كلمة مرور الحساب (للدخول مستقبلاً) <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="6 خانات أو أكثر"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-dark text-xs font-almarai outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                  {errors.password && (
                    <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-brand-dark mb-1.5">
                  عنوان المحل أو الورشة بالتفصيل
                </label>
                <input
                  type="text"
                  {...register('storeAddress')}
                  placeholder="مثال: دير البلح — شارع النخيل بجوار مسجد السلام"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border bg-brand-card text-brand-dark text-xs font-almarai outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-primary text-white hover:brightness-110 p-3 rounded-lg text-xs md:text-sm font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'جاري إرسال طلب الانضمام...' : 'تقديم طلب الانضمام لشبكة سَدِيم ←'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
