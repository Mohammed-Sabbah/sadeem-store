'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ui/ProductCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { catalogService, type CatalogProduct } from '@/features/catalog/catalog.service';
import type { Product } from '@/types';

// Palette color mapper to give realistic swatch colors for known shade names
const COLOR_HEX_MAP: Record<string, string> = {
  'عسلي': '#B8621B',
  'عسلي سديمي': '#B8621B',
  'أسود': '#1C1917',
  'أسود فاحم': '#1C1917',
  'أسود منجنيزي فاخر': '#2B2420',
  'أبيض': '#FAF7F2',
  'أبيض عاجي': '#FAF7F2',
  'أخضر': '#2D5A42',
  'أخضر زيتي ملكي': '#5E6B4A',
  'أخضر صنوبري': '#2D5A42',
  'صلصال': '#A85A3C',
  'تراب الصلصال الدافئ': '#A85A3C',
  'بيج': '#D9CEBC',
  'بيج الفخار العاجي': '#D9CEBC',
  'ياقوتي': '#7C1E2D',
  'كحلي': '#0B1120',
  'رمادي': '#57534E',
  'ذهبي': '#B08D57',
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { addToCart } = useCart();
  const [product, setProduct] = useState<CatalogProduct | Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<(CatalogProduct | Product)[]>([]);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState('أخضر زيتي ملكي');
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [isWished, setIsWished] = useState(false);
  const [isAnonymousVendor, setIsAnonymousVendor] = useState(false);

  // Mobile Bottom Sheet States
  const [sizeDrawerOpen, setSizeDrawerOpen] = useState(false);
  const [specsDrawerOpen, setSpecsDrawerOpen] = useState(false);

  // In-app Toast State
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2600);
  };

  // Fetch product from backend or fallback to local mock
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    catalogService.getProduct(id)
      .then((item) => {
        if (!active) return;
        setProduct(item);
        setSelectedImage(item.image);
        if (item.variants && item.variants.length > 0) {
          const firstVariant = item.variants[0];
          if (firstVariant.attributes) {
            setSelectedAttributes(firstVariant.attributes);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        // Fallback gracefully to demo mock data
        const fallback = products.find((p) => p.id === id) || products[4];
        setProduct(fallback);
        setSelectedImage(fallback.image);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Sync anonymous vendor settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sadeem_merchant_products');
      if (raw && product) {
        const list = JSON.parse(raw);
        const match = list.find((item: any) => item._id === id || item._id === product.id);
        if (match && match.isAnonymousVendor !== undefined) {
          setIsAnonymousVendor(!!match.isAnonymousVendor);
        }
      }
    } catch {}
  }, [id, product]);

  // Fetch related products
  useEffect(() => {
    if (!product) return;
    let active = true;
    const catId = 'categoryId' in product ? product.categoryId : undefined;

    if (catId) {
      catalogService.getProducts({ categoryId: catId, excludeId: product.id })
        .then((items) => {
          if (!active) return;
          if (items.length > 0) {
            setRelatedProducts(items.slice(0, 4));
          } else {
            setRelatedProducts(products.filter((p) => p.id !== product.id).slice(0, 4));
          }
        })
        .catch(() => {
          if (active) {
            setRelatedProducts(products.filter((p) => p.id !== product.id).slice(0, 4));
          }
        });
    } else {
      setRelatedProducts(products.filter((p) => p.id !== product.id).slice(0, 4));
    }

    return () => {
      active = false;
    };
  }, [product]);

  // Derive active variant based on user selection
  const selectedVariant = useMemo(() => {
    if (!product || !('variants' in product) || !product.variants?.length) return null;
    const match = product.variants.find((v) =>
      Object.entries(selectedAttributes).every(([name, val]) => v.attributes[name] === val)
    );
    return match || product.variants[0];
  }, [product, selectedAttributes]);

  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentStock = selectedVariant?.stock ?? (product?.inStock ? 10 : 0);

  const gallery = useMemo(() => {
    if (!product) return ['/placeholder_product.svg'];
    if (product.gallery && product.gallery.length > 0) {
      const filtered = product.gallery.filter((img) => Boolean(img && img.trim()));
      if (filtered.length > 0) return filtered;
    }
    const hasCustomImage = Boolean(product.image && product.image.trim() && product.image !== '/placeholder_product.svg');
    if (hasCustomImage) {
      if (product.id === 'canaan-wool-hoodie') {
        return [
          product.image,
          '/canaan_product_hoodie_clay.jpg',
          '/canaan_product_hoodie_detail.jpg',
        ];
      }
      return [product.image];
    }
    return ['/placeholder_product.svg'];
  }, [product]);

  const handleQuantity = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (currentStock > 0 && next > currentStock) return currentStock;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      {
        ...product,
        price: currentPrice,
        variantId: selectedVariant?._id,
        variantAttributes: selectedAttributes,
      },
      quantity,
      selectedAttributes['اللون'] || selectedColor,
      selectedAttributes['المقاس'] || selectedSize,
      selectedVariant?._id
    );
    showToast(`✓ تمت إضافة (${quantity}) من "${product.title.substring(0, 22)}..." إلى السلة`);
  };

  const shareProduct = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: product?.title || 'سَدِيم',
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('✓ تم نسخ رابط المنتج إلى الحافظة بنجاح');
    }
  };

  const handleWishlistToggle = () => {
    const next = !isWished;
    setIsWished(next);
    showToast(next ? 'تم حفظ المنتج في المفضلة' : 'تمت الإزالة من المفضلة');
  };

  if (isLoading && !product) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 py-20 text-center font-almarai">
        <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-bold text-brand-muted">جارٍ جلب تفاصيل المنتج من خوادم سَدِيم...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 py-20 text-center font-almarai">
        <h2 className="text-base font-black text-brand-dark mb-2">عذراً، المنتج غير متوفر حالياً</h2>
        <p className="text-xs text-brand-muted mb-4">ربما انتهت كمية هذا المنتج أو تم إخفاؤه من قبل المتجر.</p>
        <Link href="/" className="inline-block px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold">
          العودة للمتجر الرئيسي
        </Link>
      </main>
    );
  }

  // Check if product has dynamic definitions from backend category
  const hasDynamicDefinitions = 'variantDefinitions' in product && product.variantDefinitions && product.variantDefinitions.length > 0;

  return (
    <>
      <main className="max-w-[1240px] mx-auto px-4 pt-4 pb-28 md:pb-16 font-almarai">
        {/* ===================================================================
            PDP TWO-COLUMN GRID (GALLERY & DETAILS)
            =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ===================================================================
              GALLERY: ADAPTIVE DESKTOP VERTICAL STRIP & MOBILE COMPACT SWIPE
              =================================================================== */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
            {/* Secondary Thumbnails (Desktop Vertical Strip) */}
            <div className="hidden md:flex flex-col gap-3 shrink-0 w-20">
              {gallery.map((img, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-white ${
                    selectedImage === img
                      ? 'border-brand-primary shadow-xs ring-1 ring-brand-primary'
                      : 'border-brand-border hover:border-brand-primary/50'
                  }`}
                  onClick={() => setSelectedImage(img)}
                  title="عرض الصورة"
                >
                  <img src={img} alt="صورة المنتج" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="flex-1 rounded-2xl overflow-hidden bg-white border border-brand-border flex items-center justify-center relative aspect-square max-h-[520px] shadow-xs">
              <img
                src={(selectedImage && selectedImage.trim()) || (product.image && product.image.trim()) || '/placeholder_product.svg'}
                alt={product.title}
                className="w-full h-full object-contain p-4"
              />

              {/* Delivery Guarantee Pill */}
              <div className="absolute top-3.5 start-3.5 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs text-brand-dark text-xs font-extrabold px-3 py-1 rounded-full shadow-xs border border-brand-border/60">
                <span className="w-2 h-2 rounded-full bg-brand-trust" />
                <span>طرد موحد 8 ₪ · فحص عند الباب</span>
              </div>
            </div>

            {/* Secondary Thumbnails (Mobile Horizontal Row) */}
            <div className="flex md:hidden gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {gallery.map((img, idx) => (
                <div
                  key={idx}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer bg-white ${
                    selectedImage === img
                      ? 'border-brand-primary shadow-xs ring-1 ring-brand-primary'
                      : 'border-brand-border'
                  }`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt="صورة المنتج" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* ===================================================================
              DETAILS & DECISION COLUMN
              =================================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-brand-surface p-5 sm:p-6 rounded-2xl border border-brand-border shadow-xs">

            {/* 1. ORIGIN OVERLINE (VENDOR BADGE & CITY OR ANONYMOUS SADEEM DIRECT SUPPLY) */}
            {isAnonymousVendor ? (
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                  <span className="w-2 h-2 rounded-full bg-brand-trust" title="توريد سَدِيم المباشر" />
                  <span className="text-brand-dark font-extrabold">توريد مباشر وموثق عبر سَدِيم</span>
                  <span className="text-brand-muted font-normal text-[11px]">(المحافظة الوسطى · فحص عند الباب)</span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-trust bg-brand-trust-soft px-2.5 py-1 rounded-full border border-brand-trust/30">
                  ضمان سَدِيم المباشر
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
                  <span className="w-2 h-2 rounded-full bg-brand-trust" title="متجر معتمد" />
                  <Link href={`/store/${product.vendor.id}`} className="hover:text-brand-primary transition-colors">
                    {product.vendor.name}
                  </Link>
                  <span className="text-brand-muted font-normal text-[11px]">({product.vendor.city} · موثق)</span>
                </div>

                <Link
                  href={`/store/${product.vendor.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary bg-[var(--brand-primary-soft)] px-2.5 py-1 rounded-full border border-[var(--brand-primary-border)] hover:bg-brand-primary hover:text-white transition-all"
                >
                  <span>زيارة المتجر</span>
                  <span className="text-xs">←</span>
                </Link>
              </div>
            )}

            {/* 2. PRODUCT TITLE ROW WITH INTEGRATED SHARE BUTTON */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg md:text-xl font-extrabold text-brand-dark leading-snug">
                {product.title}
              </h1>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-primary py-1 px-2.5 rounded-lg border border-brand-border bg-brand-surface cursor-pointer shrink-0 transition-colors"
                onClick={shareProduct}
                title="مشاركة رابط المنتج"
                aria-label="مشاركة رابط المنتج"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>مشاركة</span>
              </button>
            </div>

            {/* 3. SOCIAL PROOF & STOCK */}
            <div className="flex items-center gap-2 text-xs text-brand-muted flex-wrap">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 text-[var(--brand-glow,#B08D57)]">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <button
                  type="button"
                  className="font-bold text-brand-dark hover:text-brand-primary cursor-pointer transition-colors"
                  onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  ({product.reviewsCount || 142} تقييم موثق)
                </button>
              </div>
              <span className="text-stone-300">|</span>
              <span className={`font-bold flex items-center gap-1 ${currentStock > 0 ? 'text-brand-trust' : 'text-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStock > 0 ? 'bg-brand-trust' : 'bg-red-600'}`} />
                {currentStock > 0 ? `متوفر وجاهز للتوصيل (${currentStock})` : 'نفد المخزون مؤقتاً'}
              </span>
            </div>

            {/* 4. CLEAN PROMINENT PRICE ROW */}
            <div className="flex items-baseline gap-3 p-3 bg-brand-card rounded-xl border border-brand-border/40">
              <div className="text-2xl font-black text-brand-primary flex items-baseline gap-0.5">
                <span>{currentPrice}</span>
                <span className="text-sm font-bold">₪</span>
              </div>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <div className="text-sm text-brand-muted line-through flex items-baseline gap-0.5">
                  <span>{product.originalPrice}</span>
                  <span className="text-xs">₪</span>
                </div>
              )}
              {product.discountAmount && (
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  وفر {product.discountAmount} ₪
                </span>
              )}
            </div>

            {/* 5. SHORT EDITORIAL DESCRIPTION */}
            <p className="text-xs md:text-sm text-brand-muted leading-relaxed">
              {product.description ||
                'كنزة هودي شتوية ثقيلة وفخمة، مصممة بقصة مريحة (Relaxed Fit) منسوجة من خيوط القطن الفلسطيني الممشط بوزن 380 غرام لتمنحك الدفء والنعومة وتتحمل الاستخدام اليومي المتكرر.'}
            </p>

            {/* 6. SPECS & INSPECTION DRAWER TRIGGER */}
            <div>
              <button
                type="button"
                onClick={() => setSpecsDrawerOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-primary/50 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2 text-brand-dark">
                  <svg className="w-4 h-4 text-brand-trust" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>المواصفات الكاملة وميثاق المعاينة</span>
                </div>
                <div className="flex items-center gap-1 text-brand-muted text-[11px]">
                  <span>الخامة والضمان</span>
                  <span className="text-sm">‹</span>
                </div>
              </button>
            </div>

            {/* 7. DYNAMIC VARIANTS ACCORDING TO BACKEND DEFINITIONS */}
            {hasDynamicDefinitions ? (
              ('variantDefinitions' in product && product.variantDefinitions) ? (
                product.variantDefinitions.map((definition) => {
                  const values = definition.values || [];
                  const isColor = definition.name.includes('لون') || definition.name === 'اللون';
                  const isSize = definition.name.includes('مقاس') || definition.name === 'المقاس';
                  const currentSelected = selectedAttributes[definition.name] || values[0] || '';

                  return (
                    <div key={definition.name} className="border-t border-brand-border/60 pt-3">
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-brand-muted">{definition.name}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-brand-dark font-extrabold">{currentSelected}</span>
                          {isSize && (
                            <button
                              type="button"
                              className="text-brand-primary hover:underline cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                              onClick={() => setSizeDrawerOpen(true)}
                            >
                              <span>دليل المقاسات</span>
                              <span className="text-xs">‹</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {isColor ? (
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {values.map((val) => {
                            const isActive = currentSelected === val;
                            const hex = COLOR_HEX_MAP[val] || '#B8621B';
                            return (
                              <button
                                key={val}
                                type="button"
                                className={`w-8 h-8 rounded-full cursor-pointer transition-all border-2 border-white shadow-xs relative ${
                                  isActive ? 'ring-2 ring-brand-primary ring-offset-2 scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: hex }}
                                onClick={() => setSelectedAttributes((prev) => ({ ...prev, [definition.name]: val }))}
                                title={val}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          {values.map((val) => {
                            const isActive = currentSelected === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                className={`min-w-[44px] h-10 px-3.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center ${
                                  isActive
                                    ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                                    : 'bg-brand-surface text-brand-dark border-brand-border hover:border-brand-dark/50'
                                }`}
                                onClick={() => setSelectedAttributes((prev) => ({ ...prev, [definition.name]: val }))}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : null
            ) : (
              /* Fallback Static Swatches when no backend definitions exist */
              <>
                {/* COLORS SECTION */}
                <div className="border-t border-brand-border/60 pt-3">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-brand-muted">اللون المختار:</span>
                    <span className="text-brand-dark font-extrabold">{selectedColor}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {[
                      { name: 'أخضر زيتي ملكي', hex: '#5E6B4A', imgIndex: 0 },
                      { name: 'تراب الصلصال الدافئ', hex: '#A85A3C', imgIndex: 1 },
                      { name: 'أسود منجنيزي فاخر', hex: '#2B2420', imgIndex: 0 },
                      { name: 'بيج الفخار العاجي', hex: '#D9CEBC', imgIndex: 0 },
                    ].map((color) => {
                      const isActive = selectedColor === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          className={`w-8 h-8 rounded-full cursor-pointer transition-all border-2 border-white shadow-xs ${
                            isActive ? 'ring-2 ring-brand-primary ring-offset-2 scale-105' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          onClick={() => {
                            setSelectedColor(color.name);
                            if (gallery[color.imgIndex]) setSelectedImage(gallery[color.imgIndex]);
                          }}
                          title={color.name}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* SIZES HORIZONTAL CHIPS */}
                <div className="border-t border-brand-border/60 pt-3">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-brand-muted">المقاس:</span>
                      <span className="text-brand-dark font-extrabold">{selectedSize}</span>
                    </div>
                    <button
                      type="button"
                      className="text-brand-primary hover:underline cursor-pointer flex items-center gap-1 text-xs font-bold"
                      onClick={() => setSizeDrawerOpen(true)}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21.3 15.3l-8.6-8.6a1 1 0 0 0-1.4 0l-8.6 8.6a1 1 0 0 0 0 1.4l2.8 2.8a1 1 0 0 0 1.4 0l8.6-8.6a1 1 0 0 0 0-1.4l-2.8-2.8" />
                        <line x1="7" y1="17" x2="9" y2="15" />
                        <line x1="11" y1="13" x2="13" y2="11" />
                        <line x1="15" y1="9" x2="17" y2="7" />
                      </svg>
                      <span>دليل المقاسات</span>
                      <span className="text-sm">‹</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((s) => {
                      const isActive = selectedSize === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`min-w-[44px] h-10 px-3.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center ${
                            isActive
                              ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                              : 'bg-brand-surface text-brand-dark border-brand-border hover:border-brand-dark/50'
                          }`}
                          onClick={() => setSelectedSize(s)}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* 8. DESKTOP PRIMARY BUY CTA & WISHLIST ROW */}
            <div className="hidden md:flex items-center gap-3 pt-4 border-t border-brand-border/60">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-brand-border rounded-lg bg-brand-card p-1 shrink-0">
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-brand-dark hover:bg-black/5 rounded cursor-pointer transition-colors"
                  onClick={() => handleQuantity(-1)}
                  aria-label="تقليل الكمية"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-extrabold text-brand-dark">{quantity}</span>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-brand-dark hover:bg-black/5 rounded cursor-pointer transition-colors"
                  onClick={() => handleQuantity(1)}
                  aria-label="زيادة الكمية"
                >
                  +
                </button>
              </div>

              {/* Dominant Primary CTA */}
              <button
                type="button"
                disabled={currentStock <= 0}
                className="flex-1 h-11 bg-brand-primary text-white hover:brightness-110 disabled:opacity-50 rounded-lg text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                onClick={handleAddToCart}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>{currentStock > 0 ? `أضف إلى السلة الموحدة — ${currentPrice * quantity} ₪` : 'نفد المخزون'}</span>
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                className="w-11 h-11 rounded-lg border border-brand-border bg-brand-surface hover:border-brand-primary flex items-center justify-center text-brand-muted hover:text-brand-primary transition-all cursor-pointer shrink-0"
                onClick={handleWishlistToggle}
                title="إضافة للمفضلة"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill={isWished ? 'var(--brand-primary)' : 'none'}
                  stroke={isWished ? 'var(--brand-primary)' : 'currentColor'}
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* 9. SERENE EDITORIAL TRUST REASSURANCE */}
            <div className="space-y-2 pt-3 border-t border-brand-border/60 text-xs text-brand-muted">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>معاينة وتجربة القياس عند الباب قبل الدفع</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>طرد موحد لكافة الوسطى (8 ₪ ثابت)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-card text-brand-dark border border-brand-border/60">
                  كاش أو جوال باي
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>استبدال فوري مجاني للمقاس خلال 3 أيام</span>
              </div>
            </div>

          </div>
        </div>

        {/* ===================================================================
            REVIEWS SECTION
            =================================================================== */}
        <section className="mt-10 pt-8 border-t border-brand-border" id="reviews-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-brand-dark">تقييمات وتجارب المشترين</h3>
              <p className="text-xs text-brand-muted mt-0.5">{product.reviewsCount || 142} تجربة شراء موثقة من زبائن المحافظة الوسطى</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-xs font-bold text-brand-dark hover:border-brand-primary transition-colors cursor-pointer self-start sm:self-auto"
              onClick={() => showToast('نموذج إضافة تجربة شراء سيتوفر قريباً للمشترين الموثقين')}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>أضف تجربتك</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Summary Box */}
            <div className="md:col-span-4 p-5 bg-brand-surface border border-brand-border rounded-2xl shadow-xs flex flex-col items-center text-center justify-center">
              <div className="text-4xl font-black text-brand-dark mb-1">{product.rating || '4.9'}</div>
              <div className="flex items-center gap-1 text-[var(--brand-glow,#B08D57)] mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-bold text-brand-trust mb-4">✓ 98% يوصون بهذا المنتج</span>

              <div className="w-full space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-start text-brand-muted">5 نجوم</span>
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--brand-glow,#B08D57)] rounded-full w-[88%]" />
                  </div>
                  <span className="w-8 text-end font-bold text-brand-dark">88%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-start text-brand-muted">4 نجوم</span>
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--brand-glow,#B08D57)] rounded-full w-[10%]" />
                  </div>
                  <span className="w-8 text-end font-bold text-brand-dark">10%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-start text-brand-muted">3 نجوم</span>
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--brand-glow,#B08D57)] rounded-full w-[2%]" />
                  </div>
                  <span className="w-8 text-end font-bold text-brand-dark">2%</span>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="md:col-span-8 space-y-3">
              <div className="p-4 bg-brand-surface border border-brand-border rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-dark">أحمد سلامة</span>
                    <span className="text-[11px] text-brand-muted">· دير البلح</span>
                  </div>
                  <span className="text-[11px] text-brand-muted">منذ 3 أيام</span>
                </div>
                <div className="flex items-center gap-0.5 text-[var(--brand-glow,#B08D57)] mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-brand-muted leading-relaxed">
                  الخامة ثقيلة بوزن شتوي محترم وبطانة الفليس دافية جداً. جربت المقاس L عند الباب وكان Relaxed مريح ومظبوط بالمللي. التوصيل بـ 8 شيكل مع راوتر كنت طالبه من متجر ثاني وصلوا بنفس الطرد الموحد، فكرة ممتازة وتستحق الدعم.
                </p>
              </div>

              <div className="p-4 bg-brand-surface border border-brand-border rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-dark">م. خليل إبراهيم</span>
                    <span className="text-[11px] text-brand-muted">· مخيم النصيرات</span>
                  </div>
                  <span className="text-[11px] text-brand-muted">منذ 5 أيام</span>
                </div>
                <div className="flex items-center gap-0.5 text-[var(--brand-glow,#B08D57)] mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-brand-muted leading-relaxed">
                  غطاء الرأس مبطن بطبقتين حقيقيات وثابت على الراس، حبال الهودي نهاياتها معدن مش بلاستيك. فخر والله صناعة غزة بهالمستوى الفخم.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SIMILAR PRODUCTS
            =================================================================== */}
        <section className="mt-10 pt-8 border-t border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-brand-primary" />
                <span>منتجات من الفئة نفسها</span>
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">خيارات تضاف لنفس طرد سَدِيم الموحد (8 ₪)</p>
            </div>
            <Link href="/explore" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
              <span>مشاهدة الكل</span>
              <span className="text-sm">←</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>

      {/* =====================================================================
          MOBILE STICKY ACTION DOCK (FLOATS OVER PWA BOTTOM NAV)
          ===================================================================== */}
      <aside className="fixed bottom-16 inset-x-0 z-40 bg-brand-surface/95 backdrop-blur-md border-t border-brand-border p-3 md:hidden shadow-lg" aria-label="شريط الشراء السريع">
        <div className="max-w-md mx-auto flex items-center gap-2.5">
          {/* Price & Guarantee Column */}
          <div className="shrink-0">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-brand-dark">
                {currentPrice * quantity}
              </span>
              <span className="text-xs font-bold text-brand-dark">₪</span>
            </div>
            <span className="text-[10px] text-brand-trust font-bold block">
              معاينة عند الباب
            </span>
          </div>

          {/* Stepper */}
          <div className="flex items-center border border-brand-border rounded-lg bg-brand-card p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleQuantity(-1)}
              className="w-7 h-7 flex items-center justify-center text-sm font-bold text-brand-dark cursor-pointer"
            >
              −
            </button>
            <span className="w-5 text-center text-xs font-extrabold text-brand-dark">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantity(1)}
              className="w-7 h-7 flex items-center justify-center text-sm font-bold text-brand-dark cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Primary Add to Cart Button */}
          <button
            type="button"
            disabled={currentStock <= 0}
            onClick={handleAddToCart}
            className="flex-1 h-11 bg-brand-primary text-white hover:brightness-110 disabled:opacity-50 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>{currentStock > 0 ? 'أضف للسلة الموحدة' : 'نفد المخزون'}</span>
          </button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            className="w-11 h-11 rounded-lg border border-brand-border bg-brand-surface flex items-center justify-center text-brand-muted hover:text-brand-primary cursor-pointer shrink-0 transition-colors"
            title="حفظ في المفضلة"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill={isWished ? 'var(--brand-primary)' : 'none'}
              stroke={isWished ? 'var(--brand-primary)' : 'currentColor'}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* =====================================================================
          BOTTOM SHEET DRAWER 1: SIZE GUIDE
          ===================================================================== */}
      <BottomSheet
        isOpen={sizeDrawerOpen}
        onClose={() => setSizeDrawerOpen(false)}
        title="دليل المقاسات ومطابقة القياس"
      >
        <p className="text-xs text-brand-muted mb-4">
          القصة معتمدة بأسلوب (Relaxed Fit) مريح وفضفاض يناسب الاستخدام الشتوي واليومي:
        </p>

        <div className="overflow-x-auto mb-4 border border-brand-border rounded-xl">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-brand-card border-b border-brand-border">
                <th className="p-2 font-bold text-brand-dark">المقاس</th>
                <th className="p-2 font-bold text-brand-dark">الوزن التقريبي</th>
                <th className="p-2 font-bold text-brand-dark">محيط الصدر</th>
                <th className="p-2 font-bold text-brand-dark">الطول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              <tr>
                <td className="p-2 font-extrabold">S</td>
                <td className="p-2 text-brand-muted">50 - 65 كجم</td>
                <td className="p-2 text-brand-muted">102 سم</td>
                <td className="p-2 text-brand-muted">68 سم</td>
              </tr>
              <tr>
                <td className="p-2 font-extrabold">M</td>
                <td className="p-2 text-brand-muted">65 - 75 كجم</td>
                <td className="p-2 text-brand-muted">108 سم</td>
                <td className="p-2 text-brand-muted">70 سم</td>
              </tr>
              <tr className="bg-[var(--brand-primary-soft)] font-bold text-brand-primary">
                <td className="p-2 font-extrabold">L (المختار)</td>
                <td className="p-2">75 - 85 كجم</td>
                <td className="p-2">114 سم</td>
                <td className="p-2">72 سم</td>
              </tr>
              <tr>
                <td className="p-2 font-extrabold">XL</td>
                <td className="p-2 text-brand-muted">85 - 95 كجم</td>
                <td className="p-2 text-brand-muted">120 سم</td>
                <td className="p-2 text-brand-muted">74 سم</td>
              </tr>
              <tr>
                <td className="p-2 font-extrabold">XXL</td>
                <td className="p-2 text-brand-muted">95 - 110 كجم</td>
                <td className="p-2 text-brand-muted">126 سم</td>
                <td className="p-2 text-brand-muted">76 سم</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Reassurance Note */}
        <div className="bg-[var(--brand-trust-soft)] border border-[var(--brand-trust-border)] rounded-xl p-3.5 text-xs text-brand-dark leading-relaxed">
          <strong className="text-brand-trust block mb-1">
            ✓ ميزة تجربة القياس عند الباب:
          </strong>
          يحق لك ارتداء وتجربة الكنزة عند باب بيتك بحضور المندوب قبل الدفع، ويمكنك طلب مقاسين لاختيار الأنسب وإرجاع الآخر فوراً مجاناً.
        </div>
      </BottomSheet>

      {/* =====================================================================
          BOTTOM SHEET DRAWER 2: SPECS & INSPECTION CHARTER
          ===================================================================== */}
      <BottomSheet
        isOpen={specsDrawerOpen}
        onClose={() => setSpecsDrawerOpen(false)}
        title="المواصفات وميثاق المعاينة"
      >
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center p-2.5 bg-brand-card rounded-lg text-xs">
            <span className="text-brand-muted">النسيج والخامة:</span>
            <strong className="text-brand-dark">قطن 100% فلسطيني ممشط بوزن 380 GSM</strong>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-brand-card rounded-lg text-xs">
            <span className="text-brand-muted">البطانة الداخلية:</span>
            <strong className="text-brand-dark">فليس ناعم مدفئ ومعالج ضد الوبر</strong>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-brand-card rounded-lg text-xs">
            <span className="text-brand-muted">المتجر والمنشأ:</span>
            <strong className="text-brand-dark">{product.vendor.name} · {product.vendor.city}</strong>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-brand-card rounded-lg text-xs">
            <span className="text-brand-muted">التوصيل الموحد:</span>
            <strong className="text-brand-dark">طرد موحد لكافة الوسطى (8 ₪ ثابت)</strong>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-xs leading-relaxed">
          <h4 className="font-extrabold text-brand-dark mb-2">
            ميثاق المعاينة والاستبدال
          </h4>
          <p className="text-brand-muted mb-1.5">
            1. فحص الخامة وتجربة القياس مكفول بالكامل عند باب البيت قبل تسليم أي شيكل للمندوب.
          </p>
          <p className="text-brand-muted mb-1.5">
            2. استبدال مجاني للمقاس خلال 3 أيام عبر مندوب سَدِيم الميداني.
          </p>
          <p className="text-brand-muted">
            3. سداد نقدي (كاش) عند الباب أو عبر محفظة جوال باي أو محفظة سَدِيم الرقمية.
          </p>
        </div>
      </BottomSheet>

      {/* Sadeem Toast Component */}
      <div
        className={`fixed bottom-20 md:bottom-6 start-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all duration-300 pointer-events-none ${
          toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        {toastMsg}
      </div>
    </>
  );
}
