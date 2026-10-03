import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-brand-surface border-t border-brand-border pt-12 pb-8 mt-14 text-right">
      <div className="max-w-[1240px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand Wordmark & Vision */}
        <div className="flex flex-col items-start">
          <Link href="/" className="inline-flex items-center gap-1.5 mb-3 no-underline" aria-label="سَدِيم">
            <span className="font-almarai font-extrabold text-2xl tracking-tight text-brand-dark">سَدِيم</span>
            <span className="w-2 h-2 rotate-45 bg-brand-primary inline-block rounded-[1px] shadow-[0_0_8px_rgba(184,98,27,0.5)]"></span>
          </Link>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-xs m-0">
            سوق محلي موثوق يجمع بين ثقة التجارة المحلية وهدوء التجربة الرقمية الراقية، مع ضمان حق المعاينة الكامل عند الاستلام.
          </p>
        </div>

        {/* Col 2: Customer Service */}
        <div className="flex flex-col">
          <h4 className="text-sm font-extrabold text-brand-dark mb-3.5 tracking-tight">خدمات الزبائن</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-brand-muted p-0 m-0 list-none">
            <li><Link href="/policy" className="hover:text-brand-primary transition-colors block no-underline">سياسة المعاينة والاستلام</Link></li>
            <li><Link href="/returns" className="hover:text-brand-primary transition-colors block no-underline">شروط الاستبدال خلال 7 أيام</Link></li>
            <li><Link href="/tracking" className="hover:text-brand-primary transition-colors block no-underline">تتبع الشحنة الموحدة</Link></li>
            <li><Link href="/payment-methods" className="hover:text-brand-primary transition-colors block no-underline">طرق الدفع (كاش و Jawwal Pay)</Link></li>
          </ul>
        </div>

        {/* Col 3: Merchants & Partners */}
        <div className="flex flex-col">
          <h4 className="text-sm font-extrabold text-brand-dark mb-3.5 tracking-tight">التجار والشركاء</h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-brand-muted p-0 m-0 list-none">
            <li><Link href="/merchant/join" className="hover:text-brand-primary transition-colors block no-underline">انضم كتاجر في سَدِيم</Link></li>
            <li><Link href="/quality" className="hover:text-brand-primary transition-colors block no-underline">شروط التوثيق وفحص الجودة</Link></li>
            <li><Link href="/merchant/portal" className="hover:text-brand-primary transition-colors block no-underline">بوابة إدارة المخزون</Link></li>
            <li><Link href="/logistics" className="hover:text-brand-primary transition-colors block no-underline">حلول التوصيل المجمّع</Link></li>
          </ul>
        </div>

        {/* Col 4: WhatsApp Support */}
        <div className="flex flex-col items-start">
          <h4 className="text-sm font-extrabold text-brand-dark mb-3.5 tracking-tight">الدعم المباشر</h4>
          <p className="text-xs sm:text-sm text-brand-muted mb-3 leading-relaxed">
            فريق خدمة سَدِيم متاح يومياً لمتابعة طلباتك عبر تطبيق الواتساب المباشر:
          </p>
          <a
            href="https://wa.me/972590000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-dark hover:bg-brand-primary text-white text-xs font-bold transition-colors shadow-sm no-underline"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>محادثة الدعم عبر واتساب</span>
          </a>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 pt-5 border-t border-brand-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-subtle text-center sm:text-right">
        <span>جميع الحقوق محفوظة © سَدِيم (Sadeem) — 2026</span>
        <span>سوق محلي موثوق يجمع بين الفخامة الكونية والهدوء الرقمي</span>
      </div>
    </footer>
  );
}
