'use client';

import React from 'react';
import Link from 'next/link';

export default function PolicyPage() {
  const policies = [
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      title: 'ميثاق طرد سَدِيم الموحد (شحنة واحدة)',
      desc: 'عندما تطلب منتجات من عدة تجار ومتاجر مختلفة في المحافظة الوسطى، لا تدفع رسوم شحن لكل متجر على حدة. يقوم أسطول سَدِيم الميداني بجمع كافة طلبياتك من المتاجر وتنسيقها داخل مستودعنا المركزي لتصلك في طرد واحد متكامل بمندوب واحد وأجر توصيل رمزي ثابت (8 شيكل فقط) لكافة المدن والمخيمات.',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
      ),
      title: 'حق المعاينة والتجربة الإلزامية عند الباب',
      desc: 'نؤمن في سَدِيم بأن الثقة تبدأ من الفحص الحقيقي. نمنحك حقاً أصيلاً ومكفولاً بفتح الطرد أمام المندوب، معاينة جودة وخامة المنتجات، تجربة مقاسات الملابس، وتشغيل واختبار الأجهزة الإلكترونية ومحطات الطاقة والبطاريات قبل دفع أي شيكل. إن لم يكن المنتج مطابقاً 100% لتوقعاتك، يحق لك إعادته فوراً مع المندوب دون أي مساءلة أو إحراج.',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: 'سياسة الاستبدال خلال 3 أيام',
      desc: 'حتى بعد استلام الطرد ومغادرة المندوب، تتمتع بفترة ضمان واستبدال مرنة تمتد لـ 3 أيام لكافة المنتجات غير المستهلكة وفي حالتها الأصلية. كل ما عليك هو التواصل مع خدمة عملاء سَدِيم عبر واتساب ليرسل لك المندوب القطعة البديلة حتى باب منزلك.',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
      title: 'أمان السداد والمحفظة الرقمية الفورية',
      desc: 'سواء اخترت الدفع نقداً عند الباب (كاش)، أو عبر محفظة جوال باي (Jawwal Pay)، أو من رصيدك في محفظة سَدِيم الرقمية، فإن أموالك في أمان تام. في حال إرجاع أي منتج تم سداده رقمياً، يُعاد المبلغ بالكامل فوراً إلى محفظتك في التطبيق دون تأخير بنكي أو خصم أي عمولة.',
    },
    {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      title: 'توثيق المتاجر وجودة المصادر',
      desc: 'لا يُقبل في منصة سَدِيم سوى التجار والمتاجر وأصحاب الحرف المعتمدين محلياً داخل قطاع غزة، والذين يخضعون لفحص الجودة ومطابقة المواصفات لضمان وصول أجود المؤونة والملابس ومستلزمات الطاقة الموثوقة لمنزلك.',
    },
  ];

  return (
    <main className="max-w-[1240px] mx-auto px-4 pt-4 pb-24 md:pb-16 font-almarai">
      {/* Header Strip */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-dark">ميثاق الخدمة والضمان الميداني</h1>
          <span className="text-xs md:text-sm text-brand-muted mt-1 block">
            حقوق الزبون، سياسة المعاينة قبل الدفع، وأصول طرد سَدِيم الموحد
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

      {/* Editorial Intro Banner */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 mb-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-extrabold text-brand-trust bg-[var(--brand-trust-soft)] px-3 py-1 rounded-full border border-[var(--brand-trust-border)]">
            ● المعيار التشغيلي الميداني لقطاع غزة
          </span>
        </div>
        <h2 className="text-base sm:text-xl font-extrabold text-brand-dark mb-2.5">
          تسوق باطمئنان كامل: لا تدفع شيكلاً واحداً قبل أن تفحص مشترياتك بنفسك
        </h2>
        <p className="text-xs md:text-sm text-brand-muted leading-relaxed max-w-3xl">
          صُممت تجربة متجر «سَدِيم» لتراعي الظروف الواقعية في قطاع غزة، متجاوزة عوائق التسوق التقليدي من خلال دمج المشتريات من كافة المتاجر، توحيد كلفة الشحن إلى 8 شواكل فقط، ومنح الزبون أمان المعاينة والمطابقة عند باب البيت.
        </p>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {policies.map((pol, idx) => (
          <article
            key={idx}
            className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs flex flex-col"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-xl bg-brand-card border border-brand-border/60 flex items-center justify-center text-brand-primary shrink-0">
                {pol.icon}
              </span>
              <h3 className="text-sm md:text-base font-extrabold text-brand-dark">
                {pol.title}
              </h3>
            </div>
            <p className="text-xs text-brand-muted leading-relaxed flex-1">
              {pol.desc}
            </p>
          </article>
        ))}
      </div>

      {/* WhatsApp Assistance Banner */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm md:text-base font-extrabold text-brand-dark mb-1">
            هل لديك استفسار حول طلب سابق أو ترغب في استبدال قطعة؟
          </h3>
          <p className="text-xs text-brand-muted">
            فريق خدمة عملاء سَدِيم الميداني متواجد يومياً لمساعدتك هاتفياً أو عبر واتساب من 8 صباحاً حتى 9 مساءً.
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
          <span>محادثة فورية عبر واتساب</span>
        </a>
      </div>
    </main>
  );
}
