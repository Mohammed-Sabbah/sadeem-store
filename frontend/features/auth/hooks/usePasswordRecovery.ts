'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';

export type RecoveryStep = 'request' | 'verify' | 'reset' | 'success';

export function usePasswordRecovery() {
  const [step, setStep] = useState<RecoveryStep>('request');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const requestOtp = useCallback(async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني');
      return false;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authService.forgotPassword(cleanEmail);
      if (!res.success) {
        setErrorMsg(res.message || 'تعذر إرسال رمز التحقق');
        return false;
      }

      setEmail(cleanEmail);
      setStep('verify');
      setResendCooldown(60);
      return true;
    } catch {
      setErrorMsg('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string) => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('رمز التحقق يجب أن يتكون من 6 أرقام');
      return false;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authService.verifyOtp(cleanOtp);
      if (!res.success) {
        setErrorMsg(res.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
        return false;
      }

      setStep('reset');
      return true;
    } catch {
      setErrorMsg('حدث خطأ أثناء التحقق، يرجى المحاولة مجدداً');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (password: string) => {
    if (password.length < 8) {
      setErrorMsg('كلمة المرور يجب ألا تقل عن 8 خانات');
      return false;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authService.resetPassword(password);
      if (!res.success) {
        setErrorMsg(res.message || 'تعذر إعادة تعيين كلمة المرور');
        return false;
      }

      setStep('success');
      return true;
    } catch {
      setErrorMsg('حدث خطأ أثناء تعيين كلمة المرور');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOtp = useCallback(async () => {
    if (resendCooldown > 0 || !email) return;
    await requestOtp(email);
  }, [email, resendCooldown, requestOtp]);

  return {
    step,
    setStep,
    email,
    loading,
    errorMsg,
    setErrorMsg,
    resendCooldown,
    requestOtp,
    verifyOtp,
    resetPassword,
    resendOtp,
  };
}
