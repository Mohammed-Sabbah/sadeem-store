'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface OrderHistoryItem {
  id: string;
  date: string;
  itemsCount: number;
  total: number;
  status: 'active' | 'delivered';
  statusText: string;
  vendorNames: string[];
}

export default function AccountPage() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { totalItems } = useCart();

  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2600);
  };

  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (user) {
      updateUser({ walletBalance: (user.walletBalance || 0) + amt });
    }
    setTopupModalOpen(false);
    showToast(`تم شحن محفظة سَدِيم بمبلغ ${amt} ₪ بنجاح`);
  };

  const orders: OrderHistoryItem[] = [
    {
      id: '25431',
      date: 'اليوم · 2:15 م',
      itemsCount: 2,
      total: 188,
      status: 'active',
      statusText: 'خرج للتوصيل الميداني الآن (المندوب: يوسف العطار)',
      vendorNames: ['خيوط سَدِيم للأزياء', 'معاصر النصيرات الحديثة'],
    },
    {
      id: '24109',
      date: '24 سبتمبر 2026',
      itemsCount: 1,
      total: 1858,
      status: 'delivered',
      statusText: 'تم التسليم والمعاينة عند الباب بنجاح',
      vendorNames: ['واحة الطاقة والبدائل'],
    },
  ];

  return (
    <>
      <main className="max-w-[1240px] mx-auto px-4 py-4 sm:py-6 pb-28 text-right font-almarai space-y-5">
        {/* Page Header Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark m-0">حسابي والمحفظة الرقمية</h1>
            <span className="text-xs text-brand-muted block mt-0.5">
              إدارة الرصيد، متابعة الشحنات الموحدة، وعناوين التوصيل في المحافظة الوسطى
            </span>
          </div>

          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary hover:border-brand-primary transition-colors no-underline"
          >
            <span>←</span>
            <span>الرئيسية</span>
          </Link>
        </div>

        {/* ===================================================================
            GUEST VIEW: If not authenticated, show welcoming frictionless guest hero
            =================================================================== */}
        {!isAuthenticated || !user ? (
          <div className="space-y-6">
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="max-w-2xl">
                <span className="text-xs font-extrabold text-brand-primary bg-[var(--brand-primary-soft)] border border-[var(--brand-primary-border)] px-3 py-1 rounded-full inline-block mb-3">
                  ● أنت تتصفح المتجر حالياً كزائر
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-brand-dark mb-2 leading-snug">
                  تسوّق بحرية تامة دون تسجيل، وسلتك ومفضلتك محفوظة دائماً
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-6">
                  لا نلزمك بإنشاء حساب لتصفح منتجات ومتاجر المحافظة الوسطى. يمكنك حجز مشترياتك في السلة، وعند تسجيل الدخول ستُدمج تلقائياً مع محفظتك الرقمية.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/auth/login?redirect=/account"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary text-white hover:brightness-105 text-xs sm:text-sm font-extrabold shadow-xs transition-all no-underline"
                  >
                    <span>تسجيل الدخول</span>
                    <span className="text-base">←</span>
                  </Link>

                  <Link
                    href="/auth/register?redirect=/account"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-card hover:bg-brand-surface border border-brand-border text-xs sm:text-sm font-extrabold text-brand-dark transition-all no-underline"
                  >
                    <span>إنشاء حساب جديد</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 3 Pillars of Sadeem Account */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary-soft)] text-brand-primary flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <h3 className="text-sm font-extrabold text-brand-dark mb-1">محفظة سَدِيم الرقمية</h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  دفع فوري بنقرة واحدة، استرداد فوري لقيمة أي مرتجع عند المعاينة دون انتظار بنكي أو عمولات.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h3 className="text-sm font-extrabold text-brand-dark mb-1">تتبع مسار الطرد الموحد</h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  متابعة تحركات المندوب خطوة بخطوة من تجهيز التاجر حتى باب بيتك في المحافظة الوسطى.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-brand-card text-brand-primary flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-sm font-extrabold text-brand-dark mb-1">دفتر العناوين الموثقة</h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  احفظ عناوينك في دير البلح، النصيرات، الزوايدة، المغازي أو البريج لتجهيز طلبك دون إعادة كتابة العنوان.
                </p>
              </div>
            </div>

            {/* Quick Navigation to Guest Assets */}
            <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                <span>سلتك ومفضلتك الحالية:</span>
                <span className="text-brand-primary">({totalItems} أصناف بالسلة)</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/cart"
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors"
                >
                  معاينة السلة ←
                </Link>
                <Link
                  href="/wishlist"
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors"
                >
                  المفضلة ←
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================
              AUTHENTICATED USER VIEW
              =================================================================== */
          <>
            {/* 1. TOP PROFILE HEADER BANNER */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-surface border-2 border-brand-primary flex items-center justify-center text-xl font-black text-brand-primary shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-brand-dark m-0">{user.name}</h2>
                    {user.role === 'merchant' ? (
                      <span className="text-[11px] font-bold text-brand-primary bg-[var(--brand-primary-soft)] px-2 py-0.5 rounded-full border border-[var(--brand-primary-border)]">
                        ● متجر شريك معتمد
                      </span>
                    ) : user.role === 'admin' ? (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ● مسؤول منصة سَدِيم
                      </span>
                    ) : user.role === 'courier' ? (
                      <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                        ● كابتن توصيل موحد
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-brand-trust bg-[var(--brand-trust-soft)] px-2 py-0.5 rounded-full border border-[var(--brand-trust-border)]">
                        ● حساب زبون موثق
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted mt-1 m-0">
                    {user.phone} {user.email ? `• ${user.email}` : ''} • {user.city} (المحافظة الوسطى)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-muted bg-brand-surface border border-brand-border-subtle px-3 py-1.5 rounded-lg">
                  عضوية سَدِيم · 2026
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    showToast('تم تسجيل الخروج بنجاح');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-bold text-brand-muted transition-colors cursor-pointer"
                  title="تسجيل الخروج"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>

            {/* 2. TWO-COLUMN RESPONSIVE LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              {/* COLUMN 1: WALLET & ACTIVE ORDER */}
              <div className="space-y-5">
                {/* DIGITAL WALLET CARD */}
                <div className="relative rounded-2xl p-6 text-white overflow-hidden shadow-lg bg-gradient-to-br from-brand-dark to-[#2A2522]">
                  {/* Decorative Glow */}
                  <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-brand-primary/20 blur-2xl pointer-events-none" />

                  <div className="relative flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <span className="text-sm sm:text-base font-extrabold">محفظة سَدِيم الرقمية</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#E8F5E9] bg-brand-trust/60 border border-white/20 px-2.5 py-0.5 rounded-full">
                      صفر عمولات · دفع فوري
                    </span>
                  </div>

                  <div className="relative flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <span className="text-xs text-white/80 block mb-1">الرصيد المتاح للاستخدام</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{user.walletBalance ?? 0}</span>
                        <span className="text-base font-bold text-white/80">₪</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTopupModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:brightness-110 text-white text-xs sm:text-sm font-extrabold shadow-md transition-colors border-0 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>شحن الرصيد</span>
                    </button>
                  </div>

                  <div className="relative mt-4 pt-3 border-t border-white/10 text-xs text-white/80 leading-relaxed">
                    تُستخدم المحفظة للسداد الفوري بنقرة واحدة، وتُعاد إليها قيمة أي مرتجع تلقائياً عند المعاينة دون انتظار.
                  </div>
                </div>

                {/* ACTIVE ORDER CARD */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                    <div className="flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-primary">
                        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      <h3 className="text-sm sm:text-base font-extrabold text-brand-dark m-0">الشحنة الحالية (قيد التوصيل)</h3>
                    </div>
                    <span className="text-xs font-extrabold text-brand-primary bg-[var(--brand-primary-soft)] border border-[var(--brand-primary-border)] px-2.5 py-0.5 rounded-full">
                      طلب #25431
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border flex flex-col gap-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold text-brand-dark block">طرد سَدِيم الموحد (منتجان)</span>
                        <span className="text-[11px] text-brand-trust font-bold block mt-0.5">
                          ● خرج للتوصيل الآن · المندوب: يوسف العطار (0599000000)
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-base font-black text-brand-primary">188 ₪</span>
                        <span className="text-[10px] text-brand-muted block">شامل توصيل 8 ₪</span>
                      </div>
                    </div>

                    <div className="text-xs text-brand-muted">
                      المتاجر في هذا الطرد: <strong className="text-brand-dark">خيوط سَدِيم للأزياء</strong> و <strong className="text-brand-dark">معاصر النصيرات الحديثة</strong>
                    </div>

                    <Link
                      href="/tracking?orderId=25431"
                      className="inline-flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white border border-brand-border text-xs font-extrabold text-brand-primary hover:border-brand-primary transition-colors no-underline shadow-xs mt-1"
                    >
                      <span>تتبع مسار الشحنة بالكامل وتفاصيل المندوب</span>
                      <span>←</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: ADDRESSES & HISTORY & SUPPORT */}
              <div className="space-y-5">
                {/* SAVED DELIVERY DESTINATION */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                    <div className="flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-trust">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <h3 className="text-sm sm:text-base font-extrabold text-brand-dark m-0">عنوان التوصيل المعتمد</h3>
                    </div>
                    <span className="text-xs font-bold text-brand-trust bg-[var(--brand-trust-soft)] px-2 py-0.5 rounded-md border border-[var(--brand-trust-border)]">
                      الافتراضي
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm text-brand-dark">
                        البيت الرئيسي — {user.city}
                      </div>
                      <div className="text-xs text-brand-muted mt-1 leading-relaxed">
                        {user.address || 'شارع النخيل — بالقرب من المستودع المركزي'}
                      </div>
                      <div className="text-[11px] text-brand-muted mt-1">
                        رقم هاتف التواصل: <span dir="ltr">{user.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAST ORDERS ARCHIVE */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                    <div className="flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-dark">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <h3 className="text-sm sm:text-base font-extrabold text-brand-dark m-0">سجل الطلبيات المكتملة</h3>
                    </div>
                    <span className="text-xs text-brand-muted">المحافظة الوسطى</span>
                  </div>

                  <div className="divide-y divide-brand-border-subtle">
                    {orders
                      .filter((o) => o.status === 'delivered')
                      .map((order) => (
                        <div key={order.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-brand-dark">طلب #{order.id}</span>
                              <span className="text-[11px] text-brand-trust font-bold">✓ مكتمل ومعاين</span>
                            </div>
                            <div className="text-xs text-brand-muted mt-0.5">
                              {order.date} • {order.vendorNames.join('، ')}
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="font-black text-sm text-brand-dark">{order.total} ₪</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* LOGISTICS CONCIERGE & SUPPORT */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#25D366]">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <h3 className="text-sm sm:text-base font-extrabold text-brand-dark m-0">الدعم الميداني المباشر</h3>
                  </div>

                  <p className="text-xs text-brand-muted leading-relaxed m-0">
                    هل لديك استفسار عن موعد وصول المندوب، رصيد محفظتك، أو ترغب في استبدال مقاس؟ منسق سَدِيم متاح يومياً.
                  </p>

                  <a
                    href={`https://wa.me/970590000000?text=${encodeURIComponent('مرحباً، استفسار بخصوص حسابي ومشترياتي عبر سَدِيم')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-extrabold no-underline shadow-xs transition-colors"
                  >
                    <span>محادثة منسق العمليات عبر واتساب</span>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MODAL: TOPUP WALLET (ONLY ACTIVE FOR AUTHENTICATED USERS) */}
        {topupModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                <h3 className="text-base font-extrabold text-brand-dark m-0">شحن محفظة سَدِيم الرقمية</h3>
                <button
                  type="button"
                  onClick={() => setTopupModalOpen(false)}
                  className="text-brand-muted hover:text-brand-dark text-sm p-1 cursor-pointer bg-transparent border-0"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-brand-muted leading-relaxed m-0">
                اختر المبلغ المراد شحنه فورياً عبر محفظة جوال باي (Jawwal Pay) بدون أي رسوم إضافية:
              </p>

              <form onSubmit={handleTopupSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {['30', '50', '100', '200'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTopupAmount(val)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        topupAmount === val
                          ? 'bg-[var(--brand-primary-soft)] border-brand-primary text-brand-primary'
                          : 'bg-brand-surface border-brand-border text-brand-dark hover:border-brand-primary'
                      }`}
                    >
                      {val} ₪
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-brand-primary hover:brightness-110 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all border-0 cursor-pointer"
                  >
                    تأكيد الشحن ({topupAmount} ₪)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopupModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-brand-surface border border-brand-border text-brand-dark text-xs font-bold hover:bg-brand-border/40 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Sadeem Toast Component */}
      {toastVisible && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
