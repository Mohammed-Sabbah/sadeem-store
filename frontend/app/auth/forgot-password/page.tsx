'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim();
    if (!clean) {
      setErrorMsg('يرجى إدخال رقم الجوال أو البريد الإلكتروني');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

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
            استعادة كلمة المرور
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-2 m-0 leading-relaxed">
            أدخل رقم جوالك أو بريدك الإلكتروني المسجل لإرسال تعليمات إعادة التعيين
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-brand-border/80 rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(28,25,23,0.04)]">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust border border-[var(--brand-trust-border)] flex items-center justify-center mx-auto text-lg font-black">
                ✓
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-brand-dark m-0">
                  تم إرسال التعليمات بنجاح
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted mt-2 leading-relaxed max-w-sm mx-auto m-0">
                  أرسلنا رابط إعادة تعيين كلمة المرور إلى ({identifier}). يرجى التحقق من رسائلك للمتابعة.
                </p>
              </div>

              <Link
                href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
                className="w-full h-12 bg-brand-primary text-white hover:brightness-105 rounded-lg text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all no-underline mt-4"
              >
                <span>العودة لتسجيل الدخول</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    !
                  </span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-brand-dark mb-2">
                  رقم الجوال أو البريد الإلكتروني
                </label>
                <input
                  type="text"
                  required
                  placeholder="059xxxxxxx أو name@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-brand-border bg-white text-sm text-brand-dark outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-almarai placeholder:text-brand-subtle"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] rounded-lg text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 mt-3"
              >
                {loading ? (
                  <span>جاري التحقق...</span>
                ) : (
                  <span>إرسال رمز التعيين</span>
                )}
              </button>
            </form>
          )}

          {/* Switch to Login */}
          <div className="mt-7 pt-5 border-t border-brand-border/70 text-center text-xs sm:text-sm text-brand-muted">
            <span>تذكرت كلمة المرور؟ </span>
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-extrabold text-brand-primary hover:underline no-underline mr-1"
            >
              تسجيل الدخول
            </Link>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-brand-muted font-almarai">جاري التحميل...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
