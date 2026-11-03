'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useUserWalletQuery } from '@/features/wallet/hooks/useUserWallet';

interface AddressItem {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  city: string;
  area: string;
  detailedAddress: string;
  landmark: string;
  notes?: string;
  isDefault: boolean;
}

export default function AccountPage() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { totalItems } = useCart();
  const { data: walletData, isLoading: isLoadingWallet } = useUserWalletQuery({
    enabled: Boolean(isAuthenticated),
  });

  // Toast feedback state
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  };

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Address state (Operational Gaza Middle Governorate Pattern)
  const [addresses, setAddresses] = useState<AddressItem[]>([
    {
      id: 'addr-1',
      label: 'المنزل',
      recipientName: user?.name || 'محمد صباح',
      phone: user?.phone || '0592236240',
      city: 'دير البلح',
      area: 'البلد - شارع السلام',
      detailedAddress: 'منطقة النخيل، بجوار صيدلية القدس',
      landmark: 'بالقرب من ملعب الدرة ومسجد النور',
      notes: 'الطابق الثاني - الاتصال قبل الوصول بـ 15 دقيقة',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'العمل',
      recipientName: user?.name || 'محمد صباح',
      phone: user?.phone || '0592236240',
      city: 'مخيم النصيرات',
      area: 'السوق المركزي',
      detailedAddress: 'مجمع الأندلس التجاري، الطابق الأرضي',
      landmark: 'مقابل مكتب البريد',
      notes: 'التسليم من 9 صباحاً حتى 3 عصراً',
      isDefault: false,
    },
  ]);

  // Add Address Form State
  const [newAddressLabel, setNewAddressLabel] = useState('المنزل');
  const [newAddressCity, setNewAddressCity] = useState('دير البلح');
  const [newAddressArea, setNewAddressArea] = useState('');
  const [newAddressDetails, setNewAddressDetails] = useState('');
  const [newAddressLandmark, setNewAddressLandmark] = useState('');
  const [newAddressNotes, setNewAddressNotes] = useState('');
  const [newAddressIsDefault, setNewAddressIsDefault] = useState(false);

  // Active Shipment Mock (Gaza Middle Governorate)
  const activeOrder = {
    id: '25431',
    status: 'out_for_delivery',
    statusText: 'المندوب استلم الطرد الموحد وباتجاه عنوانك',
    itemsCount: 3,
    vendorNames: ['زاد الزيتون (دير البلح)', 'عطور يافا (النصيرات)'],
    total: 218,
    courierName: 'أبو أحمد النجار',
  };

  // Balance computation
  const withdrawableBalance = walletData?.withdrawableBalance ?? user?.walletBalance ?? 0;
  const storeCreditBalance = walletData?.storeCreditBalance ?? 0;
  const currentBalance = walletData?.balance ?? withdrawableBalance + storeCreditBalance;

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('الاسم الكامل مطلوب');
      return;
    }
    updateUser({
      name: editName.trim(),
      phone: editPhone.trim(),
    });
    setIsEditProfileOpen(false);
    showToast('تم حفظ البيانات الشخصية بنجاح');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('كلمة المرور يجب ألا تقل عن 8 خانات');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة المرور الجديدة غير متطابقة مع التأكيد');
      return;
    }
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('تم تحديث كلمة المرور بنجاح');
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    showToast('تم تعيين العنوان الافتراضي للتوصيل');
  };

  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      showToast('يجب الاحتفاظ بعنوان واحد على الأقل');
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    showToast('تم حذف العنوان بنجاح');
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressDetails.trim() || !newAddressLandmark.trim()) {
      showToast('يرجى كتابة الشارع وأقرب معلم بارز للمندوب');
      return;
    }
    const newId = `addr-${Date.now()}`;
    const newAddr: AddressItem = {
      id: newId,
      label: newAddressLabel,
      recipientName: user?.name || 'محمد صباح',
      phone: user?.phone || '0592236240',
      city: newAddressCity,
      area: newAddressArea.trim() || 'المنطقة العامة',
      detailedAddress: newAddressDetails.trim(),
      landmark: newAddressLandmark.trim(),
      notes: newAddressNotes.trim(),
      isDefault: newAddressIsDefault || addresses.length === 0,
    };

    setAddresses((prev) => {
      if (newAddr.isDefault) {
        return [...prev.map((a) => ({ ...a, isDefault: false })), newAddr];
      }
      return [...prev, newAddr];
    });

    setIsAddAddressOpen(false);
    setNewAddressArea('');
    setNewAddressDetails('');
    setNewAddressLandmark('');
    setNewAddressNotes('');
    setNewAddressIsDefault(false);
    showToast('تمت إضافة العنوان الجديد بنجاح');
  };

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
    showToast('تم تسجيل الخروج بنجاح');
  };

  return (
    <>
      <main className="w-full max-w-[1240px] mx-auto px-4 py-5 sm:py-7 pb-24 text-right font-almarai space-y-6">
        {/* ===================================================================
            GUEST VIEW
            =================================================================== */}
        {!isAuthenticated || !user ? (
          <div className="space-y-6 max-w-xl mx-auto py-10 text-center">
            <div className="bg-white border border-brand-border rounded-[20px] p-7 sm:p-10 shadow-xs space-y-4">
              <span className="w-14 h-14 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary inline-flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-brand-dark leading-snug m-0">
                أهلاً بك في سَدِيم
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed m-0 max-w-md mx-auto">
                تسوّق بحرية تامة مع حق فحص ومعاينة مشترياتك عند الباب قبل الدفع وتوصيل موحد 8 ₪ في المحافظة الوسطى.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/auth/login?redirect=/account"
                  className="px-6 py-2.5 rounded-[8px] bg-brand-primary hover:brightness-105 text-white text-xs sm:text-sm font-black shadow-xs transition-all active:scale-95 no-underline"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/auth/register?redirect=/account"
                  className="px-5 py-2.5 rounded-[8px] bg-brand-surface border border-brand-border text-brand-dark hover:border-brand-primary text-xs sm:text-sm font-bold transition-all active:scale-95 no-underline"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-[14px] bg-white border border-brand-border shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                <span>سلتك ومفضلتك الحالية:</span>
                <span className="text-brand-primary font-black font-mono">({totalItems} أصناف بالسلة)</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/cart"
                  className="px-3.5 py-1.5 rounded-[8px] bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors active:scale-95 no-underline"
                >
                  معاينة السلة ←
                </Link>
                <Link
                  href="/wishlist"
                  className="px-3.5 py-1.5 rounded-[8px] bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors active:scale-95 no-underline"
                >
                  المفضلة ←
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================
              AUTHENTICATED CONSUMER DASHBOARD (PROPORTIONAL 1240PX SADEEM GRID)
              =================================================================== */
          <div className="space-y-6">
            {/* -------------------------------------------------------------
                TOP IDENTITY CARD & METRIC CAPSULES
                ------------------------------------------------------------- */}
            <div className="rounded-[18px] bg-gradient-to-b from-brand-primary/10 via-brand-surface to-white border border-brand-border/80 shadow-xs p-4 sm:p-6 space-y-4">
              {/* User Identity Top Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] bg-[var(--brand-primary-soft)] border border-brand-primary/30 flex items-center justify-center text-lg sm:text-xl font-black text-brand-primary shrink-0 shadow-2xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-[11px] sm:text-xs text-brand-muted font-bold">مرحباً بك،</span>
                      <h1 className="text-sm sm:text-lg font-black text-brand-dark m-0 truncate">
                        {user.name}
                      </h1>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand-trust bg-[var(--brand-trust-soft)] px-2 py-0.5 rounded-full border border-[var(--brand-trust-border)]">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>حساب موثق</span>
                      </span>
                    </div>

                    <div className="text-[11px] sm:text-xs text-brand-muted flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span dir="ltr" className="font-mono text-brand-dark font-medium">
                        {user.phone}
                      </span>
                      <span>•</span>
                      <span>دير البلح (المحافظة الوسطى)</span>
                      {user.email && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span dir="ltr" className="font-mono text-brand-subtle text-[10px] sm:text-[11px] hidden sm:inline">
                            {user.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditName(user.name);
                    setEditPhone(user.phone);
                    setIsEditProfileOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-[8px] bg-white border border-brand-border text-xs font-black text-brand-dark hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95 cursor-pointer shadow-2xs shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>تعديل الملف</span>
                </button>
              </div>

              {/* The 3 Metric Stat Capsules Bar */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                <Link
                  href="/orders"
                  className="p-3 sm:p-3.5 rounded-[12px] bg-white border border-brand-border/80 shadow-2xs hover:border-brand-primary transition-all no-underline text-center group active:scale-95"
                >
                  <span className="w-7 h-7 rounded-[7px] bg-[var(--brand-primary-soft)] text-brand-primary inline-flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </span>
                  <div className="text-sm sm:text-lg font-black text-brand-dark font-mono leading-tight">
                    1
                  </div>
                  <span className="text-[10px] sm:text-xs text-brand-muted font-bold block mt-0.5">
                    إجمالي الطلبات
                  </span>
                </Link>

                <Link
                  href="/account/wallet"
                  className="p-3 sm:p-3.5 rounded-[12px] bg-white border border-brand-border/80 shadow-2xs hover:border-brand-primary transition-all no-underline text-center group active:scale-95"
                >
                  <span className="w-7 h-7 rounded-[7px] bg-[var(--brand-trust-soft)] text-brand-trust inline-flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M2 10h20" />
                      <circle cx="16" cy="14" r="1.5" fill="currentColor" />
                    </svg>
                  </span>
                  <div className="text-sm sm:text-lg font-black text-brand-dark font-mono leading-tight">
                    {isLoadingWallet ? '...' : currentBalance.toFixed(2)} ₪
                  </div>
                  <span className="text-[10px] sm:text-xs text-brand-muted font-bold block mt-0.5">
                    رصيد المحفظة
                  </span>
                </Link>

                <div className="p-3 sm:p-3.5 rounded-[12px] bg-white border border-brand-border/80 shadow-2xs text-center">
                  <span className="w-7 h-7 rounded-[7px] bg-brand-surface text-brand-dark inline-flex items-center justify-center mb-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div className="text-sm sm:text-lg font-black text-brand-dark font-mono leading-tight">
                    {addresses.length}
                  </div>
                  <span className="text-[10px] sm:text-xs text-brand-muted font-bold block mt-0.5">
                    عناوين التوصيل
                  </span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                ACTIVE SHIPMENT BANNER (FULL WIDTH IF ACTIVE)
                ------------------------------------------------------------- */}
            {activeOrder && (
              <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-brand-primary/30 shadow-xs space-y-3 relative overflow-hidden ring-1 ring-brand-primary/20">
                <div className="flex items-center justify-between pb-2.5 border-b border-brand-border/70 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-trust" />
                    </span>
                    <h2 className="text-xs sm:text-sm font-black text-brand-dark m-0">
                      طردك الموحد قيد التوصيل الميداني
                    </h2>
                  </div>
                  <span className="text-[11px] font-black text-brand-primary bg-[var(--brand-primary-soft)] border border-[var(--brand-primary-border)] px-2.5 py-0.5 rounded-full font-mono">
                    طلب #{activeOrder.id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-brand-dark block">
                      {activeOrder.itemsCount} منتجات • {activeOrder.vendorNames.join('، ')}
                    </span>
                    <span className="text-brand-trust font-medium block">
                      كابتن التوصيل: {activeOrder.courierName} ({activeOrder.statusText})
                    </span>
                  </div>
                  <div className="text-right sm:text-left shrink-0">
                    <span className="text-base font-black text-brand-primary font-mono block">
                      {activeOrder.total} ₪
                    </span>
                    <span className="text-[10px] text-brand-muted block">
                      شامل توصيل 8 ₪ ثابت
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-brand-border/40">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-brand-trust bg-[var(--brand-trust-soft)] px-2 py-0.5 rounded-[6px] border border-[var(--brand-trust-border)]">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>حق الفحص والمعاينة عند الباب قبل الدفع</span>
                  </span>
                  <Link
                    href={`/tracking?orderId=${activeOrder.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-brand-primary hover:brightness-105 text-white text-xs font-black no-underline shadow-2xs transition-all active:scale-95"
                  >
                    <span>تتبع المندوب خطوة بخطوة</span>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                BALANCED 2-COLUMN PROPORTIONAL GRID (ZERO DUPLICATION)
                ------------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* =========================================================
                  COLUMN 1 (RIGHT): FINANCIAL & DELIVERY HUBS
                  ========================================================= */}
              <div className="space-y-6">
                {/* 1. SADEEM LUXURY WALLET HUB */}
                <div className="p-5 sm:p-6 rounded-[18px] bg-white border border-brand-border shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M2 10h20" />
                          <circle cx="16" cy="14" r="1.5" fill="currentColor" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-brand-dark m-0">محفظة سَدِيم الموحدة</h2>
                        <span className="text-[11px] text-brand-muted">إدارة الرصيد والإيداع والسحب الفوري</span>
                      </div>
                    </div>
                    <Link
                      href="/account/wallet"
                      className="text-xs font-bold text-brand-primary hover:underline no-underline inline-flex items-center gap-1"
                    >
                      <span>كشف الحساب</span>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </Link>
                  </div>

                  <div className="p-4 rounded-[14px] bg-brand-surface/80 border border-brand-border/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-brand-muted block font-medium">الرصيد المتاح للاستخدام أو السحب</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl sm:text-3xl font-black text-brand-dark font-mono">
                          {isLoadingWallet ? '...' : currentBalance.toFixed(2)}
                        </span>
                        <span className="text-sm font-black text-brand-primary">₪ شيكل</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-trust bg-[var(--brand-trust-soft)] px-2.5 py-1 rounded-full border border-[var(--brand-trust-border)]">
                      مفعلة للسحب والإيداع
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <Link
                      href="/account/wallet?action=deposit"
                      className="py-2.5 px-3 rounded-[8px] bg-brand-primary hover:brightness-105 text-white text-xs font-black text-center no-underline shadow-2xs transition-all active:scale-95 inline-flex items-center justify-center gap-1.5"
                    >
                      <span>+ شحن الرصيد</span>
                    </Link>
                    <Link
                      href="/account/wallet?action=withdraw"
                      className="py-2.5 px-3 rounded-[8px] bg-white hover:bg-brand-surface border border-brand-border text-brand-dark text-xs font-black text-center no-underline shadow-2xs transition-all active:scale-95 inline-flex items-center justify-center gap-1.5"
                    >
                      <span>طلب سحب نقدي</span>
                    </Link>
                  </div>
                </div>

                {/* 2. DELIVERY ADDRESSES HUB (DIRECTLY INLINE - NO ENDLESS NESTING) */}
                <div className="p-5 sm:p-6 rounded-[18px] bg-white border border-brand-border shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center border border-[var(--brand-trust-border)]">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-brand-dark m-0">عناوين التوصيل (المحافظة الوسطى)</h2>
                        <span className="text-[11px] text-brand-muted">مواقع التسليم الميداني المعتمدة لطرد سَدِيم الموحد</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddAddressOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-brand-primary hover:brightness-105 text-white text-xs font-black transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <span>+ إضافة عنوان</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-3.5 rounded-[14px] border ${
                          addr.isDefault
                            ? 'border-brand-primary/40 bg-[var(--brand-primary-soft)]/20 shadow-2xs'
                            : 'border-brand-border bg-white shadow-2xs'
                        } space-y-1.5`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-brand-surface text-brand-dark flex items-center justify-center">
                              {addr.label === 'المنزل' ? (
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                  <line x1="9" y1="22" x2="9" y2="2" />
                                </svg>
                              )}
                            </span>
                            <span className="text-xs font-black text-brand-dark">{addr.label}</span>
                            <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-2 py-0.5 rounded-[4px] border border-brand-border">
                              {addr.city}
                            </span>
                          </div>
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand-trust bg-[var(--brand-trust-soft)] px-2 py-0.5 rounded-full border border-[var(--brand-trust-border)]">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              <span>العنوان الافتراضي</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-brand-dark m-0 font-medium leading-relaxed">
                          {addr.area} — {addr.detailedAddress}
                        </p>

                        <div className="text-[11px] text-brand-muted">
                          معلم بارز للمندوب: <strong className="text-brand-dark font-medium">{addr.landmark}</strong>
                        </div>

                        {addr.notes && (
                          <div className="text-[10px] text-amber-900 bg-amber-50/80 p-1.5 rounded-[6px] border border-amber-200/60 m-0">
                            ملاحظة التسليم: {addr.notes}
                          </div>
                        )}

                        <div className="pt-1.5 border-t border-brand-border/40 flex items-center justify-between text-[11px]">
                          <div>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-brand-primary font-bold hover:underline cursor-pointer"
                              >
                                تعيين كافتراضي للتوصيل
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="inline-flex items-center gap-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* =========================================================
                  COLUMN 2 (LEFT): ORDERS, SECURITY & GAZA CHARTER
                  ========================================================= */}
              <div className="space-y-6">
                {/* 3. ORDERS, WISHLIST & SECURITY GROUP */}
                <div className="rounded-[18px] bg-white border border-brand-border shadow-xs overflow-hidden">
                  <div className="px-5 py-3 bg-brand-surface/50 border-b border-brand-border/60">
                    <span className="text-xs font-black text-brand-primary">الطلبات والتسوق والأمان</span>
                  </div>
                  <div className="divide-y divide-brand-border/60">
                    {/* Row 1: Orders History */}
                    <Link
                      href="/orders"
                      className="group flex items-center justify-between p-4 hover:bg-brand-surface/60 transition-colors no-underline cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[var(--brand-primary-soft)] text-brand-primary flex items-center justify-center shrink-0 border border-[var(--brand-primary-border)]">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-black text-brand-dark group-hover:text-brand-primary transition-colors m-0">
                            سجل طلبياتي وشحناتي
                          </h3>
                          <p className="text-[11px] text-brand-muted m-0 truncate">
                            متابعة الطرود وسجل المعاينات والتسليم الميداني
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-brand-trust bg-[var(--brand-trust-soft)] px-2 py-0.5 rounded-full border border-[var(--brand-trust-border)]">
                          1 نشط
                        </span>
                        <svg className="w-3.5 h-3.5 text-brand-subtle group-hover:text-brand-primary group-hover:-translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </div>
                    </Link>

                    {/* Row 2: Wishlist */}
                    <Link
                      href="/wishlist"
                      className="group flex items-center justify-between p-4 hover:bg-brand-surface/60 transition-colors no-underline cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-black text-brand-dark group-hover:text-brand-primary transition-colors m-0">
                            قائمتي المفضلة
                          </h3>
                          <p className="text-[11px] text-brand-muted m-0 truncate">
                            المنتجات المحفوظة للشراء لاحقاً
                          </p>
                        </div>
                      </div>
                      <svg className="w-3.5 h-3.5 text-brand-subtle group-hover:text-brand-primary group-hover:-translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </Link>

                    {/* Row 3: Security & Password */}
                    <div
                      onClick={() => {
                        setPasswordError('');
                        setIsPasswordModalOpen(true);
                      }}
                      className="group flex items-center justify-between p-4 hover:bg-brand-surface/60 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-black text-brand-dark group-hover:text-brand-primary transition-colors m-0">
                            الأمان وكلمة المرور
                          </h3>
                          <p className="text-[11px] text-brand-muted m-0 truncate">
                            تحديث كلمة مرور الحساب لحماية المحفظة والبيانات
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-brand-muted text-xs font-bold">
                        <span>تحديث</span>
                        <svg className="w-3.5 h-3.5 text-brand-subtle group-hover:text-brand-primary group-hover:-translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. GAZA CHARTER & SUPPORT HUB */}
                <div className="p-5 sm:p-6 rounded-[18px] bg-white border border-brand-border shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[8px] bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-brand-dark m-0">ميثاق سَدِيم والدعم الميداني</h2>
                        <span className="text-[11px] text-brand-muted">معايير التجارة الموثوقة بالمحافظة الوسطى</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5 p-2 rounded-[8px] bg-brand-surface/60">
                      <span className="text-brand-trust font-black mt-0.5 shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <div>
                        <strong className="text-brand-dark font-black block">حق الفحص والمعاينة عند الباب</strong>
                        <span className="text-[11px] text-brand-muted">افحص طردك وجرّب منتجك وتأكد منه قبل دفع أي مبلغ للمندوب.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2 rounded-[8px] bg-brand-surface/60">
                      <span className="text-brand-primary font-black mt-0.5 shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      </span>
                      <div>
                        <strong className="text-brand-dark font-black block">طرد موحد برسم 8 ₪ فقط</strong>
                        <span className="text-[11px] text-brand-muted">مهما تعددت متاجرك في دير البلح والنصيرات والزوايدة والمغازي والبريج.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2 rounded-[8px] bg-brand-surface/60">
                      <span className="text-brand-dark font-black mt-0.5 shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                      </span>
                      <div>
                        <strong className="text-brand-dark font-black block">استبدال المقاسات خلال 3 أيام</strong>
                        <span className="text-[11px] text-brand-muted">تنسيق ميداني سريع عبر واتساب لتبديل المقاس عند الحاجة.</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/970590000000?text=${encodeURIComponent(
                      'مرحباً منسق سَدِيم، استفسار بخصوص حسابي وعناوين التوصيل في المحافظة الوسطى'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-[8px] bg-brand-surface hover:bg-emerald-50 hover:border-emerald-200 border border-brand-border text-brand-dark text-xs font-black no-underline transition-all active:scale-95 flex items-center justify-center gap-2 shadow-2xs mt-2"
                  >
                    <svg className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span>محادثة منسق العمليات الميداني (واتساب)</span>
                    <svg className="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                DISTINCT & SEPARATED SIGN OUT SECTION
                ------------------------------------------------------------- */}
            <div className="pt-4 flex justify-center border-t border-brand-border/40">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="w-full sm:w-auto min-w-[280px] py-3 px-6 rounded-[12px] bg-white hover:bg-red-50 border border-stone-200 hover:border-red-200 text-stone-600 hover:text-red-700 text-xs font-bold transition-all shadow-2xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-stone-400 group-hover:text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===================================================================
          MODAL 1: EDIT PROFILE MODAL
          =================================================================== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] border border-brand-border shadow-lg max-w-sm w-full p-5 space-y-4 text-right font-almarai animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
              <h3 className="text-sm font-black text-brand-dark m-0">تعديل الملف الشخصي</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-7 h-7 rounded-[6px] text-brand-muted hover:text-brand-dark hover:bg-brand-surface flex items-center justify-center cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  رقم الهاتف الأساسي
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  dir="ltr"
                  placeholder="059xxxxxxx"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs font-mono text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-brand-primary text-white text-xs font-black shadow-2xs hover:brightness-105 active:scale-95 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL 2: CHANGE PASSWORD MODAL
          =================================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] border border-brand-border shadow-lg max-w-sm w-full p-5 space-y-4 text-right font-almarai animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
              <h3 className="text-sm font-black text-brand-dark m-0">تعديل كلمة المرور</h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-7 h-7 rounded-[6px] text-brand-muted hover:text-brand-dark hover:bg-brand-surface flex items-center justify-center cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              {passwordError && (
                <div className="p-2 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  كلمة المرور الجديدة (8 خانات على الأقل)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-brand-primary text-white text-xs font-black shadow-2xs hover:brightness-105 active:scale-95 cursor-pointer"
                >
                  تحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL 3: ADD NEW DELIVERY ADDRESS MODAL
          =================================================================== */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-55 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] border border-brand-border shadow-lg max-w-sm w-full p-5 space-y-3.5 text-right font-almarai animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-brand-border/60">
              <h3 className="text-sm font-black text-brand-dark m-0">إضافة عنوان توصيل جديد</h3>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="w-7 h-7 rounded-[6px] text-brand-muted hover:text-brand-dark hover:bg-brand-surface flex items-center justify-center cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-brand-dark block mb-1">
                    تصنيف العنوان
                  </label>
                  <select
                    value={newAddressLabel}
                    onChange={(e) => setNewAddressLabel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                  >
                    <option value="المنزل">المنزل</option>
                    <option value="العمل">العمل</option>
                    <option value="الأهل">بيت الأهل</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-dark block mb-1">
                    المدينة بالوسطى
                  </label>
                  <select
                    value={newAddressCity}
                    onChange={(e) => setNewAddressCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                  >
                    <option value="دير البلح">دير البلح</option>
                    <option value="مخيم النصيرات">مخيم النصيرات</option>
                    <option value="الزوايدة">الزوايدة</option>
                    <option value="مخيم المغازي">مخيم المغازي</option>
                    <option value="مخيم البريج">مخيم البريج</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  المنطقة أو الحي
                </label>
                <input
                  type="text"
                  value={newAddressArea}
                  onChange={(e) => setNewAddressArea(e.target.value)}
                  placeholder="مثال: البلد، مخيم 2، شارع السلام"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  تفاصيل الشارع والحي
                </label>
                <input
                  type="text"
                  value={newAddressDetails}
                  onChange={(e) => setNewAddressDetails(e.target.value)}
                  required
                  placeholder="مثال: شارع السلام، منطقة النخيل"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  أقرب معلم بارز للمندوب (حاسم للتوصيل)
                </label>
                <input
                  type="text"
                  value={newAddressLandmark}
                  onChange={(e) => setNewAddressLandmark(e.target.value)}
                  required
                  placeholder="مثال: بالقرب من ملعب الدرة / صيدلية القدس"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-dark block mb-1">
                  ملاحظة للمندوب
                </label>
                <input
                  type="text"
                  value={newAddressNotes}
                  onChange={(e) => setNewAddressNotes(e.target.value)}
                  placeholder="مثال: الطابق الثاني / الاتصال قبل الوصول"
                  className="w-full px-3 py-2 rounded-[8px] border border-brand-border text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={newAddressIsDefault}
                  onChange={(e) => setNewAddressIsDefault(e.target.checked)}
                  className="rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
                <label htmlFor="defaultCheck" className="text-xs text-brand-dark cursor-pointer font-bold">
                  تعيين هذا العنوان كافتراضي لطلبات سَدِيم
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="px-3.5 py-1.5 rounded-[8px] border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-brand-primary text-white text-xs font-black shadow-2xs hover:brightness-105 active:scale-95 cursor-pointer"
                >
                  إضافة العنوان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL 4: LOGOUT CONFIRMATION SAFETY MODAL
          =================================================================== */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-brand-border shadow-xl max-w-sm w-full p-5 space-y-4 text-right font-almarai animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-brand-dark m-0">تأكيد تسجيل الخروج</h3>
                <p className="text-[11px] text-brand-muted m-0 mt-0.5">
                  هل أنت متأكد من رغبتك في تسجيل الخروج من هذا الجهاز؟
                </p>
              </div>
            </div>

            <div className="p-3 rounded-[10px] bg-brand-surface border border-brand-border text-xs text-brand-muted leading-relaxed">
              ستحتاج لإعادة تسجيل الدخول للوصول إلى محفظتك وسجل شحناتك الحية.
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-[8px] bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:border-brand-primary cursor-pointer active:scale-95"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-[8px] bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                تأكيد الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TOAST FEEDBACK
          =================================================================== */}
      {toastVisible && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[8px] bg-brand-dark text-white text-xs font-black shadow-md border border-brand-border animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMsg}
        </div>
      )}
    </>
  );
}
