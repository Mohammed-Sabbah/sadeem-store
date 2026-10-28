'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  useUserWalletQuery,
  useUserTransactionsQuery,
  useUserWalletOperations,
} from '@/features/wallet/hooks/useUserWallet';

const QUICK_AMOUNTS = [30, 50, 100, 200];
const JAWWAL_PAY_NUMBER = '0599123456';

export default function CustomerWalletPage() {
  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const { data: wallet, isLoading: isLoadingWallet } = useUserWalletQuery();
  const { data: txRes, isLoading: isLoadingTx } = useUserTransactionsQuery({ limit: 50 });
  const {
    submitDeposit,
    isSubmittingDeposit,
    submitWithdrawal,
    isSubmittingWithdrawal,
    cancelTransaction,
    isCancelling,
  } = useUserWalletOperations();

  const [activeForm, setActiveForm] = useState<'none' | 'deposit' | 'withdraw'>('none');
  const [depositAmount, setDepositAmount] = useState<string>('50');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedJawwal, setCopiedJawwal] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50');
  const [withdrawPhone, setWithdrawPhone] = useState<string>('');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');

  const transactions = txRes?.data || [];
  const withdrawableBalance = wallet?.withdrawableBalance ?? (user?.walletBalance || 0);

  const handleCopyJawwal = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(JAWWAL_PAY_NUMBER);
      setCopiedJawwal(true);
      setTimeout(() => setCopiedJawwal(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0 || !proofFile) return;

    submitDeposit(
      { amount: amt, proofImage: proofFile },
      {
        onSuccess: () => {
          setActiveForm('none');
          setProofFile(null);
          setPreviewUrl(null);
          setDepositAmount('50');
        },
      }
    );
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0 || amt > withdrawableBalance) return;

    submitWithdrawal(
      {
        amount: amt,
        payoutDetails: {
          bankName: 'محفظة جوال باي (Jawwal Pay)',
          accountNumber: withdrawPhone || user?.phone || '',
          accountName: user?.name || 'مستفيد سَدِيم',
          notes: withdrawNotes,
        },
      },
      {
        onSuccess: () => {
          setActiveForm('none');
          setWithdrawAmount('50');
          setWithdrawNotes('');
        },
      }
    );
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-almarai text-center p-4">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-brand-muted">جارٍ التحقق من بيانات الدخول...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-brand-card rounded-2xl border border-brand-border text-center font-almarai shadow-2xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-surface text-brand-primary border border-brand-border flex items-center justify-center mx-auto text-2xl">
          👛
        </div>
        <h2 className="text-lg font-black text-brand-dark">
          محفظة سَدِيم الرقمية
        </h2>
        <p className="text-xs text-brand-muted leading-relaxed">
          يرجى تسجيل الدخول إلى حسابك لإدارة رصيدك المالي، شحن المحفظة، ومتابعة حركات الدفع الفوري.
        </p>
        <Link
          href="/auth/login?redirect=/account/wallet"
          className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-brand-primary text-white text-xs font-black shadow-xs hover:bg-brand-primary-hover active:scale-95 transition-all no-underline"
        >
          تسجيل الدخول إلى حسابك
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8 font-almarai text-right select-none space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between gap-3 border-b border-brand-border/60 pb-4">
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-brand-primary block">
            الحساب الشخصي
          </span>
          <h1 className="text-xl font-black text-brand-dark tracking-tight m-0">
            محفظة سَدِيم الرقمية
          </h1>
        </div>

        <Link
          href="/account"
          className="text-xs font-bold text-brand-muted hover:text-brand-dark py-2 px-3 rounded-xl border border-brand-border bg-brand-card shadow-2xs transition-colors no-underline flex items-center gap-1"
        >
          <span>←</span>
          <span>حسابي</span>
        </Link>
      </div>

      {/* 1. Cosmic Luxury Balance Card */}
      <div className="bg-gradient-to-br from-[#1C1917] to-[#292524] text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden">
        {/* Subtle Cosmic Background Sparkle Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-brand-trust/20 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-sm">
              👛
            </span>
            <span className="text-xs font-bold text-white/80">
              الرصيد المتاح للشراء أو السحب
            </span>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-brand-gold border border-white/10">
            دفع فوري آمن
          </span>
        </div>

        <div className="relative z-10 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-white">
              {isLoadingWallet ? '...' : withdrawableBalance.toFixed(2)}
            </span>
            <span className="text-base font-bold text-brand-gold">شيكل</span>
          </div>
          <span className="text-[11px] text-white/60 block">
            يمكنك استخدام رصيد المحفظة للشراء بضغطة واحدة من أي متجر بالوسطى
          </span>
        </div>

        {/* Action Buttons for Mobile Thumbs */}
        <div className="pt-2 flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => setActiveForm(activeForm === 'deposit' ? 'none' : 'deposit')}
            className={`flex-1 h-11 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-98 ${
              activeForm === 'deposit'
                ? 'bg-white text-brand-dark'
                : 'bg-brand-primary text-white hover:brightness-105'
            }`}
          >
            <span>+</span>
            <span>شحن الرصيد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveForm(activeForm === 'withdraw' ? 'none' : 'withdraw')}
            className={`h-11 px-5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 ${
              activeForm === 'withdraw'
                ? 'bg-white text-brand-dark'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
          >
            <span>سحب رصيد</span>
          </button>
        </div>
      </div>

      {/* 2. Top-Up Form (Collapsible / Dynamic) */}
      {activeForm === 'deposit' && (
        <div className="bg-brand-card rounded-2xl border border-brand-border p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-brand-dark">
                طلب شحن رصيد جديد
              </h3>
              <p className="text-[11px] text-brand-muted">
                حول المبلغ لحساب سَدِيم المعتمد وارفق صورة الإشعار للمراجعة الفورية.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveForm('none')}
              className="text-xs text-brand-muted hover:text-brand-dark cursor-pointer font-bold"
            >
              إلغاء ✕
            </button>
          </div>

          {/* Official Transfer Instructions Strip */}
          <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5">
            <span className="text-xs font-bold text-brand-dark block">
              1. بيانات التحويل المعتمدة (جوال باي)
            </span>
            <div className="flex items-center justify-between bg-brand-card p-3 rounded-lg border border-brand-border/80">
              <div className="space-y-0.5">
                <span className="text-[10px] text-brand-muted block">رقم محفظة سَدِيم الرسمية</span>
                <span className="text-sm font-black font-mono text-brand-dark dir-ltr block text-right">
                  {JAWWAL_PAY_NUMBER}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyJawwal}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer"
              >
                {copiedJawwal ? '✓ تم النسخ' : 'نسخ الرقم'}
              </button>
            </div>
            <p className="text-[10px] text-brand-muted leading-relaxed m-0">
              * بعد إتمام التحويل عبر تطبيق جوال باي، التقط لقطة شاشة للإشعار المكتمل وارفقها أدناه.
            </p>
          </div>

          {/* Deposit Form */}
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            {/* Amount Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-dark">
                2. المبلغ المحول (شيكل)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(String(amt))}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      depositAmount === String(amt)
                        ? 'border-brand-primary bg-brand-primary-soft text-brand-primary shadow-2xs'
                        : 'border-brand-border bg-brand-surface text-brand-dark hover:border-brand-border-subtle'
                    }`}
                  >
                    {amt} ₪
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="5"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="أو اكتب أي مبلغ آخر..."
                  required
                  className="w-full h-11 pr-4 pl-10 text-sm font-bold rounded-xl border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary transition-all font-mono"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted pointer-events-none">
                  ₪
                </span>
              </div>
            </div>

            {/* Proof Image Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-dark">
                3. صورة إشعار التحويل المالي <span className="text-red-500">*</span>
              </label>

              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-brand-border bg-stone-900 max-h-56 flex items-center justify-center p-2">
                  <img
                    src={previewUrl}
                    alt="معاينة إشعار التحويل"
                    className="max-h-52 w-auto object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProofFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-[11px] font-bold hover:bg-black transition-colors cursor-pointer"
                  >
                    تغيير الصورة ✕
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-brand-border hover:border-brand-primary rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-brand-surface/40 hover:bg-brand-surface transition-all">
                  <span className="text-2xl">📸</span>
                  <span className="text-xs font-black text-brand-dark">
                    التقط صورة للإشعار أو اخترها من الألبوم
                  </span>
                  <span className="text-[10px] text-brand-muted">
                    يقبل صور PNG, JPG بحد أقصى 5 ميغابايت
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmittingDeposit || !proofFile || parseFloat(depositAmount) <= 0}
              className="w-full h-11 rounded-xl bg-brand-primary text-white text-xs font-black shadow-xs hover:bg-brand-primary-hover active:scale-98 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSubmittingDeposit ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ إرسال الإشعار للتدقيق...</span>
                </>
              ) : (
                <span>إرسال طلب الشحن للمراجعة</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 3. Withdraw Form (Collapsible / Dynamic) */}
      {activeForm === 'withdraw' && (
        <div className="bg-brand-card rounded-2xl border border-brand-border p-5 sm:p-6 shadow-2xs space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-brand-dark">
                طلب سحب رصيد نقدي
              </h3>
              <p className="text-[11px] text-brand-muted">
                سحب جزء أو كامل رصيدك المتاح إلى محفظة جوال باي الخاصة بك.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveForm('none')}
              className="text-xs text-brand-muted hover:text-brand-dark cursor-pointer font-bold"
            >
              إلغاء ✕
            </button>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-brand-dark">
                المبلغ المراد سحبه (شيكل)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max={withdrawableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  className="w-full h-11 pr-4 pl-10 text-sm font-bold rounded-xl border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary font-mono"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted pointer-events-none">
                  ₪
                </span>
              </div>
              <span className="text-[10px] text-brand-muted block">
                أقصى مبلغ قابل للسحب حالياً: {withdrawableBalance.toFixed(2)} ₪
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-brand-dark">
                رقم محفظة جوال باي المستلمة
              </label>
              <input
                type="text"
                placeholder="059xxxxxxxx"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                required
                className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingWithdrawal || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > withdrawableBalance}
              className="w-full h-11 rounded-xl bg-brand-dark text-white text-xs font-black shadow-xs hover:bg-stone-800 active:scale-98 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSubmittingWithdrawal ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ تسجيل طلب السحب...</span>
                </>
              ) : (
                <span>تأكيد طلب السحب</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 4. Transactions History Section */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
          <h2 className="text-sm font-black text-brand-dark m-0">
            سجل حركات المحفظة
          </h2>
          <span className="text-[10px] font-bold text-brand-muted">
            {transactions.length} حركات مسجلة
          </span>
        </div>

        {isLoadingTx ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-brand-muted">جارٍ تحميل الحركات...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <span className="text-2xl block">📂</span>
            <p className="text-xs font-bold text-brand-dark">لا توجد حركات مسجلة بعد</p>
            <p className="text-[11px] text-brand-muted">
              ستظهر هنا كافة عمليات الشحن والدفع والاسترداد المالي في محفظتك.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border/50">
            {transactions.map((tx) => {
              const isDeposit = tx.type === 'deposit';
              const isPending = tx.status === 'pending';
              const isApproved = tx.status === 'approved';
              const isRejected = tx.status === 'rejected';
              const dateStr = new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={tx._id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-brand-dark">
                        {isDeposit
                          ? 'طلب شحن رصيد'
                          : tx.type === 'withdrawal'
                          ? 'طلب سحب رصيد'
                          : tx.type === 'refund'
                          ? 'استرداد نقدي'
                          : 'دفع مشتريات'}
                      </span>
                      {isPending && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                          قيد المراجعة
                        </span>
                      )}
                      {isApproved && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          معتمد ✓
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                          مرفوض
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-brand-muted block font-mono">
                      {dateStr}
                    </span>
                    {isRejected && tx.rejectReason && (
                      <span className="text-[10px] text-red-700 font-bold block">
                        السبب: {tx.rejectReason}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-black font-mono ${
                        isDeposit || tx.type === 'refund' ? 'text-brand-trust' : 'text-brand-dark'
                      }`}
                    >
                      {isDeposit || tx.type === 'refund' ? '+' : '-'}{tx.amount} ₪
                    </span>

                    {/* Self-cancellation for pending items */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => cancelTransaction(tx._id)}
                        disabled={isCancelling}
                        className="text-[10px] font-bold text-stone-500 hover:text-red-600 hover:underline cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
