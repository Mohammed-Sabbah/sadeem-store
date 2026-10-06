'use client';

import React from 'react';
import Link from 'next/link';
import { useMerchantJoin } from '@/features/auth/hooks/useMerchantJoin';
import { useStoreTaxonomy } from '@/features/store/hooks/useStoreTaxonomy';
import StoreMapPicker from '@/features/store/components/StoreMapPicker';

export default function MerchantJoinPage() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    submitted,
    registeredStoreName,
    registeredPhone,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    selectedLat,
    selectedLng,
    selectedGovernorate,
    setLocation,
  } = useMerchantJoin();

  const {
    categories,
    availableGovernorates,
    getCitiesForGovernorate,
    isLoading: isLoadingTaxonomy,
  } = useStoreTaxonomy();

  // Dynamic cities based on current governorate
  const currentCities = getCitiesForGovernorate(selectedGovernorate || 'central');

  return (
    <main className="max-w-[1240px] mx-auto px-4 pt-6 sm:pt-8 pb-24 md:pb-16 font-almarai text-right">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-6 sm:mb-8 border-b border-brand-border">
        <div>
          <span className="text-xs font-bold text-brand-primary tracking-wide block mb-1">
            شراكة المتاجر والحرفيين
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight m-0">
            انضمام تاجر جديد في سَدِيم
          </h1>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-muted hover:text-brand-dark transition-colors py-2 px-3.5 rounded-lg border border-brand-border bg-white shrink-0 no-underline"
        >
          <span>الرئيسية</span>
          <span className="text-xs">←</span>
        </Link>
      </div>

      {/* Two-Column Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ===================================================================
            COLUMN 1: EDITORIAL VALUE PROPOSITION (Quiet Luxury & Pure Serenity)
            =================================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-7 lg:sticky lg:top-24">
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-brand-dark leading-snug tracking-tight m-0">
              ركّز على إتقان بضاعتك، ونحن نتولى التسويق والتوصيل الميداني للزبائن
            </h2>

            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed m-0">
              سَدِيم تدمج متجرك ضمن شبكة المتاجر المعتمدة في غزة، مع إدارة لوجستية متكاملة تضمن راحة التاجر واستلام الطرود من موقع محلك مباشرة.
            </p>
          </div>

          {/* Serene 3 Pillars (Pure minimalist line icons) */}
          <div className="space-y-4 pt-1">
            {/* Pillar 1 */}
            <div className="flex items-start gap-3.5">
              <span className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border/80 text-brand-dark flex items-center justify-center shrink-0 mt-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16h6v-5.5a1.5 1.5 0 0 0-1.5-1.5H16" />
                  <rect x="2" y="6" width="14" height="10" rx="1.5" />
                  <circle cx="6" cy="18" r="2" />
                  <circle cx="18" cy="18" r="2" />
                </svg>
              </span>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-brand-dark m-0">
                  استلام مباشر من باب محلك عبر الـ GPS
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed m-0">
                  يتولى مناديب سَدِيم استلام القطع من موقعك الجغرافي المسجل وتوصيلها للزبائن بطرد موحد.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-start gap-3.5">
              <span className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border/80 text-brand-dark flex items-center justify-center shrink-0 mt-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-brand-dark m-0">
                  تسويات مالية موثقة ودورية
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed m-0">
                  تحصيل مستحقات مبيعاتك فورياً عبر محفظة سَدِيم ومحفظة جوال باي أو حوالة دورية دون تأخير.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-start gap-3.5">
              <span className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border/80 text-brand-dark flex items-center justify-center shrink-0 mt-0.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-brand-dark m-0">
                  واجهة عرض فاخرة ومعتمدة
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed m-0">
                  إبراز علامتك التجارية ومنتجاتك بتنسيق راقٍ يعكس جودة بضاعتك ومكانتها.
                </p>
              </div>
            </div>
          </div>

          {/* Reassurance Footnote */}
          <div className="text-xs text-brand-muted leading-relaxed space-y-1">
            <span className="font-extrabold text-brand-dark block">
              مسار الاعتماد الميداني:
            </span>
            <p className="m-0">
              يراجع فريق التوثيق في سَدِيم الطلب خلال 24 ساعة، ثم نتواصل معك هاتفياً لترتيب الزيارة الميدانية واعتماد حساب متجرك في المنصة.
            </p>
          </div>
        </div>

        {/* ===================================================================
            COLUMN 2: ULTRA-CLEAN REGISTRATION FORM (Production-Ready)
            =================================================================== */}
        <div className="lg:col-span-7 bg-white border border-brand-border/80 rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(28,25,23,0.03)]">
          {submitted ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full bg-[var(--brand-trust-soft)] border border-[var(--brand-trust-border)] flex items-center justify-center mx-auto mb-4 text-brand-trust">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-brand-dark mb-2">
                تم استلام طلب انضمام «{registeredStoreName || 'متجرك'}» بنجاح
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto mb-6 leading-relaxed">
                حسابك مسجل حالياً بحالة <strong>قيد المراجعة والاعتماد</strong> من قبل إدارة سَدِيم. سيتواصل معك فريق التوثيق قريباً عبر الهاتف ({registeredPhone}) لإتمام التحقق الميداني وتفعيل لوحة التحكم.
              </p>
              <div className="p-3.5 rounded-lg bg-brand-surface border border-brand-border text-xs text-brand-muted max-w-md mx-auto mb-6 text-right">
                <span className="font-bold text-brand-dark block mb-0.5">تنويه الدخول:</span>
                يمكنك تسجيل الدخول لحساب التاجر فور اكتمال مكالمة التحقق واعتماد المتجر من الإدارة.
              </div>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-brand-primary text-white hover:brightness-105 px-6 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold shadow-xs transition-all no-underline"
              >
                العودة للرئيسية
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.root && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    !
                  </span>
                  <span>{errors.root.message}</span>
                </div>
              )}

              {/* Group 1: بيانات المتجر والتصنيف */}
              <div className="space-y-3.5">
                <span className="text-xs font-bold text-brand-muted block">
                  بيانات المتجر والتصنيف
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Store Name */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      اسم المتجر أو العلامة التجارية <span className="text-brand-primary">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: خيوط سَدِيم للأزياء"
                      {...register('storeName')}
                      className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                        errors.storeName ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                      }`}
                    />
                    {errors.storeName && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.storeName.message}</p>}
                  </div>

                  {/* Category (Dynamic from DB) */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      تصنيف المنتجات الأساسي <span className="text-brand-primary">*</span>
                    </label>
                    <select
                      {...register('category')}
                      disabled={isLoadingTaxonomy}
                      className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai ${
                        errors.category ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                      }`}
                    >
                      <option value="">
                        {isLoadingTaxonomy ? 'جاري تحميل التصنيفات...' : '-- اختر تصنيف المتجر --'}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.category.message}</p>}
                  </div>
                </div>

                {/* Governorates & Cities (Dynamic from DB) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Governorate */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      المحافظة <span className="text-brand-primary">*</span>
                    </label>
                    <select
                      {...register('governorate')}
                      className="w-full h-11 px-3.5 rounded-lg border border-brand-border bg-brand-surface text-xs sm:text-sm text-brand-dark outline-none font-almarai font-bold"
                    >
                      {availableGovernorates.length > 0 ? (
                        availableGovernorates.map((gov) => (
                          <option key={gov.code} value={gov.code}>
                            {gov.name} (المرحلة الأولى)
                          </option>
                        ))
                      ) : (
                        <option value="central">المحافظة الوسطى (المرحلة الأولى)</option>
                      )}
                    </select>
                    {errors.governorate && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.governorate.message}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      المدينة / المخيم <span className="text-brand-primary">*</span>
                    </label>
                    <select
                      {...register('city')}
                      className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai ${
                        errors.city ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                      }`}
                    >
                      {currentCities.length > 0 ? (
                        currentCities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="deir_albalah">دير البلح</option>
                          <option value="nuseirat">مخيم النصيرات</option>
                          <option value="zawayda">الزوايدة</option>
                          <option value="maghazi">مخيم المغازي</option>
                          <option value="bureij">مخيم البريج</option>
                        </>
                      )}
                    </select>
                    {errors.city && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.city.message}</p>}
                  </div>
                </div>

                {/* Detailed Address */}
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    العنوان التفصيلي ونقطة الاستلام <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="الشارع وأقرب معلَم بارز بجوار المحل"
                    {...register('storeAddress')}
                    className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                      errors.storeAddress ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                    }`}
                  />
                  {errors.storeAddress && (
                    <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.storeAddress.message}</p>
                  )}
                </div>

                {/* MANDATORY STORE MAP PICKER */}
                <div className="pt-2">
                  <StoreMapPicker
                    initialLat={selectedLat}
                    initialLng={selectedLng}
                    onLocationSelect={({ lat, lng, suggestedCityName }) => {
                      setLocation(lat, lng, suggestedCityName);
                    }}
                    error={errors.lat?.message || errors.lng?.message}
                  />
                </div>
              </div>

              {/* Group 2: بيانات المسؤول والدخول (Without WhatsApp) */}
              <div className="space-y-3.5 pt-3 border-t border-brand-border/60">
                <span className="text-xs font-bold text-brand-muted block">
                  بيانات المسؤول وحساب الدخول
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      اسم المسؤول / صاحب المتجر <span className="text-brand-primary">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="الاسم الثلاثي"
                      {...register('name')}
                      className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                        errors.name ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                      }`}
                    />
                    {errors.name && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.name.message}</p>}
                  </div>

                  {/* Primary Phone */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      رقم الجوال الأساسي للتواصل والتحقق <span className="text-brand-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="059xxxxxxx أو 056xxxxxxx"
                      {...register('phone')}
                      className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                        errors.phone ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                      }`}
                    />
                    {errors.phone && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.phone.message}</p>}
                  </div>
                </div>

                {/* Email (Full row or clean width) */}
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    البريد الإلكتروني (لتسجيل الدخول وإدارة المتجر) <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="store@example.com"
                    {...register('email')}
                    className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                      errors.email ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.email.message}</p>}
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      كلمة مرور الحساب <span className="text-brand-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="8 خانات على الأقل (أحرف وأرقام)"
                        {...register('password')}
                        className={`w-full h-11 pr-3.5 pl-11 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                          errors.password ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center transition-colors"
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      تأكيد كلمة المرور <span className="text-brand-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="أعد إدخال كلمة المرور"
                        {...register('confirmPassword')}
                        className={`w-full h-11 pr-3.5 pl-11 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                          errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center transition-colors"
                        aria-label={showConfirmPassword ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
                      >
                        {showConfirmPassword ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 sm:h-12 bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري إرسال طلب الانضمام...</span>
                    </span>
                  ) : (
                    <>
                      <span>تقديم طلب الانضمام لشبكة سَدِيم</span>
                      <span className="text-sm">←</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
