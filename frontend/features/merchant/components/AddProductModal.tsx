'use client';

import React, { useState, useEffect } from 'react';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';
import { merchantService } from '../services/merchant.service';
import type { ProductFormData, ProductOption, OptionDefinition } from '../types/merchant.types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<boolean>;
}

interface VariantRow {
  attributes: Record<string, string>;
  attrKey: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
}

const PRESET_OPTIONS = ['المقاس', 'اللون', 'الحجم', 'الوزن'];

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
}: AddProductModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryOptionDefinitions, setCategoryOptionDefinitions] = useState<OptionDefinition[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Mode: Simple vs Variants
  const [isSimple, setIsSimple] = useState(true);

  // Simple Product Fields
  const [simplePrice, setSimplePrice] = useState<number | ''>('');
  const [simpleCompareAtPrice, setSimpleCompareAtPrice] = useState<number | ''>('');
  const [simpleStock, setSimpleStock] = useState<number | ''>(10);
  const [simpleSku, setSimpleSku] = useState('');

  // Variants Product Fields
  const [options, setOptions] = useState<ProductOption[]>([
    { name: 'المقاس', values: [] },
  ]);
  const [optionTagInputs, setOptionTagInputs] = useState<Record<number, string>>({});
  const [variantsRows, setVariantsRows] = useState<VariantRow[]>([]);

  // Bulk Apply for Variants
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');
  const [bulkStock, setBulkStock] = useState<number | ''>(10);

  // Load Categories on Open
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingCategories(true);
    taxonomyService
      .fetchCategories()
      .then((cats) => {
        if (!isMounted) return;
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0]._id || cats[0].slug);
        }
      })
      .catch((err) => {
        console.error('Failed fetching categories:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Load allowed options for selected category
  useEffect(() => {
    if (!categoryId) return;
    merchantService.fetchOptionsByCategory(categoryId).then((res) => {
      if (res.success && res.data?.definitions) {
        setCategoryOptionDefinitions(res.data.definitions);
      }
    });
  }, [categoryId]);

  // Compute Cartesian product for Variants
  useEffect(() => {
    if (isSimple) return;

    const validOptions = options.filter((opt) => opt.name.trim() && opt.values.length > 0);
    if (validOptions.length === 0) {
      setVariantsRows([]);
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const valueArrays = validOptions.map((o) => o.values);
    const combinations = cartesian(valueArrays);

    if (combinations.length > 100) {
      setErrorMessage(`هذه التشكيلة ستنتج ${combinations.length} صنف. الحد الأقصى المسموح هو 100 صنف.`);
      setVariantsRows([]);
      return;
    } else {
      setErrorMessage(null);
    }

    setVariantsRows((prev) => {
      return combinations.map((combo) => {
        const attributes: Record<string, string> = {};
        validOptions.forEach((opt, idx) => {
          attributes[opt.name] = combo[idx];
        });

        const sortedEntries = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b));
        const attrKey = sortedEntries.map(([k, v]) => `${k}:${v}`).join('|');

        const existing = prev.find((r) => r.attrKey === attrKey);
        if (existing) {
          return existing;
        }

        const cleanSkuPart = combo.map((v) => v.slice(0, 3).toUpperCase()).join('-');
        const randomNum = Math.floor(100 + Math.random() * 900);
        return {
          attributes,
          attrKey,
          sku: `SDM-${cleanSkuPart}-${randomNum}`,
          price: typeof bulkPrice === 'number' && bulkPrice > 0 ? bulkPrice : 50,
          stock: typeof bulkStock === 'number' && bulkStock >= 0 ? bulkStock : 10,
          isActive: true,
        };
      });
    });
  }, [isSimple, options]);

  const addOption = (optionName: string = '', def?: OptionDefinition) => {
    if (options.length >= 3) {
      alert('الحد الأقصى للخيارات هو 3 لضمان سرعة التصفح لزبائن غزة.');
      return;
    }
    const targetName = def?.label || optionName;
    if (options.some((o) => o.name === targetName)) return;
    setOptions((prev) => [
      ...prev,
      {
        key: def?.key,
        source: def ? 'DEFINED' : 'CUSTOM',
        label: def?.label || targetName,
        name: targetName,
        type: def?.type || 'TEXT',
        unit: def?.unit || null,
        values: def?.values ? def.values.slice(0, 3).map((v) => v.label) : [],
      },
    ]);
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const addTagValue = (optionIndex: number) => {
    const rawVal = (optionTagInputs[optionIndex] || '').trim();
    if (!rawVal) return;

    setOptions((prev) => {
      const copy = [...prev];
      const currentValues = copy[optionIndex].values;
      if (!currentValues.includes(rawVal)) {
        copy[optionIndex].values = [...currentValues, rawVal];
      }
      return copy;
    });

    setOptionTagInputs((prev) => ({ ...prev, [optionIndex]: '' }));
  };

  const removeTagValue = (optionIndex: number, valToRemove: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[optionIndex].values = copy[optionIndex].values.filter((v) => v !== valToRemove);
      return copy;
    });
  };

  const applyBulkValues = () => {
    if (typeof bulkPrice !== 'number' && typeof bulkStock !== 'number') return;
    setVariantsRows((prev) =>
      prev.map((r) => ({
        ...r,
        price: typeof bulkPrice === 'number' ? bulkPrice : r.price,
        stock: typeof bulkStock === 'number' ? bulkStock : r.stock,
      }))
    );
  };

  const updateVariantRow = (index: number, field: keyof VariantRow, value: any) => {
    setVariantsRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('يرجى كتابة اسم الصنف أو السلعة.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('يرجى اختيار القسم أو التصنيف المناسب.');
      return;
    }

    if (isSimple) {
      if (!simplePrice || Number(simplePrice) <= 0) {
        setErrorMessage('يرجى تحديد سعر البيع بالـ ₪ للمنتج.');
        return;
      }
      if (simpleStock === '' || Number(simpleStock) < 0) {
        setErrorMessage('يرجى تحديد كمية المخزون المتاحة في محلك.');
        return;
      }
    } else {
      if (variantsRows.length === 0) {
        setErrorMessage('يرجى إضافة قيم وخيارات للمتغيرات (مثل المقاسات أو الألوان).');
        return;
      }
      const hasInvalidVariant = variantsRows.some((r) => !r.price || r.price <= 0);
      if (hasInvalidVariant) {
        setErrorMessage('يرجى التأكد من كتابة سعر صالح لكل متغير.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: ProductFormData = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        images: imageUrl ? [imageUrl] : [],
        isSimple,
        simplePrice: Number(simplePrice) || 0,
        simpleCompareAtPrice: simpleCompareAtPrice ? Number(simpleCompareAtPrice) : undefined,
        simpleStock: Number(simpleStock) || 0,
        simpleSku: simpleSku.trim(),
        options: isSimple ? [] : options.filter((o) => o.name.trim() && o.values.length > 0),
        variants: isSimple
          ? []
          : variantsRows.map((r) => ({
              attributes: r.attributes,
              attrKey: r.attrKey,
              sku: r.sku,
              price: Number(r.price),
              compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : undefined,
              stock: Number(r.stock) || 0,
              isActive: r.isActive,
            })),
        isFeatured,
        isActive,
      };

      const ok = await onSubmit(payload);
      if (ok) {
        setName('');
        setDescription('');
        setImageUrl('');
        setSimplePrice('');
        setSimpleStock(10);
        setIsSimple(true);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ الصنف، يرجى المحاولة ثانية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end font-almarai text-right animate-fadeIn">
      {/* Apple-style Backdrop Blur Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Apple Slide-Over Sheet (From Right on Desktop, Bottom-Sheet on Mobile) */}
      <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-white sm:h-full sm:max-h-screen max-h-[92vh] rounded-t-3xl sm:rounded-t-none sm:rounded-r-none sm:rounded-l-3xl shadow-2xl flex flex-col z-10 overflow-hidden border-t sm:border-t-0 sm:border-r border-brand-border/70 transition-transform">
        {/* Mobile Grab Handle Bar (Physical Affordance) */}
        <div className="sm:hidden w-full pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>

        {/* Translucent Frosted Glass Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-brand-border/60 flex items-center justify-between gap-4 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <span className="text-[11px] font-bold text-brand-primary block mb-0.5">
              إدارة المخزون والتوريد
            </span>
            <h2 className="text-base sm:text-lg font-black text-brand-dark m-0 tracking-tight">
              إضافة صنف جديد إلى سَدِيم
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-brand-muted hover:text-brand-dark flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-800 text-xs font-bold border border-red-200/80 animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* Section 1: Mode Switch — Apple Segmented Control */}
          <div className="bg-zinc-100/80 p-1.5 rounded-2xl flex items-center gap-1.5 border border-zinc-200/60">
            <button
              type="button"
              onClick={() => setIsSimple(true)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer select-none ${
                isSimple
                  ? 'bg-white text-brand-dark shadow-xs'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <span>صنف موحد (سعر ومخزون واحد)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSimple(false)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer select-none ${
                !isSimple
                  ? 'bg-white text-brand-dark shadow-xs'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <span>متعدد الخيارات (مقاسات / ألوان)</span>
            </button>
          </div>

          {/* Section 2: General Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-brand-subtle uppercase tracking-wider m-0">
              بيانات الصنف الأساسية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-7">
                <label className="text-xs font-bold text-brand-dark block mb-1.5">
                  اسم الصنف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: قميص كتان بيج طبيعي"
                  className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-surface/50 text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="text-xs font-bold text-brand-dark block mb-1.5">
                  القسم <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isLoadingCategories}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-surface/50 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c._id || c.slug} value={c._id || c.slug}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-brand-dark block mb-1.5">
                الوصف والمواصفات
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="خامة القماش، الحجم، المنشأ، أو إرشادات الاستخدام..."
                className="w-full p-3 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-surface/50 text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
              />
            </div>

            {/* Image Preview & URL */}
            <div>
              <label className="text-xs font-bold text-brand-dark block mb-1.5">
                صورة الصنف
              </label>
              <div className="flex items-center gap-2">
                {imageUrl && (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-border/80 bg-zinc-100 shrink-0 shadow-2xs">
                    <img
                      src={imageUrl}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="رابط الصورة (URL)..."
                  className="flex-1 h-10 px-3.5 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-surface/50 text-brand-dark focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImageUrl('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80')
                  }
                  className="px-3 h-10 text-[11px] font-bold rounded-xl border border-brand-border/80 bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer active:scale-95"
                >
                  صورة تجريبية
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Simple Product Pricing & Inventory */}
          {isSimple && (
            <div className="bg-brand-surface/60 p-4 sm:p-5 rounded-2xl border border-brand-border/70 space-y-4">
              <h3 className="text-xs font-black text-brand-dark m-0">
                تسعير ومخزون الصنف الموحد
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-brand-dark block mb-1">
                    السعر (₪) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={simplePrice}
                    onChange={(e) => setSimplePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50"
                    className="w-full h-11 px-3 text-sm font-black rounded-xl border border-brand-border bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-muted block mb-1">
                    قبل الخصم (₪)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={simpleCompareAtPrice}
                    onChange={(e) =>
                      setSimpleCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="65"
                    className="w-full h-11 px-3 text-xs font-medium rounded-xl border border-brand-border bg-white text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-dark block mb-1">
                    القطع بالمحل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="15"
                    className="w-full h-11 px-3 text-sm font-black rounded-xl border border-brand-border bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-muted block mb-1">
                    الباركود / SKU
                  </label>
                  <input
                    type="text"
                    value={simpleSku}
                    onChange={(e) => setSimpleSku(e.target.value)}
                    placeholder="توليد آلي"
                    className="w-full h-11 px-3 text-xs font-mono rounded-xl border border-brand-border bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Variants Dynamic Chips Builder */}
          {!isSimple && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-black text-brand-dark m-0">
                  خيارات الصنف (اللون، المقاس، الحجم):
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {categoryOptionDefinitions.length > 0
                    ? categoryOptionDefinitions.map((def) => (
                        <button
                          key={def.key}
                          type="button"
                          onClick={() => addOption(def.label, def)}
                          disabled={options.some((o) => o.name === def.label || o.key === def.key)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark hover:border-brand-primary disabled:opacity-40 transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          + {def.label}
                        </button>
                      ))
                    : PRESET_OPTIONS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => addOption(preset)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-brand-border/80 bg-white text-brand-muted hover:text-brand-dark hover:border-brand-primary transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                  <button
                    type="button"
                    onClick={() => addOption('')}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-primary-soft text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-150 active:scale-95 cursor-pointer"
                  >
                    + مخصص
                  </button>
                </div>
              </div>

              {/* Options Tag Rows */}
              <div className="space-y-3">
                {options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    className="bg-brand-surface/70 p-3.5 rounded-2xl border border-brand-border/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOptions((prev) => {
                            const copy = [...prev];
                            copy[optIdx].name = val;
                            return copy;
                          });
                        }}
                        placeholder="اسم الخيار (المقاس، اللون...)"
                        className="h-8 px-2.5 text-xs font-black rounded-lg border border-brand-border bg-white text-brand-dark w-44 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      />

                      <button
                        type="button"
                        onClick={() => removeOption(optIdx)}
                        className="text-[11px] text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                      >
                        حذف الخيار ✕
                      </button>
                    </div>

                    {/* Chips Display */}
                    <div className="flex flex-wrap items-center gap-2">
                      {opt.values.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-brand-border/80 text-xs font-black text-brand-dark shadow-2xs"
                        >
                          <span>{v}</span>
                          <button
                            type="button"
                            onClick={() => removeTagValue(optIdx, v)}
                            className="text-zinc-400 hover:text-red-600 font-bold text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Tag Add Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={optionTagInputs[optIdx] || ''}
                          onChange={(e) =>
                            setOptionTagInputs((prev) => ({ ...prev, [optIdx]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTagValue(optIdx);
                            }
                          }}
                          placeholder="+ قيمة (اضغط Enter)"
                          className="h-8 px-2.5 text-xs rounded-xl border border-dashed border-brand-border/90 bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary w-36"
                        />
                        <button
                          type="button"
                          onClick={() => addTagValue(optIdx)}
                          className="h-8 px-3 rounded-xl bg-zinc-200 text-brand-dark text-xs font-bold hover:bg-zinc-300 active:scale-95 cursor-pointer"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Variants Matrix */}
              {variantsRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-950">
                        الأصناف المولدة: {variantsRows.length} / 100
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        متبقي {Math.max(0, 100 - variantsRows.length)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="السعر ₪"
                        value={bulkPrice}
                        onChange={(e) =>
                          setBulkPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-20 h-8 px-2 text-xs font-black rounded-lg border border-amber-300 bg-white"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="القطع"
                        value={bulkStock}
                        onChange={(e) =>
                          setBulkStock(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-20 h-8 px-2 text-xs font-black rounded-lg border border-amber-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={applyBulkValues}
                        className="h-8 px-3 rounded-lg bg-amber-800 text-white text-xs font-black hover:bg-amber-900 active:scale-95 cursor-pointer shrink-0"
                      >
                        تطبيق على الكل
                      </button>
                    </div>
                  </div>

                  {/* Matrix Rows */}
                  <div className="overflow-x-auto border border-brand-border/80 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-brand-surface/70 border-b border-brand-border/60">
                        <tr className="font-bold text-brand-muted">
                          <th className="p-3">المتغير</th>
                          <th className="p-3">رمز SKU</th>
                          <th className="p-3 w-24">السعر (₪) *</th>
                          <th className="p-3 w-24">المخزون *</th>
                          <th className="p-3 text-center w-16">نشط</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border-subtle bg-white">
                        {variantsRows.map((v, vIdx) => {
                          const label = Object.entries(v.attributes)
                            .map(([k, val]) => `${val}`)
                            .join(' / ');

                          return (
                            <tr key={v.attrKey || vIdx} className="hover:bg-brand-surface/40">
                              <td className="p-3 font-black text-brand-dark">{label}</td>
                              <td className="p-3 font-mono text-[11px] text-brand-muted">
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) =>
                                    updateVariantRow(vIdx, 'sku', e.target.value)
                                  }
                                  className="h-7 px-2 text-[11px] font-mono rounded-lg border border-brand-border w-28"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  required
                                  value={v.price || ''}
                                  onChange={(e) =>
                                    updateVariantRow(vIdx, 'price', Number(e.target.value))
                                  }
                                  className="h-7 px-2 text-xs font-black rounded-lg border border-brand-border w-20"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={v.stock ?? ''}
                                  onChange={(e) =>
                                    updateVariantRow(vIdx, 'stock', Number(e.target.value))
                                  }
                                  className="h-7 px-2 text-xs font-black rounded-lg border border-brand-border w-20"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={v.isActive}
                                  onChange={(e) =>
                                    updateVariantRow(vIdx, 'isActive', e.target.checked)
                                  }
                                  className="rounded text-brand-primary focus:ring-brand-primary"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 5: Visibility & Flags */}
          <div className="pt-2 border-t border-brand-border/60 flex flex-wrap items-center gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-brand-dark select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>تفعيل ونشر الصنف فورياً في واجهة المتجر</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-brand-dark select-none">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>تمييز الصنف في واجهة المحل (Featured)</span>
            </label>
          </div>
        </form>

        {/* Bottom Translucent Glass Action Bar (Apple-style) */}
        <div className="px-5 sm:px-7 py-4 border-t border-brand-border/60 flex items-center justify-end gap-3 shrink-0 bg-white/80 backdrop-blur-md sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-brand-border/80 text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-zinc-100 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-7 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-black transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-brand-primary/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'جارٍ حفظ الصنف...' : 'نشر الصنف في سَدِيم'}
          </button>
        </div>
      </div>
    </div>
  );
}
