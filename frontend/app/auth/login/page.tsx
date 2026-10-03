'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLogin } from '@/features/auth/hooks/useLogin';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
  } = useLogin();

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-4 py-8 sm:py-12 font-almarai text-right overflow-hidden bg-brand-bg">
      {/* Subtle Ambient Cosmic Nebula Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[var(--brand-primary)]/8 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Strip: Return link on right, Compact logo on left (aligned to card edges) */}
      <header className="w-full max-w-[420px] mx-auto flex items-center justify-between z-10 mb-2 sm:mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-muted hover:text-brand-dark transition-colors no-underline group"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          <span>العودة للرئيسية</span>
        </Link>

        {/* Compact Logo in Top Left Corner */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 no-underline group"
          title="سَدِيم — سوق محلي موثوق"
        >
          <span className="font-almarai font-black text-lg tracking-tight text-brand-dark group-hover:text-brand-primary transition-colors">
            سَدِيم
          </span>
          <span className="w-2 h-2 rotate-45 bg-brand-primary inline-block rounded-[1px] shadow-[0_0_8px_rgba(184,98,27,0.5)]"></span>
        </Link>
      </header>

      {/* Center Stage: Apple-style Crisp Focused Card */}
      <main className="w-full max-w-[420px] mx-auto my-auto py-2 sm:py-4 z-10">
        {/* Headline */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark m-0 tracking-tight">
            تسجيل الدخول
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-2 m-0 leading-relaxed">
            أدخل بيانات حسابك للوصول إلى طلبياتك ومحفظتك الرقمية
          </p>
        </div>

        {/* Form Container (Apple-style pristine white card with golden ratio rhythm) */}
        <div className="bg-white border border-brand-border/80 rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(28,25,23,0.04)]">
          {errors.root && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                !
              </span>
              <span>{errors.root.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-brand-dark mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={`w-full h-12 px-4 rounded-lg border bg-white text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                  errors.email ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-brand-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                }`}
                dir="ltr"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field with Left-aligned Eye Toggle in RTL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-bold text-brand-dark m-0">
                  كلمة المرور
                </label>
                <Link
                  href={`/auth/forgot-password?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="text-xs text-brand-muted hover:text-brand-primary transition-colors no-underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full h-12 pr-4 pl-12 rounded-lg border bg-white text-sm text-brand-dark outline-none transition-all font-almarai placeholder:text-brand-subtle ${
                    errors.password ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400' : 'border-brand-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 mt-1 font-bold m-0">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] rounded-lg text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 mt-2"
            >
              {isSubmitting ? (
                <span>جاري التحقق...</span>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </button>
          </form>

          {/* Switch to Register & Merchant Join */}
          <div className="mt-6 pt-5 border-t border-brand-border/70 text-center text-xs sm:text-sm text-brand-muted space-y-2.5">
            <div>
              <span>ليس لديك حساب بعد؟ </span>
              <Link
                href={`/auth/register?redirect=${encodeURIComponent(redirectUrl)}`}
                className="font-extrabold text-brand-primary hover:underline no-underline mr-1"
              >
                إنشاء حساب جديد
              </Link>
            </div>
            <div className="pt-2 border-t border-dashed border-brand-border/60">
              <span className="text-xs text-brand-muted">صاحب متجر أو حرفي في الوسطى؟ </span>
              <Link
                href="/merchant/join"
                className="font-extrabold text-brand-trust hover:underline no-underline text-xs mr-1"
              >
                انضم كتاجر معتمد ←
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Quiet Footer */}
      <footer className="w-full max-w-[420px] mx-auto text-center text-xs text-brand-subtle py-2 z-10">
        سَدِيم · منصة المحافظة الوسطى الموحدة
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-brand-muted font-almarai">جاري التحميل...</div>}>
      <LoginForm />
    </Suspense>
  );
}
