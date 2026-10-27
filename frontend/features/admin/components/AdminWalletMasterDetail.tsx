'use client';

import React, { useState, useEffect } from 'react';
import type { AdminWalletTransactionItem } from '../types/admin.types';
import { AdminWalletRejectModal } from './AdminWalletRejectModal';

interface AdminWalletMasterDetailProps {
  pendingTransactions: AdminWalletTransactionItem[];
  onApproveDeposit: (id: string, amount?: number) => void;
  onRejectDeposit: (id: string, reason: string) => void;
  onApproveWithdrawal: (id: string, reference?: string) => void;
  onRejectWithdrawal: (id: string, reason: string) => void;
  isBusy?: boolean;
}

export const AdminWalletMasterDetail: React.FC<AdminWalletMasterDetailProps> = ({
  pendingTransactions,
  onApproveDeposit,
  onRejectDeposit,
  onApproveWithdrawal,
  onRejectWithdrawal,
  isBusy = false,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [correctedAmount, setCorrectedAmount] = useState<string>('');
  const [payoutRef, setPayoutRef] = useState<string>('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [itemToReject, setItemToReject] = useState<AdminWalletTransactionItem | null>(null);

  // Filter list
  const filteredItems = pendingTransactions.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = item.userId?.name?.toLowerCase() || '';
    const phone = item.userId?.phoneNumber?.toLowerCase() || '';
    const id = item._id.toLowerCase();
    return name.includes(q) || phone.includes(q) || id.includes(q);
  });

  // Keep selectedId valid
  useEffect(() => {
    if (filteredItems.length > 0) {
      if (!selectedId || !filteredItems.some((i) => i._id === selectedId)) {
        setSelectedId(filteredItems[0]._id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredItems, selectedId]);

  const selectedItem = filteredItems.find((i) => i._id === selectedId) || null;

  // Reset inputs when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      const initialAmt = selectedItem.amount || selectedItem.requestedAmount || 0;
      setCorrectedAmount(String(initialAmt));
      setPayoutRef('');
    }
  }, [selectedItem?._id]);

  const advanceToNext = () => {
    const currentIndex = filteredItems.findIndex((i) => i._id === selectedId);
    if (currentIndex !== -1 && currentIndex < filteredItems.length - 1) {
      setSelectedId(filteredItems[currentIndex + 1]._id);
    } else if (filteredItems.length > 1) {
      setSelectedId(filteredItems[0]._id);
    } else {
      setSelectedId(null);
    }
  };

  const handleApprove = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'deposit') {
      const parsed = Number(correctedAmount);
      onApproveDeposit(selectedItem._id, !isNaN(parsed) && parsed > 0 ? parsed : undefined);
    } else {
      onApproveWithdrawal(selectedItem._id, payoutRef.trim() || undefined);
    }
    advanceToNext();
  };

  const handleConfirmReject = (reason: string) => {
    if (!itemToReject) return;
    if (itemToReject.type === 'deposit') {
      onRejectDeposit(itemToReject._id, reason);
    } else {
      onRejectWithdrawal(itemToReject._id, reason);
    }
    setItemToReject(null);
    advanceToNext();
  };

  if (pendingTransactions.length === 0) {
    return (
      <div className="bg-brand-card rounded-2xl border border-brand-border p-12 text-center space-y-3 shadow-2xs font-almarai">
        <div className="w-16 h-16 rounded-2xl bg-brand-trust-soft text-brand-trust border border-[var(--brand-trust-border)] flex items-center justify-center mx-auto shadow-2xs">
          <svg className="w-8 h-8 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-black text-brand-dark">
          كافة العمليات المالية مدققة ومكتملة
        </h3>
        <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
          لا توجد حالياً أي طلبات شحن رصيد أو سحب معلقة بانتظار المراجعة. يتم تحديث القائمة تلقائياً فور وصول إشعار جديد.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-almarai text-right">
      {/* =====================================================================
          RIGHT PANE: Master List of Pending Requests (5 cols)
          ===================================================================== */}
      <div className="lg:col-span-5 bg-brand-card rounded-2xl border border-brand-border shadow-2xs overflow-hidden flex flex-col max-h-[820px]">
        {/* List Header & Search */}
        <div className="p-4 border-b border-brand-border/70 space-y-3 bg-brand-surface/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-brand-dark">
              قائمة الطلبات المعلقة ({filteredItems.length})
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20">
              تنتظر التدقيق
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو رقم الهاتف..."
              className="w-full h-9 pr-8 pl-3 text-xs font-medium rounded-xl border border-brand-border bg-brand-card text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-primary transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-brand-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-brand-dark text-white'
                  : 'bg-brand-card text-brand-muted hover:text-brand-dark border border-brand-border'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setFilterType('deposit')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'deposit'
                  ? 'bg-brand-dark text-white'
                  : 'bg-brand-card text-brand-muted hover:text-brand-dark border border-brand-border'
              }`}
            >
              إيداع وشحن
            </button>
            <button
              type="button"
              onClick={() => setFilterType('withdrawal')}
              className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'withdrawal'
                  ? 'bg-brand-dark text-white'
                  : 'bg-brand-card text-brand-muted hover:text-brand-dark border border-brand-border'
              }`}
            >
              سحب رصيد
            </button>
          </div>
        </div>

        {/* Scrollable Items */}
        <div className="overflow-y-auto divide-y divide-brand-border/50 flex-1">
          {filteredItems.map((item) => {
            const isSelected = item._id === selectedId;
            const isDeposit = item.type === 'deposit';
            const displayAmount = item.amount || item.requestedAmount || 0;
            const dateStr = new Date(item.createdAt).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item._id}
                onClick={() => setSelectedId(item._id)}
                className={`p-3.5 transition-all cursor-pointer select-none space-y-2 ${
                  isSelected
                    ? 'bg-brand-primary-soft/40 border-r-4 border-r-brand-primary'
                    : 'hover:bg-brand-surface/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-brand-dark truncate">
                        {item.userId?.name || 'زبون سَدِيم'}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          isDeposit
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isDeposit ? 'إيداع' : 'سحب'}
                      </span>
                    </div>
                    <span className="text-[10px] text-brand-muted block font-mono dir-ltr text-right">
                      {item.userId?.phoneNumber || 'بدون هاتف'}
                    </span>
                  </div>

                  <div className="text-left shrink-0">
                    <span
                      className={`text-xs font-black block ${
                        isDeposit ? 'text-brand-trust' : 'text-brand-dark'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}{displayAmount} ₪
                    </span>
                    <span className="text-[9px] text-brand-muted block">
                      {dateStr}
                    </span>
                  </div>
                </div>

                {isDeposit && item.proofImage && (
                  <div className="flex items-center gap-1 text-[10px] text-brand-primary font-bold">
                    <span>📎 يتوفر إشعار تحويل مرفق</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          LEFT PANE: Interactive Detail Inspector (7 cols)
          ===================================================================== */}
      <div className="lg:col-span-7 bg-brand-card rounded-2xl border border-brand-border p-6 shadow-2xs space-y-5">
        {selectedItem ? (
          <>
            {/* Top Inspector Header */}
            <div className="flex items-start justify-between border-b border-brand-border/60 pb-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-brand-dark">
                    {selectedItem.userId?.name || 'زبون سَدِيم'}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      selectedItem.type === 'deposit'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {selectedItem.type === 'deposit' ? 'طلب شحن محفظة' : 'طلب سحب رصيد'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-brand-muted">
                  <span>هاتف: {selectedItem.userId?.phoneNumber || 'غير متوفر'}</span>
                  {selectedItem.userId?.email && <span>• بريد: {selectedItem.userId.email}</span>}
                </div>
              </div>

              <div className="text-left shrink-0">
                <span className="text-[10px] text-brand-muted block">معرف المعاملة</span>
                <span className="text-[11px] font-mono text-brand-dark block dir-ltr">
                  #{selectedItem._id.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Proof of Transfer / Lightbox */}
            {selectedItem.type === 'deposit' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-dark">
                    إشعار التحويل البنكي / جوال باي
                  </label>
                  {selectedItem.proofImage && (
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                      <span>تكبير الإشعار</span>
                    </button>
                  )}
                </div>

                {selectedItem.proofImage ? (
                  <div
                    onClick={() => setIsZoomOpen(true)}
                    className="relative rounded-2xl overflow-hidden border border-brand-border bg-stone-900 group cursor-zoom-in max-h-72 flex items-center justify-center shadow-inner"
                  >
                    <img
                      src={selectedItem.proofImage}
                      alt="إشعار التحويل المالي"
                      className="max-h-72 w-auto object-contain transition-transform group-hover:scale-102 duration-200"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                      <span>انقر للتكبير الرقمي</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border text-center text-xs text-brand-muted">
                    لم يتم إرفاق صورة إشعار بهذا الطلب
                  </div>
                )}
              </div>
            )}

            {/* Payout Details for Withdrawals */}
            {selectedItem.type === 'withdrawal' && (
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
                <span className="text-xs font-bold text-brand-dark block">
                  بيانات وجهة سحب الرصيد
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-brand-muted block">وسيلة السحب</span>
                    <span className="font-bold text-brand-dark">
                      {selectedItem.payoutDetails?.method || 'محفظة جوال باي'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-muted block">رقم الحساب / الهاتف</span>
                    <span className="font-mono font-bold text-brand-dark dir-ltr block text-right">
                      {selectedItem.payoutDetails?.accountNumber || selectedItem.userId?.phoneNumber || 'غير محدد'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-brand-border/60">
                  <label className="text-[11px] font-bold text-brand-dark block">
                    مرجع الحوالة البنكية الصادرة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="رقم عملية التحويل في جوال باي / البنك..."
                    className="w-full h-9 px-3 rounded-xl border border-brand-border bg-brand-card text-xs font-medium text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            )}

            {/* Amount Verification / Correction Field */}
            <div className="space-y-1.5 p-4 rounded-xl bg-brand-surface/70 border border-brand-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-brand-dark">
                  المبلغ المعتمد للإيداع (شيكل)
                </label>
                <span className="text-[10px] text-brand-muted">
                  المدعى بالطلب: {selectedItem.amount || selectedItem.requestedAmount} ₪
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={correctedAmount}
                  onChange={(e) => setCorrectedAmount(e.target.value)}
                  className="w-full h-11 pr-4 pl-10 text-base font-black rounded-xl border border-brand-border bg-brand-card text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted pointer-events-none">
                  ₪
                </span>
              </div>
              {Number(correctedAmount) !== (selectedItem.amount || selectedItem.requestedAmount) && (
                <p className="text-[11px] font-bold text-amber-800">
                  ⚠️ سيتم اعتماد مبلغ مصحح ({correctedAmount} ₪) بدلاً من المبلغ المطلوب أصلاً.
                </p>
              )}
            </div>

            {/* Decision Actions Bar */}
            <div className="pt-3 border-t border-brand-border/60 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setItemToReject(selectedItem)}
                disabled={isBusy}
                className="h-11 px-5 rounded-xl border border-brand-border text-xs font-bold text-brand-muted hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer disabled:opacity-40"
              >
                رفض الطلب
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isBusy || Number(correctedAmount) <= 0}
                className="flex-1 h-11 rounded-xl bg-brand-trust text-white text-xs font-black hover:bg-emerald-800 active:scale-98 transition-all cursor-pointer shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  {selectedItem.type === 'deposit'
                    ? `اعتماد وشحن ${correctedAmount} ₪ في المحفظة`
                    : `اعتماد سحب ${correctedAmount} ₪`}
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="py-24 text-center text-xs text-brand-muted">
            حدد طلباً من القائمة لمعاينته وتدقيقه
          </div>
        )}
      </div>

      {/* Lightbox Image Modal */}
      {isZoomOpen && selectedItem?.proofImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold hover:bg-black transition-colors cursor-pointer z-10"
            >
              ✕
            </button>
            <img
              src={selectedItem.proofImage}
              alt="إشعار التحويل بحجم كامل"
              className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      <AdminWalletRejectModal
        isOpen={Boolean(itemToReject)}
        onClose={() => setItemToReject(null)}
        onConfirm={handleConfirmReject}
        transactionTitle={
          itemToReject
            ? `طلب ${itemToReject.type === 'deposit' ? 'إيداع' : 'سحب'} بقيمة ${
                itemToReject.amount || itemToReject.requestedAmount
              } ₪ للزبون ${itemToReject.userId?.name || ''}`
            : ''
        }
        isSubmitting={isBusy}
      />
    </div>
  );
};
