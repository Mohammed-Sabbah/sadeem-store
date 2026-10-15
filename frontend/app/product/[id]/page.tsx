'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ui/ProductCard';
import { catalogService, type CatalogProduct } from '@/features/catalog/catalog.service';

export default function ProductDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { addToCart } = useCart();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setIsLoading(true);
    setErrorMessage(null);
    catalogService.getProduct(id)
      .then((result) => {
        if (!active) return;
        setProduct(result);
        setSelectedImage(result.image);
        const initialVariant = result.variants.find((variant) => variant.stock > 0) || result.variants[0];
        setSelectedAttributes(initialVariant?.attributes || {});
        setQuantity(1);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setProduct(null);
        setErrorMessage(error instanceof Error ? error.message : 'تعذر تحميل المنتج');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product?.categoryId) return;
    let active = true;
    catalogService.getProducts({ categoryId: product.categoryId, excludeId: product.id })
      .then((items) => {
        if (active) setRelatedProducts(items.slice(0, 4));
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'تعذر تحميل المنتجات المشابهة');
      });
    return () => {
      active = false;
    };
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((variant) =>
      Object.entries(selectedAttributes).every(([name, value]) => variant.attributes[name] === value)
    ) || product.variants[0] || null;
  }, [product, selectedAttributes]);

  const showToast = () => {
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 2500);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant || selectedVariant.stock < quantity) return;
    addToCart(
      {
        ...product,
        price: selectedVariant.price,
        variantId: selectedVariant._id,
        variantAttributes: selectedVariant.attributes,
      },
      quantity,
      undefined,
      undefined,
      selectedVariant._id
    );
    showToast();
  };

  if (isLoading) {
    return <main className="max-w-[1240px] mx-auto px-4 py-16 text-center font-almarai">جارٍ تحميل المنتج...</main>;
  }
  if (!product) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 py-16 text-center font-almarai">
        <p role="alert" className="text-brand-muted">{errorMessage || 'المنتج غير متاح'}</p>
        <Link href="/" className="inline-block mt-4 text-brand-primary font-bold">العودة للرئيسية</Link>
      </main>
    );
  }

  const stock = selectedVariant?.stock || 0;

  return (
    <>
      <main className="max-w-[1240px] mx-auto px-4 pt-4 pb-28 md:pb-16 font-almarai">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden bg-white border border-brand-border aspect-square max-h-[520px]">
              <img src={selectedImage || product.image} alt={product.title} className="w-full h-full object-contain p-4" />
            </div>
          </div>

          <section className="lg:col-span-5 flex flex-col gap-4 bg-brand-surface p-5 sm:p-6 rounded-2xl border border-brand-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
              <Link href={`/store/${product.vendor.id}`} className="text-xs font-bold text-brand-primary hover:underline">
                {product.vendor.name}
              </Link>
              <span className="text-xs text-brand-muted">{product.category}</span>
            </div>

            <h1 className="text-lg md:text-xl font-extrabold text-brand-dark leading-snug">{product.title}</h1>
            <p className="text-xs md:text-sm text-brand-muted leading-relaxed">{product.description}</p>

            {product.variantDefinitions.map((definition) => {
              const values = Array.from(new Set(product.variants
                .map((variant) => variant.attributes[definition.name])
                .filter((value): value is string => Boolean(value))));
              return (
                <div key={definition.name} className="border-t border-brand-border/60 pt-3">
                  <div className="text-xs font-bold text-brand-muted mb-2">
                    {definition.name}: <span className="text-brand-dark">{selectedAttributes[definition.name] || 'اختر قيمة'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {values.map((value) => {
                      const active = selectedAttributes[definition.name] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          className={`min-h-10 px-3.5 rounded-lg text-xs font-extrabold border transition-all ${
                            active
                              ? 'bg-brand-dark text-white border-brand-dark'
                              : 'bg-brand-surface text-brand-dark border-brand-border hover:border-brand-dark/50'
                          }`}
                          onClick={() => setSelectedAttributes((current) => ({ ...current, [definition.name]: value }))}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between p-3 bg-brand-card rounded-xl border border-brand-border/40">
              <div className="text-2xl font-black text-brand-primary">
                {selectedVariant?.price ?? product.price} <span className="text-sm font-bold">₪</span>
              </div>
              <span className={`text-xs font-bold ${stock > 0 ? 'text-brand-trust' : 'text-red-600'}`}>
                {stock > 0 ? `متوفر (${stock})` : 'نفد المخزون'}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-brand-border rounded-lg bg-brand-card p-1">
                <button
                  type="button"
                  className="w-8 h-8 text-sm font-bold text-brand-dark"
                  aria-label="تقليل الكمية"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                >−</button>
                <span className="w-8 text-center text-sm font-extrabold">{quantity}</span>
                <button
                  type="button"
                  className="w-8 h-8 text-sm font-bold text-brand-dark disabled:opacity-40"
                  aria-label="زيادة الكمية"
                  disabled={quantity >= stock}
                  onClick={() => setQuantity((current) => Math.min(stock, current + 1))}
                >+</button>
              </div>
              <button
                type="button"
                disabled={!selectedVariant || stock === 0}
                className="flex-1 h-11 bg-brand-primary text-white hover:brightness-110 disabled:opacity-50 rounded-lg text-xs md:text-sm font-extrabold shadow-xs"
                onClick={handleAddToCart}
              >
                أضف إلى السلة — {(selectedVariant?.price || 0) * quantity} ₪
              </button>
            </div>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-10 pt-8 border-t border-brand-border">
            <h2 className="text-base md:text-lg font-extrabold text-brand-dark mb-4">منتجات من التصنيف نفسه</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} showWishlist={false} />
              ))}
            </div>
          </section>
        )}
      </main>
      {toastVisible && (
        <div role="status" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-brand-dark text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
          تمت إضافة المنتج المحدد إلى السلة
        </div>
      )}
    </>
  );
}
