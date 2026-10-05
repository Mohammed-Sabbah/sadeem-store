'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { HybridAddressPicker, type AddressFormData } from '@/features/checkout/components/HybridAddressPicker';
import { getGoogleMapsUrl, calculateHaversineDistance, GAZA_REGIONS_CLIENT } from '@/shared/lib/geolocation';

interface Governorate {
  id: string;
  name: string;
  active: boolean;
  badge: string;
  cities: string[];
}

const PALESTINE_GAZA_GOVERNORATES: Governorate[] = [
  {
    id: 'central',
    name: 'المحافظة الوسطى',
    active: true,
    badge: 'طرد موحد · تغطية فورية',
    cities: [
      'دير البلح',
      'مخيم النصيرات',
      'الزوايدة',
      'مخيم البريج',
      'مخيم المغازي',
    ],
  },
  {
    id: 'khanyounis',
    name: 'محافظة خان يونس',
    active: true,
    badge: 'تغطية متوفرة',
    cities: ['مدينة خان يونس والبلد', 'مخيم خان يونس والأمل', 'القرارة', 'بني سهيلا والشرقية', 'المواصي - خان يونس'],
  },
  {
    id: 'gaza_city',
    name: 'محافظة غزة',
    active: true,
    badge: 'تغطية متوفرة',
    cities: ['الرمال وتل الهوا', 'الشجاعية والدرج والتفاح', 'الزيتون والصبرة', 'الشيخ رضوان والنصر'],
  },
  {
    id: 'north',
    name: 'محافظة شمال غزة',
    active: true,
    badge: 'تغطية متوفرة',
    cities: ['جباليا ومخيمها', 'بيت لاهيا', 'بيت حانون'],
  },
  {
    id: 'rafah',
    name: 'محافظة رفح',
    active: true,
    badge: 'تغطية متوفرة',
    cities: ['مدينة رفح والبلد', 'تل السلطان والمخيم', 'الشابورة والبرازيل', 'المواصي - رفح'],
  },
];

interface SavedAddress {
  id: string;
  tag: string;
  recipientName: string;
  phone: string;
  governorateId: string;
  governorateName: string;
  city: string;
  details: string;
  coordinates?: { lat: number; lng: number };
  isGpsVerified?: boolean;
  isDefault?: boolean;
}

const INITIAL_SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-home',
    tag: 'المنزل',
    recipientName: 'أحمد سلامة',
    phone: '0599123456',
    governorateId: 'central',
    governorateName: 'المحافظة الوسطى',
    city: 'دير البلح',
    details: 'شارع النخيل، بجوار مسجد الفرقان (منزل عائلة سلامة)',
    coordinates: { lat: 31.418, lng: 34.351 },
    isGpsVerified: true,
    isDefault: true,
  },
  {
    id: 'addr-work',
    tag: 'العمل / المحل',
    recipientName: 'أحمد سلامة',
    phone: '0599123456',
    governorateId: 'central',
    governorateName: 'المحافظة الوسطى',
    city: 'مخيم النصيرات',
    details: 'شارع صلاح الدين، بالقرب من المدخل الرئيسي والمخبز الآلي',
    coordinates: { lat: 31.448, lng: 34.391 },
    isGpsVerified: true,
    isDefault: false,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, clearCart } = useCart();
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();

  // Route guard: Must be authenticated to checkout
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login?redirect=/checkout');
    }
  }, [isLoading, isAuthenticated, router]);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(INITIAL_SAVED_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-home');

  // Adaptive Address Drawer / Modal State
  const [addressDrawerOpen, setAddressDrawerOpen] = useState<boolean>(false);
  const [drawerMode, setDrawerMode] = useState<'list' | 'add'>('list');

  // Form State for Adding New Address (3-Tier Hierarchy)
  const [newRecipientName, setNewRecipientName] = useState<string>(user?.name || '');
  const [newPhone, setNewPhone] = useState<string>(user?.phone || '');
  const [selectedGovId, setSelectedGovId] = useState<string>('central');
  const [selectedCity, setSelectedCity] = useState<string>(user?.city || 'دير البلح');
  const [newAddressDetails, setNewAddressDetails] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('المنزل');
  // Form State for Adding New Address with Hybrid GPS Picker
  const [pickerData, setPickerData] = useState<AddressFormData | null>(null);

  // Payment & Bill States - PREPAID ONLY (No COD)
  const [paymentMethod, setPaymentMethod] = useState<'jawwal' | 'wallet'>('jawwal');
  const [billSheetOpen, setBillSheetOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance ?? 0);
  const [jawwalPhone, setJawwalPhone] = useState(user?.phone || '0599123456');

  // Sync authenticated user data
  useEffect(() => {
    if (user) {
      if (user.walletBalance !== undefined) setWalletBalance(user.walletBalance);
      if (user.phone) {
        setJawwalPhone(user.phone);
      }
      if (user.addresses && user.addresses.length > 0) {
        const mapped: SavedAddress[] = user.addresses.map((a, idx) => ({
          id: a._id || `user-addr-${idx}`,
          tag: a.label || 'المنزل',
          recipientName: user.name,
          phone: a.phone || user.phone || '',
          governorateId: a.governorate || 'central',
          governorateName: a.governorate || 'المحافظة الوسطى',
          city: a.city || 'دير البلح',
          details: a.detailedAddress,
          coordinates: (a as any).coordinates,
          isDefault: a.isDefault,
        }));
        setSavedAddresses(mapped);
        const def = mapped.find((m) => m.isDefault);
        if (def) setSelectedAddressId(def.id);
        else setSelectedAddressId(mapped[0].id);
      }
    }
  }, [user]);

  // 3-second undo countdown toast state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Active address & dynamic distance delivery fee
  const activeSelectedAddress = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];

  // Central hub coordinates (Deir al-Balah hub: 31.418, 34.351)
  const HUB_CENTER = { lat: 31.418, lng: 34.351 };
  const targetCoord = activeSelectedAddress?.coordinates || HUB_CENTER;
  const distanceKm = calculateHaversineDistance(
    HUB_CENTER.lat,
    HUB_CENTER.lng,
    targetCoord.lat,
    targetCoord.lng
  );

  // Dynamic fee: 2 ₪ per km, min 7 ₪, max 80 ₪ (matches delivery.config.js)
  const dynamicDeliveryFee = items.length > 0 ? Math.max(7, Math.min(80, Math.round(distanceKm * 2))) : 0;

  const baseTotal = subtotal + dynamicDeliveryFee;
  const gatewayFee = paymentMethod === 'jawwal' ? Math.round(baseTotal * 0.03) : 0;
  const grandTotal = baseTotal + gatewayFee;
  const isWalletSufficient = walletBalance >= grandTotal;

  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  const handleSaveNewAddress = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pickerData || !pickerData.recipientName.trim() || !pickerData.phone.trim() || !pickerData.detailedAddress.trim()) {
      alert('يرجى ملء جميع الحقول الإلزامية للعنوان (الاسم، الهاتف، والعنوان بالتفصيل)');
      return;
    }

    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      tag: pickerData.tag || 'المنزل',
      recipientName: pickerData.recipientName.trim(),
      phone: pickerData.phone.trim(),
      governorateId: pickerData.governorateId,
      governorateName: pickerData.governorateName,
      city: pickerData.cityName,
      details: pickerData.detailedAddress.trim(),
      coordinates: pickerData.coordinates,
      isGpsVerified: pickerData.isGpsVerified,
      isDefault: false,
    };

    setSavedAddresses((prev) => [newAddr, ...prev]);
    setSelectedAddressId(newAddr.id);
    setAddressDrawerOpen(false);
    setDrawerMode('list');
  };

  const handleStartOrder = () => {
    const orderId = `SD-${Math.floor(100000 + Math.random() * 900000)}`;
    setIsSubmitting(true);
    setCountdown(3);

    const chosenAddress = {
      fullName: activeSelectedAddress.recipientName,
      phone: activeSelectedAddress.phone,
      governorate: activeSelectedAddress.governorateName,
      town: activeSelectedAddress.city,
      detailedAddress: activeSelectedAddress.details,
      coordinates: activeSelectedAddress.coordinates,
    };

    const orderData = {
      orderId,
      createdAt: new Date().toISOString(),
      customer: chosenAddress,
      paymentMethod,
      items,
      subtotal,
      deliveryFee: dynamicDeliveryFee,
      gatewayFee,
      grandTotal,
    };

    try {
      localStorage.setItem('sadeem_last_order', JSON.stringify(orderData));
    } catch {}

    let remaining = 3;
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (paymentMethod === 'wallet' && user) {
          updateUser({
            walletBalance: Math.max(0, (user.walletBalance || walletBalance) - grandTotal),
            ordersCount: (user.ordersCount || 0) + 1,
          });
        }
        clearCart();
        router.push(`/order-success?orderId=${orderId}`);
      }
    }, 1000);

    setTimerId(interval as unknown as NodeJS.Timeout);
  };

  const handleCancelUndo = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setIsSubmitting(false);
    setCountdown(3);
  };

  const handleTopup = (amt: number) => {
    setWalletBalance((prev) => {
      const next = prev + amt;
      if (user) {
        updateUser({ walletBalance: next });
      }
      return next;
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 py-24 text-center font-almarai">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs sm:text-sm text-brand-muted">جاري التحقق من الحساب ونقلك لمتابعة إتمام الطلب...</p>
      </main>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-4 sm:py-6 pb-28 text-right font-almarai">
      {/* 1. COMPACT PAGE HEADER STRIP */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-brand-border">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark m-0">تأكيد الطلب والسداد</h1>
          <p className="text-xs text-brand-muted m-0 mt-0.5">طرد سَدِيم الموحد للمحافظة الوسطى · توصيل 8 ₪ فقط</p>
        </div>

        <Link
          href="/cart"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary hover:border-brand-primary transition-colors no-underline"
        >
          <span>←</span>
          <span>العودة للسلة</span>
        </Link>
      </div>

      {/* 2. COMPACT THREE-STEP STEPPER */}
      <nav className="flex items-center justify-center gap-2 sm:gap-3 mb-4 select-none text-xs font-bold" aria-label="مراحل إتمام الطلب">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-brand-trust no-underline">
          <span className="w-5 h-5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust flex items-center justify-center text-[10px]">
            ✓
          </span>
          <span>السلة</span>
        </Link>

        <div className="w-6 sm:w-8 h-[1px] bg-brand-border"></div>

        <div className="inline-flex items-center gap-1.5 text-brand-primary font-extrabold">
          <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px]">
            2
          </span>
          <span>الشحن والسداد</span>
        </div>

        <div className="w-6 sm:w-8 h-[1px] bg-brand-border"></div>

        <div className="inline-flex items-center gap-1.5 text-brand-muted">
          <span className="w-5 h-5 rounded-full bg-brand-surface border border-brand-border text-brand-muted flex items-center justify-center text-[10px]">
            3
          </span>
          <span>التتبع</span>
        </div>
      </nav>

      {/* 3. SERENE UNIFIED PARCEL TRUST BANNER */}
      <div className="p-3 sm:px-4 rounded-xl bg-white border border-brand-border-subtle flex items-center gap-2.5 mb-5 shadow-xs" aria-label="ميثاق طرد سَدِيم الموحد">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/20 text-xs font-bold whitespace-nowrap flex-shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>طرد موحد 8 ₪</span>
        </span>
        <span className="text-xs text-brand-muted font-medium leading-relaxed">
          تُجمع طلبياتك من كافة متاجر الوسطى في شحنة واحدة مع حق المعاينة عند الباب قبل الدفع.
        </span>
      </div>

      {/* 4. TWO-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT COLUMN: MAIN FORM FLOW (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* CARD 1: DELIVERY DESTINATION & ADDRESS SELECTION */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-brand-dark m-0">
                <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">1</span>
                <span>وجهة التوصيل والمستلم</span>
              </h2>

              <button
                type="button"
                onClick={() => {
                  setDrawerMode('add');
                  setAddressDrawerOpen(true);
                }}
                className="text-xs font-extrabold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              >
                <span>＋ عنوان جديد</span>
              </button>
            </div>

            {/* Active Selected Address Summary Box */}
            <div
              className="p-3.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-primary/40 cursor-pointer transition-colors shadow-xs flex flex-col gap-2"
              onClick={() => {
                setDrawerMode('list');
                setAddressDrawerOpen(true);
              }}
              title="انقر لتغيير العنوان أو إضافة عنوان جديد"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-brand-border text-[11px] font-extrabold text-brand-dark">
                    {activeSelectedAddress.tag}
                  </span>
                  <span className="text-[11px] text-brand-trust font-bold flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>معتمد للتوصيل الموحد</span>
                  </span>
                </div>

                <span className="text-xs font-bold text-brand-primary">
                  تغيير ‹
                </span>
              </div>

              <div className="text-xs sm:text-sm font-extrabold text-brand-dark">
                {activeSelectedAddress.recipientName} · <span dir="ltr">{activeSelectedAddress.phone}</span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-brand-muted leading-relaxed">
                <span>
                  {activeSelectedAddress.governorateName} · {activeSelectedAddress.city} — {activeSelectedAddress.details}
                </span>
                {activeSelectedAddress.coordinates && (
                  <a
                    href={getGoogleMapsUrl(activeSelectedAddress.coordinates.lat, activeSelectedAddress.coordinates.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-primary hover:underline bg-brand-surface px-2 py-0.5 rounded border border-brand-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>📍</span>
                    <span>الموقع على خرائط جوجل</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: PAYMENT METHODS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-brand-dark m-0">
                <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">2</span>
                <span>طريقة السداد المعتمدة (دفع مسبق)</span>
              </h2>
              <span className="text-xs font-bold text-brand-muted">
                {paymentMethod === 'jawwal' && 'جوال باي'}
                {paymentMethod === 'wallet' && 'محفظة سَدِيم'}
              </span>
            </div>

            {/* Payment Options Grid (Prepaid Only) */}
            <div className="space-y-2.5">
              {/* Option 1: Jawwal Pay */}
              <div
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  paymentMethod === 'jawwal'
                    ? 'bg-brand-primary-soft/40 border-brand-primary shadow-xs'
                    : 'bg-white border-brand-border hover:border-brand-primary/30'
                }`}
                onClick={() => setPaymentMethod('jawwal')}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  paymentMethod === 'jawwal' ? 'border-brand-primary bg-brand-primary' : 'border-brand-border bg-white'
                }`}>
                  {paymentMethod === 'jawwal' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-brand-dark">جوال باي (Jawwal Pay)</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-surface text-brand-dark border border-brand-border">محفظة إلكترونية</span>
                  </div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    سداد مسبق فوري وآمن عبر تطبيق جوال باي بهاتفك (+3% رسوم بوابة)
                  </div>
                </div>
              </div>

              {/* Option 2: Wallet */}
              <div
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  paymentMethod === 'wallet'
                    ? 'bg-brand-primary-soft/40 border-brand-primary shadow-xs'
                    : 'bg-white border-brand-border hover:border-brand-primary/30'
                }`}
                onClick={() => setPaymentMethod('wallet')}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                  paymentMethod === 'wallet' ? 'border-brand-primary bg-brand-primary' : 'border-brand-border bg-white'
                }`}>
                  {paymentMethod === 'wallet' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-brand-dark">محفظة سَدِيم الرقمية</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary/20">رصيدك: {walletBalance} ₪</span>
                  </div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    سداد مسبق بنقرة واحدة بدون أي عمولات إضافية
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Panel 2: Wallet */}
            {paymentMethod === 'wallet' && (
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-brand-muted">رصيد محفظتك المتاح:</span>
                  <span className="text-brand-trust">0% رسوم بوابة</span>
                </div>

                <div className="text-2xl font-black text-brand-primary">
                  {walletBalance} <span className="text-sm font-bold">₪</span>
                </div>

                <div className="text-xs leading-relaxed">
                  {isWalletSufficient ? (
                    <span className="text-brand-trust font-semibold flex items-center gap-1">
                      <span>✓ رصيدك يغطي كامل الفاتورة ({grandTotal} ₪) ويُخصم فوراً عند تأكيد الطلب.</span>
                    </span>
                  ) : (
                    <span className="text-brand-primary font-semibold">
                      رصيدك الحالي ({walletBalance} ₪) يغطي جزءاً من الطلب. يُرجى شحن المحفظة أو الدفع كاش عند الاستلام.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-brand-border-subtle flex-wrap">
                  <span className="text-[11px] text-brand-subtle font-bold">شحن سريع:</span>
                  <button type="button" className="px-2.5 py-1 rounded-md bg-white border border-brand-border text-xs font-bold hover:border-brand-primary transition-colors cursor-pointer" onClick={() => handleTopup(50)}>
                    +50 ₪
                  </button>
                  <button type="button" className="px-2.5 py-1 rounded-md bg-white border border-brand-border text-xs font-bold hover:border-brand-primary transition-colors cursor-pointer" onClick={() => handleTopup(100)}>
                    +100 ₪
                  </button>
                  <button type="button" className="px-2.5 py-1 rounded-md bg-white border border-brand-border text-xs font-bold hover:border-brand-primary transition-colors cursor-pointer" onClick={() => handleTopup(200)}>
                    +200 ₪
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Panel 3: Jawwal Pay */}
            {paymentMethod === 'jawwal' && (
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex flex-col gap-2.5">
                <div className="text-xs sm:text-sm font-bold text-brand-dark">السداد عبر محفظة جوال باي (Jawwal Pay)</div>
                <div className="text-xs text-brand-muted leading-relaxed">
                  سيتم إرسال طلب سداد فوري إلى حسابك في جوال باي لتأكيد الدفع عبر تطبيق الهاتف.
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-brand-dark">رقم محفظة جوال باي:</label>
                  <input
                    type="tel"
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary text-right"
                    value={jawwalPhone}
                    onChange={(e) => setJawwalPhone(e.target.value)}
                    placeholder="059xxxxxxx"
                  />
                </div>

                <div className="text-[11px] text-brand-primary font-bold">
                  +3% رسوم بوابة الدفع الإلكتروني ({gatewayFee} ₪)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: STICKY ORDER MINI-SUMMARY (4 cols) */}
        <aside className="lg:col-span-5 xl:col-span-4 sticky top-20" aria-label="ملخص الفاتورة">
          <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h2 className="text-base font-extrabold text-brand-dark m-0">ملخص الحساب والفاتورة</h2>
              <span className="text-xs font-bold text-brand-muted">
                {items.length} {items.length === 1 ? 'منتج' : 'منتجات'}
              </span>
            </div>

            {/* Mini Items List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-lg bg-brand-surface border border-brand-border-subtle">
                  <div className="w-10 h-10 rounded-md bg-white border border-brand-border/60 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-brand-dark truncate" title={item.product.title}>
                      {item.product.title}
                    </div>
                    <div className="text-[10px] text-brand-muted">
                      {item.product.vendor?.name || 'متجر معتمد'} · الكمية: {item.quantity}
                    </div>
                  </div>
                  <div className="text-xs font-extrabold text-brand-dark whitespace-nowrap">
                    {item.product.price * item.quantity} ₪
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Cost Stack */}
            <div className="space-y-2 text-xs sm:text-sm pt-2 border-t border-brand-border">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">مجموع المنتجات:</span>
                <span className="font-bold text-brand-dark">{subtotal} ₪</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-brand-muted">أجر طرد سَدِيم الموحد:</span>
                <span className="font-bold text-brand-dark">{dynamicDeliveryFee} ₪</span>
              </div>

              {gatewayFee > 0 && (
                <div className="flex items-center justify-between text-brand-primary">
                  <span>رسوم بوابة جوال باي (3%):</span>
                  <span className="font-extrabold">+{gatewayFee} ₪</span>
                </div>
              )}

              <div className="border-t border-brand-border pt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-extrabold text-brand-dark block">المبلغ المطلوب سداده:</span>
                  <span className="text-[10px] text-brand-muted">شامل التوصيل للمحافظة الوسطى</span>
                </div>
                <div className="text-2xl font-black text-brand-primary">
                  {grandTotal} <span className="text-sm font-bold">₪</span>
                </div>
              </div>
            </div>

            {/* Desktop Action Button */}
            <div className="hidden lg:block pt-1">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm sm:text-base font-extrabold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-between cursor-pointer border-0 disabled:opacity-50"
                onClick={handleStartOrder}
                disabled={isSubmitting || (paymentMethod === 'wallet' && !isWalletSufficient)}
              >
                <span>تأكيد وحجز الطلب الآن</span>
                <span>←</span>
              </button>
            </div>

            {/* Trust Assurance */}
            <div className="pt-3 border-t border-brand-border-subtle space-y-1.5 text-[11px] text-brand-muted font-medium">
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-trust">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>حق المعاينة والتجربة عند الباب مكفول قبل السداد</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-trust">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>طرد موحد لكافة المتاجر بمندوب واحد (8 ₪)</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 3-SECOND UNDO COUNTDOWN TOAST */}
      {isSubmitting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-dark text-white px-5 py-3 rounded-full text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div>
            <div className="font-extrabold">جاري تثبيت وحجز طلبك... ({countdown})</div>
            <div className="text-[11px] text-brand-bg opacity-85">لديك 3 ثوانٍ للتراجع إن ضغطت بالخطأ</div>
          </div>
          <button
            type="button"
            className="px-3 py-1 rounded-full bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-colors cursor-pointer border-0"
            onClick={handleCancelUndo}
          >
            تراجع ✕
          </button>
        </div>
      )}

      {/* MOBILE STICKY FLOATING ACTION BAR */}
      <aside className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border px-4 py-2.5 shadow-lg flex items-center justify-between" aria-label="شريط تأكيد الطلب للجوال">
        <div className="cursor-pointer" onClick={() => setBillSheetOpen(true)}>
          <span className="text-[10px] text-brand-muted block">المطلوب سداده:</span>
          <div className="text-base font-black text-brand-primary flex items-center gap-1">
            <span>{grandTotal} ₪</span>
            <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-1.5 py-0.5 rounded border border-brand-border">الفاتورة ▴</span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 border-0 cursor-pointer disabled:opacity-50"
          onClick={handleStartOrder}
          disabled={isSubmitting || (paymentMethod === 'wallet' && !isWalletSufficient)}
        >
          <span>تأكيد وحجز الطلب</span>
          <span>←</span>
        </button>
      </aside>

      {/* ADAPTIVE ADDRESS MANAGEMENT (DRAWER ON MOBILE, MODAL ON DESKTOP) */}
      <BottomSheet
        isOpen={addressDrawerOpen}
        onClose={() => setAddressDrawerOpen(false)}
        title={drawerMode === 'add' ? 'إضافة عنوان توصيل جديد' : 'عناوين التوصيل بالمحافظة الوسطى'}
      >
        {drawerMode === 'list' ? (
          /* VIEW 1: SAVED ADDRESSES LIST */
          <div className="flex flex-col gap-3.5 text-right font-almarai">
            <p className="m-0 text-xs text-brand-muted leading-relaxed">
              اختر عنوان التوصيل المعتمد لطلبك الحالي في المحافظة الوسطى:
            </p>

            <div className="space-y-2.5">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-brand-primary-soft/40 border-brand-primary shadow-xs'
                        : 'bg-white border-brand-border hover:border-brand-primary/30'
                    }`}
                    onClick={() => {
                      setSelectedAddressId(addr.id);
                      setAddressDrawerOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-brand-border text-[11px] font-extrabold text-brand-dark">
                          {addr.tag}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] text-brand-muted">(الافتراضي)</span>
                        )}
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-border bg-white'
                      }`}>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </div>

                    <div className="text-xs font-extrabold text-brand-dark">
                      {addr.recipientName} · <span dir="ltr">{addr.phone}</span>
                    </div>

                    <div className="text-[11px] text-brand-muted leading-relaxed">
                      {addr.governorateName} · {addr.city} — {addr.details}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-primary text-brand-dark text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => setDrawerMode('add')}
            >
              <span>＋ إضافة عنوان توصيل جديد</span>
            </button>
          </div>
        ) : (
          /* VIEW 2: HYBRID GPS & DROPDOWN ADDRESS PICKER */
          <form onSubmit={handleSaveNewAddress} className="flex flex-col gap-4 text-right font-almarai">
            <HybridAddressPicker
              initialData={{
                recipientName: user?.name || '',
                phone: user?.phone || '',
                governorateId: 'central',
                cityId: 'deir_albalah',
              }}
              onAddressChange={(data) => setPickerData(data)}
            />

            <div className="flex gap-2 pt-2 border-t border-brand-border">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white text-xs sm:text-sm font-extrabold hover:bg-brand-primary-hover transition-colors cursor-pointer border-0 shadow-sm"
              >
                حفظ واعتماد هذا العنوان
              </button>

              <button
                type="button"
                onClick={() => setDrawerMode('list')}
                className="px-4 py-2.5 rounded-lg bg-brand-surface border border-brand-border text-brand-muted text-xs font-bold hover:text-brand-dark transition-colors cursor-pointer"
              >
                العودة
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* ADAPTIVE BILL SHEET (MOBILE DRAWER) */}
      <BottomSheet
        isOpen={billSheetOpen}
        onClose={() => setBillSheetOpen(false)}
        title="تفاصيل الحساب والفاتورة"
      >
        <div className="flex flex-col gap-3 text-right font-almarai text-xs sm:text-sm">
          <div className="flex justify-between text-brand-dark">
            <span>مجموع المنتجات ({items.length}):</span>
            <span className="font-bold">{subtotal} ₪</span>
          </div>
          <div className="flex justify-between text-brand-dark">
            <span>أجر طرد سَدِيم الموحد:</span>
            <span className="font-bold">{dynamicDeliveryFee} ₪</span>
          </div>
          {gatewayFee > 0 && (
            <div className="flex justify-between text-brand-primary font-bold">
              <span>رسوم بوابة جوال باي (3%):</span>
              <span>+{gatewayFee} ₪</span>
            </div>
          )}

          <div className="border-t border-brand-border pt-2 flex justify-between items-center">
            <div>
              <div className="text-sm font-extrabold text-brand-dark">الإجمالي المستحق:</div>
              <div className="text-[10px] text-brand-muted">شامل التوصيل الموحد والمعاينة</div>
            </div>
            <div className="text-xl font-black text-brand-primary">
              {grandTotal} <span className="text-xs font-bold">₪</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setBillSheetOpen(false);
              handleStartOrder();
            }}
            disabled={isSubmitting || (paymentMethod === 'wallet' && !isWalletSufficient)}
            className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-extrabold transition-all active:scale-98 flex items-center justify-center gap-2 mt-2 cursor-pointer border-0 disabled:opacity-50 shadow-sm"
          >
            <span>تأكيد وحجز الطلب الآن</span>
            <span>←</span>
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}
