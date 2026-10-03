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
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  } = useMerchantJoin();

  return (
    <main className="max-w-[1240px] mx-auto px-4 pt-6 pb-24 md:pb-16 font-almarai text-right">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-dark tracking-tight">
            انضم كتاجر معتمد في سَدِيم
          </h1>
          <span className="text-xs md:text-sm text-brand-muted mt-1 block">
            وسّع مبيعاتك في المحافظة الوسطى بشراكة لوجستية وتسويقية متكاملة
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-brand-muted hover:text-brand-dark transition-colors py-1.5 px-3 rounded-lg border border-brand-border bg-white shrink-0 no-underline"
        >
          <span>←</span>
          <span>الرئيسية</span>
        </Link>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMN 1: VALUE PROPOSITION & QUIET LUXURY TRUST PILLARS */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white border border-brand-border/80 rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(28,25,23,0.03)]">
            <span className="text-xs font-black text-brand-primary bg-[var(--brand-primary-soft)] border border-[var(--brand-primary-border)] px-3 py-1 rounded-full inline-block mb-3.5">
              ● شراكة حقيقية لمتاجر وحرفيي الوسطى
            </span>
            <h2 className="text-base sm:text-lg font-black text-brand-dark mb-3 leading-snug">
              ركّز على جودة بضاعتك وصناعتك، ونحن نتولى التسويق المتقن والتوصيل الميداني للزبائن
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-6">
              سَدِيم تدمج مبيعاتك ضمن شبكة متاجر معتمدة في المحافظة الوسطى. نوفر واجهة عرض فاخرة، نظام طرد موحد، وتسوية مالية فورية عند تسليم كل طلب.
            </p>

            {/* 3 Pillars */}
            <div className="flex flex-col gap-3">
              <div className="bg-brand-bg/50 border border-brand-border/60 rounded-xl p-3.5 flex gap-3.5 items-center">
                <div className="w-10 h-10 rounded-xl bg-white border border-brand-border flex items-center justify-center text-brand-primary shrink-0 font-bold">
                  📦
                </div>
                <div>
                  <strong className="text-xs sm:text-sm text-brand-dark block">
                    أسطول توصيل يستلم من باب محلك
                  </strong>
                  <span className="text-[11px] text-brand-muted block mt-0.5">
                    مندوبو سَدِيم يستلمون المنتج منك ويجمعونه في طرد موحد للزبون.
                  </span>
                </div>
              </div>

              <div className="bg-brand-bg/50 border border-brand-border/60 rounded-xl p-3.5 flex gap-3.5 items-center">
                <div className="w-10 h-10 rounded-xl bg-white border border-brand-border flex items-center justify-center text-brand-trust shrink-0 font-bold">
                  💰
                </div>
                <div>
                  <strong className="text-xs sm:text-sm text-brand-dark block">
                    تسويات مالية دورية وموثقة
                  </strong>
                  <span className="text-[11px] text-brand-muted block mt-0.5">
                    تحصيل المبالغ كاش أو جوال باي وتسليم أرباحك دورياً دون تأخير.
                  </span>
                </div>
              </div>

              <div className="bg-brand-bg/50 border border-brand-border/60 rounded-xl p-3.5 flex gap-3.5 items-center">
                <div className="w-10 h-10 rounded-xl bg-white border border-brand-border flex items-center justify-center text-brand-primary shrink-0 font-bold">
                  ✨
                </div>
                <div>
                  <strong className="text-xs sm:text-sm text-brand-dark block">
                    واجهة رقمية بمعايير المجلات العالمية
                  </strong>
                  <span className="text-[11px] text-brand-muted block mt-0.5">
                    تصوير منسق للمنتجات يعكس موثوقية وفخامة علامتك التجارية.
                  </span>
                </div>
              </div>
            </div>

            {/* Operational Note */}
            <div className="mt-6 pt-4 border-t border-brand-border/70 text-xs text-brand-muted leading-relaxed">
              <strong className="text-brand-dark block mb-1">كيف تتم مراجعة وتفعيل الحساب؟</strong>
              بعد تقديم الطلب، يقوم فريق توثيق سَدِيم في الوسطى بالتحقق من البيانات والتواصل معك هاتفياً لترتيب زيارة المحل والتأكد من مطابقة شروط الجودة قبل تفعيل المتجر.
            </div>
          </div>
        </div>

        {/* COLUMN 2: REGISTRATION FORM */}
        <div className="lg:col-span-7 bg-white border border-brand-border/80 rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(28,25,23,0.04)]">
          {submitted ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 rounded-full bg-[var(--brand-trust-soft)] border-2 border-brand-trust flex items-center justify-center mx-auto mb-4 text-brand-trust text-2xl font-black">
                ✓
              </div>
              <h3 className="text-lg md:text-xl font-black text-brand-dark mb-2">
                تم استلام طلب انضمام «{registeredStoreName || 'متجرك'}» بنجاح!
              </h3>
              <p className="text-xs md:text-sm text-brand-muted max-w-md mx-auto mb-6 leading-relaxed">
                حسابك مسجل حالياً بحالة <strong>قيد المراجعة والاعتماد</strong> من قبل إدارة سَدِيم. سيتواصل معك فريق التوثيق خلال 24 ساعة عبر الهاتف أو الواتساب ({registeredPhone}) لترتيب الزيارة الميدانية وتفعيل حساب متجرك في المنصة.
              </p>
              <div className="p-3.5 rounded-xl bg-brand-bg/60 border border-brand-border text-xs text-brand-muted max-w-md mx-auto mb-6 text-right">
                <span className="font-bold text-brand-dark block mb-1">ملاحظة مهمة:</span>
                لن تتمكن من تسجيل الدخول كتاجر فاعل في لوحة التحكم إلا بعد إتمام مكالمة التحقق واعتماد المتجر من الإدارة.
              </div>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-brand-primary text-white hover:brightness-105 px-6 py-3 rounded-lg text-xs md:text-sm font-extrabold shadow-xs transition-all no-underline"
              >
                العودة للتسوق في سَدِيم
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header inside form */}
              <div>
                <h3 className="text-base sm:text-lg font-black text-brand-dark mb-1">
                  طلب انضمام وتوثيق متجر جديد
                </h3>
                <p className="text-xs text-brand-muted m-0">
                  الحساب لن يتفعل تلقائياً، بل يُعتمد بعد مراجعة الإدارة والتأكد من مطابقة شروط الجودة الميدانية.
                </p>
              </div>

              {errors.root && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    !
                  </span>
                  <span>{errors.root.message}</span>
                </div>
              )}

              {/* SECTION 1: هوية المتجر وموقعه في الوسطى */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2 pb-1.5 border-b border-brand-border/60">
                  <span className="w-5 h-5 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary text-xs font-black flex items-center justify-center">1</span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-brand-dark m-0">بيانات المتجر وموقعه في المحافظة الوسطى</h4>
                </div>

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

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      تصنيف المنتجات الأساسي <span className="text-brand-primary">*</span>
                    </label>
                    <select
                      {...register('category')}
                      className="w-full h-11 px-3.5 rounded-lg border border-brand-border bg-white text-xs sm:text-sm text-brand-dark outline-none focus:border-brand-primary transition-all font-almarai"
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
                </div>

                {/* Address: 3 Precise parts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Part 1: Governorate */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      1. المحافظة <span className="text-brand-primary">*</span>
                    </label>
                    <select
                      {...register('governorate')}
                      className="w-full h-11 px-3.5 rounded-lg border border-brand-border bg-brand-bg/50 text-xs sm:text-sm text-brand-dark outline-none font-almarai font-bold"
                    >
                      <option value="المحافظة الوسطى">المحافظة الوسطى (المرحلة الأولى)</option>
                    </select>
                    <span className="text-[10px] text-brand-muted mt-1 block">
                      * التوصيل والطرد الموحد محصور بالوسطى حالياً لضمان توصيل 8 ₪.
                    </span>
                  </div>

                  {/* Part 2: City / Camp */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      2. المدينة / المخيم <span className="text-brand-primary">*</span>
                    </label>
                    <select
                      {...register('city')}
                      className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai ${
                        errors.city ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                      }`}
                    >
                      <option value="دير البلح">دير البلح</option>
                      <option value="مخيم النصيرات">مخيم النصيرات</option>
                      <option value="الزوايدة">الزوايدة</option>
                      <option value="مخيم المغازي">مخيم المغازي</option>
                      <option value="مخيم البريج">مخيم البريج</option>
                    </select>
                    {errors.city && <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.city.message}</p>}
                  </div>
                </div>

                {/* Part 3: Detailed Address */}
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">
                    3. العنوان التفصيلي ونقطة الاستلام <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: شارع النخيل — بالقرب من مسجد السلام، مقابل صيدلية القدس"
                    {...register('storeAddress')}
                    className={`w-full h-11 px-3.5 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                      errors.storeAddress ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                    }`}
                  />
                  {errors.storeAddress && (
                    <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.storeAddress.message}</p>
                  )}
                  <span className="text-[10px] text-brand-muted mt-1 block">
                    يستخدم هذا العنوان لوصول مندوب سَدِيم لاستلام الطرد وتنسيق التسليم.
                  </span>
                </div>
              </div>

              {/* SECTION 2: بيانات المسؤول وتأمين الحساب */}
              <div className="space-y-4 pt-3 border-t border-brand-border/60">
                <div className="flex items-center gap-2 pb-1.5 border-b border-brand-border/60">
                  <span className="w-5 h-5 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary text-xs font-black flex items-center justify-center">2</span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-brand-dark m-0">بيانات المسؤول وحماية الحساب</h4>
                </div>

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
                      رقم الجوال الأساسي <span className="text-brand-primary">*</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      رقم الواتساب للتنسيق واستلام الطلبات
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="اتركه فارغاً إن كان نفس رقم الجوال"
                      {...register('whatsapp')}
                      className="w-full h-11 px-3.5 rounded-lg border border-brand-border bg-white text-xs sm:text-sm text-brand-dark outline-none focus:border-brand-primary transition-all font-almarai placeholder:text-brand-subtle"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      البريد الإلكتروني (لتسجيل الدخول) <span className="text-brand-primary">*</span>
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
                </div>

                {/* Password & Confirm Password (2 Fields) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-brand-dark mb-1.5">
                      كلمة مرور الحساب <span className="text-brand-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="6 خانات على الأقل"
                        {...register('password')}
                        className={`w-full h-11 pr-3.5 pl-11 rounded-lg border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                          errors.password ? 'border-red-400 focus:border-red-500' : 'border-brand-border focus:border-brand-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center"
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center"
                        aria-label={showConfirmPassword ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] rounded-lg text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>جاري إرسال طلب الانضمام...</span>
                  ) : (
                    <span>تقديم طلب الانضمام لشبكة سَدِيم ←</span>
                  )}
                </button>
                <p className="text-[11px] text-brand-muted text-center mt-2.5 m-0">
                  بتقديم الطلب، فإنك توافق على سياسة التوثيق وفحص الجودة لشبكة سَدِيم في المحافظة الوسطى.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
