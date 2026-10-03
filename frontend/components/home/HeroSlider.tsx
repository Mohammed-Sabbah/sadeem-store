'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { products } from '@/data/products';

export function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const { addToCart } = useCart();
  const touchStartX = useRef<number | null>(null);

  // Auto-play slider every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? 2 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % 3);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    // RTL: swiping left increases slide index (negative diff in LTR, positive in RTL)
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const powerStationProduct = products.find((p) => p.id === 'power-station-1200w') || products[2];
  const oliveOilProduct = products.find((p) => p.id === 'olive-oil-amphora') || products[1];

  return (
    <section className="max-w-[1240px] mx-auto px-4 pt-3 md:pt-4 w-full" aria-label="أبرز العروض والمنتجات">
      <div
        className="relative w-full h-[180px] sm:h-[300px] md:h-[420px] rounded-2xl md:rounded-3xl border border-brand-border overflow-hidden bg-gradient-to-br from-white via-[#FAF4EF] to-[#F2E5DC] shadow-sm flex items-center select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Wrapper */}
        <div className="relative w-full h-full">

          {/* SLIDE 0: Lithium Power Station 1200W */}
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
              activeSlide === 0
                ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                : 'opacity-0 scale-[0.98] z-0 pointer-events-none'
            }`}
          >
            <div className="w-full h-full grid grid-cols-[1.3fr_0.9fr] sm:grid-cols-[1.2fr_0.8fr] md:grid-cols-2 items-center px-4 sm:px-8 md:px-14 py-2 sm:py-6 md:py-8 gap-2 sm:gap-6">
              {/* Text Column */}
              <div className="flex flex-col items-start gap-1 sm:gap-2 md:gap-3 text-right">
                <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm font-bold text-[var(--brand-glow,#B08D57)]">
                  <span className="w-1.5 h-1.5 rounded-xs bg-brand-primary rotate-45" />
                  <span>واحة الطاقة والبدائل • دير البلح</span>
                </div>

                <h2 className="text-sm sm:text-2xl md:text-4xl font-extrabold text-brand-dark leading-tight tracking-tight">
                  محطة طاقة سَدِيم 1200W
                </h2>

                <p className="text-xs md:text-sm text-brand-muted leading-relaxed">
                  <span className="hidden md:inline">
                    14 ساعة تشغيل متواصل للإنارة والراوتر ببطاريات LiFePO4 آمنة. عاين وافحص جهازك وشغّله عند باب بيتك قبل دفع أي شيكل.
                  </span>
                  <span className="md:hidden text-[11px] line-clamp-1">
                    14 ساعة تشغيل • فحص وتشغيل عند الباب
                  </span>
                </p>

                {/* Price & CTA Row */}
                <div className="flex items-center gap-2 sm:gap-4 mt-0.5 sm:mt-2 flex-wrap">
                  <div className="flex items-baseline gap-1 sm:gap-1.5">
                    <span className="text-sm sm:text-2xl md:text-3xl font-black text-brand-dark leading-none">
                      1,480 <span className="text-xs sm:text-sm font-bold text-[var(--brand-glow,#B08D57)]">₪</span>
                    </span>
                    <span className="text-[11px] sm:text-sm text-brand-muted line-through">1,690 ₪</span>
                    <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary border border-[var(--brand-primary-border)]">
                      وفر 210 ₪
                    </span>
                  </div>

                  <Link
                    href={`/product/${powerStationProduct.id}`}
                    className="h-7 sm:h-9 md:h-11 px-3 sm:px-5 rounded-full md:rounded-lg bg-brand-primary text-white hover:brightness-110 text-[11px] sm:text-xs md:text-sm font-extrabold flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                  >
                    <span className="hidden md:inline">احجز مع المعاينة</span>
                    <span className="md:inline">احجز الآن</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Image Column */}
              <Link
                href={`/product/${powerStationProduct.id}`}
                className="w-full h-full flex items-center justify-center relative cursor-pointer"
              >
                <img
                  className="max-h-[130px] sm:max-h-[220px] md:max-h-[320px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform duration-300"
                  src="/canaan_power_station_transparent.png"
                  alt="محطة طاقة ليثيوم سَدِيم 1200W"
                />
              </Link>
            </div>
          </div>

          {/* SLIDE 1: Heritage Palestinian Olive Oil Amphora */}
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
              activeSlide === 1
                ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                : 'opacity-0 scale-[0.98] z-0 pointer-events-none'
            }`}
          >
            <div className="w-full h-full grid grid-cols-[1.3fr_0.9fr] sm:grid-cols-[1.2fr_0.8fr] md:grid-cols-2 items-center px-4 sm:px-8 md:px-14 py-2 sm:py-6 md:py-8 gap-2 sm:gap-6">
              {/* Text Column */}
              <div className="flex flex-col items-start gap-1 sm:gap-2 md:gap-3 text-right">
                <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm font-bold text-[var(--brand-glow,#B08D57)]">
                  <span className="w-1.5 h-1.5 rounded-xs bg-brand-primary rotate-45" />
                  <span>معاصر النصيرات الحديثة • النصيرات</span>
                </div>

                <h2 className="text-sm sm:text-2xl md:text-4xl font-extrabold text-brand-dark leading-tight tracking-tight">
                  زيت الزيتون الرومي المعمّر
                </h2>

                <p className="text-xs md:text-sm text-brand-muted leading-relaxed">
                  <span className="hidden md:inline">
                    عصرة أولى على البارد بنسبة حموضة أقل من 0.4%. معبأ في خابية فخار تراثية تحفظ نقاء الطعم والزيت من الضوء والحرارة.
                  </span>
                  <span className="md:hidden text-[11px] line-clamp-1">
                    عصرة أولى ع البارد • خابية فخار تراثية
                  </span>
                </p>

                {/* Price & CTA Row */}
                <div className="flex items-center gap-2 sm:gap-4 mt-0.5 sm:mt-2 flex-wrap">
                  <div className="flex items-baseline gap-1 sm:gap-1.5">
                    <span className="text-sm sm:text-2xl md:text-3xl font-black text-brand-dark leading-none">
                      140 <span className="text-xs sm:text-sm font-bold text-[var(--brand-glow,#B08D57)]">₪</span>
                    </span>
                    <span className="text-[11px] sm:text-sm text-brand-muted line-through">160 ₪</span>
                    <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary border border-[var(--brand-primary-border)]">
                      وفر 20 ₪
                    </span>
                  </div>

                  <button
                    type="button"
                    className="h-7 sm:h-9 md:h-11 px-3 sm:px-5 rounded-full md:rounded-lg bg-brand-primary text-white hover:brightness-110 text-[11px] sm:text-xs md:text-sm font-extrabold flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                    onClick={() => addToCart(oliveOilProduct, 1)}
                  >
                    <span className="hidden md:inline">اقتنِ الخابية</span>
                    <span className="md:inline">اقتنِ الآن</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Image Column */}
              <Link
                href={`/product/${oliveOilProduct.id}`}
                className="w-full h-full flex items-center justify-center relative cursor-pointer"
              >
                <img
                  className="max-h-[130px] sm:max-h-[220px] md:max-h-[320px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform duration-300"
                  src="/canaan_olive_amphora_transparent.png"
                  alt="خابية زيت زيتون بلدي تراثية"
                />
              </Link>
            </div>
          </div>

          {/* SLIDE 2: Canaan Central Parcel Delivery */}
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
              activeSlide === 2
                ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                : 'opacity-0 scale-[0.98] z-0 pointer-events-none'
            }`}
          >
            <div className="w-full h-full grid grid-cols-[1.3fr_0.9fr] sm:grid-cols-[1.2fr_0.8fr] md:grid-cols-2 items-center px-4 sm:px-8 md:px-14 py-2 sm:py-6 md:py-8 gap-2 sm:gap-6">
              {/* Text Column */}
              <div className="flex flex-col items-start gap-1 sm:gap-2 md:gap-3 text-right">
                <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm font-bold text-[var(--brand-glow,#B08D57)]">
                  <span className="w-1.5 h-1.5 rounded-xs bg-brand-primary rotate-45" />
                  <span>مستودع سَدِيم المركزي • دير البلح</span>
                </div>

                <h2 className="text-sm sm:text-2xl md:text-4xl font-extrabold text-brand-dark leading-tight tracking-tight">
                  طرد سَدِيم الموحّد للوسطى
                </h2>

                <p className="text-xs md:text-sm text-brand-muted leading-relaxed">
                  <span className="hidden md:inline">
                    اطلب من عدة تجار ومتاجر في دير البلح والنصيرات والمغازي والزوايدة معاً، وتصلك في شحنة واحدة بمندوب واحد وأجر توصيل 8 ₪ ثابت.
                  </span>
                  <span className="md:hidden text-[11px] line-clamp-1">
                    شحنة موحدة لمختلف المتاجر • توصيل 8 ₪
                  </span>
                </p>

                {/* Price & CTA Row */}
                <div className="flex items-center gap-2 sm:gap-4 mt-0.5 sm:mt-2 flex-wrap">
                  <div className="flex items-baseline gap-1 sm:gap-1.5">
                    <span className="text-sm sm:text-2xl md:text-3xl font-black text-brand-dark leading-none">
                      8 <span className="text-xs sm:text-sm font-bold text-[var(--brand-glow,#B08D57)]">₪</span>
                    </span>
                    <span className="inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust border border-[var(--brand-trust-border)]">
                      توصيل موحد
                    </span>
                  </div>

                  <Link
                    href="/explore"
                    className="h-7 sm:h-9 md:h-11 px-3 sm:px-5 rounded-full md:rounded-lg bg-brand-primary text-white hover:brightness-110 text-[11px] sm:text-xs md:text-sm font-extrabold flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                  >
                    <span className="hidden md:inline">استكشف تجار الوسطى</span>
                    <span className="md:inline">استكشف</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Image Column */}
              <div className="w-full h-full flex items-center justify-center relative">
                <img
                  className="max-h-[130px] sm:max-h-[220px] md:max-h-[320px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                  src="/canaan_delivery_transparent.png"
                  alt="طرد وشحنة سَدِيم الموحدة"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Desktop Navigation Arrows */}
        <button
          type="button"
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 start-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-brand-dark shadow-md items-center justify-center cursor-pointer z-20 transition-all border border-brand-border"
          onClick={handlePrev}
          aria-label="السابق"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          type="button"
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 end-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-brand-dark shadow-md items-center justify-center cursor-pointer z-20 transition-all border border-brand-border"
          onClick={handleNext}
          aria-label="التالي"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Progress Segments */}
        <div className="absolute bottom-2.5 sm:bottom-3 md:bottom-4 start-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              className={`h-1 rounded-full transition-all cursor-pointer ${
                activeSlide === idx ? 'w-5 sm:w-6 bg-brand-primary' : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              onClick={() => setActiveSlide(idx)}
              aria-label={`شريحة ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
