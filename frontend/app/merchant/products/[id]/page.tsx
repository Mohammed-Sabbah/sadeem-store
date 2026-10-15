'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  sellerProductService,
  type SellerCategory,
  type SellerProduct,
  type SellerVariant,
} from '@/features/merchant/services/product.service';

export default function MerchantProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variantEdits, setVariantEdits] = useState<Record<string, SellerVariant>>({});
  const [newVariantAttributes, setNewVariantAttributes] = useState<Record<string, string>>({});
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const currentCategoryId = product
    ? (typeof product.categoryId === 'string' ? product.categoryId : product.categoryId._id)
    : '';
  const currentCategory = categories.find((category) => category._id === categoryId)
    || (product && typeof product.categoryId === 'object' ? product.categoryId : null);
  const definitions = currentCategory?.variantAttributes || [];

  const loadProduct = async () => {
    const [item, categoryItems] = await Promise.all([
      sellerProductService.getProduct(productId),
      sellerProductService.getCategories(),
    ]);
    setProduct(item);
    setCategories(categoryItems);
    setTitle(item.title);
    setDescription(item.description || '');
    setImage(item.image);
    const selectedCategoryId = typeof item.categoryId === 'string' ? item.categoryId : item.categoryId._id;
    setCategoryId(selectedCategoryId);
    setVariantEdits(Object.fromEntries(item.variants.map((variant) => [variant._id, variant])));
  };

  useEffect(() => {
    if (!productId) return;
    let active = true;
    setIsLoading(true);
    Promise.all([
      sellerProductService.getProduct(productId),
      sellerProductService.getCategories(),
    ])
      .then(([item, categoryItems]) => {
        if (!active) return;
        setProduct(item);
        setCategories(categoryItems);
        setTitle(item.title);
        setDescription(item.description || '');
        setImage(item.image);
        const selectedCategoryId = typeof item.categoryId === 'string' ? item.categoryId : item.categoryId._id;
        setCategoryId(selectedCategoryId);
        setVariantEdits(Object.fromEntries(item.variants.map((variant) => [variant._id, variant])));
      })
      .catch((error: unknown) => {
        if (active) setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر تحميل المنتج' });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  const sortedVariants = useMemo(
    () => product?.variants.map((variant) => variantEdits[variant._id] || variant) || [],
    [product, variantEdits]
  );

  const saveChanges = async () => {
    if (!product) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const productUpdates: Record<string, string> = {};
      if (title.trim() !== product.title) productUpdates.title = title.trim();
      if (description !== (product.description || '')) productUpdates.description = description;
      if (image.trim() !== product.image) productUpdates.image = image.trim();
      if (categoryId !== currentCategoryId) productUpdates.categoryId = categoryId;

      if (Object.keys(productUpdates).length > 0) {
        await sellerProductService.updateProduct(productId, productUpdates);
      }
      for (const variant of sortedVariants) {
        const original = product.variants.find((item) => item._id === variant._id);
        if (!original) continue;
        if (
          original.price !== variant.price ||
          original.stock !== variant.stock ||
          JSON.stringify(original.attributes) !== JSON.stringify(variant.attributes)
        ) {
          await sellerProductService.updateVariant(productId, variant._id, {
            price: Number(variant.price),
            stock: Number(variant.stock),
            attributes: variant.attributes,
          });
        }
      }
      await loadProduct();
      setMessage({ type: 'success', text: 'تم حفظ تغييرات المنتج' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر حفظ التغييرات' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!product) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await sellerProductService.updateStatus(
        productId,
        product.status === 'active' ? 'inActive' : 'active'
      );
      setProduct(updated);
      setMessage({ type: 'success', text: 'تم تحديث حالة المنتج' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر تحديث حالة المنتج' });
    } finally {
      setIsSaving(false);
    }
  };

  const createVariant = async () => {
    const price = Number(newVariantPrice);
    const stock = Number(newVariantStock);
    if (!Number.isFinite(price) || price < 0.01 || !Number.isInteger(stock) || stock < 0) {
      setMessage({ type: 'error', text: 'أدخل سعراً أكبر من صفر ومخزوناً صحيحاً غير سالب' });
      return;
    }
    if (definitions.some((definition) => !newVariantAttributes[definition.name])) {
      setMessage({ type: 'error', text: 'اختر قيمة لكل خاصية مطلوبة' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await sellerProductService.createVariant(productId, {
        attributes: newVariantAttributes,
        price,
        stock,
      });
      setProduct(updated);
      setVariantEdits(Object.fromEntries(updated.variants.map((variant) => [variant._id, variant])));
      setNewVariantAttributes({});
      setNewVariantPrice('');
      setNewVariantStock('0');
      setMessage({ type: 'success', text: 'تمت إضافة المتغير' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر إضافة المتغير' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVariant = async (variantId: string) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await sellerProductService.deleteVariant(productId, variantId);
      setProduct(updated);
      setVariantEdits(Object.fromEntries(updated.variants.map((variant) => [variant._id, variant])));
      setMessage({ type: 'success', text: 'تم حذف المتغير' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر حذف المتغير' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!window.confirm('هل تريد حذف هذا المنتج؟')) return;
    setIsSaving(true);
    try {
      await sellerProductService.deleteProduct(productId);
      router.push('/merchant/dashboard');
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر حذف المنتج' });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-16 text-center font-almarai text-brand-muted">جارٍ تحميل المنتج...</div>;
  }
  if (!product) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center font-almarai">
        <p role="alert" className="text-sm text-red-700">{message?.text || 'المنتج غير موجود'}</p>
        <Link href="/merchant/dashboard" className="inline-block mt-4 text-brand-primary font-bold">العودة للمنتجات</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 font-almarai text-right pb-20">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <Link href="/merchant/dashboard" className="text-xs font-bold text-brand-muted hover:text-brand-primary">
            العودة إلى المنتجات
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark mt-2">{product.title}</h1>
          <p className="text-xs text-brand-muted mt-1">
            حالة الاعتماد: {product.approveStatus}
            {product.rejectionReason ? ` — ${product.rejectionReason}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={updateStatus}
          disabled={isSaving}
          className="px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-xs font-bold disabled:opacity-50"
        >
          {product.status === 'active' ? 'إخفاء المنتج' : 'تفعيل المنتج'}
        </button>
      </div>

      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`mb-4 text-xs font-bold ${message.type === 'error' ? 'text-red-700' : 'text-brand-trust'}`}>
          {message.text}
        </p>
      )}

      <section className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4 mb-6">
        <h2 className="text-sm font-black text-brand-dark pb-3 border-b border-brand-border/40">بيانات المنتج</h2>
        <label className="block text-xs font-bold text-brand-dark">
          الاسم
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-brand-border bg-brand-surface text-sm" />
        </label>
        <label className="block text-xs font-bold text-brand-dark">
          التصنيف
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-brand-border bg-brand-surface text-sm">
            {categories.map((category) => <option key={category._id} value={category._id}>{category.title}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-brand-dark">
          رابط الصورة
          <input value={image} onChange={(event) => setImage(event.target.value)} maxLength={2048} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-brand-border bg-brand-surface text-sm" />
        </label>
        <label className="block text-xs font-bold text-brand-dark">
          الوصف
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={4} className="mt-1.5 w-full p-3 rounded-xl border border-brand-border bg-brand-surface text-sm" />
        </label>
        <button type="button" onClick={saveChanges} disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50">
          حفظ بيانات المنتج
        </button>
      </section>

      <section className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-brand-dark">المتغيرات والأسعار والمخزون</h2>
          <span className="text-xs text-brand-muted">{product.variants.length} متغير</span>
        </div>
        <div className="space-y-3">
          {sortedVariants.map((variant) => (
            <div key={variant._id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-3 items-end p-3 rounded-xl border border-brand-border bg-brand-surface/40">
              <div className="flex flex-wrap gap-1.5 text-xs font-bold text-brand-dark">
                {Object.keys(variant.attributes).length > 0
                  ? Object.entries(variant.attributes).map(([name, value]) => <span key={name} className="px-2 py-1 rounded-md bg-white border border-brand-border">{name}: {value}</span>)
                  : <span>منتج مفرد</span>}
                <span className="text-brand-muted self-center">{variant.approveStatus}</span>
              </div>
              <label className="text-[11px] font-bold text-brand-muted">السعر
                <input type="number" min="0.01" step="0.01" value={variant.price} onChange={(event) => setVariantEdits((current) => ({ ...current, [variant._id]: { ...variant, price: Number(event.target.value) } }))} className="mt-1 w-full h-9 px-2 rounded-lg border border-brand-border bg-white text-sm text-brand-dark" />
              </label>
              <label className="text-[11px] font-bold text-brand-muted">المخزون
                <input type="number" min="0" step="1" value={variant.stock} onChange={(event) => setVariantEdits((current) => ({ ...current, [variant._id]: { ...variant, stock: Number(event.target.value) } }))} className="mt-1 w-full h-9 px-2 rounded-lg border border-brand-border bg-white text-sm text-brand-dark" />
              </label>
              <button type="button" onClick={() => deleteVariant(variant._id)} disabled={isSaving} className="h-9 px-3 rounded-lg border border-red-200 text-red-700 text-xs font-bold disabled:opacity-50">
                حذف
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={saveChanges} disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold disabled:opacity-50">
          حفظ تغييرات المتغيرات
        </button>
      </section>

      {definitions.length > 0 && (
        <section className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4 mb-6">
          <h2 className="text-sm font-black text-brand-dark">إضافة متغير</h2>
          {definitions.map((definition) => (
            <label key={definition.name} className="block text-xs font-bold text-brand-dark">
              {definition.name}
              <select
                value={newVariantAttributes[definition.name] || ''}
                onChange={(event) => setNewVariantAttributes((current) => ({ ...current, [definition.name]: event.target.value }))}
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-surface"
              >
                <option value="">اختر قيمة</option>
                {definition.values.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-brand-dark">السعر
              <input type="number" min="0.01" step="0.01" value={newVariantPrice} onChange={(event) => setNewVariantPrice(event.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-surface" />
            </label>
            <label className="text-xs font-bold text-brand-dark">المخزون
              <input type="number" min="0" step="1" value={newVariantStock} onChange={(event) => setNewVariantStock(event.target.value)} className="mt-1.5 w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-surface" />
            </label>
          </div>
          <button type="button" onClick={createVariant} disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-brand-dark text-white text-xs font-bold disabled:opacity-50">
            إضافة المتغير
          </button>
        </section>
      )}

      <button type="button" onClick={deleteProduct} disabled={isSaving} className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-bold disabled:opacity-50">
        حذف المنتج
      </button>
    </div>
  );
}
