'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  useUserWalletQuery,
  useUserTransactionsQuery,
  useUserWalletOperations,
} from '@/features/wallet/hooks/useUserWallet';
import type { WalletTransactionItem } from '@/features/wallet/types/wallet.types';
import { PaymentRailId, PAYMENT_RAILS } from '@/features/wallet/constants/paymentRails';
import { PaymentRailSelector } from '@/features/wallet/components/PaymentRailSelector';
import { DepositAccountCard } from '@/features/wallet/components/DepositAccountCard';
import {
  WithdrawalChannelFields,
  WithdrawalFormFields,
} from '@/features/wallet/components/WithdrawalChannelFields';
import {
  compressReceiptImage,
  formatFileSize,
  CompressionResult,
} from '@/features/wallet/utils/imageCompression';
import { ReceiptPreviewModal } from '@/features/wallet/components/ReceiptPreviewModal';
import { TransactionDetailDrawer } from '@/features/wallet/components/TransactionDetailDrawer';

const QUICK_AMOUNTS = [30, 50, 100, 200];

export default function CustomerWalletPage() {
  const { user, isAuthenticated, isLoading: isLoadingAuth, updateUser } = useAuth();

  // Transactions query with auto-detection of pending items
  const { data: txRes, isLoading: isLoadingTx } = useUserTransactionsQuery({ limit: 50 });
  const transactions = txRes?.data || [];
  const pendingTransactions = transactions.filter((t) => t.status === 'pending');
  const hasPending = pendingTransactions.length > 0;

  // Wallet query synchronized with pending state
  const { data: wallet, isLoading: isLoadingWallet } = useUserWalletQuery({
    enabled: Boolean(isAuthenticated),
    refetchInterval: hasPending ? 3000 : false,
  });

  const {
    submitDeposit,
    isSubmittingDeposit,
    submitWithdrawal,
    isSubmittingWithdrawal,
    cancelTransaction,
    isCancelling,
  } = useUserWalletOperations();

  // Keep AuthContext in sync with fresh wallet balance
  useEffect(() => {
    if (wallet && wallet.balance !== undefined && user) {
      if (user.walletBalance !== wallet.balance) {
        updateUser({ walletBalance: wallet.balance });
      }
    }
  }, [wallet?.balance, user?.walletBalance, updateUser]);

  // Form states: 'none' | 'deposit' | 'withdraw'
  const [activeForm, setActiveForm] = useState<'none' | 'deposit' | 'withdraw'>('none');

  // Ledger Filter State & Footprint Compression
  const [txFilter, setTxFilter] = useState<'all' | 'pending' | 'deposit' | 'withdrawal'>('all');
  const [isLedgerExpanded, setIsLedgerExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'deposit' || action === 'withdraw') {
        setActiveForm(action);
      }
    }
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeForm !== 'none') {
        setActiveForm('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeForm]);

  // Deposit states
  const [depositRail, setDepositRail] = useState<PaymentRailId>('JAWWAL_PAY');
  const [depositAmount, setDepositAmount] = useState<string>('50');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Withdraw states
  const [withdrawRail, setWithdrawRail] = useState<PaymentRailId>('JAWWAL_PAY');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50');
  const [withdrawFields, setWithdrawFields] = useState<WithdrawalFormFields>({
    accountNumber: user?.phone || '',
    accountName: user?.name || '',
    bankBranch: '',
    notes: '',
  });

  // Drawer state
  const [inspectedTransaction, setInspectedTransaction] = useState<WalletTransactionItem | null>(null);

  const withdrawableBalance = wallet?.withdrawableBalance ?? (user?.walletBalance || 0);
  const storeCreditBalance = wallet?.storeCreditBalance ?? 0;
  const totalBalance = wallet?.balance ?? withdrawableBalance + storeCreditBalance;

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'all') return true;
    if (txFilter === 'pending') return tx.status === 'pending';
    if (txFilter === 'deposit') return tx.type === 'deposit';
    if (txFilter === 'withdrawal') return tx.type === 'withdrawal';
    return true;
  });

  // Displayed transactions (compressed footprint: 5 items by default)
  const displayedTransactions = isLedgerExpanded
    ? filteredTransactions
    : filteredTransactions.slice(0, 5);

  // Counts for tabs
  const depositsCount = transactions.filter((t) => t.type === 'deposit').length;
  const withdrawalsCount = transactions.filter((t) => t.type === 'withdrawal').length;

  // Handle image selection & client-side compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressionError(null);
    setIsCompressing(true);

    try {
      const result = await compressReceiptImage(file, { maxDimension: 1600, quality: 0.82 });
      setProofFile(result.file);
      setCompressionResult(result);
    } catch (err: any) {
      setCompressionError(err?.message || 'تعذر معالجة الصورة المحددة');
      setProofFile(null);
      setCompressionResult(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0 || !proofFile) return;

    const railConfig = PAYMENT_RAILS[depositRail];
    submitDeposit(
      {
        amount: amt,
        proofImage: proofFile,
        referenceId: railConfig.name,
      },
      {
        onSuccess: () => {
          setActiveForm('none');
          setProofFile(null);
          setCompressionResult(null);
          setDepositAmount('50');
        },
      }
    );
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0 || amt > withdrawableBalance) return;
    if (!withdrawFields.accountNumber.trim() || !withdrawFields.accountName.trim()) return;

    const railConfig = PAYMENT_RAILS[withdrawRail];
    submitWithdrawal(
      {
        amount: amt,
        payoutDetails: {
          bankName: railConfig.name,
          accountNumber: withdrawFields.accountNumber.trim(),
          accountName: withdrawFields.accountName.trim(),
          notes: [withdrawFields.bankBranch ? `الفرع: ${withdrawFields.bankBranch}` : '', withdrawFields.notes]
            .filter(Boolean)
            .join(' - '),
        },
      },
      {
        onSuccess: () => {
          setActiveForm('none');
          setWithdrawAmount('50');
          setWithdrawFields({
            accountNumber: user?.phone || '',
            accountName: user?.name || '',
            bankBranch: '',
            notes: '',
          });
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
      <div className="max-w-md mx-auto my-16 p-8 bg-brand-card rounded-[14px] border border-brand-border text-center font-almarai shadow-2xs space-y-4">
        <div className="w-14 h-14 rounded-[12px] bg-brand-surface text-brand-primary border border-brand-border flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-brand-dark">
          محفظة سَدِيم الرقمية
        </h2>
        <p className="text-xs text-brand-muted leading-relaxed">
          يرجى تسجيل الدخول إلى حسابك لإدارة رصيدك المالي، شحن المحفظة، ومتابعة حركات الدفع الفوري في المحافظة الوسطى.
        </p>
        <Link
          href="/auth/login?redirect=/account/wallet"
          className="inline-flex items-center justify-center w-full h-11 rounded-[8px] bg-brand-primary text-white text-xs font-black shadow-xs hover:bg-brand-primary-hover active:scale-95 transition-all no-underline"
        >
          تسجيل الدخول إلى حسابك
        </Link>
      </div>
    );
  }

  return (
    <main className="w-full max-w-[1240px] mx-auto px-4 py-5 sm:py-7 font-almarai text-right space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-3 border-b border-brand-border/60 pb-3.5">
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-brand-primary block">
            حسابي
          </span>
          <h1 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight m-0">
            محفظة سَدِيم الرقمية
          </h1>
        </div>

        <Link
          href="/account"
          className="text-xs font-bold text-brand-muted hover:text-brand-dark py-2 px-3.5 rounded-[8px] border border-brand-border bg-brand-card shadow-2xs transition-colors no-underline flex items-center gap-1.5 active:scale-95"
        >
          <span>←</span>
          <span>العودة لحسابي</span>
        </Link>
      </div>

      {/* 12-Column Symmetrical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT HUB: Hero Balance (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Cosmic Luxury Balance Hero Card */}
          <div className="bg-gradient-to-br from-[#1C1917] via-[#241F1B] to-[#2B231D] text-white rounded-[14px] p-5 sm:p-7 shadow-xl space-y-5 relative overflow-hidden border border-white/10">
            {/* Subtle Ambient Cosmic Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-brand-trust/20 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

            <div className="flex items-center justify-between relative z-10 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-[8px] bg-white/10 border border-white/10 flex items-center justify-center text-sm shadow-xs text-brand-gold">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                  </svg>
                </span>
                <span className="text-xs font-bold text-white/90">
                  رصيد المحفظة
                </span>
              </div>

              {hasPending && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  تحديث فوري نشط
                </span>
              )}
            </div>

            {/* Live Grand Total Balance */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-white">
                  {isLoadingWallet ? '...' : totalBalance.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-brand-gold">₪ شيكل</span>
              </div>

              {/* Balance Breakdown Disambiguation Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/80">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-[6px] border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>قابل للسحب:</span>
                  <strong className="text-white font-mono">{withdrawableBalance.toFixed(2)} ₪</strong>
                </span>

                {storeCreditBalance > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-[6px] border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>رصيد المشتريات:</span>
                    <strong className="text-brand-gold font-mono">{storeCreditBalance.toFixed(2)} ₪</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons for Thumb Comfort */}
            <div className="pt-2 flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setActiveForm('deposit')}
                className="flex-1 h-11 sm:h-12 rounded-[8px] bg-brand-primary text-white hover:bg-brand-primary-hover font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <span>+</span>
                <span>شحن المحفظة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveForm('withdraw')}
                className="h-11 sm:h-12 px-6 rounded-[8px] bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>سحب كاش</span>
              </button>
            </div>
          </div>
        </div>

        {/* LEFT HUB: Live Pending Status + Compact Transaction History Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* ACTIVE PENDING NOTIFICATION BANNER */}
          {hasPending && (
            <div className="rounded-[14px] p-4 bg-amber-50 border border-amber-200/80 shadow-xs flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-2">
                    <span>
                      طلب {pendingTransactions[0].type === 'deposit' ? 'شحن رصيد' : 'سحب نقدي'} بقيمة{' '}
                      <strong className="font-mono">{pendingTransactions[0].amount} ₪</strong> قيد التدقيق لدى الإدارة
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 m-0 mt-0.5">
                    سيُحدّث الرصيد تلقائياً فور اعتماد العملية من الإدارة.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedTransaction(pendingTransactions[0])}
                className="px-3.5 py-1.5 rounded-[8px] bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 text-xs font-black shrink-0 transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>معاينة الإشعار أو الإلغاء</span>
                <span>←</span>
              </button>
            </div>
          )}

          {/* Transactions Ledger History with Controlled Footprint */}
          <div className="bg-brand-card rounded-[14px] border border-brand-border p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 flex-wrap gap-2">
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-black text-brand-dark m-0">
                  سجل العمليات والحركات المالية
                </h3>
                <span className="text-[11px] text-brand-muted block">
                  اضغط على أي عملية لعرض تفاصيل الإيصال، سبب الرفض، أو إلغاء الطلب المعلق
                </span>
              </div>

              {/* Quick Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-brand-surface rounded-[8px] border border-brand-border">
                <button
                  type="button"
                  onClick={() => setTxFilter('all')}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-black transition-all cursor-pointer ${
                    txFilter === 'all'
                      ? 'bg-brand-dark text-white shadow-2xs'
                      : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  الكل ({transactions.length})
                </button>

                <button
                  type="button"
                  onClick={() => setTxFilter('pending')}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                    txFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  <span>قيد التدقيق</span>
                  {pendingTransactions.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center leading-none">
                      {pendingTransactions.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTxFilter('deposit')}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-black transition-all cursor-pointer ${
                    txFilter === 'deposit'
                      ? 'bg-brand-dark text-white shadow-2xs'
                      : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  إيداع ({depositsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setTxFilter('withdrawal')}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-black transition-all cursor-pointer ${
                    txFilter === 'withdrawal'
                      ? 'bg-brand-dark text-white shadow-2xs'
                      : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  سحب ({withdrawalsCount})
                </button>
              </div>
            </div>

            {isLoadingTx ? (
              <div className="py-10 text-center text-xs font-bold text-brand-muted">
                <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                جارٍ تحميل سجل المعاملات...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mx-auto text-brand-muted">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <p className="text-xs font-black text-brand-dark m-0">
                  {txFilter === 'pending'
                    ? 'لا توجد طلبات معلقة حالياً'
                    : txFilter === 'deposit'
                    ? 'لا توجد عمليات إيداع مسجلة'
                    : txFilter === 'withdrawal'
                    ? 'لا توجد عمليات سحب مسجلة'
                    : 'لا توجد حركات مالية مسجلة بعد'}
                </p>
                <p className="text-[11px] text-brand-muted max-w-xs mx-auto m-0">
                  {txFilter === 'all'
                    ? 'عند شحن محفظتك أو إتمام طلبات الشراء، ستظهر كافة المعاملات بالتفصيل هنا.'
                    : 'يمكنك التبديل إلى تبويب "الكل" لاستعراض كافة العمليات السابقة.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedTransactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  const isWithdrawal = tx.type === 'withdrawal';
                  const isPurchase = tx.type === 'purchase';
                  const isApproved = tx.status === 'approved';
                  const isPending = tx.status === 'pending';
                  const isRejected = tx.status === 'rejected';

                  return (
                    <div
                      key={tx._id}
                      onClick={() => setInspectedTransaction(tx)}
                      className="py-2.5 px-3 rounded-[8px] bg-brand-surface/40 hover:bg-brand-surface border border-brand-border/40 hover:border-brand-border transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs border ${
                            isDeposit
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : isWithdrawal
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {isDeposit ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <polyline points="19 12 12 19 5 12" />
                            </svg>
                          ) : isWithdrawal ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="19" x2="12" y2="5" />
                              <polyline points="5 12 12 5 19 12" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-brand-dark group-hover:text-brand-primary transition-colors truncate">
                              {isDeposit ? 'شحن رصيد' : isWithdrawal ? 'طلب سحب نقدي' : isPurchase ? 'شراء من المتجر' : tx.type}
                            </span>

                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                isApproved
                                  ? 'bg-brand-trust-soft text-brand-trust border border-[var(--brand-trust-border)]'
                                  : isPending
                                  ? 'bg-amber-500/10 text-amber-800 border border-amber-500/30'
                                  : isRejected
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}
                            >
                              {isApproved ? 'معتمدة' : isPending ? 'قيد التدقيق' : isRejected ? 'مرفوضة' : tx.status}
                            </span>

                            {tx.referenceId && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-surface border border-brand-border text-brand-dark truncate max-w-[130px]">
                                {tx.referenceId}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-brand-muted block font-medium">
                            {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-left space-y-0.5 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black font-mono block ${
                            isDeposit ? 'text-brand-trust' : 'text-brand-dark'
                          }`}
                        >
                          {isDeposit ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`} ₪
                        </span>
                        {tx.requestedAmount && tx.requestedAmount !== tx.amount && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 block text-center">
                            مصحح ({tx.requestedAmount} ₪)
                          </span>
                        )}
                        <span className="text-[9px] text-brand-muted block group-hover:text-brand-primary transition-colors">
                          التفاصيل ←
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Ledger Compression / Expansion Toggle */}
                {filteredTransactions.length > 5 && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] bg-brand-surface border border-brand-border hover:bg-brand-card text-xs font-bold text-brand-dark transition-all cursor-pointer active:scale-95 shadow-2xs"
                    >
                      {isLedgerExpanded ? (
                        <>
                          <span>عرض أحدث 5 حركات فقط</span>
                          <span>↑</span>
                        </>
                      ) : (
                        <>
                          <span>عرض كافة الحركات السابقة ({filteredTransactions.length})</span>
                          <span>↓</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Charter & Operations Support Card - At Bottom of Page */}
      <div className="bg-brand-card rounded-[14px] border border-brand-border p-4 sm:p-5 shadow-2xs space-y-3 mt-4">
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-[8px] bg-brand-surface text-brand-trust border border-brand-border flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <div>
              <h4 className="text-xs font-black text-brand-dark m-0">
                ميثاق المعاملات المالية الموثوقة في غزة
              </h4>
              <p className="text-[10px] text-brand-muted m-0">
                ضمانات الأمان المالي ورصيد العمليات في المحافظة الوسطى
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/970590000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B3%D9%8E%D8%AF%D9%8A%D9%85%D8%8C%20%D9%84%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%AD%D9%88%D9%84%20%D8%B1%D8%B5%D9%8A%D8%AF%20%D8%A7%D9%84%D9%85%D8%AD%D9%81%D8%B8%D8%A9"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 rounded-[6px] bg-brand-surface border border-brand-border text-brand-dark hover:text-brand-primary text-xs font-bold flex items-center gap-1.5 transition-colors no-underline active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>محادثة منسق العمليات (واتساب)</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-brand-dark pt-1">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="leading-relaxed">
              <strong className="font-bold">حق الفحص عند الباب:</strong> عاين وافحص طلبك قبل دفع أي مبالغ نقدية.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="leading-relaxed">
              <strong className="font-bold">استرداد فوري للمحفظة:</strong> في حال الاسترجاع أو الاستبدال، يعاد المبلغ فورياً لمحفظتك.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="leading-relaxed">
              <strong className="font-bold">طرد موحد برسم 8 ₪:</strong> تجمع كافة مشترياتك في شحنة واحدة بأجر توصيل ثابت.
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          APPLE-STYLE BOTTOM SHEET / MODAL: DEPOSIT & TOP-UP FLOW
          ===================================================================== */}
      {activeForm === 'deposit' && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setActiveForm('none')}
          />
          <div className="relative z-10 w-full sm:max-w-lg bg-brand-card rounded-t-[20px] sm:rounded-[16px] border border-brand-border shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-right font-almarai overflow-hidden">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-brand-border rounded-full mx-auto my-2 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-border/60 px-4 sm:px-6 py-3 shrink-0">
              <h3 className="text-sm sm:text-base font-black text-brand-dark m-0">
                شحن المحفظة
              </h3>
              <button
                type="button"
                onClick={() => setActiveForm('none')}
                className="w-7 h-7 rounded-[6px] border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="إغلاق"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-3.5">
              {/* Payment Rails Selector */}
              <PaymentRailSelector
                selectedRail={depositRail}
                onSelect={setDepositRail}
                label="وسيلة التحويل:"
              />

              {/* Selected Provider Official Sadeem Account */}
              <DepositAccountCard railId={depositRail} />

              {/* Deposit Form Fields */}
              <form id="deposit-form" onSubmit={handleDepositSubmit} className="space-y-3.5">
                {/* Amount Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-brand-dark">
                      المبلغ المحول (شيكل) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-brand-muted">
                      أدخل نفس القيمة الموجودة بالإشعار
                    </span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex items-center gap-2">
                    {QUICK_AMOUNTS.map((amt) => {
                      const isSelected = depositAmount === String(amt);
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(String(amt))}
                          className={`flex-1 h-9 rounded-[8px] text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                            isSelected
                              ? 'border-2 border-brand-primary bg-[var(--brand-primary-soft)] text-brand-primary font-black shadow-2xs'
                              : 'border border-brand-border bg-brand-card text-brand-dark hover:border-brand-primary/50 shadow-2xs'
                          }`}
                        >
                          {amt} ₪
                        </button>
                      );
                    })}
                  </div>

                  {/* Prominent Custom Amount Input */}
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="5"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="أو أدخل مبلغاً آخر..."
                      required
                      className="w-full h-12 pr-4 pl-12 text-base font-black font-mono rounded-[8px] border-2 border-brand-border bg-brand-card text-brand-dark placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all shadow-2xs"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-[6px] bg-brand-surface border border-brand-border text-xs font-black text-brand-dark pointer-events-none">
                      ₪
                    </div>
                  </div>
                </div>

                {/* Receipt Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-brand-dark">
                      صورة إشعار أو وصل التحويل <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-brand-muted">
                      لقطة شاشة أو صورة الإيصال
                    </span>
                  </div>

                  <div>
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {isCompressing ? (
                      <div className="border-2 border-dashed border-brand-border rounded-[10px] p-5 text-center bg-brand-surface/60">
                        <div className="py-2 text-xs font-bold text-brand-muted flex items-center justify-center gap-2.5">
                          <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          <span>جارٍ فحص وتحسين صورة الإشعار...</span>
                        </div>
                      </div>
                    ) : compressionResult ? (
                      <div className="border border-brand-border rounded-[10px] p-3 bg-brand-card shadow-2xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail with Click-to-preview */}
                          <div
                            onClick={() => setReceiptPreviewOpen(true)}
                            className="relative w-14 h-14 rounded-[8px] border border-brand-border overflow-hidden bg-stone-900 shrink-0 cursor-pointer hover:opacity-95 transition-opacity group shadow-2xs"
                            title="انقر لمعاينة الإشعار"
                          >
                            <img
                              src={compressionResult.previewUrl}
                              alt="صورة الإشعار"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              </svg>
                            </div>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-black text-brand-dark">
                              <svg className="w-4 h-4 text-brand-trust stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>تم إرفاق الإشعار بنجاح</span>
                            </div>
                            <span className="text-[11px] text-brand-muted block font-medium">
                              انقر على الصورة أو زر المعاينة للتأكد
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setReceiptPreviewOpen(true)}
                            className="h-8 px-3 rounded-[6px] bg-brand-surface border border-brand-border hover:border-brand-primary text-xs font-bold text-brand-primary transition-all cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span>معاينة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 px-2.5 rounded-[6px] text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors cursor-pointer"
                          >
                            تغيير
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-brand-border hover:border-brand-primary rounded-[10px] p-5 text-center bg-brand-surface/40 hover:bg-brand-surface transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-card border border-brand-border/80 flex items-center justify-center text-brand-primary shadow-2xs mx-auto mb-2 group-hover:scale-105 transition-transform">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <span className="text-xs font-black text-brand-dark block">
                          اضغط هنا لإرفاق صورة الإشعار
                        </span>
                        <span className="text-[11px] text-brand-muted block mt-0.5">
                          يقبل لقطات الشاشة أو الصور (PNG أو JPG)
                        </span>
                      </div>
                    )}
                  </div>

                  {compressionError && (
                    <p className="text-xs text-red-600 font-medium m-0">{compressionError}</p>
                  )}
                </div>
              </form>
            </div>

            {/* Sticky Footer: Submit Button is ALWAYS visible on mobile & desktop */}
            <div className="sticky bottom-0 bg-brand-card/98 backdrop-blur-md px-4 sm:px-6 py-3 border-t border-brand-border/60 z-20 shrink-0">
              <button
                type="submit"
                form="deposit-form"
                disabled={isSubmittingDeposit || isCompressing || !proofFile}
                className="w-full h-11 rounded-[8px] bg-brand-primary text-white text-xs sm:text-sm font-black shadow-md hover:bg-brand-primary-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingDeposit ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ إرسال طلب الشحن...</span>
                  </>
                ) : (
                  <span>إرسال طلب الشحن</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          APPLE-STYLE BOTTOM SHEET / MODAL: CASH WITHDRAWAL FLOW
          ===================================================================== */}
      {activeForm === 'withdraw' && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setActiveForm('none')}
          />
          <div className="relative z-10 w-full sm:max-w-lg bg-brand-card rounded-t-[20px] sm:rounded-[16px] border border-brand-border shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-right font-almarai overflow-hidden">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-brand-border rounded-full mx-auto my-2 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-border/60 px-4 sm:px-6 py-3 shrink-0">
              <h3 className="text-sm sm:text-base font-black text-brand-dark m-0">
                سحب نقدي
              </h3>
              <button
                type="button"
                onClick={() => setActiveForm('none')}
                className="w-7 h-7 rounded-[6px] border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="إغلاق"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-3.5">
              {/* Payment Rails Selector for Payout */}
              <PaymentRailSelector
                selectedRail={withdrawRail}
                onSelect={setWithdrawRail}
                label="وسيلة الاستلام:"
              />

              <form id="withdraw-form" onSubmit={handleWithdrawSubmit} className="space-y-3.5">
                {/* Dynamic Withdrawal Inputs */}
                <div className="bg-brand-surface rounded-[8px] border border-brand-border p-3 sm:p-4">
                  <WithdrawalChannelFields
                    railId={withdrawRail}
                    fields={withdrawFields}
                    onChange={(up) => setWithdrawFields((prev) => ({ ...prev, ...up }))}
                    disabled={isSubmittingWithdrawal}
                  />
                </div>

                {/* Withdraw Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-brand-dark">
                      المبلغ المراد سحبه (شيكل) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-brand-muted">المتاح:</span>
                      <strong className="text-brand-trust font-mono font-black">{withdrawableBalance.toFixed(2)} ₪</strong>
                      {withdrawableBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(String(withdrawableBalance))}
                          className="text-[10px] font-bold text-brand-primary hover:underline cursor-pointer mr-1"
                        >
                          (سحب الكل)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="10"
                      max={withdrawableBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full h-12 pr-4 pl-12 text-base font-black font-mono rounded-[8px] border-2 border-brand-border bg-brand-card text-brand-dark placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 transition-all shadow-2xs"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-[6px] bg-brand-surface border border-brand-border text-xs font-black text-brand-dark pointer-events-none">
                      ₪
                    </div>
                  </div>

                  {parseFloat(withdrawAmount) > withdrawableBalance && (
                    <p className="text-xs text-red-600 font-bold m-0">
                      المبلغ المطلوب يتجاوز رصيدك القابل للسحب حالياً.
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Sticky Footer: Submit Button is ALWAYS visible on mobile & desktop */}
            <div className="sticky bottom-0 bg-brand-card/98 backdrop-blur-md px-4 sm:px-6 py-3 border-t border-brand-border/60 z-20 shrink-0">
              <button
                type="submit"
                form="withdraw-form"
                disabled={
                  isSubmittingWithdrawal ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > withdrawableBalance ||
                  !withdrawFields.accountNumber.trim()
                }
                className="w-full h-11 rounded-[8px] bg-brand-primary text-white text-xs sm:text-sm font-black shadow-md hover:bg-brand-primary-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingWithdrawal ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ إرسال طلب السحب...</span>
                  </>
                ) : (
                  <span>تأكيد طلب السحب</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Receipt Preview Modal (During Deposit Form) */}
      {receiptPreviewOpen && compressionResult && (
        <ReceiptPreviewModal
          isOpen={receiptPreviewOpen}
          onClose={() => setReceiptPreviewOpen(false)}
          imageUrl={compressionResult.previewUrl}
          originalSize={compressionResult.originalSizeBytes}
          compressedSize={compressionResult.compressedSizeBytes}
          savedPercentage={compressionResult.savedPercentage}
          title="معاينة إيصال التحويل قبل الإرسال"
        />
      )}

      {/* Transaction Details Sheet / Drawer */}
      {inspectedTransaction && (
        <TransactionDetailDrawer
          transaction={inspectedTransaction}
          onClose={() => setInspectedTransaction(null)}
          onCancelTransaction={(id) => {
            cancelTransaction(id, {
              onSuccess: () => setInspectedTransaction(null),
            });
          }}
          isCancelling={isCancelling}
        />
      )}
    </main>
  );
}
