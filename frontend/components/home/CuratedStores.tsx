import React from 'react';
import Link from 'next/link';

export function CuratedStores() {
  const stores = [
    {
      id: 'nuseirat-press',
      name: 'معاصر النصيرات الحديثة',
      city: 'النصيرات — شارع السوق',
      desc: 'مؤونة ريفية وزيت زيتون رومي معمر في خوابي فخار',
      image: '/canaan_store_olive_1788865126935.jpg',
      rating: '5.0',
      orders: '64 طلب',
    },
    {
      id: 'oasis-energy',
      name: 'واحة الطاقة والبدائل',
      city: 'دير البلح — شارع النخيل',
      desc: 'راوترات 4G متنقلة ومحطات طاقة ليثيوم وبطاريات',
      image: '/canaan_store_energy_1788865153153.jpg',
      rating: '4.9',
      orders: '82 طلب',
    },
    {
      id: 'canaan-pottery',
      name: 'خزفيات وحرف سَدِيم التراثية',
      city: 'المغازي — حارة الحرفيين',
      desc: 'خزفيات وأوانٍ فخارية وحجرية تراثية أصيلة تخلد فنون الأرض',
      image: '/canaan_store_pottery_1788865183231.jpg',
      rating: '4.8',
      orders: '44 طلب',
    },
  ];

  return (
    <section className="max-w-[1240px] mx-auto px-4 py-4 w-full font-almarai" aria-labelledby="stores-head">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2" id="stores-head">
          <span className="w-1 h-4 rounded-full bg-brand-primary" />
          <span>المتاجر المعتمدة</span>
        </h2>
        <Link href="/explore" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
          <span>دليل كافة المتاجر (18)</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/store/${store.id}`}
            className="flex flex-col bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group"
          >
            <div className="relative w-full h-40 overflow-hidden bg-stone-900">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                src={store.image}
                alt={store.name}
                loading="lazy"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-brand-trust font-bold mb-1.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>معتمد</span>
                <span className="opacity-40 text-brand-muted">•</span>
                <span className="text-brand-muted font-normal">{store.city}</span>
              </div>
              <h3 className="text-sm md:text-base font-extrabold text-brand-dark group-hover:text-brand-primary transition-colors mb-1">
                {store.name}
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed mb-3 line-clamp-2 flex-1">
                {store.desc}
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-brand-border/60">
                <div className="flex items-center gap-1 text-xs font-extrabold text-brand-dark">
                  <svg className="w-3 h-3 text-[var(--brand-glow,#B08D57)] fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>{store.rating}</span>
                  <span className="text-[10px] text-brand-muted font-normal">({store.orders})</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust border border-[var(--brand-trust-border)]">
                  طرد موحد 8 ₪
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
