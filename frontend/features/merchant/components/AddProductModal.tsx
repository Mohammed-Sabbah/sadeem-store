'use client';

import React, { useState, useEffect, useRef } from 'react';
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

// ألوان شائعة ومطلوبة في سوق غزة مع درجات Hex دقيقة
export const COMPREHENSIVE_COLOR_SWATCHES: Record<string, { hex: string; border?: boolean }> = {
  'أسود': { hex: '#18181B' },
  'أبيض': { hex: '#FFFFFF', border: true },
  'أوف وايت': { hex: '#F8F6F0', border: true },
  'كحلي': { hex: '#1E3A8A' },
  'كحلي داكن': { hex: '#0F172A' },
  'رمادي': { hex: '#71717A' },
  'رمادي فاتح': { hex: '#D4D4D8' },
  'بيج': { hex: '#E5D9C5' },
  'رملي': { hex: '#D2B48C' },
  'زيتي': { hex: '#4D5D43' },
  'زيتوني': { hex: '#556B2F' },
  'عسلي': { hex: '#B8621B' },
  'جملي': { hex: '#C19A6B' },
  'بني': { hex: '#78350F' },
  'شوكولاتة': { hex: '#3E2723' },
  'عنابي': { hex: '#831843' },
  'أحمر': { hex: '#DC2626' },
  'وردي': { hex: '#F472B6' },
  'موف': { hex: '#A855F7' },
  'أزرق': { hex: '#2563EB' },
  'سماوي': { hex: '#38BDF8' },
  'تيفاني': { hex: '#14B8A6' },
  'أخضر': { hex: '#15803D' },
  'خردلي': { hex: '#CA8A04' },
  'برتقالي': { hex: '#EA580C' },
};

// مقاسات الملابس القياسية
export const CLOTHING_SIZE_PRESETS = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  'موحد (Free Size)',
];

// مقاسات الأحذية المعتمدة
export const SHOE_SIZE_PRESETS = [
  '35',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
];

// مقاسات الأطفال والرقمية
export const KIDS_SIZE_PRESETS = [
  '0-3m',
  '3-6m',
  '6-12m',
  '1-2y',
  '2-3y',
  '4-5y',
  '6-7y',
  '8-9y',
  '10-11y',
  '12-13y',
  '14-16y',
];

/**
 * ضغط الصورة على جهاز التاجر باستخدام HTML5 Canvas
 */
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const rawUrl = readerEvent.target?.result as string;
      if (!rawUrl) return resolve('');

      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(rawUrl);
        }
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

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
  const [images, setImages] = useState<string[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mode: Simple vs Variants
  const [isSimple, setIsSimple] = useState(true);

  // Simple Product Fields
  const [simplePrice, setSimplePrice] = useState<number | ''>('');
  const [simpleCompareAtPrice, setSimpleCompareAtPrice] = useState<number | ''>('');
  const [simpleStock, setSimpleStock] = useState<number | ''>(10);
  const [simpleSku] = useState('');

  // Variants Product Fields
  const [options, setOptions] = useState<ProductOption[]>([
    { name: 'اللون', values: [] },
  ]);
  const [activeValuePopoverIdx, setActiveValuePopoverIdx] = useState<number | null>(null);
  const [customValueInput, setCustomValueInput] = useState('');
  const [variantsRows, setVariantsRows] = useState<VariantRow[]>([]);

  // Color to Image Binding Map
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({});
  const [activeColorPhotoPopover, setActiveColorPhotoPopover] = useState<string | null>(null);

  // Bulk Apply for Variants
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState<number | ''>('');
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

    const activeCat = categories.find((c) => c._id === categoryId);
    if (activeCat?.variantAttributes && activeCat.variantAttributes.length > 0) {
      const mappedDefs: OptionDefinition[] = activeCat.variantAttributes.map((attr) => {
        const lower = attr.name.toLowerCase();
        const isColor = lower === 'color' || attr.name.includes('لون');
        const isSize = lower === 'size' || lower.includes('size_') || attr.name.includes('مقاس');
        const isStorage = lower === 'storage' || attr.name.includes('تخزين') || attr.name.includes('سعة');
        const isWeight = lower === 'weight' || attr.name.includes('وزن');
        const isVolume = lower === 'volume' || attr.name.includes('حجم');

        let label = attr.name;
        let type: 'COLOR' | 'SIZE' | 'TEXT' | 'NUMERIC' = 'TEXT';
        let unit: string | null = null;

        if (isColor) {
          label = 'اللون';
          type = 'COLOR';
        } else if (isSize) {
          label = 'المقاس';
          type = 'SIZE';
        } else if (isStorage) {
          label = 'سعة التخزين';
          type = 'NUMERIC';
          unit = 'gb';
        } else if (isWeight) {
          label = 'الوزن';
          type = 'NUMERIC';
          unit = 'kg';
        } else if (isVolume) {
          label = 'الحجم / السعة';
          type = 'NUMERIC';
          unit = 'ml';
        }

        return {
          key: attr.name,
          label,
          type,
          unit,
          values: attr.values.map((v) => ({
            key: v,
            label: v,
            isActive: true,
          })),
          isActive: true,
        };
      });
      setCategoryOptionDefinitions(mappedDefs);
      return;
    }

    merchantService.fetchOptionsByCategory(categoryId).then((res) => {
      if (res.success && res.data?.definitions) {
        const catTitle = activeCat?.title || '';
        const catSlug = activeCat?.slug || '';
        const isShoes = catTitle.includes('حذاء') || catTitle.includes('أحذية') || catSlug.includes('shoe');
        const isKids = catTitle.includes('أطفال') || catSlug.includes('kid');

        const refinedDefs = res.data.definitions.filter((def) => {
          if (def.key === 'size_shoes' && !isShoes) return false;
          if (def.key === 'size_kids' && !isKids) return false;
          return true;
        });
        setCategoryOptionDefinitions(refinedDefs);
      }
    });
  }, [categoryId, categories]);

  // Category Change with Guard against active variants
  const handleCategoryChange = (newCatId: string) => {
    const hasActiveVariants = !isSimple && options.some((o) => o.values.length > 0);
    if (hasActiveVariants && newCatId !== categoryId) {
      setErrorMessage(
        'لا يمكن تغيير قسم الصنف طالما توجد خيارات ومقاسات محددة. يرجى حذف الخيارات الحالية أولاً أو تحويل الصنف إلى (صنف موحد) لتتمكن من تغيير القسم.'
      );
      return;
    }
    setErrorMessage(null);
    setCategoryId(newCatId);
  };

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
          compareAtPrice:
            typeof bulkCompareAtPrice === 'number' && bulkCompareAtPrice > 0
              ? bulkCompareAtPrice
              : undefined,
          stock: typeof bulkStock === 'number' && bulkStock >= 0 ? bulkStock : 10,
          isActive: true,
        };
      });
    });
  }, [isSimple, options]);

  // Image Upload Handlers
  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const fileArray = Array.from(files);

    try {
      const compressedUrls = await Promise.all(fileArray.map((f) => compressImage(f)));
      const validUrls = compressedUrls.filter(Boolean);
      if (validUrls.length > 0) {
        setImages((prev) => [...prev, ...validUrls]);
      }
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setIsProcessingFiles(false);
      e.target.value = '';
    }
  };

  const handleSetPrimaryImage = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [target] = next.splice(idx, 1);
      next.unshift(target);
      return next;
    });
  };

  const handleRemoveImage = (idx: number) => {
    const removedUrl = images[idx];
    setImages((prev) => prev.filter((_, i) => i !== idx));

    // Clear from colorImageMap if assigned
    setColorImageMap((prev) => {
      const copy = { ...prev };
      for (const col in copy) {
        if (copy[col] === removedUrl) {
          delete copy[col];
        }
      }
      return copy;
    });
  };

  const handleBindColorImage = (color: string, imgUrl: string) => {
    setColorImageMap((prev) => ({ ...prev, [color]: imgUrl }));
  };

  const addOption = (
    optionName: string = '',
    presetType?: 'COLOR' | 'CLOTHING_SIZE' | 'SHOE_SIZE' | 'KIDS_SIZE' | 'CUSTOM',
    def?: OptionDefinition
  ) => {
    if (options.length >= 3) {
      alert('الحد الأقصى للخيارات هو 3 لضمان سرعة التصفح لزبائن غزة.');
      return;
    }

    let defaultName = def?.label || optionName;
    if (!defaultName) {
      defaultName = `خيار ${options.length + 1}`;
    }

    if (options.some((o) => o.name === defaultName)) {
      alert(`الخيار «${defaultName}» مضاف بالفعل.`);
      return;
    }

    setOptions((prev) => [
      ...prev,
      {
        key: def?.key || `opt_${Date.now()}`,
        source: def ? 'DEFINED' : 'CUSTOM',
        label: def?.label || defaultName,
        name: defaultName,
        type: def?.type || (presetType === 'COLOR' ? 'COLOR' : 'TEXT'),
        unit: def?.unit || null,
        values: [],
      },
    ]);

    // Open popover for the newly created option
    setTimeout(() => {
      setActiveValuePopoverIdx(options.length);
    }, 50);
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (activeValuePopoverIdx === index) {
      setActiveValuePopoverIdx(null);
    }
  };

  const addTagValue = (optionIndex: number, specificVal: string) => {
    const rawVal = specificVal.trim();
    if (!rawVal) return;

    setOptions((prev) => {
      const copy = [...prev];
      const currentValues = copy[optionIndex].values;
      if (!currentValues.includes(rawVal)) {
        copy[optionIndex].values = [...currentValues, rawVal];
      }
      return copy;
    });
  };

  const removeTagValue = (optionIndex: number, valToRemove: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[optionIndex].values = copy[optionIndex].values.filter((v) => v !== valToRemove);
      return copy;
    });
  };

  const applyBulkValues = () => {
    setVariantsRows((prev) =>
      prev.map((r) => ({
        ...r,
        price: typeof bulkPrice === 'number' && bulkPrice > 0 ? bulkPrice : r.price,
        compareAtPrice:
          typeof bulkCompareAtPrice === 'number' && bulkCompareAtPrice > 0
            ? bulkCompareAtPrice
            : r.compareAtPrice,
        stock: typeof bulkStock === 'number' && bulkStock >= 0 ? bulkStock : r.stock,
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
        images: images.length > 0 ? images : [],
        isSimple,
        simplePrice: Number(simplePrice) || 0,
        simpleCompareAtPrice: simpleCompareAtPrice ? Number(simpleCompareAtPrice) : undefined,
        simpleStock: Number(simpleStock) || 0,
        simpleSku: simpleSku.trim(),
        options: isSimple ? [] : options.filter((o) => o.name.trim() && o.values.length > 0),
        variants: isSimple
          ? []
          : variantsRows.map((r) => {
              // Check if any attribute matches a bound color image
              let boundImg: string | undefined = undefined;
              for (const [attrName, attrVal] of Object.entries(r.attributes)) {
                if (attrName.includes('لون') || attrName.toLowerCase().includes('color')) {
                  if (colorImageMap[attrVal]) {
                    boundImg = colorImageMap[attrVal];
                    break;
                  }
                }
              }

              return {
                attributes: r.attributes,
                attrKey: r.attrKey,
                sku: r.sku,
                price: Number(r.price),
                compareAtPrice: r.compareAtPrice ? Number(r.compareAtPrice) : undefined,
                stock: Number(r.stock) || 0,
                isActive: r.isActive,
                images: boundImg ? [boundImg] : images.length > 0 ? [images[0]] : [],
              };
            }),
        isFeatured: false,
        isActive,
      };

      const ok = await onSubmit(payload);
      if (ok) {
        setName('');
        setDescription('');
        setImages([]);
        setColorImageMap({});
        setSimplePrice('');
        setSimpleCompareAtPrice('');
        setSimpleStock(10);
        setIsSimple(true);
        setOptions([]);
        setVariantsRows([]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-6 font-almarai text-right animate-fadeIn">
      {/* Apple-style Backdrop Blur Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Full-Screen on Mobile, Centered Luxury Modal on Desktop */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[88vh] bg-brand-card sm:rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden sm:border border-brand-border/80 transition-all">
        {/* Translucent Frosted Glass Header */}
        <div className="px-4 sm:px-7 py-3.5 sm:py-4 border-b border-brand-border/60 flex items-center justify-between gap-4 shrink-0 bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-brand-primary block mb-0.5">
              إدارة المخزون والتوريد
            </span>
            <h2 className="text-sm sm:text-lg font-black text-brand-dark m-0 tracking-tight">
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

        {/* Form Body with Smooth Mobile-First Scroll */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-4 sm:px-7 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-800 text-xs font-bold border border-red-200/80 animate-fadeIn flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-900 font-black text-xs cursor-pointer"
              >
                ✕
              </button>
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
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

            {/* Image Gallery & Fast Device Upload */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-bold text-brand-dark block">
                  صور الصنف (معرض المنتج)
                </label>
                <span className="text-[10px] text-brand-muted">
                  الصورة الأولى = الغلاف الرئيسي للمنتج
                </span>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleDeviceFileUpload}
                className="hidden"
              />

              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/40 hover:bg-brand-surface/70 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 text-center group active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-dark">
                      {isProcessingFiles
                        ? 'جارٍ ضغط وتجهيز الصور...'
                        : 'اضغط لاختيار صور من كاميرا أو ذاكرة هاتفك'}
                    </div>
                    <div className="text-[10px] text-brand-muted mt-0.5">
                      تُضغط الصور تلقائياً لتناسب سرعة الإنترنت في غزة وتوفر بياناتك
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-2xl overflow-hidden border group bg-zinc-100 shadow-2xs transition-all ${
                        idx === 0
                          ? 'border-brand-primary ring-2 ring-brand-primary/25'
                          : 'border-brand-border/80'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`صورة ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Primary Cover Badge */}
                      {idx === 0 ? (
                        <span className="absolute bottom-1 right-1 bg-brand-primary text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs select-none">
                          ★ الغلاف
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute bottom-1 right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-black/75 hover:bg-black sm:bg-white/95 sm:hover:bg-white text-white sm:text-brand-dark text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs transition-all active:scale-95 cursor-pointer select-none"
                          title="اجعل هذه الصورة الغلاف الرئيسي للمنتج"
                        >
                          ☆ غلاف
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 left-1 w-5 h-5 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] transition-colors cursor-pointer active:scale-90"
                        title="حذف الصورة"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFiles}
                    className="aspect-square rounded-2xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/40 hover:bg-brand-surface/80 flex flex-col items-center justify-center gap-1 text-brand-muted hover:text-brand-primary transition-all cursor-pointer active:scale-95"
                  >
                    <span className="text-base font-bold">+</span>
                    <span className="text-[10px] font-bold">إضافة صورة</span>
                  </button>
                </div>
              )}

              {/* Optional URL Input Toggle */}
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-brand-muted hover:text-brand-primary underline transition-colors cursor-pointer"
                >
                  {showUrlInput ? 'إخفاء حقل الرابط' : 'أو إضافة صورة عبر رابط مباشر (URL)'}
                </button>
              </div>

              {showUrlInput && (
                <div className="mt-2 flex items-center gap-2 animate-fadeIn">
                  <input
                    type="url"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    placeholder="الصق رابط صورة مباشر (https://...)"
                    className="flex-1 h-9 px-3 text-xs rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newUrlInput.trim()) {
                        setImages((prev) => [...prev, newUrlInput.trim()]);
                        setNewUrlInput('');
                        setShowUrlInput(false);
                      }
                    }}
                    disabled={!newUrlInput.trim()}
                    className="h-9 px-3 text-[11px] font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              )}
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
                    سعر البيع (₪) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={simplePrice}
                    onChange={(e) =>
                      setSimplePrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
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
                    onChange={(e) =>
                      setSimpleStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="15"
                    className="w-full h-11 px-3 text-sm font-black rounded-xl border border-brand-border bg-white text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-muted block mb-1">
                    الباركود / SKU
                  </label>
                  <div
                    className="w-full h-11 px-3 rounded-xl border border-brand-border bg-brand-surface/40 flex items-center justify-between select-none"
                    title="رمز تتبع المستودع والباركود يولّد تلقائياً من النظام"
                  >
                    <span className="font-mono text-xs font-bold text-brand-dark truncate">
                      {simpleSku || 'SDM-PROD-AUTO'}
                    </span>
                    <span className="text-[10px] font-bold text-brand-muted bg-white px-2 py-0.5 rounded-md border border-brand-border shrink-0">
                      توليد آلي
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Variants Dynamic Chips Builder */}
          {!isSimple && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-brand-border/40">
                <h3 className="text-xs font-black text-brand-dark m-0">
                  خيارات ومقاسات الصنف:
                </h3>

                {/* Option Category Selectors */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {categoryOptionDefinitions && categoryOptionDefinitions.length > 0 ? (
                    categoryOptionDefinitions.map((def) => {
                      const isColor = def.type === 'COLOR' || def.key === 'color';
                      const isAlreadyAdded = options.some(
                        (o) =>
                          o.key === def.key ||
                          o.name === def.label ||
                          (isColor && (o.type === 'COLOR' || o.name.includes('لون')))
                      );

                      return (
                        <button
                          key={def.key}
                          type="button"
                          onClick={() => addOption(def.label, isColor ? 'COLOR' : 'CUSTOM', def)}
                          disabled={isAlreadyAdded || options.length >= 3}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs ${
                            isAlreadyAdded
                              ? 'opacity-40 border-brand-border/60 bg-brand-surface/40 text-brand-muted cursor-not-allowed'
                              : 'border-brand-border/80 bg-white text-brand-dark hover:border-brand-primary'
                          }`}
                        >
                          {isColor && (
                            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-600 via-rose-500 to-blue-500 shrink-0" />
                          )}
                          <span>+ {def.label}</span>
                        </button>
                      );
                    })
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => addOption('اللون', 'COLOR')}
                        disabled={options.some((o) => o.name.includes('لون') || o.name.toLowerCase().includes('color')) || options.length >= 3}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark hover:border-brand-primary disabled:opacity-40 transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-600 via-rose-500 to-blue-500" />
                        <span>+ اللون</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addOption('المقاس', 'CLOTHING_SIZE')}
                        disabled={options.some((o) => o.name === 'المقاس') || options.length >= 3}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark hover:border-brand-primary disabled:opacity-40 transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        + المقاس
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => addOption('', 'CUSTOM')}
                    disabled={options.length >= 3}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-150 active:scale-95 cursor-pointer shadow-2xs disabled:opacity-40"
                  >
                    + مخصص
                  </button>
                </div>
              </div>

              {/* Options Cards */}
              <div className="space-y-3.5">
                {options.map((opt, optIdx) => {
                  const matchingDef = categoryOptionDefinitions.find(
                    (d) => d.key === opt.key || d.label === opt.name
                  );
                  const isColorOption =
                    opt.type === 'COLOR' ||
                    opt.name.includes('لون') ||
                    opt.name.toLowerCase().includes('color') ||
                    matchingDef?.type === 'COLOR' ||
                    matchingDef?.key === 'color';
                  const isShoeSize =
                    matchingDef?.key === 'size_shoes' ||
                    opt.name.includes('حذاء') ||
                    opt.name.includes('أحذية');
                  const isKidsSize =
                    matchingDef?.key === 'size_kids' || opt.name.includes('أطفال');
                  const isClothingSize =
                    matchingDef?.key === 'size_clothing' ||
                    (!isShoeSize &&
                      !isKidsSize &&
                      (opt.name.includes('ملابس') ||
                        (opt.name.includes('مقاس') && !matchingDef)));
                  const hasDefPresets = Boolean(
                    matchingDef?.values &&
                      matchingDef.values.length > 0 &&
                      !isColorOption &&
                      !isShoeSize &&
                      !isKidsSize &&
                      !isClothingSize
                  );

                  return (
                    <div
                      key={optIdx}
                      className="bg-brand-surface/70 p-3.5 sm:p-4 rounded-2xl border border-brand-border/70 space-y-3 relative"
                    >
                      {/* Fixed Option Header Row */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-brand-border/40">
                        <div className="flex items-center gap-2">
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
                            className="h-8 px-2.5 text-xs font-black rounded-lg border border-brand-border bg-white text-brand-dark w-36 sm:w-44 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                          />
                          <span className="text-[10px] font-bold text-brand-muted bg-white px-2 py-0.5 rounded-full border border-brand-border/60">
                            {opt.values.length} {isColorOption ? 'ألوان' : 'قيم'}
                          </span>
                        </div>

                        {/* Fixed Actions Slot: Launcher Button + Delete Option */}
                        <div className="flex items-center gap-2">
                          {/* Dedicated Fixed Launcher Button */}
                          <div className="relative inline-flex items-center" data-popover>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveValuePopoverIdx(
                                  activeValuePopoverIdx === optIdx ? null : optIdx
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl border border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              <span>
                                + {isColorOption
                                  ? 'إضافة لون...'
                                  : isShoeSize
                                  ? 'إضافة مقاس حذاء...'
                                  : isClothingSize
                                  ? 'إضافة مقاس ملابس...'
                                  : isKidsSize
                                  ? 'إضافة مقاس أطفال...'
                                  : matchingDef?.label
                                  ? `إضافة ${matchingDef.label}...`
                                  : 'إضافة قيمة...'}
                              </span>
                              <span className="text-[9px]">
                                {activeValuePopoverIdx === optIdx ? '▲' : '▼'}
                              </span>
                            </button>

                            {/* Floating Popover on Desktop / Smooth Bottom Sheet on Mobile */}
                            {activeValuePopoverIdx === optIdx && (
                              <>
                                {/* Mobile Backdrop Scrim */}
                                <div
                                  onClick={() => setActiveValuePopoverIdx(null)}
                                  className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-fadeIn"
                                />

                                {/* Container */}
                                <div className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:absolute sm:left-0 sm:top-full sm:mt-2 w-full sm:w-84 max-h-[75vh] sm:max-h-[26rem] bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-brand-border shadow-2xl p-4 z-50 flex flex-col animate-slideUp sm:animate-fadeIn">
                                  {/* Mobile Handle Bar */}
                                  <div className="sm:hidden w-10 h-1 rounded-full bg-zinc-300 mx-auto mb-3 shrink-0" />

                                  {/* 1. Color Palette Grid */}
                                  {isColorOption && (
                                    <>
                                      <div className="flex items-center justify-between pb-2 border-b border-brand-border/40 text-xs font-black text-brand-dark">
                                        <span>لوحة الألوان الجاهزة ({Object.keys(COMPREHENSIVE_COLOR_SWATCHES).length} لون)</span>
                                        <span className="text-[10px] text-brand-muted font-normal">انقر للتضمين</span>
                                      </div>

                                      <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto no-scrollbar py-1">
                                        {Object.entries(COMPREHENSIVE_COLOR_SWATCHES).map(
                                          ([colName, swatch]) => {
                                            const isSelected = opt.values.includes(colName);
                                            return (
                                              <button
                                                key={colName}
                                                type="button"
                                                onClick={() => {
                                                  if (isSelected) {
                                                    removeTagValue(optIdx, colName);
                                                  } else {
                                                    addTagValue(optIdx, colName);
                                                  }
                                                }}
                                                className={`flex items-center gap-1.5 p-2 rounded-xl border text-right transition-all cursor-pointer active:scale-95 ${
                                                  isSelected
                                                    ? 'border-brand-primary bg-brand-primary/10 text-brand-dark font-black shadow-xs'
                                                    : 'border-brand-border/60 hover:bg-brand-surface text-brand-muted hover:text-brand-dark'
                                                }`}
                                              >
                                                <span
                                                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                                                  style={{
                                                    backgroundColor: swatch.hex,
                                                    border: swatch.border ? '1px solid #D1D5DB' : 'none',
                                                  }}
                                                />
                                                <span className="text-[11px] truncate flex-1">
                                                  {colName}
                                                </span>
                                                {isSelected && (
                                                  <span className="text-brand-primary font-bold text-xs">
                                                    ✓
                                                  </span>
                                                )}
                                              </button>
                                            );
                                          }
                                        )}
                                      </div>
                                    </>
                                  )}

                                  {/* 2. Clothing Size Grid */}
                                  {isClothingSize && (
                                    <>
                                      <div className="flex items-center justify-between pb-2 border-b border-brand-border/40 text-xs font-black text-brand-dark">
                                        <span>مقاسات الملابس القياسية</span>
                                        <span className="text-[10px] text-brand-muted font-normal">انقر للتضمين</span>
                                      </div>

                                      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
                                        {CLOTHING_SIZE_PRESETS.map((sz) => {
                                          const isSelected = opt.values.includes(sz);
                                          return (
                                            <button
                                              key={sz}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  removeTagValue(optIdx, sz);
                                                } else {
                                                  addTagValue(optIdx, sz);
                                                }
                                              }}
                                              className={`min-w-11 h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary/10 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/80 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{sz}</span>
                                              {isSelected && (
                                                <span className="text-brand-primary text-xs">✓</span>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}

                                  {/* 3. Shoe Size Grid */}
                                  {isShoeSize && (
                                    <>
                                      <div className="flex items-center justify-between pb-2 border-b border-brand-border/40 text-xs font-black text-brand-dark">
                                        <span>مقاسات الأحذية المعتمدة</span>
                                        <span className="text-[10px] text-brand-muted font-normal">انقر للتضمين</span>
                                      </div>

                                      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
                                        {SHOE_SIZE_PRESETS.map((sz) => {
                                          const isSelected = opt.values.includes(sz);
                                          return (
                                            <button
                                              key={sz}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  removeTagValue(optIdx, sz);
                                                } else {
                                                  addTagValue(optIdx, sz);
                                                }
                                              }}
                                              className={`min-w-11 h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary/10 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/80 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{sz}</span>
                                              {isSelected && (
                                                <span className="text-brand-primary text-xs">✓</span>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}

                                  {/* 4. Kids Size Grid */}
                                  {isKidsSize && (
                                    <>
                                      <div className="flex items-center justify-between pb-2 border-b border-brand-border/40 text-xs font-black text-brand-dark">
                                        <span>مقاسات الأطفال والشهور</span>
                                        <span className="text-[10px] text-brand-muted font-normal">انقر للتضمين</span>
                                      </div>

                                      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
                                        {KIDS_SIZE_PRESETS.map((sz) => {
                                          const isSelected = opt.values.includes(sz);
                                          return (
                                            <button
                                              key={sz}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  removeTagValue(optIdx, sz);
                                                } else {
                                                  addTagValue(optIdx, sz);
                                                }
                                              }}
                                              className={`min-w-11 h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary/10 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/80 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{sz}</span>
                                              {isSelected && (
                                                <span className="text-brand-primary text-xs">✓</span>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}

                                  {/* 5. Definition Predefined Values Grid (storage, weight, volume, battery...) */}
                                  {hasDefPresets && matchingDef?.values && (
                                    <>
                                      <div className="flex items-center justify-between pb-2 border-b border-brand-border/40 text-xs font-black text-brand-dark">
                                        <span>قيم «{matchingDef.label}» المقترحة</span>
                                        {matchingDef.unit && (
                                          <span className="text-[10px] text-brand-muted font-normal bg-brand-surface px-1.5 py-0.5 rounded">
                                            {matchingDef.unit}
                                          </span>
                                        )}
                                      </div>

                                       <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
                                        {matchingDef.values.map((valItem) => {
                                          const val = typeof valItem === 'string' ? valItem : valItem.label || valItem.key;
                                          const isSelected = opt.values.includes(val);
                                          return (
                                            <button
                                              key={val}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  removeTagValue(optIdx, val);
                                                } else {
                                                  addTagValue(optIdx, val);
                                                }
                                              }}
                                              className={`min-w-11 h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary/10 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/80 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{val}</span>
                                              {isSelected && (
                                                <span className="text-brand-primary text-xs">✓</span>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}

                                  {/* Bottom: Custom Value Input */}
                                  <div className="pt-2.5 border-t border-brand-border/50 flex items-center gap-1.5 mt-auto">
                                    <input
                                      type="text"
                                      value={customValueInput}
                                      onChange={(e) => setCustomValueInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (customValueInput.trim()) {
                                            addTagValue(optIdx, customValueInput.trim());
                                            setCustomValueInput('');
                                          }
                                        }
                                      }}
                                      placeholder={
                                        isColorOption
                                          ? 'أو اكتب لوناً مخصصاً (مثال: كشمير)...'
                                          : 'أو اكتب قيمة مخصصة...'
                                      }
                                      className="flex-1 h-9 px-3 text-xs rounded-xl border border-brand-border bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (customValueInput.trim()) {
                                          addTagValue(optIdx, customValueInput.trim());
                                          setCustomValueInput('');
                                        }
                                      }}
                                      disabled={!customValueInput.trim()}
                                      className="h-9 px-3.5 text-xs font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
                                    >
                                      إضافة
                                    </button>
                                  </div>

                                  <div className="pt-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setActiveValuePopoverIdx(null)}
                                      className="w-full py-2 bg-zinc-100 sm:bg-transparent rounded-xl sm:rounded-none text-xs font-bold text-brand-muted hover:text-brand-dark cursor-pointer transition-colors"
                                    >
                                      إغلاق القائمة
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Delete Option Button */}
                          <button
                            type="button"
                            onClick={() => removeOption(optIdx)}
                            className="w-8 h-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                            title="حذف هذا الخيار"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Selected Values Chips Section (Expands freely without moving the button!) */}
                      <div className="min-h-8 flex flex-wrap items-center gap-2 pt-1">
                        {opt.values.length === 0 ? (
                          <span className="text-[11px] text-brand-muted/70 italic">
                            لم يتم تحديد أي {isColorOption ? 'ألوان' : 'قيم'} بعد. اضغط على زر الإضافة أعلاه للاختيار.
                          </span>
                        ) : (
                          opt.values.map((v) => {
                            const swatch = COMPREHENSIVE_COLOR_SWATCHES[v];
                            const boundImg = colorImageMap[v];

                            return (
                              <span
                                key={v}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-brand-border/80 text-xs font-bold text-brand-dark shadow-2xs"
                              >
                                {isColorOption && swatch && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                                    style={{
                                      backgroundColor: swatch.hex,
                                      border: swatch.border ? '1px solid #D1D5DB' : 'none',
                                    }}
                                  />
                                )}

                                <span>{v}</span>

                                {/* Color-to-Image Binding Thumbnail Pill */}
                                {isColorOption && images.length > 0 && (
                                  <div className="relative inline-flex items-center" data-popover>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveColorPhotoPopover(
                                          activeColorPhotoPopover === v ? null : v
                                        )
                                      }
                                      className="w-5 h-5 rounded-md overflow-hidden border border-brand-border/80 shrink-0 hover:scale-110 transition-transform cursor-pointer shadow-2xs relative group/thumb"
                                      title={`ربط صورة بهذا اللون: ${v}`}
                                    >
                                      <img
                                        src={boundImg || images[0]}
                                        alt={v}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>

                                    {/* Color Photo Picker Popover */}
                                    {activeColorPhotoPopover === v && (
                                      <>
                                        <div
                                          onClick={() => setActiveColorPhotoPopover(null)}
                                          className="sm:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-fadeIn"
                                        />
                                        <div className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-full sm:w-64 bg-white rounded-t-3xl sm:rounded-2xl border-t sm:border border-brand-border shadow-2xl p-3.5 z-50 flex flex-col space-y-2 animate-slideUp sm:animate-fadeIn">
                                          <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/40 text-[11px] font-bold text-brand-dark">
                                            <span>صورة لون «{v}»</span>
                                            <button
                                              type="button"
                                              onClick={() => setActiveColorPhotoPopover(null)}
                                              className="text-brand-muted hover:text-brand-dark text-xs cursor-pointer"
                                            >
                                              ✕
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto py-1">
                                            {images.map((imgUrl, imgI) => {
                                              const isAssigned =
                                                colorImageMap[v] === imgUrl ||
                                                (!colorImageMap[v] && imgI === 0);
                                              return (
                                                <button
                                                  key={imgI}
                                                  type="button"
                                                  onClick={() => {
                                                    handleBindColorImage(v, imgUrl);
                                                    setActiveColorPhotoPopover(null);
                                                  }}
                                                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                                    isAssigned
                                                      ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                                                      : 'border-brand-border/70 hover:border-brand-primary/50'
                                                  }`}
                                                >
                                                  <img
                                                    src={imgUrl}
                                                    alt={`صورة ${imgI + 1}`}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  {isAssigned && (
                                                    <div className="absolute inset-0 bg-brand-primary/25 flex items-center justify-center">
                                                      <span className="w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] flex items-center justify-center">
                                                        ✓
                                                      </span>
                                                    </div>
                                                  )}
                                                  <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-bold px-1 rounded">
                                                    {imgI === 0 ? 'الغلاف' : `#${imgI + 1}`}
                                                  </span>
                                                </button>
                                              );
                                            })}
                                          </div>

                                          {colorImageMap[v] && (
                                            <div className="pt-1 border-t border-brand-border/40">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const nextMap = { ...colorImageMap };
                                                  delete nextMap[v];
                                                  setColorImageMap(nextMap);
                                                  setActiveColorPhotoPopover(null);
                                                }}
                                                className="w-full py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-center"
                                              >
                                                إلغاء التخصيص (استخدام الغلاف)
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => removeTagValue(optIdx, v)}
                                  className="text-zinc-400 hover:text-red-600 font-bold text-xs cursor-pointer p-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Variants Matrix */}
              {variantsRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  {/* Bulk Apply Bar with Sale Price */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-950">
                        الأصناف المولدة: {variantsRows.length} / 100
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        متبقي {Math.max(0, 100 - variantsRows.length)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="السعر ₪ *"
                        value={bulkPrice}
                        onChange={(e) =>
                          setBulkPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-20 h-8 px-2 text-xs font-black rounded-lg border border-amber-300 bg-white"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="قبل الخصم ₪"
                        value={bulkCompareAtPrice}
                        onChange={(e) =>
                          setBulkCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-24 h-8 px-2 text-xs font-medium rounded-lg border border-amber-300 bg-white"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="القطع *"
                        value={bulkStock}
                        onChange={(e) =>
                          setBulkStock(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-18 h-8 px-2 text-xs font-black rounded-lg border border-amber-300 bg-white"
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

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto border border-brand-border/80 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-brand-surface/70 border-b border-brand-border/60">
                        <tr className="font-bold text-brand-muted">
                          <th className="p-3">المتغير</th>
                          <th className="p-3">رمز SKU</th>
                          <th className="p-3 w-22">السعر (₪) *</th>
                          <th className="p-3 w-24">قبل الخصم (₪)</th>
                          <th className="p-3 w-20">المخزون *</th>
                          <th className="p-3 text-center w-14">نشط</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border-subtle bg-white">
                        {variantsRows.map((v, vIdx) => {
                          const label = Object.entries(v.attributes)
                            .map(([_, val]) => `${val}`)
                            .join(' / ');

                          return (
                            <tr key={v.attrKey || vIdx} className="hover:bg-brand-surface/40">
                              <td className="p-3 font-black text-brand-dark">{label}</td>
                              <td className="p-3 font-mono text-[11px] text-brand-muted">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-brand-surface border border-brand-border text-brand-dark font-mono text-[11px]">
                                  {v.sku || 'SDM-VAR-AUTO'}
                                </span>
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
                                  step="0.5"
                                  placeholder="اختياري"
                                  value={v.compareAtPrice ?? ''}
                                  onChange={(e) =>
                                    updateVariantRow(
                                      vIdx,
                                      'compareAtPrice',
                                      e.target.value === '' ? undefined : Number(e.target.value)
                                    )
                                  }
                                  className="h-7 px-2 text-xs font-medium rounded-lg border border-brand-border w-22 text-brand-muted"
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
                                  className="h-7 px-2 text-xs font-black rounded-lg border border-brand-border w-18"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={v.isActive}
                                  onChange={(e) =>
                                    updateVariantRow(vIdx, 'isActive', e.target.checked)
                                  }
                                  className="rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile-Friendly Cards View */}
                  <div className="sm:hidden space-y-2.5">
                    {variantsRows.map((v, vIdx) => {
                      const label = Object.entries(v.attributes)
                        .map(([_, val]) => `${val}`)
                        .join(' / ');

                      return (
                        <div
                          key={v.attrKey || vIdx}
                          className="p-3 bg-white rounded-xl border border-brand-border/70 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-black text-brand-dark block">{label}</span>
                              <span className="font-mono text-[10px] text-brand-muted">{v.sku}</span>
                            </div>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <span className="text-[11px] font-bold text-brand-muted">
                                {v.isActive ? 'متاح' : 'معطل'}
                              </span>
                              <input
                                type="checkbox"
                                checked={v.isActive}
                                onChange={(e) =>
                                  updateVariantRow(vIdx, 'isActive', e.target.checked)
                                }
                                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-border/40">
                            <div>
                              <label className="text-[10px] font-bold text-brand-muted block mb-1">
                                السعر (₪) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={v.price || ''}
                                onChange={(e) =>
                                  updateVariantRow(vIdx, 'price', Number(e.target.value))
                                }
                                className="w-full h-8 px-2 text-xs font-black rounded-lg border border-brand-border"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-brand-muted block mb-1">
                                قبل الخصم
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="اختياري"
                                value={v.compareAtPrice ?? ''}
                                onChange={(e) =>
                                  updateVariantRow(
                                    vIdx,
                                    'compareAtPrice',
                                    e.target.value === '' ? undefined : Number(e.target.value)
                                  )
                                }
                                className="w-full h-8 px-2 text-xs font-medium rounded-lg border border-brand-border text-brand-muted"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-brand-muted block mb-1">
                                المخزون *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={v.stock ?? ''}
                                onChange={(e) =>
                                  updateVariantRow(vIdx, 'stock', Number(e.target.value))
                                }
                                className="w-full h-8 px-2 text-xs font-black rounded-lg border border-brand-border"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 5: Visibility Toggle */}
          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-brand-dark select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
              />
              <span>تفعيل ونشر الصنف فورياً في واجهة المتجر</span>
            </label>
          </div>
        </form>

        {/* Bottom Translucent Glass Action Bar */}
        <div className="px-4 sm:px-7 py-3 sm:py-4 border-t border-brand-border/60 flex items-center justify-end gap-3 shrink-0 bg-white/90 backdrop-blur-md sticky bottom-0 z-20">
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
