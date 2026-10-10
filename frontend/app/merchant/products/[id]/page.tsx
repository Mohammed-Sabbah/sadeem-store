'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { merchantService } from '@/features/merchant/services/merchant.service';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';
import type { ProductItem, ProductOption, OptionDefinition } from '@/features/merchant/types/merchant.types';

export default function MerchantProductStudioPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core product state
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allowedDefinitions, setAllowedDefinitions] = useState<OptionDefinition[]>([]);

  // Editable Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Options & Variants Matrix
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<
    Array<{
      _id?: string;
      sku: string;
      attributes: Record<string, string>;
      attrKey: string;
      price: number;
      compareAtPrice?: number | null;
      stock: number;
      isActive: boolean;
      images?: string[];
    }>
  >([]);

  const [optionTagInputs, setOptionTagInputs] = useState<Record<number, string>>({});

  // 1. Load Product Data on mount
  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      merchantService.getProductById(productId),
      taxonomyService.fetchCategories(),
      merchantService.fetchOptionDefinitions(),
    ])
      .then(([prodRes, cats, optRes]) => {
        if (!isMounted) return;
        setCategories(cats);

        if (prodRes.success && prodRes.data) {
          const p = prodRes.data;
          setProduct(p);
          setName(p.name || p.title || '');
          setDescription(p.description || '');
          const currentCatId = typeof p.categoryId === 'object' ? p.categoryId._id : p.categoryId;
          setCategoryId(currentCatId || (cats[0]?._id ?? ''));
          setImages(p.images && p.images.length > 0 ? p.images : []);
          setIsActive(p.isActive !== undefined ? p.isActive : true);
          setIsFeatured(p.isFeatured || false);

          const mappedOptions = (p.options || []).map((o) => ({
            key: o.key,
            source: o.source || 'DEFINED',
            label: o.label || o.name,
            name: o.name || o.label || o.key || '',
            type: o.type || 'TEXT',
            unit: o.unit || null,
            values: o.values || [],
          }));
          setOptions(mappedOptions);

          const mappedVariants = (p.variants || []).map((v) => ({
            _id: v._id,
            sku: v.sku,
            attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {}),
            attrKey: v.attrKey || 'default',
            price: Number(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            stock: Number(v.stock) || 0,
            isActive: v.isActive !== undefined ? v.isActive : true,
            images: v.images || (v.image ? [v.image] : []),
          }));
          setVariants(mappedVariants);
        } else {
          setErrorMessage(prodRes.message || 'تعذر تحميل بيانات المنتج');
        }

        if (optRes.success && optRes.data?.definitions) {
          setAllowedDefinitions(optRes.data.definitions);
        }
      })
      .catch((err) => {
        console.error('Error loading product studio:', err);
        if (isMounted) setErrorMessage('حدث خطأ في الاتصال بالخادم');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Load allowed options whenever category changes
  useEffect(() => {
    if (!categoryId) return;
    merchantService.fetchOptionsByCategory(categoryId).then((res) => {
      if (res.success && res.data?.definitions) {
        setAllowedDefinitions(res.data.definitions);
      }
    });
  }, [categoryId]);

  // Variant Count Metrics (Max 100 limit rule)
  const variantsCount = variants.length;
  const isNearVariantLimit = variantsCount >= 85;
  const isOverVariantLimit = variantsCount > 100;
  const remainingVariants = Math.max(0, 100 - variantsCount);

  // Total Stock & Price Range Computed
  const totalStock = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [variants]);

  const minPrice = useMemo(() => {
    if (variants.length === 0) return 0;
    return Math.min(...variants.map((v) => Number(v.price) || 0));
  }, [variants]);

  const maxPrice = useMemo(() => {
    if (variants.length === 0) return 0;
    return Math.max(...variants.map((v) => Number(v.price) || 0));
  }, [variants]);

  // -------------------------------------------------------------
  // Option Management Handlers
  // -------------------------------------------------------------
  const handleAddOptionPreset = (def: OptionDefinition) => {
    if (options.some((o) => o.key === def.key || o.name === def.label)) {
      return;
    }
    setOptions([
      ...options,
      {
        key: def.key,
        source: 'DEFINED',
        label: def.label,
        name: def.label,
        type: def.type,
        unit: def.unit || null,
        values: def.values ? def.values.slice(0, 3).map((v) => v.label) : [],
      },
    ]);
  };

  const handleAddCustomOption = () => {
    const customIndex = options.length + 1;
    setOptions([
      ...options,
      {
        key: `opt_custom_${Date.now()}`,
        source: 'CUSTOM',
        label: `خيار جديد ${customIndex}`,
        name: `خيار جديد ${customIndex}`,
        type: 'TEXT',
        unit: null,
        values: [],
      },
    ]);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    setOptions(options.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddOptionValue = (optIndex: number) => {
    const rawVal = optionTagInputs[optIndex] || '';
    const cleanVal = rawVal.trim();
    if (!cleanVal) return;

    const opt = options[optIndex];
    if (opt.values.includes(cleanVal)) {
      setOptionTagInputs({ ...optionTagInputs, [optIndex]: '' });
      return;
    }

    const updatedOptions = [...options];
    updatedOptions[optIndex] = {
      ...opt,
      values: [...opt.values, cleanVal],
    };
    setOptions(updatedOptions);
    setOptionTagInputs({ ...optionTagInputs, [optIndex]: '' });
  };

  const handleRemoveOptionValue = (optIndex: number, valToRemove: string) => {
    const opt = options[optIndex];
    const updatedOptions = [...options];
    updatedOptions[optIndex] = {
      ...opt,
      values: opt.values.filter((v) => v !== valToRemove),
    };
    setOptions(updatedOptions);
  };

  // Re-generate / Fill combinations from current options
  const handleRegenerateCombinations = () => {
    const validOptions = options.filter((o) => o.values.length > 0);
    if (validOptions.length === 0) {
      alert('الرجاء إضافة قيم للخيارات أولاً لتوليد الأصناف');
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const arrays = validOptions.map((o) => o.values);
    const combos = cartesian(arrays);

    if (combos.length > 100) {
      alert(`هذه الخيارات ستنتج ${combos.length} صنف، بينما الحد الأقصى المسموح هو 100 صنف`);
      return;
    }

    const categoryPrefix = (categories.find((c) => c._id === categoryId)?.slug || 'ITEM')
      .slice(0, 3)
      .toUpperCase();

    const newVariants = combos.map((combo, idx) => {
      const attrs: Record<string, string> = {};
      validOptions.forEach((opt, optIdx) => {
        attrs[opt.name || opt.label || `opt_${optIdx}`] = combo[optIdx];
      });

      const attrKey = Object.entries(attrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');

      // Check if variant with this combination already exists to keep its price & stock
      const existing = variants.find((v) => v.attrKey === attrKey);
      if (existing) {
        return existing;
      }

      const cleanValues = Object.values(attrs)
        .map((v) => v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'VAL')
        .slice(0, 2)
        .join('-');

      return {
        sku: `SDM-${categoryPrefix}-${cleanValues || 'VAR'}-${idx + 1}-${Math.floor(100 + Math.random() * 900)}`,
        attributes: attrs,
        attrKey,
        price: minPrice > 0 ? minPrice : 50,
        compareAtPrice: null,
        stock: 5,
        isActive: true,
      };
    });

    setVariants(newVariants);
  };

  // -------------------------------------------------------------
  // Image Handlers
  // -------------------------------------------------------------
  const handleAddImage = () => {
    const cleanUrl = newImageUrl.trim();
    if (!cleanUrl) return;
    setImages([...images, cleanUrl]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (imgIdx: number) => {
    setImages(images.filter((_, idx) => idx !== imgIdx));
  };

  // -------------------------------------------------------------
  // Save & Delete Actions
  // -------------------------------------------------------------
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم المنتج');
      return;
    }
    if (variants.length === 0) {
      setErrorMessage('يجب توفر صنف واحد على الأقل للمنتج');
      return;
    }
    if (variants.length > 100) {
      setErrorMessage('تجاوزت الحد الأقصى للأصناف (100 صنف كحد أقصى)');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    const result = await merchantService.updateProduct(productId, {
      name,
      title: name,
      description,
      categoryId,
      images,
      options,
      variants,
      isActive,
      isFeatured,
    });

    setIsSaving(false);
    if (result.success && result.data) {
      setProduct(result.data);
      setSaveSuccessMessage('تم حفظ كافة التعديلات بنجاح وتم تحديث المتجر.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } else {
      setErrorMessage(result.message || 'فشل حفظ التعديلات');
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف الصنف «${name}» نهائياً من المتجر؟`)) {
      return;
    }
    setIsSaving(true);
    const res = await merchantService.deleteProduct(productId);
    setIsSaving(false);
    if (res.success) {
      router.push('/merchant/dashboard');
    } else {
      setErrorMessage('تعذر حذف المنتج حالياً');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center font-almarai text-right">
        <div className="w-10 h-10 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-brand-dark">جاري فتح استوديو الصنف...</h2>
        <p className="text-xs text-brand-muted mt-1">يتم استدعاء بيانات المتغيرات والمخزون الميداني</p>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center font-almarai text-right">
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border shadow-xs">
          <div className="text-3xl mb-3">🔍</div>
          <h2 className="text-lg font-bold text-brand-dark mb-1">المنتج غير موجود</h2>
          <p className="text-xs text-brand-muted mb-5">قد يكون تم نقله أو حذفه من قبل إدارة المتجر.</p>
          <Link
            href="/merchant/dashboard"
            className="inline-flex items-center gap-2 bg-brand-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-primary-hover transition-all"
          >
            ← العودة للوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 font-almarai text-right">
      {/* 1. Header Bar & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-brand-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-muted mb-1">
            <Link href="/merchant/dashboard" className="hover:text-brand-primary transition-colors flex items-center gap-1">
              <span>←</span>
              <span>لوحة التحكم</span>
            </Link>
            <span>/</span>
            <span>استوديو الصنف</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight">{name || 'صنف بدون اسم'}</h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isActive
                  ? 'bg-brand-trust-soft text-brand-trust border-brand-trust/30'
                  : 'bg-brand-surface text-brand-muted border-brand-border'
              }`}
            >
              {isActive ? '● نشط بالمتجر' : '○ مخفي مؤقتاً'}
            </span>
          </div>
        </div>

        {/* Live Variant Counter Badge */}
        <div className="flex items-center gap-2 bg-brand-card px-3.5 py-2 rounded-xl border border-brand-border shadow-2xs">
          <div className="text-right">
            <div className="text-[10px] font-bold text-brand-muted">عداد الأصناف (Variants):</div>
            <div className="text-xs font-black text-brand-dark flex items-center gap-1">
              <span className={isNearVariantLimit ? 'text-amber-600' : 'text-brand-primary'}>{variantsCount}</span>
              <span className="text-brand-muted/70">/ 100</span>
              <span className="text-[10px] font-medium text-brand-muted mr-1">(متبقي {remainingVariants})</span>
            </div>
          </div>
          <div className="w-10 h-2 bg-brand-surface rounded-full overflow-hidden border border-brand-border/60">
            <div
              className={`h-full transition-all ${
                isOverVariantLimit ? 'bg-red-500' : isNearVariantLimit ? 'bg-amber-500' : 'bg-brand-primary'
              }`}
              style={{ width: `${Math.min(100, (variantsCount / 100) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="mb-4 p-3 bg-brand-trust-soft border border-brand-trust/30 rounded-xl text-brand-trust text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span>✔</span>
          <span>{saveSuccessMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Visual Preview, Logistics & Danger Zone (4 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Preview Facsimile */}
          <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-brand-muted mb-3">
              <span>معاينة البطاقة في المتجر</span>
              <span className="text-[10px] bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border">Live Card</span>
            </div>

            {/* Facsimile Card */}
            <div className="bg-white rounded-xl border border-brand-border-subtle overflow-hidden shadow-sm flex flex-col text-right">
              <div className="relative aspect-square w-full bg-brand-surface overflow-hidden flex items-center justify-center">
                <img src={primaryImage} alt={name} className="w-full h-full object-cover" />
                <span className="absolute top-2.5 right-2.5 bg-brand-primary text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  طرد موحد 8 ₪
                </span>
              </div>
              <div className="p-3">
                <div className="text-[11px] text-brand-muted font-bold mb-0.5">
                  {categories.find((c) => c._id === categoryId)?.title || 'صنف عام'}
                </div>
                <h4 className="text-sm font-black text-brand-dark line-clamp-2 leading-tight mb-2">{name || 'عنوان المنتج'}</h4>
                <div className="flex items-baseline justify-between pt-2 border-t border-brand-border/40">
                  <span className="text-xs text-brand-muted font-bold">
                    {totalStock > 0 ? `${totalStock} متوفر` : 'غير متوفر'}
                  </span>
                  <div className="text-sm font-black text-brand-dark">
                    {minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} - ${maxPrice} ₪`}
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics Specs Card */}
            <div className="mt-4 pt-4 border-t border-brand-border/60 grid grid-cols-2 gap-2 text-center">
              <div className="bg-brand-surface/70 p-2.5 rounded-xl border border-brand-border/60">
                <div className="text-[10px] font-bold text-brand-muted">إجمالي المخزون</div>
                <div className="text-sm font-black text-brand-dark mt-0.5">{totalStock} قطعة</div>
              </div>
              <div className="bg-brand-surface/70 p-2.5 rounded-xl border border-brand-border/60">
                <div className="text-[10px] font-bold text-brand-muted">أجر التوصيل</div>
                <div className="text-sm font-black text-brand-trust mt-0.5">8 ₪ موحد</div>
              </div>
            </div>
          </div>

          {/* Gallery Management Card */}
          <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border shadow-xs">
            <h3 className="text-xs font-black text-brand-dark mb-3">معرض صور الصنف ({images.length})</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-brand-border group">
                  <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 left-1 w-5 h-5 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                    title="حذف الصورة"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length === 0 && (
                <div className="col-span-3 text-center py-4 bg-brand-surface rounded-xl border border-dashed border-brand-border text-xs text-brand-muted">
                  لا توجد صور مضافة للصنف
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="رابط صورة جديدة (https://...)"
                className="flex-1 h-9 px-3 text-xs rounded-xl border border-brand-border bg-brand-surface text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!newImageUrl.trim()}
                className="h-9 px-3 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-hover disabled:opacity-40 cursor-pointer transition-colors"
              >
                + إضافة
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-red-200 shadow-2xs">
            <h3 className="text-xs font-black text-red-700 mb-2">منطقة الخطر والتعليق</h3>
            <p className="text-[11px] text-brand-muted leading-relaxed mb-4">
              إيقاف تفعيل الصنف يخفيه فورياً عن زبائن سَدِيم، بينما الحذف يزيله نهائياً.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isActive
                    ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                    : 'border-brand-trust text-brand-trust bg-brand-trust-soft hover:bg-brand-trust-soft/80'
                }`}
              >
                {isActive ? 'إخفاء مؤقت عن الزبائن' : 'إعادة التفعيل في المتجر'}
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                حذف الصنف نهائياً
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Primary Specs & Variants Matrix (8 cols)    */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-brand-card rounded-2xl p-4 sm:p-6 border border-brand-border shadow-xs">
            <h3 className="text-sm font-black text-brand-dark mb-4 pb-2 border-b border-brand-border/60">
              1. البيانات الأساسية والتصنيف
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">اسم الصنف المعروض للزبائن *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: فستان سديم الحريري الأسود"
                  className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">التصنيف المعتمد *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">تمييز الصنف</label>
                  <label className="flex items-center gap-2 h-11 px-3 bg-brand-surface rounded-xl border border-brand-border text-xs font-bold text-brand-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="accent-brand-primary rounded"
                    />
                    <span>إبراز الصنف في واجهة المتجر (Featured)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">الوصف والتفاصيل</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفاً دقيقاً للمنتج وخاماته وطريقة العناية به..."
                  className="w-full p-3 text-xs rounded-xl border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Options Architecture & Category Presets */}
          <div className="bg-brand-card rounded-2xl p-4 sm:p-6 border border-brand-border shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-brand-border/60">
              <div>
                <h3 className="text-sm font-black text-brand-dark">2. هندسة الخيارات (Options)</h3>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  حدد خيارات المنتج (مثل اللون، المقاس) لتوليد أصناف الـ Variants المنفصلة
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleAddCustomOption}
                  className="px-2.5 py-1.5 bg-brand-surface hover:bg-brand-border text-brand-dark text-xs font-bold rounded-xl border border-brand-border transition-colors cursor-pointer"
                >
                  + خيار مخصص
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateCombinations}
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-hover shadow-2xs transition-colors cursor-pointer"
                >
                  ⚡ توليد الأصناف
                </button>
              </div>
            </div>

            {/* Presets Chips Bar */}
            {allowedDefinitions.length > 0 && (
              <div className="mb-4 p-3 bg-brand-surface/70 rounded-xl border border-brand-border/60">
                <span className="text-[11px] font-bold text-brand-muted block mb-2">
                  خيارات معتمدة وسريعة لهذا التصنيف:
                </span>
                <div className="flex flex-wrap gap-2">
                  {allowedDefinitions.map((def) => {
                    const isAdded = options.some((o) => o.key === def.key || o.name === def.label);
                    return (
                      <button
                        key={def.key}
                        type="button"
                        onClick={() => handleAddOptionPreset(def)}
                        disabled={isAdded}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-brand-card text-brand-muted border-brand-border/40 opacity-50 cursor-not-allowed'
                            : 'bg-white text-brand-dark hover:border-brand-primary hover:text-brand-primary border-brand-border shadow-2xs'
                        }`}
                      >
                        + {def.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Options List */}
            <div className="space-y-3">
              {options.map((opt, optIdx) => (
                <div key={optIdx} className="bg-brand-surface/50 rounded-xl p-3.5 border border-brand-border/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-brand-dark">{opt.name || opt.label}</span>
                      <span className="text-[10px] text-brand-muted bg-brand-card px-1.5 py-0.5 rounded border border-brand-border">
                        {opt.source === 'DEFINED' ? 'معتمد' : 'مخصص'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(optIdx)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer"
                    >
                      إزالة الخيار ×
                    </button>
                  </div>

                  {/* Values Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {opt.values.map((val) => (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-brand-card text-brand-dark px-2.5 py-1 rounded-lg border border-brand-border shadow-2xs"
                      >
                        <span>{val}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionValue(optIdx, val)}
                          className="text-brand-muted hover:text-red-600 transition-colors cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {/* Quick Add Tag Input */}
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={optionTagInputs[optIdx] || ''}
                        onChange={(e) => setOptionTagInputs({ ...optionTagInputs, [optIdx]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOptionValue(optIdx);
                          }
                        }}
                        placeholder="+ أضف قيمة..."
                        className="h-7 px-2 text-xs rounded-lg border border-brand-border bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary w-24"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOptionValue(optIdx)}
                        className="h-7 px-2 text-[11px] font-bold bg-brand-surface text-brand-dark rounded-lg border border-brand-border hover:bg-brand-card cursor-pointer"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {options.length === 0 && (
                <div className="text-center py-6 bg-brand-surface/40 rounded-xl border border-dashed border-brand-border text-xs text-brand-muted">
                  لا توجد خيارات مضافة. هذا المنتج يعتبر صنفاً بسيطاً (Simple Item).
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Variants Matrix Table */}
          <div className="bg-brand-card rounded-2xl p-4 sm:p-6 border border-brand-border shadow-xs overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-border/60">
              <div>
                <h3 className="text-sm font-black text-brand-dark">3. مصفوفة الأصناف والأسعار والمخزون</h3>
                <span className="text-[11px] text-brand-muted">
                  لكل صنف كود SKU فريد وسعر ومخزون مستقل يتم تتبعه في مستودع سَدِيم
                </span>
              </div>
              <span className="text-xs font-black text-brand-primary bg-brand-primary-soft px-2.5 py-1 rounded-lg border border-brand-primary-border">
                {variants.length} أصناف
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-surface/60 text-brand-muted font-bold text-[11px]">
                    <th className="py-2.5 px-3">الصنف / الخصائص</th>
                    <th className="py-2.5 px-3">رمز SKU</th>
                    <th className="py-2.5 px-3">السعر (₪)</th>
                    <th className="py-2.5 px-3">الخصم (₪)</th>
                    <th className="py-2.5 px-3">المخزون (ق)</th>
                    <th className="py-2.5 px-3 text-center">الحالة</th>
                    <th className="py-2.5 px-3 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {variants.map((v, vIdx) => {
                    const attrSummary = Object.entries(v.attributes || {})
                      .map(([k, val]) => `${val}`)
                      .join(' · ') || 'افتراضي';

                    return (
                      <tr key={v._id || vIdx} className="hover:bg-brand-surface/30 transition-colors">
                        {/* Attributes summary */}
                        <td className="py-3 px-3 font-black text-brand-dark whitespace-nowrap">
                          {attrSummary}
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[vIdx] = { ...v, sku: e.target.value.toUpperCase() };
                              setVariants(updated);
                            }}
                            className="h-8 px-2 text-xs font-mono uppercase rounded-lg border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary w-32"
                          />
                        </td>

                        {/* Price */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[vIdx] = { ...v, price: Number(e.target.value) || 0 };
                              setVariants(updated);
                            }}
                            className="h-8 px-2 text-xs font-bold rounded-lg border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary w-20"
                          />
                        </td>

                        {/* Compare at price */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={v.compareAtPrice ?? ''}
                            onChange={(e) => {
                              const updated = [...variants];
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              updated[vIdx] = { ...v, compareAtPrice: val };
                              setVariants(updated);
                            }}
                            placeholder="-"
                            className="h-8 px-2 text-xs rounded-lg border border-brand-border bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary w-20"
                          />
                        </td>

                        {/* Stock with Micro-stepper */}
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1 bg-brand-surface rounded-lg p-0.5 border border-brand-border">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...variants];
                                updated[vIdx] = { ...v, stock: Math.max(0, v.stock - 1) };
                                setVariants(updated);
                              }}
                              className="w-6 h-6 rounded bg-brand-card text-brand-dark font-black text-xs hover:bg-brand-surface flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[vIdx] = { ...v, stock: Math.max(0, parseInt(e.target.value) || 0) };
                                setVariants(updated);
                              }}
                              className="w-10 text-center font-bold text-xs bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...variants];
                                updated[vIdx] = { ...v, stock: v.stock + 1 };
                                setVariants(updated);
                              }}
                              className="w-6 h-6 rounded bg-brand-card text-brand-dark font-black text-xs hover:bg-brand-surface flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Active toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...variants];
                              updated[vIdx] = { ...v, isActive: !v.isActive };
                              setVariants(updated);
                            }}
                            className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                              v.isActive ? 'bg-brand-trust border-brand-trust' : 'bg-brand-surface border-brand-border'
                            }`}
                            title={v.isActive ? 'نشط' : 'معطل'}
                          />
                        </td>

                        {/* Delete variant */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (variants.length <= 1) {
                                alert('لا يمكن حذف الصنف الوحيد المتبقي للمنتج');
                                return;
                              }
                              setVariants(variants.filter((_, idx) => idx !== vIdx));
                            }}
                            className="text-brand-muted hover:text-red-600 text-sm font-bold cursor-pointer transition-colors"
                            title="حذف هذا الصنف"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky Bottom Save Action Bar */}
          <div className="sticky bottom-4 z-20 bg-brand-card/95 backdrop-blur-md p-4 rounded-2xl border border-brand-border shadow-lg flex items-center justify-between gap-4">
            <div className="text-xs text-brand-muted">
              <span>آخر تحديث: </span>
              <span className="font-bold text-brand-dark">
                {product?.updatedAt ? new Date(product.updatedAt).toLocaleTimeString('ar-EG') : 'الآن'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/merchant/dashboard"
                className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-dark text-xs font-bold hover:bg-brand-surface transition-colors"
              >
                إلغاء التغييرات
              </Link>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-95 shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>حفظ التعديلات في المتجر</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
