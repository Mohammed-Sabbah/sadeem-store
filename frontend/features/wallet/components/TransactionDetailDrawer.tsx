'use client';

import React, { useState, useEffect } from 'react';
import type { WalletTransactionItem } from '../types/wallet.types';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';

interface TransactionDetailDrawerProps {
  transaction: WalletTransactionItem | null;
  onClose: () => void;
  onCancelTransaction: (id: string) => void;
  isCancelling?: boolean;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  onClose,
  onCancelTransaction,
  isCancelling = false,
}) => {
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    if (!transaction) {
      setConfirmCancelOpen(false);
      setReceiptModalOpen(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const isDeposit = transaction.type === 'deposit';
  const isWithdrawal = transaction.type === 'withdrawal';
  const isPending = transaction.status === 'pending';
  const isRejected = transaction.status === 'rejected';
  const isApproved = transaction.status === 'approved';
  const isCancelled = transaction.status === 'cancelled';

  const handleConfirmCancel = () => {
    onCancelTransaction(transaction._id);
    setConfirmCancelOpen(false);
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-almarai text-right"
        onClick={onClose}
      >
        <div
          className="bg-brand-card rounded-t-3xl sm:rounded-2xl border-t sm:border border-brand-border shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Indicator */}
          <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 mx-auto mt-3 mb-1 sm:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-border">
            <div className="space-y-0.5">
              <span className="text-[11px] text-brand-muted block font-medium">
                تفاصيل العملية المالية
              </span>
              <h3 className="text-base font-black text-brand-dark m-0">
                {isDeposit ? 'طلب شحن محفظة (إيداع)' : isWithdrawal ? 'طلب سحب نقدي' : 'حركة مالية'}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark flex items-center justify-center transition-all cursor-pointer active:scale-90"
              title="إغلاق"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Amount & Status Card */}
            <div className="bg-brand-surface rounded-2xl border border-brand-border p-4 text-center space-y-2">
              <span className="text-xs text-brand-muted block font-medium">
                المبلغ المحدد في العملية
              </span>
              <div className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">
                {transaction.amount} <span className="text-base font-bold text-brand-primary">₪</span>
              </div>

              {transaction.requestedAmount && transaction.requestedAmount !== transaction.amount && (
                <div className="text-[11px] font-bold text-amber-900 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg inline-block text-right">
                  تم تصحيح واعتماد المبلغ من قِبل إدارة سَدِيم (المبلغ المدخل عند الطلب: {transaction.requestedAmount} ₪)
                </div>
              )}

              {/* Status Badge */}
              <div className="pt-1">
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/30 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    قيد مراجعة وتدقيق الإدارة
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-trust-soft text-brand-trust border border-[var(--brand-trust-border)] text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-brand-trust" />
                    معتمدة ومكتملة بنجاح
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-700 border border-red-500/30 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    تم رفض الطلب
                  </span>
                )}
                {isCancelled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200 text-stone-700 border border-stone-300 text-xs font-bold">
                    ملغاة ذاتياً
                  </span>
                )}
              </div>
            </div>

            {/* Rejection Reason Alert if rejected */}
            {isRejected && (
              <div className="bg-red-50/80 border border-red-200/80 rounded-xl p-3.5 space-y-1">
                <span className="text-xs font-black text-red-900 block">
                  سبب رفض المعاملة من قِبل المدقق المالي:
                </span>
                <p className="text-xs text-red-800 leading-relaxed m-0 font-medium">
                  {transaction.rejectReason || 'لم يتم إرفاق تفاصيل إضافية للرفض. يرجى التواصل مع الدعم الفني للمزيد.'}
                </p>
              </div>
            )}

            {/* Payout Reference if Approved Withdrawal */}
            {isWithdrawal && transaction.referenceId && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-bold">رقم الحوالة المرجعي:</span>
                <span className="font-mono font-black text-emerald-950 dir-ltr">{transaction.referenceId}</span>
              </div>
            )}

            {/* Key-Value Details List */}
            <div className="bg-brand-card rounded-xl border border-brand-border divide-y divide-brand-border/60 text-xs">
              {transaction.referenceId && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-brand-muted">
                    {isDeposit ? 'وسيلة / قناة التحويل' : 'رقم الحوالة المرجعي'}
                  </span>
                  <span className="font-bold text-brand-dark px-2.5 py-1 rounded-[6px] bg-brand-surface border border-brand-border shadow-2xs text-xs">
                    {transaction.referenceId}
                  </span>
                </div>
              )}
              <div className="p-3 flex items-center justify-between">
                <span className="text-brand-muted">رقم العملية الداخلي</span>
                <span className="font-mono text-brand-dark font-bold dir-ltr select-all text-[11px]">
                  {transaction._id}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-brand-muted">تاريخ الإنشاء</span>
                <span className="text-brand-dark font-bold">
                  {new Date(transaction.createdAt).toLocaleString('ar-EG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {transaction.reviewedAt && (
                <div className="p-3 flex items-center justify-between">
                  <span className="text-brand-muted">تاريخ التدقيق</span>
                  <span className="text-brand-dark font-bold">
                    {new Date(transaction.reviewedAt).toLocaleString('ar-EG', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              )}

              {/* Withdrawal Bank/Wallet details if present */}
              {isWithdrawal && transaction.payoutDetails && (
                <>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-brand-muted">الجهة المستفيدة</span>
                    <strong className="text-brand-dark font-bold">{transaction.payoutDetails.bankName}</strong>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-brand-muted">رقم الحساب / الهاتف</span>
                    <span className="font-mono font-bold text-brand-dark dir-ltr">{transaction.payoutDetails.accountNumber}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-brand-muted">اسم صاحب الحساب</span>
                    <span className="text-brand-dark font-bold">{transaction.payoutDetails.accountName}</span>
                  </div>
                </>
              )}
            </div>

            {/* Proof Receipt Thumbnail if Deposit */}
            {isDeposit && transaction.proofImage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-brand-dark">
                    إشعار التحويل المرفوع
                  </span>
                  <button
                    type="button"
                    onClick={() => setReceiptModalOpen(true)}
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>تكبير الإيصال</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </div>

                <div
                  onClick={() => setReceiptModalOpen(true)}
                  className="rounded-xl border border-brand-border bg-brand-surface p-2 cursor-pointer hover:border-brand-primary transition-colors flex items-center justify-center max-h-48 overflow-hidden group shadow-2xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={transaction.proofImage}
                    alt="إيصال التحويل المالي"
                    className="max-h-44 object-contain rounded-lg group-hover:scale-102 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Self Cancel Confirmation / Trigger for Pending */}
            {isPending && (
              <div className="pt-2">
                {!confirmCancelOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancelOpen(true)}
                    disabled={isCancelling}
                    className="w-full h-11 rounded-xl border border-red-200 text-red-600 hover:bg-red-50/70 text-xs font-black transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>إلغاء هذا الطلب واسترجاع المعاملة</span>
                  </button>
                ) : (
                  <div className="bg-red-50/90 rounded-2xl border border-red-200 p-4 space-y-3">
                    <div className="space-y-1">
                      <strong className="text-xs font-black text-red-950 block">
                        تأكيد إلغاء المعاملة المالية؟
                      </strong>
                      <p className="text-[11px] text-red-800 leading-relaxed m-0">
                        {isWithdrawal
                          ? 'سيتم إلغاء طلب السحب فوراً وإرجاع المبلغ المحجوز إلى رصيدك القابل للسحب دون أي خصومات.'
                          : 'سيتم إلغاء طلب الشحن وحذفه من قائمة مراجعة الإدارة.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                        className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
                      >
                        {isCancelling ? 'جاري الإلغاء...' : 'نعم، قم بالإلغاء الآن'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelOpen(false)}
                        disabled={isCancelling}
                        className="px-4 h-10 rounded-xl border border-brand-border bg-brand-card text-brand-dark text-xs font-bold hover:bg-brand-surface transition-all cursor-pointer active:scale-95"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Receipt Zoom Modal */}
      {receiptModalOpen && transaction.proofImage && (
        <ReceiptPreviewModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          imageUrl={transaction.proofImage}
          title={`إشعار التحويل - العملية #${transaction._id.substring(0, 8)}`}
        />
      )}
    </>
  );
};
