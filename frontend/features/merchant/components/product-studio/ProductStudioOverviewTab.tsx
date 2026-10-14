import React from 'react';
import {
  IconPackage,
  IconCurrencyShekel,
  IconStarSolid,
  IconShieldCheck,
  IconArrowRight,
  IconCheck,
} from './ProductStudioIcons';
import { SAMPLE_REVIEWS, type StudioTab } from './ProductStudioTypes';
import type { VariantItemState } from '../../hooks/useProductStudio';
import { merchantService } from '@/features/merchant/services/merchant.service';

interface ProductStudioOverviewTabProps {
  productId: string;
  name: string;
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  primaryImage: string;
  isSimple: boolean;
  simplePrice: number | string;
  simpleStock: number | string;
  simpleSku: string;
  setSimpleStock: (val: number | string) => void;
  variants: VariantItemState[];
  handleQuickDeltaStock: (variantId: string | undefined, delta: number) => void;
  setActiveTab: (tab: StudioTab) => void;
}

export function ProductStudioOverviewTab({
  productId,
  name,
  totalStock,
  minPrice,
  maxPrice,
  primaryImage,
  isSimple,
  simplePrice,
  simpleStock,
  simpleSku,
  setSimpleStock,
  variants,
  handleQuickDeltaStock,
  setActiveTab,
}: ProductStudioOverviewTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn font-almarai text-right">
      {/* Key Metrics Cards (Apple Design, Zero Emojis) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>المخزون الإجمالي</span>
            <IconPackage className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-dark">
            {totalStock}{' '}
            <span className="text-xs font-normal text-brand-muted">قطعة</span>
          </div>
          <div className="text-[11px] text-brand-muted mt-1">
            {totalStock > 0 ? 'متاح للطلب المباشر في الوسطى' : 'نفد المخزون حالياً'}
          </div>
        </div>

        <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>نطاق الأسعار</span>
            <IconCurrencyShekel className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-dark">
            {minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} - ${maxPrice} ₪`}
          </div>
          <div className="text-[11px] text-brand-muted mt-1">شامل عمولة سَدِيم</div>
        </div>

        <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>تقييم الزبائن</span>
            <IconStarSolid className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-dark flex items-center gap-1.5">
            <span>4.8</span>
            <span className="text-xs font-normal text-brand-muted">من 5</span>
          </div>
          <div className="text-[11px] text-brand-trust mt-1">100% نسبة رضا المشترين</div>
        </div>

        <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
            <span>أمان الشحنة</span>
            <IconShieldCheck className="w-4 h-4 text-brand-trust" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-trust">طرد موحد</div>
          <div className="text-[11px] text-brand-muted mt-1">توصيل 8 ₪ ومعاينة عند الباب</div>
        </div>
      </div>

      {/* Quick Variants Inventory Snapshot */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
          <div>
            <h2 className="text-sm font-black text-brand-dark">
              حالة توفر الأصناف في المستودع
            </h2>
            <p className="text-[11px] text-brand-muted mt-0.5">
              تعديل سريع للمخزون بدون الحاجة للدخول للمحرر
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer"
          >
            <span>إدارة كامل الخيارات</span>
            <IconArrowRight className="w-3 h-3" />
          </button>
        </div>

        {isSimple ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface/30 border border-brand-border/60">
            <div className="flex items-center gap-3">
              <img
                src={primaryImage}
                alt={name}
                className="w-12 h-12 rounded-xl object-cover border border-brand-border/60 shrink-0 bg-brand-surface"
              />
              <div>
                <div className="text-xs font-black text-brand-dark">{name}</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  صنف مفرد بسعر {simplePrice} ₪ · كود:{' '}
                  <span className="font-mono">{simpleSku || 'SDM-DEFAULT'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-brand-card p-1 rounded-xl border border-brand-border/60 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  const cur = Math.max(0, Number(simpleStock) - 1);
                  setSimpleStock(cur);
                  merchantService.quickUpdateStock(productId, cur);
                }}
                className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
              >
                -
              </button>
              <span className="w-8 text-center font-black text-xs text-brand-dark tabular-nums">
                {simpleStock}
              </span>
              <button
                type="button"
                onClick={() => {
                  const cur = Number(simpleStock) + 1;
                  setSimpleStock(cur);
                  merchantService.quickUpdateStock(productId, cur);
                }}
                className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {variants.map((v, vIdx) => {
              const attrSummary =
                Object.entries(v.attributes || {})
                  .map(([_, val]) => val)
                  .join(' · ') || 'افتراضي';

              const variantPhoto =
                v.images && v.images.length > 0 ? v.images[0] : primaryImage;

              return (
                <div
                  key={v._id || vIdx}
                  className="bg-brand-surface/30 rounded-xl p-3.5 border border-brand-border/60 flex items-center justify-between gap-3 hover:bg-brand-surface/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={variantPhoto}
                      alt={attrSummary}
                      className="w-11 h-11 rounded-xl object-cover border border-brand-border/60 shrink-0 bg-brand-surface"
                    />
                    <div>
                      <div className="text-xs font-black text-brand-dark">{attrSummary}</div>
                      <div className="text-[10px] text-brand-muted mt-0.5">
                        {v.price} ₪ · <span className="font-mono">{v.sku}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-brand-card p-1 rounded-xl border border-brand-border/60 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickDeltaStock(v._id || v.sku, -1)}
                      className="w-7 h-7 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                      title="إنقاص المخزون قطعة واحدة"
                    >
                      -
                    </button>
                    <span
                      className={`w-7 text-center font-black text-xs tabular-nums ${
                        v.stock === 0 ? 'text-red-600' : 'text-brand-dark'
                      }`}
                    >
                      {v.stock}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickDeltaStock(v._id || v.sku, 1)}
                      className="w-7 h-7 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                      title="زيادة المخزون قطعة واحدة"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Reviews & Feedback Section */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-brand-border/40">
          <div>
            <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
              <IconStarSolid className="w-4 h-4 text-amber-500" />
              <span>تقييمات ومعاينة الزبائن</span>
            </h2>
            <p className="text-[11px] text-brand-muted mt-0.5">
              انطباعات موثقة من زبائن استلموا وعاينوا هذا الصنف عند باب المنزل في المحافظة الوسطى
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-brand-surface/70 px-3 py-1.5 rounded-xl border border-brand-border/70 text-xs">
            <span className="text-sm font-black text-brand-dark">4.8</span>
            <div className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStarSolid key={i} className="w-3 h-3 text-amber-500" />
              ))}
            </div>
            <span className="text-[11px] text-brand-muted font-bold mr-1">
              • {SAMPLE_REVIEWS.length} تقييمات
            </span>
          </div>
        </div>

        <div className="divide-y divide-brand-border/40">
          {SAMPLE_REVIEWS.map((rev) => (
            <div key={rev.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-brand-dark">{rev.authorName}</span>
                  <span className="text-brand-muted/40">•</span>
                  <span className="text-[11px] text-brand-muted">{rev.city}</span>
                  {rev.verifiedPurchase && (
                    <>
                      <span className="text-brand-muted/40">•</span>
                      <span className="text-[11px] font-bold text-brand-trust flex items-center gap-0.5">
                        <IconCheck className="w-3 h-3" />
                        <span>معاينة مؤكدة</span>
                      </span>
                    </>
                  )}
                  <span className="text-brand-muted/40">•</span>
                  <span className="text-[11px] text-brand-muted">{rev.date}</span>
                </div>

                <div className="flex items-center gap-0.5 text-amber-500 self-start sm:self-auto">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <IconStarSolid key={i} className="w-3 h-3" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-brand-dark/90 leading-relaxed font-normal">
                {rev.comment}
              </p>

              {rev.variantSummary && (
                <div className="text-[10px] text-brand-muted flex items-center gap-1.5 pt-0.5">
                  <span className="font-medium text-brand-muted/70">المواصفات المشتراة:</span>
                  <span className="font-bold text-brand-dark/80 bg-brand-surface/80 px-2 py-0.5 rounded-md border border-brand-border/50">
                    {rev.variantSummary}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
