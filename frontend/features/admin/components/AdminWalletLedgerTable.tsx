'use client';

import React, { useState } from 'react';
import type { AdminWalletTransactionItem } from '../types/admin.types';

interface AdminWalletLedgerTableProps {
  transactions: AdminWalletTransactionItem[];
  isLoading?: boolean;
}

export const AdminWalletLedgerTable: React.FC<AdminWalletLedgerTableProps> = ({
  transactions,
  isLoading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProofImage, setActiveProofImage] = useState<string | null>(null);

  const filtered = transactions.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = t.userId?.name?.toLowerCase() || '';
    const phone = t.userId?.phoneNumber?.toLowerCase() || '';
    const id = t._id.toLowerCase();
    return name.includes(q) || phone.includes(q) || id.includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            معتمد
          </span>
        );
      case 'pending':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 animate-pulse">
            قيد المراجعة
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200">
            مرفوض
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
            ملغي
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-surface text-brand-muted">
            {status}
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return <span className="text-brand-trust font-black">إيداع وشحن</span>;
      case 'withdrawal':
        return <span className="text-brand-dark font-black">سحب رصيد</span>;
      case 'purchase':
        return <span className="text-stone-700 font-bold">دفع طلب</span>;
      case 'refund':
        return <span className="text-emerald-700 font-black">استرداد نقدي</span>;
      default:
        return <span className="text-brand-muted">{type}</span>;
    }
  };

  return (
    <div className="space-y-4 font-almarai text-right select-none">
      {/* Search and Filters Bar */}
      <div className="bg-brand-card rounded-[14px] border border-brand-border p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الزبون، الهاتف، أو معرف المعاملة..."
            className="w-full h-10 pr-9 pl-4 text-xs font-medium rounded-[8px] border border-brand-border bg-brand-surface text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-primary transition-all"
          />
          <svg
            className="w-4 h-4 text-brand-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-brand-dark text-white'
                    : 'bg-brand-surface text-brand-muted hover:text-brand-dark'
                }`}
              >
                {st === 'all' && 'كافة الحالات'}
                {st === 'pending' && 'معلقة'}
                {st === 'approved' && 'معتمدة'}
                {st === 'rejected' && 'مرفوضة'}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-brand-border hidden md:block mx-1" />

          {/* Type Filter */}
          <div className="flex items-center gap-1">
            {['all', 'deposit', 'withdrawal'].map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTypeFilter(tp)}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  typeFilter === tp
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-surface text-brand-muted hover:text-brand-dark'
                }`}
              >
                {tp === 'all' && 'كافة العمليات'}
                {tp === 'deposit' && 'إيداع'}
                {tp === 'withdrawal' && 'سحب'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-brand-card rounded-[14px] border border-brand-border shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-brand-muted">جارٍ استرجاع المعاملات المالية...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-brand-muted">
            لم يتم العثور على أي معاملات مالية تطابق شروط البحث الحالية
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-brand-surface/80 border-b border-brand-border text-brand-muted font-bold select-none">
                <tr>
                  <th className="py-3 px-5 min-w-[200px]">المعاملة وصاحب المحفظة</th>
                  <th className="py-3 px-4 w-32">نوع الحركة</th>
                  <th className="py-3 px-4 w-32">المبلغ</th>
                  <th className="py-3 px-4 w-28 text-center">الحالة</th>
                  <th className="py-3 px-4 min-w-[160px]">الإشعار / المرجع</th>
                  <th className="py-3 px-4 w-36 text-left">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filtered.map((item) => {
                  const isDeposit = item.type === 'deposit';
                  const dateStr = new Date(item.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = new Date(item.createdAt).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={item._id} className="hover:bg-brand-surface/60 transition-colors">
                      {/* User & ID */}
                      <td className="py-3 px-5">
                        <div className="space-y-0.5">
                          <span className="font-black text-brand-dark block">
                            {item.userId?.name || 'مستخدم سَدِيم'}
                          </span>
                          <span className="text-[11px] font-mono text-brand-muted block dir-ltr text-right">
                            {item.userId?.phoneNumber || `#${item._id.slice(-6).toUpperCase()}`}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        {getTypeLabel(item.type)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-black font-mono text-sm ${
                            isDeposit ? 'text-brand-trust' : 'text-brand-dark'
                          }`}
                        >
                          {isDeposit ? '+' : '-'}{item.amount} ₪
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Proof Image / Reference */}
                      <td className="py-3 px-4">
                        {item.proofImage ? (
                          <button
                            type="button"
                            onClick={() => setActiveProofImage(item.proofImage || null)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-primary text-brand-primary font-bold text-[11px] cursor-pointer"
                          >
                            <span>📎 معاينة الإشعار</span>
                          </button>
                        ) : item.referenceId ? (
                          <span className="text-[11px] font-mono text-brand-muted">
                            {item.referenceId}
                          </span>
                        ) : item.rejectReason ? (
                          <span className="text-[11px] text-red-700 block truncate max-w-xs" title={item.rejectReason}>
                            السبب: {item.rejectReason}
                          </span>
                        ) : (
                          <span className="text-[11px] text-brand-muted">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-left">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[11px] text-brand-dark block">
                            {dateStr}
                          </span>
                          <span className="text-[10px] text-brand-muted block">
                            {timeStr}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Lightbox Modal */}
      {activeProofImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none"
          onClick={() => setActiveProofImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] overflow-hidden rounded-[14px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveProofImage(null)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-sm font-bold hover:bg-black transition-colors cursor-pointer z-10"
            >
              ✕
            </button>
            <img
              src={activeProofImage}
              alt="إشعار التحويل بحجم كامل"
              className="max-h-[85vh] w-auto object-contain rounded-[14px] shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
