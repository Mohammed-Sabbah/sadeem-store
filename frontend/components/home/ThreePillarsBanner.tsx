import React from 'react';

export function ThreePillarsBanner() {
  return (
    <section className="max-w-[1240px] mx-auto px-4 py-3 sm:py-4 w-full font-almarai" aria-label="الشحن الموحد لكافة المحافظة الوسطى">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-4 sm:p-5 rounded-2xl bg-brand-surface border border-brand-border shadow-xs">
        {/* Pillar 1 */}
        <div className="flex items-start gap-3 p-1 sm:p-2">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--brand-primary-soft)] text-brand-primary flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-brand-dark mb-0.5">طرد سَدِيم الموحد</h3>
            <p className="text-[11px] sm:text-xs text-brand-muted leading-relaxed">
              اطلب من عدة تجار ومتاجر في الوسطى معاً وتصلك في شحنة واحدة.
            </p>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="flex items-start gap-3 p-1 sm:p-2 border-t md:border-t-0 md:border-r border-brand-border/60 pt-3 md:pt-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-card text-brand-primary flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-xs sm:text-sm font-extrabold text-brand-dark">توصيل 8 ₪ ثابت</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary border border-[var(--brand-primary-border)]">
                موحد
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-brand-muted leading-relaxed">
              أجر شحن موحد ومندوب واحد لباب بيتك مهما زادت مشترياتك وتعددت المتاجر.
            </p>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="flex items-start gap-3 p-1 sm:p-2 border-t md:border-t-0 md:border-r border-brand-border/60 pt-3 md:pt-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-brand-dark mb-0.5">فحص وتشغيل عند الباب</h3>
            <p className="text-[11px] sm:text-xs text-brand-muted leading-relaxed">
              حق أصيل بمعاينة وتجربة طلبك مع المندوب قبل دفع أي شيكل كاش.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
