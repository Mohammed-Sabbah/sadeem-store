'use client';

import React from 'react';
import Link from 'next/link';

export default function ReturnsPage() {
  const steps = [
    {
      num: '1',
      title: 'المعاينة الفورية عند الباب',
      desc: 'يحق لك فحص وتجربة أي منتج أمام المندوب مباشرة قبل الدفع. في حال عدم ملائمة المقاس أو وجود أي ملاحظة، يُعاد المنتج فوراً مع المندوب دون دفع ثمنه.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
      ),
    },
    {
      num: '2',
      title: 'طلب الاستبدال خلال 3 أيام',
      desc: 'إذا استلمت المنتج ورغبت لاحقاً في تغيير المقاس أو استبداله بمنتج آخر، تواصل مع فريق سَدِيم عبر واتساب وسيرسل لك المندوب القطعة البديلة حتى باب بيتك.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      num: '3',
      title: 'استرداد الأموال الفوري للمحفظة',
      desc: 'عند سداد قيمة الطلب عبر محفظة سَدِيم أو جوال باي، تُعاد قيمة أي صنف مرتجع فوراً ودون أي خصم إلى محفظتك الإلكترونية في التطبيق.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <main className="max-w-[1240px] mx-auto px-4 pt-4 pb-24 md:pb-16 font-almarai">
      {/* Header Strip */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-dark">سياسة الاستبدال والمعاينة</h1>
          <span className="text-xs md:text-sm text-brand-muted mt-1 block">
            حقوقك محفوظة ومكفولة في كل شحنة تصلك من منصة سَدِيم
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-brand-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-lg border border-brand-border bg-brand-surface shrink-0"
        >
          <span>←</span>
          <span>الرئيسية</span>
        </Link>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 mb-6 shadow-xs">
        <h2 className="text-base sm:text-xl font-extrabold text-brand-dark mb-2.5">
          تسوق بثقة تامة: كيف تضمن سَدِيم حقك في المعاينة والاستبدال؟
        </h2>
        <p className="text-xs md:text-sm text-brand-muted leading-relaxed mb-6 max-w-3xl">
          ندرك في قطاع غزة أهمية التأكد من السلعة ومطابقتها للمواصفات الحقيقية. لذلك وضعنا سياسة استبدال مرنة تُراعي راحتك وتضمن عدم هدر أي شيكل.
        </p>

        {/* 3-Column Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((st) => (
            <div
              key={st.num}
              className="bg-brand-card border border-brand-border/60 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary font-black text-base flex items-center justify-center border border-[var(--brand-primary-border)]">
                    {st.num}
                  </div>
                  <div className="text-brand-primary">{st.icon}</div>
                </div>
                <h3 className="text-sm md:text-base font-extrabold text-brand-dark mb-2">
                  {st.title}
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct WhatsApp Action */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-sm md:text-base font-extrabold text-brand-dark mb-1">
            هل تود استبدال قطعة أو الاستفسار عن مقاس مختلف؟
          </h3>
          <p className="text-xs text-brand-muted">
            منسق خدمة الزبائن متاح لمساعدتك فورياً وإرسال المندوب البديل.
          </p>
        </div>

        <a
          href="https://wa.me/970590000000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white hover:brightness-105 px-5 py-2.5 rounded-lg text-xs md:text-sm font-extrabold shadow-sm transition-all shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>طلب استبدال عبر واتساب</span>
        </a>
      </div>
    </main>
  );
}
