'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usePasswordRecovery } from '@/features/auth/hooks/usePasswordRecovery';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const {
    step,
    email,
    loading,
    errorMsg,
    setErrorMsg,
    resendCooldown,
    requestOtp,
    verifyOtp,
    resetPassword,
    resendOtp,
  } = usePasswordRecovery();

  // Local form states
  const [inputEmail, setInputEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestOtp(inputEmail);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtp(otpCode);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين');
      return;
    }
    await resetPassword(password);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-4 py-8 sm:py-12 font-almarai text-right overflow-hidden bg-brand-bg">
      {/* Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[var(--brand-primary)]/8 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Strip */}
      <header className="w-full max-w-[420px] mx-auto flex items-center justify-between z-10 mb-2 sm:mb-4">
        <Link
          href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-muted hover:text-brand-dark transition-colors no-underline"
        >
          <span>←</span>
          <span>العودة للدخول</span>
        </Link>

        {/* Compact Logo */}
        <Link href="/" className="inline-flex items-center gap-1.5 no-underline" title="سَدِيم">
          <span className="font-almarai font-black text-lg tracking-tight text-brand-dark">
            سَدِيم
          </span>
          <span className="w-2 h-2 rotate-45 bg-brand-primary inline-block rounded-[1px] shadow-[0_0_8px_rgba(184,98,27,0.5)]" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[420px] mx-auto my-auto py-2 sm:py-4 z-10">
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark m-0 tracking-tight">
            استعادة كلمة المرور
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-2 m-0 leading-relaxed">
            {step === 'request' && 'أدخل بريدك الإلكتروني المسجل لاستلام رمز التحقق'}
            {step === 'verify' && `أدخل رمز التحقق (OTP) المكوّن من 6 أرقام المُرسل إلى ${email}`}
            {step === 'reset' && 'عيّن كلمة مرور جديدة وقوية لحسابك'}
            {step === 'success' && 'تم تحديث كلمة المرور بنجاح'}
          </p>
        </div>

        <div className="bg-white border border-brand-border/80 rounded-[14px] p-6 sm:p-8 shadow-[0_2px_16px_rgba(28,25,23,0.03)]">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                !
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Request OTP */}
          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-brand-border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 placeholder:text-brand-subtle"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">
                  رمز التحقق (6 أرقام)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-12 px-3.5 rounded-lg border border-brand-border bg-white text-center text-lg font-black tracking-widest text-brand-dark outline-none transition-all font-mono focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full h-11 bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد الرمز والمتابعة'}
              </button>

              <div className="pt-2 text-center text-xs text-brand-muted">
                {resendCooldown > 0 ? (
                  <span>إعادة إرسال الرمز خلال {resendCooldown} ثانية</span>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading}
                    className="font-bold text-brand-primary hover:text-brand-dark cursor-pointer bg-transparent border-0 underline"
                  >
                    إعادة إرسال رمز التحقق
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8 خانات على الأقل"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pr-3.5 pl-11 rounded-lg border border-brand-border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 placeholder:text-brand-subtle"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark cursor-pointer bg-transparent border-0 p-1"
                  >
                    {showPassword ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-brand-border bg-white text-xs sm:text-sm text-brand-dark outline-none transition-all font-almarai focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 placeholder:text-brand-subtle"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 8}
                className="w-full h-11 bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust border border-[var(--brand-trust-border)] flex items-center justify-center mx-auto text-lg font-black">
                ✓
              </div>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-sm mx-auto m-0">
                تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بحسابك.
              </p>

              <Link
                href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
                className="w-full h-11 bg-brand-primary text-white hover:brightness-105 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all no-underline mt-4"
              >
                <span>الانتقال لتسجيل الدخول</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-brand-muted mt-6 z-10">
        سَدِيم &copy; {new Date().getFullYear()} — منصة التجارة المحلية
      </footer>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg flex items-center justify-center">تحميل...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
