'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { merchantKeys } from '@/features/merchant/queries/merchant.keys';
import { useMerchantContext } from '@/features/merchant/context/MerchantContext';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';
import { merchantService } from '@/features/merchant/services/merchant.service';
import type { ProductFormData } from '@/features/merchant/types/merchant.types';
import { useToast } from '@/components/ui/toast';
import { COLOR_SWATCHES } from '@/features/merchant/components/product-studio/ProductStudioTypes';
import {
  getAttributeKey,
  getAttributeDisplayName,
  isColorAttribute,
} from '@/shared/lib/attributeUtils';

interface VariantRowState {
  id: string;
  attributes: Record<string, string>;
  price: number | '';
  compareAtPrice: number | '';
  stock: number | '';
  sku: string;
  isEnabled: boolean; // Controls whether this combination is active or disabled
  image?: string;
  imageFile?: File;
}

/**
 * ضغط الصورة في المتصفح باستخدام Canvas لتلائم شبكات الاتصال الضعيفة في غزة
 */
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { store, isLoading: isAuthLoading } = useMerchantContext();
  const toast = useToast();

  // Categories & Active Category State (from DB)
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryId, setCategoryId] = useState('');

  // Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Base Pricing & Stock (Used for simple products; inherited by variants if options are created)
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [baseCompareAtPrice, setBaseCompareAtPrice] = useState<number | ''>('');
  const [baseStock, setBaseStock] = useState<number | ''>(10);

  // Active Option Keys enabled by the merchant (e.g. ["color", "size"])
  const [activeOptionKeys, setActiveOptionKeys] = useState<string[]>([]);

  // Selected Values per Active Option (e.g. { "color": ["أسود", "أبيض"], "size": ["M", "L"] })
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string[]>>({});

  // UI State: Open Dropdown Popover Key & Search Query
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');

  // Generated Variants Matrix
  const [variantsRows, setVariantsRows] = useState<VariantRowState[]>([]);

  // Bulk Apply Tools
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Gatekeeper: Redirect unapproved stores
  useEffect(() => {
    if (!isAuthLoading && store && store.approveStatus !== 'approved') {
      router.replace('/merchant/pending-approval');
    }
  }, [store, isAuthLoading, router]);

  // Load Real Categories from Database
  useEffect(() => {
    let isMounted = true;
    taxonomyService
      .fetchCategories()
      .then((cats) => {
        if (!isMounted) return;
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0]._id);
        }
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
        if (isMounted) setErrorMessage('تعذر جلب الأقسام من قاعدة البيانات');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Active Category & its DB Variant Attributes
  const activeCategory = useMemo(() => {
    return categories.find((c) => c._id === categoryId);
  }, [categories, categoryId]);

  const categoryAttributes = useMemo(() => {
    return activeCategory?.variantAttributes || [];
  }, [activeCategory]);

  const categorySupportsVariants = categoryAttributes.length > 0;

  // Available options from the category that have not been enabled yet
  const availableUnusedAttributes = useMemo(() => {
    return categoryAttributes.filter((attr) => !activeOptionKeys.includes(getAttributeKey(attr)));
  }, [categoryAttributes, activeOptionKeys]);

  // Checks if options are active (locks category selector until options are cleared)
  const hasOptions = activeOptionKeys.length > 0 || variantsRows.length > 0;

  // When Category changes: reset any options that do not belong to the new category
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setActiveOptionKeys([]);
    setSelectedAttributeValues({});
    setVariantsRows([]);
    setOpenDropdownKey(null);
    setDropdownSearch('');
    setErrorMessage(null);
  };

  // Enable a new option (Never auto-opens dropdown to keep interface peaceful)
  const handleAddOption = (attrKey: string) => {
    if (!activeOptionKeys.includes(attrKey)) {
      setActiveOptionKeys((prev) => [...prev, attrKey]);
    }
  };

  // Remove an active option
  const handleRemoveOption = (attrKey: string) => {
    setActiveOptionKeys((prev) => prev.filter((k) => k !== attrKey));
    setSelectedAttributeValues((prev) => {
      const copy = { ...prev };
      delete copy[attrKey];
      return copy;
    });
    if (openDropdownKey === attrKey) {
      setOpenDropdownKey(null);
      setDropdownSearch('');
    }
  };

  // Clear all selected values for an option
  const handleClearAllValues = (attrKey: string) => {
    setSelectedAttributeValues((prev) => ({
      ...prev,
      [attrKey]: [],
    }));
  };

  // Toggle Attribute Value Selection
  const handleToggleValue = (attrKey: string, val: string) => {
    setSelectedAttributeValues((prev) => {
      const current = prev[attrKey] || [];
      const exists = current.includes(val);
      const next = exists ? current.filter((v) => v !== val) : [...current, val];
      return {
        ...prev,
        [attrKey]: next,
      };
    });
  };

  // Generate Cartesian Product of Variants when selections change
  useEffect(() => {
    const activeKeysWithValues = activeOptionKeys.filter(
      (k) => selectedAttributeValues[k] && selectedAttributeValues[k].length > 0
    );

    if (activeKeysWithValues.length === 0) {
      setVariantsRows([]);
      return;
    }

    const cartesian = (keys: string[]): Record<string, string>[] => {
      if (keys.length === 0) return [{}];
      const [firstKey, ...restKeys] = keys;
      const restCombos = cartesian(restKeys);
      const values = selectedAttributeValues[firstKey] || [];
      const results: Record<string, string>[] = [];

      for (const val of values) {
        for (const rest of restCombos) {
          results.push({ [firstKey]: val, ...rest });
        }
      }
      return results;
    };

    const combinations = cartesian(activeKeysWithValues);

    setVariantsRows((prevRows) => {
      return combinations.map((comb) => {
        // Construct canonical attribute key for matching
        const comboKey = Object.entries(comb)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${v}`)
          .join('|');

        // Look for existing row with identical attributes to preserve price/stock/isEnabled
        const existing = prevRows.find((row) => {
          const rowKey = Object.entries(row.attributes)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('|');
          return rowKey === comboKey;
        });

        if (existing) {
          return existing;
        }

        return {
          id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          attributes: comb,
          price: basePrice !== '' ? basePrice : '',
          compareAtPrice: baseCompareAtPrice !== '' ? baseCompareAtPrice : '',
          stock: baseStock !== '' ? baseStock : 10,
          sku: '',
          isEnabled: true,
        };
      });
    });
  }, [activeOptionKeys, selectedAttributeValues, basePrice, baseCompareAtPrice, baseStock]);

  // Bulk Apply Price to all Enabled Variants
  const handleApplyBulkPrice = () => {
    const p = parseFloat(bulkPrice);
    if (isNaN(p) || p <= 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.isEnabled !== false ? { ...r, price: p } : r))
    );
    setBulkPrice('');
  };

  // Bulk Apply Stock to all Enabled Variants
  const handleApplyBulkStock = () => {
    const s = parseInt(bulkStock, 10);
    if (isNaN(s) || s < 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.isEnabled !== false ? { ...r, stock: s } : r))
    );
    setBulkStock('');
  };

  // Toggle specific variant row status (Enable / Disable via standard switch)
  const handleToggleVariantStatus = (idx: number) => {
    setVariantsRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  };

  // Enable all variant rows
  const handleEnableAllVariants = () => {
    setVariantsRows((prev) => prev.map((r) => ({ ...r, isEnabled: true })));
  };

  // Counts of enabled and disabled variants
  const enabledVariantsCount = useMemo(() => {
    return variantsRows.filter((r) => r.isEnabled !== false).length;
  }, [variantsRows]);

  const disabledVariantsCount = useMemo(() => {
    return variantsRows.filter((r) => r.isEnabled === false).length;
  }, [variantsRows]);

  // Image Upload Handler
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setErrorMessage('تنبيه: الحد الأقصى المسموح به هو 5 صور فقط لكل منتج لضمان سرعة التحميل والتصفح.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsUploadingImages(true);
    const newBase64s: string[] = [];
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file);
          newBase64s.push(compressed);
          newFiles.push(file);
        } catch (err) {
          console.error('Compression failed for', file.name, err);
        }
      }
    }

    setImages((prev) => [...prev, ...newBase64s]);
    setImageFiles((prev) => [...prev, ...newFiles]);
    setIsUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Variant-specific Image Upload & Remove
  const handleVariantImageUpload = async (idx: number, file: File) => {
    try {
      const compressedDataUrl = await compressImage(file);
      setVariantsRows((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          image: compressedDataUrl,
          imageFile: file,
        };
        return next;
      });
    } catch (err) {
      console.error('Failed to compress variant image:', err);
    }
  };

  const handleRemoveVariantImage = (idx: number) => {
    setVariantsRows((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        image: undefined,
        imageFile: undefined,
      };
      return next;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Computed: Has active variants in use under the hood
  const hasVariantsUnderTheHood = useMemo(() => {
    const hasValuesSelected = Object.keys(selectedAttributeValues).some(
      (k) => selectedAttributeValues[k] && selectedAttributeValues[k].length > 0
    );
    return activeOptionKeys.length > 0 && hasValuesSelected && enabledVariantsCount > 0;
  }, [activeOptionKeys, selectedAttributeValues, enabledVariantsCount]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('يرجى كتابة اسم الصنف.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('يرجى اختيار قسم الصنف.');
      return;
    }

    if (images.length === 0) {
      setErrorMessage('يرجى إضافة صورة واحدة على الأقل للصنف.');
      return;
    }

    const enabledRows = variantsRows.filter((r) => r.isEnabled !== false);

    // Validation based on whether variants exist under the hood
    if (!hasVariantsUnderTheHood) {
      if (basePrice === '' || Number(basePrice) <= 0) {
        setErrorMessage('يرجى تحديد سعر بيع صحيح للصنف (أكبر من 0).');
        return;
      }
      if (baseStock === '' || Number(baseStock) < 0) {
        setErrorMessage('يرجى تحديد كمية مخزون صحيحة (0 أو أكثر).');
        return;
      }
    } else {
      if (enabledRows.length === 0) {
        setErrorMessage('يرجى تفعيل توليفة واحدة على الأقل لنشر الصنف، أو إزالة الخيارات لجعله صنفاً موحداً.');
        return;
      }
      for (const row of enabledRows) {
        if (row.price === '' || Number(row.price) <= 0) {
          const label = Object.entries(row.attributes)
            .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
            .join(' / ');
          setErrorMessage(`يرجى تحديد سعر بيع صحيح للخيار (${label}).`);
          return;
        }
        if (row.stock === '' || Number(row.stock) < 0) {
          const label = Object.entries(row.attributes)
            .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
            .join(' / ');
          setErrorMessage(`يرجى تحديد كمية مخزون صحيحة للخيار (${label}).`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const payload: ProductFormData = {
        name: cleanTitle,
        title: cleanTitle,
        description: description.trim(),
        categoryId,
        images,
        imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
        isSimple: !hasVariantsUnderTheHood,
        simplePrice: Number(basePrice) || 0,
        simpleCompareAtPrice: baseCompareAtPrice !== '' ? Number(baseCompareAtPrice) : null,
        simpleStock: Number(baseStock) || 0,
        isFeatured: false,
        isActive: true,
        options: !hasVariantsUnderTheHood
          ? []
          : activeOptionKeys
              .filter((k) => selectedAttributeValues[k] && selectedAttributeValues[k].length > 0)
              .map((k) => {
                const attrDef = categoryAttributes.find((a) => getAttributeKey(a) === k);
                return {
                  key: k,
                  name: attrDef?.name || getAttributeDisplayName(k),
                  values: selectedAttributeValues[k],
                };
              }),
        variants: !hasVariantsUnderTheHood
          ? []
          : enabledRows.map((r) => {
              const attrKey = Object.entries(r.attributes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}:${v}`)
                .join('|');
              return {
                attributes: r.attributes,
                attrKey,
                sku: r.sku || '',
                price: Number(r.price) || 0,
                compareAtPrice: r.compareAtPrice !== '' ? Number(r.compareAtPrice) : null,
                stock: Number(r.stock) || 0,
                isActive: true,
                image: r.image,
                imageFile: r.imageFile,
              };
            }),
      };

      const res = await merchantService.createProduct(payload);

      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
        await queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
        router.refresh();
        setSuccessMessage('تم إضافة الصنف ونشره بنجاح في متجرك على سَدِيم.');
        toast.success('تم نشر الصنف بنجاح', `تمت إضافة «${cleanTitle}» إلى متجرك`);
        setTimeout(() => {
          router.push('/merchant/dashboard');
        }, 1000);
      } else {
        const msg = res.message || 'تعذر إضافة الصنف، يرجى المحاولة لاحقاً.';
        setErrorMessage(msg);
        toast.error('تعذر إضافة الصنف', msg);
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
      const msg = err.message || 'حدث خطأ غير متوقع أثناء إرسال البيانات.';
      setErrorMessage(msg);
      toast.error('حدث خطأ', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 font-almarai text-right">
      {/* Click-outside backdrop for open option pickers */}
      {openDropdownKey && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setOpenDropdownKey(null);
            setDropdownSearch('');
          }}
        />
      )}

      {/* Top Editorial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-brand-border/60">
        <div className="flex items-center gap-3">
          <Link
            href="/merchant/dashboard"
            className="w-9 h-9 rounded-xl border border-brand-border/80 flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors shrink-0"
            title="العودة للوحة التاجر"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-brand-dark">إضافة صنف جديد</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                سَدِيم
              </span>
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              أدخل تفاصيل الصنف بدقة؛ المتجر الموثوق يحظى بثقة زبائن غزة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-10 px-6 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <span>نشر الصنف</span>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800 text-sm font-black p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <span className="text-base">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Card 1: Basic Information, Category & Gallery */}
      <section className="bg-white rounded-2xl border border-brand-border/70 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="border-b border-brand-border/40 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-black text-brand-dark">معلومات الصنف ومعرض الصور</h2>
          </div>
          <span className="text-[10px] font-bold text-brand-muted">حقول أساسية</span>
        </div>

        {/* Category & Title in 1 Row on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unified Category Selection Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-brand-dark">
                قسم الصنف <span className="text-red-500">*</span>
              </label>
              {hasOptions && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  لتغيير القسم، يرجى حذف الخيارات أدناه أولاً
                </span>
              )}
            </div>
            {isLoadingCategories ? (
              <div className="h-11 rounded-xl bg-brand-surface/40 animate-pulse border border-brand-border/60" />
            ) : (
              <div className="relative">
                <select
                  value={categoryId}
                  disabled={hasOptions}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted text-xs">
                  ▼
                </div>
              </div>
            )}
            {hasOptions ? (
              <p className="text-[10px] text-amber-700 font-bold mt-1">
                لتغيير القسم، يرجى حذف الخيارات والتوليفات أولاً.
              </p>
            ) : (
              <p className="text-[10px] text-brand-muted mt-1">
                يحدد القسم تلقائياً الخيارات والصفات المتاحة لهذا الصنف وفق قاعدة بيانات سَدِيم.
              </p>
            )}
          </div>

          {/* Product Title */}
          <div>
            <label className="text-xs font-bold text-brand-dark block mb-1.5">
              اسم الصنف <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: قميص كتان طبيعي بيج أو زيت زيتون بكر معصرة 2026"
              className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
            <p className="text-[10px] text-brand-muted mt-1">
              اكتب اسماً واضحاً ومميزاً يصف الصنف بدقة لزبائن المتجر.
            </p>
          </div>
        </div>

        {/* Product Description */}
        <div>
          <label className="text-xs font-bold text-brand-dark block mb-1.5">
            وصف الصنف والمواصفات <span className="text-brand-muted text-[10px]">(اختياري)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب تفاصيل القماش، الحجم، المنشأ، أو طريقة الاستخدام لمساعدة الزبون على اتخاذ القرار..."
            className="w-full p-3.5 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
          />
        </div>

        {/* Images Gallery */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-brand-dark">
              صور الصنف <span className="text-red-500">*</span>{' '}
              <span className="text-[10px] font-normal text-brand-muted">
                (حتى 5 صور، الأولى هي الغلاف)
              </span>
            </label>
            <span className="text-[10px] font-bold text-brand-muted">{images.length} / 5 صور</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-brand-border/80 bg-brand-surface group shadow-2xs"
              >
                <img src={imgUrl} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute top-1 right-1 bg-brand-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                    غلاف
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute bottom-1 left-1 bg-black/70 hover:bg-red-600 text-white rounded-lg p-1 text-[10px] transition-colors cursor-pointer"
                  title="حذف الصورة"
                >
                  ✕
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages}
                className="aspect-square rounded-xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary/60 bg-brand-surface/30 hover:bg-brand-surface/60 transition-all flex flex-col items-center justify-center gap-1 text-brand-muted hover:text-brand-primary cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isUploadingImages ? (
                  <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg">📷</span>
                    <span className="text-[10px] font-bold">+ إضافة</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImagesUpload}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>
      </section>

      {/* Card 2: Pricing, Stock & Progressive Options */}
      <section className="bg-white rounded-2xl border border-brand-border/70 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="border-b border-brand-border/40 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-black text-brand-dark">التسعير والمخزون والخيارات</h2>
          </div>
          <span className="text-[10px] font-bold text-brand-muted">
            {hasVariantsUnderTheHood ? 'صنف متعدد الخيارات' : 'صنف موحد'}
          </span>
        </div>

        {/* Base Pricing & Stock Inputs: Only shown when product is simple (!hasVariantsUnderTheHood) */}
        {!hasVariantsUnderTheHood && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
            <div>
              <label className="text-xs font-bold text-brand-dark block mb-1.5">
                سعر البيع (₪) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="مثال: 45"
                className="w-full h-11 px-3.5 text-xs font-black rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-brand-dark block mb-1.5">
                الكمية المتوفرة في المخزن <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={baseStock}
                onChange={(e) => setBaseStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="مثال: 10"
                className="w-full h-11 px-3.5 text-xs font-black rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>
          </div>
        )}

        {/* Progressive Disclosure: Options Trigger Button */}
        {categorySupportsVariants && availableUnusedAttributes.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-brand-dark">هل يتوفر الصنف بعدة خيارات؟</span>
              {availableUnusedAttributes.map((attr) => {
                const attrKey = getAttributeKey(attr);
                const attrDisplay = getAttributeDisplayName(attr);
                return (
                  <button
                    key={attrKey}
                    type="button"
                    onClick={() => handleAddOption(attrKey)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-primary/50 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <span>+ إضافة {attrDisplay}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notice when Category has NO variant attributes in the DB */}
        {!categorySupportsVariants && (
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-600 font-medium">
            ℹ️ هذا القسم مخصص للمنتجات الموحدة فقط في قاعدة البيانات (سعر واحد ومخزون واحد).
          </div>
        )}

        {/* Active Enabled Options Section: Fixed-Button & Non-Jumping Picker */}
        {activeOptionKeys.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-brand-border/50">
            <div className="space-y-3">
              {activeOptionKeys.map((attrKey) => {
                const attrDef = categoryAttributes.find((a) => getAttributeKey(a) === attrKey);
                if (!attrDef) return null;

                const attrDisplay = getAttributeDisplayName(attrDef);
                const isColor = isColorAttribute(attrKey);
                const selectedVals = selectedAttributeValues[attrKey] || [];
                const allowedValues = attrDef.values || [];
                const unselectedValues = allowedValues.filter((v) => !selectedVals.includes(v));

                const isPopoverOpen = openDropdownKey === attrKey;
                const filteredUnselected = isPopoverOpen && dropdownSearch.trim()
                  ? unselectedValues.filter((v) =>
                      v.toLowerCase().includes(dropdownSearch.trim().toLowerCase())
                    )
                  : unselectedValues;

                return (
                  <div
                    key={attrKey}
                    className="p-4 rounded-xl border border-brand-border/70 bg-white shadow-2xs space-y-3 relative"
                  >
                    {/* Header Row: Option Name & Actions */}
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-brand-dark text-sm">{attrDisplay}</span>
                        {selectedVals.length > 0 && (
                          <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border/60">
                            {selectedVals.length} محدد
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedVals.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearAllValues(attrKey)}
                            className="h-7 px-2.5 rounded-lg border border-brand-border/80 bg-white hover:bg-brand-surface text-brand-muted hover:text-brand-dark text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                            title={`مسح كافة خيارات ${attrDisplay} المحددة`}
                          >
                            <svg className="w-3 h-3 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>مسح المحدد</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(attrKey)}
                          className="h-7 px-2.5 rounded-lg border border-red-200/80 bg-red-50/60 hover:bg-red-100/70 text-red-700 hover:text-red-800 text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                          title={`إزالة خيار ${attrDisplay} بالكامل من الصنف`}
                        >
                          <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>إزالة الخيار</span>
                        </button>
                      </div>
                    </div>

                    {/* Fixed Position Trigger: Never shifts when values are added */}
                    {unselectedValues.length > 0 ? (
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPopoverOpen) {
                              setOpenDropdownKey(null);
                              setDropdownSearch('');
                            } else {
                              setOpenDropdownKey(attrKey);
                              setDropdownSearch('');
                            }
                          }}
                          className="h-9 px-3.5 rounded-xl border border-brand-border/90 bg-brand-surface/60 hover:bg-brand-surface text-brand-dark text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                        >
                          <span>+ اختيار {attrDisplay} من القائمة ({unselectedValues.length} متبقي)</span>
                          <span className="text-[9px] text-brand-muted">▼</span>
                        </button>

                        {/* Floating Popover directly attached to this fixed button */}
                        {isPopoverOpen && (
                          <div className="absolute top-full mt-2 right-0 z-30 w-72 sm:w-84 p-3 rounded-2xl bg-white border border-brand-border/80 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/50 text-[11px] font-bold text-brand-dark">
                              <span>اختر {attrDisplay} لإضافته:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownKey(null);
                                  setDropdownSearch('');
                                }}
                                className="text-brand-muted hover:text-brand-dark text-xs p-0.5 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            <input
                              type="text"
                              placeholder={`بحث أو كتابة ${attrDisplay} مخصص...`}
                              value={dropdownSearch}
                              onChange={(e) => setDropdownSearch(e.target.value)}
                              className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface/30 focus:bg-white focus:outline-none focus:border-brand-primary"
                              autoFocus
                            />

                            {dropdownSearch.trim() && !selectedVals.includes(dropdownSearch.trim()) && !filteredUnselected.includes(dropdownSearch.trim()) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cleanVal = dropdownSearch.trim().slice(0, 80);
                                  handleToggleValue(attrKey, cleanVal);
                                  setDropdownSearch('');
                                }}
                                className="w-full h-8 px-2.5 rounded-lg border border-dashed border-brand-primary/70 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                              >
                                <span>+ إضافة &quot;{dropdownSearch.trim()}&quot; كـ {attrDisplay} مخصص</span>
                                <span className="text-[10px] font-black">إضافة ↵</span>
                              </button>
                            )}

                            <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5 no-scrollbar flex flex-wrap gap-1.5 pt-1">
                              {filteredUnselected.map((val) => {
                                const swatch = isColor ? COLOR_SWATCHES[val] || { hex: '#71717A' } : null;

                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleToggleValue(attrKey, val)}
                                    className="h-7 px-2.5 rounded-lg border border-brand-border/80 hover:border-brand-primary bg-white hover:bg-brand-surface text-brand-dark text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                  >
                                    {swatch && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{
                                          backgroundColor: swatch.hex,
                                          border: swatch.border ? '1px solid #D1D5DB' : 'none',
                                        }}
                                      />
                                    )}
                                    <span>{val}</span>
                                    <span className="text-[10px] text-brand-primary font-black">+</span>
                                  </button>
                                );
                              })}

                              {filteredUnselected.length === 0 && (
                                <div className="w-full py-4 text-center text-xs text-brand-muted">
                                  لا توجد نتائج مطابقة للبحث
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between text-[10px]">
                              <span className="text-brand-muted">انقر لإضافة الخيار</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownKey(null);
                                  setDropdownSearch('');
                                }}
                                className="text-brand-primary font-bold hover:underline cursor-pointer"
                              >
                                تم
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-200">
                        <span>✓</span>
                        <span>تم اختيار كافة خيارات {attrDisplay} المتاحة</span>
                      </div>
                    )}

                    {/* Selected Values Tags: Neatly listed BELOW the fixed button */}
                    {selectedVals.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {selectedVals.map((val) => {
                          const swatch = isColor ? COLOR_SWATCHES[val] || { hex: '#71717A' } : null;

                          return (
                            <span
                              key={val}
                              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-brand-primary/40 bg-brand-primary/10 text-brand-dark text-xs font-bold shadow-2xs"
                            >
                              {swatch && (
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                  style={{
                                    backgroundColor: swatch.hex,
                                    border: swatch.border ? '1px solid #D1D5DB' : 'none',
                                  }}
                                />
                              )}
                              <span>{val}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleValue(attrKey, val)}
                                className="text-brand-muted hover:text-red-600 text-xs font-black cursor-pointer p-0.5 leading-none"
                                title={`إزالة ${val}`}
                              >
                                ✕
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-brand-muted pt-0.5">
                        لم يتم اختيار أي {attrDisplay} بعد. انقر على الزر أعلاه لاختيار المتوفر لديك.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Generated Variants Table */}
            {variantsRows.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-brand-border/50">
                {/* Clean, Serene Table Header & Cohesive Bulk Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border/50">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xs font-black text-brand-dark">
                      التوليفات ({enabledVariantsCount} من {variantsRows.length} متوفرة)
                    </h3>
                    {disabledVariantsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleEnableAllVariants}
                        className="h-6 px-2.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[10px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                      >
                        <span>✓ تفعيل المستبعد ({disabledVariantsCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Cohesive, Prestigious Bulk Inputs Bar */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Unified Bulk Price Input Group */}
                    <div className="inline-flex items-center h-8 rounded-lg border border-brand-border/80 bg-white shadow-2xs hover:border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all overflow-hidden divide-x divide-x-reverse divide-brand-border/60">
                      <span className="px-2.5 text-[11px] font-bold text-brand-muted bg-brand-surface/60 h-full flex items-center select-none shrink-0">
                        سعر موحد
                      </span>
                      <div className="relative flex items-center h-full bg-white">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={bulkPrice}
                          onChange={(e) => setBulkPrice(e.target.value)}
                          className="w-20 h-full px-2 text-xs font-bold text-brand-dark bg-transparent focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-brand-muted/70 pl-2 select-none pointer-events-none">
                          ₪
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyBulkPrice}
                        disabled={!bulkPrice}
                        className={`h-full px-3 text-[11px] font-black transition-all cursor-pointer shrink-0 active:scale-95 ${
                          bulkPrice
                            ? 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-2xs'
                            : 'bg-brand-surface/50 text-brand-muted/50 cursor-not-allowed'
                        }`}
                      >
                        تطبيق
                      </button>
                    </div>

                    {/* Unified Bulk Stock Input Group */}
                    <div className="inline-flex items-center h-8 rounded-lg border border-brand-border/80 bg-white shadow-2xs hover:border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all overflow-hidden divide-x divide-x-reverse divide-brand-border/60">
                      <span className="px-2.5 text-[11px] font-bold text-brand-muted bg-brand-surface/60 h-full flex items-center select-none shrink-0">
                        كمية موحدة
                      </span>
                      <div className="relative flex items-center h-full bg-white">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={bulkStock}
                          onChange={(e) => setBulkStock(e.target.value)}
                          className="w-18 h-full px-2.5 text-xs font-bold text-brand-dark bg-transparent focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyBulkStock}
                        disabled={!bulkStock}
                        className={`h-full px-3 text-[11px] font-black transition-all cursor-pointer shrink-0 active:scale-95 ${
                          bulkStock
                            ? 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-2xs'
                            : 'bg-brand-surface/50 text-brand-muted/50 cursor-not-allowed'
                        }`}
                      >
                        تطبيق
                      </button>
                    </div>
                  </div>
                </div>

                {/* Matrix Rows with Standard Switch & Subtle Dimming */}
                <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                  {variantsRows.map((row, idx) => {
                    const isEnabled = row.isEnabled !== false;
                    const label = Object.entries(row.attributes)
                      .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
                      .join(' • ');

                    return (
                      <div
                        key={row.id}
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isEnabled
                            ? 'bg-white border-brand-border/70 hover:border-brand-primary/40 opacity-100 shadow-2xs'
                            : 'bg-zinc-100/50 border-zinc-200/60 opacity-30 select-none'
                        }`}
                      >
                        {/* Switch + Variant Image Thumbnail + Label */}
                        <div className="flex items-center gap-2.5">
                          {/* Standard iOS/Apple Style Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={() => handleToggleVariantStatus(idx)}
                            title={isEnabled ? 'تعطيل هذا الخيار' : 'تفعيل هذا الخيار'}
                            className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer shrink-0 ${
                              isEnabled ? 'bg-brand-primary justify-start' : 'bg-zinc-300 justify-end'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-white shadow-sm transition-all" />
                          </button>

                          {/* Variant Specific Image Picker */}
                          <div className="relative shrink-0">
                            <input
                              type="file"
                              id={`v-img-new-${row.id}`}
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              disabled={!isEnabled}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleVariantImageUpload(idx, f);
                              }}
                            />
                            {row.image ? (
                              <div className="relative group w-9 h-9 rounded-lg overflow-hidden border border-brand-border/80 shadow-2xs">
                                <img src={row.image} alt="" className="w-full h-full object-cover" />
                                {isEnabled && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantImage(idx)}
                                    title="إزالة الصورة المخصصة"
                                    className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ) : (
                              <label
                                htmlFor={`v-img-new-${row.id}`}
                                title="رفع صورة مخصصة لهذا الصنف (اختياري)"
                                className={`w-9 h-9 rounded-lg border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                                  isEnabled
                                    ? 'border-brand-border/80 hover:border-brand-primary bg-brand-surface/50 hover:bg-brand-primary/5 text-brand-muted hover:text-brand-primary'
                                    : 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-[7px] font-bold">صورة</span>
                              </label>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-black ${
                                isEnabled ? 'text-brand-dark' : 'text-zinc-500'
                              }`}
                            >
                              {label}
                            </span>
                            {!isEnabled && (
                              <span className="text-[10px] font-bold text-zinc-500">
                                (معطل)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price and Stock Inputs */}
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-brand-muted block mb-0.5">
                              السعر (₪) <span className="text-red-500">*</span>
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              required={isEnabled}
                              disabled={!isEnabled}
                              value={row.price}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                setVariantsRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, price: val } : r))
                                );
                              }}
                              placeholder="السعر"
                              className="w-24 h-9 px-2 text-xs font-bold rounded-lg border border-brand-border bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary disabled:opacity-40 disabled:bg-zinc-100"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-brand-muted block mb-0.5">
                              الكمية <span className="text-red-500">*</span>
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              required={isEnabled}
                              disabled={!isEnabled}
                              value={row.stock}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                setVariantsRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, stock: val } : r))
                                );
                              }}
                              placeholder="المخزون"
                              className="w-20 h-9 px-2 text-xs font-bold rounded-lg border border-brand-border bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary disabled:opacity-40 disabled:bg-zinc-100"
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
      </section>

      {/* Sticky Bottom Actions Bar (Properly docks with desktop sidebar: lg:right-68) */}
      <footer className="fixed bottom-0 left-0 right-0 lg:right-68 bg-white/95 backdrop-blur-md border-t border-brand-border/80 px-4 sm:px-8 py-3.5 z-20 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/merchant/dashboard"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-brand-muted hover:text-brand-dark border border-brand-border hover:bg-brand-surface transition-all"
          >
            إلغاء والعودة
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial sm:min-w-64 py-3 px-6 rounded-xl bg-brand-primary text-white text-xs sm:text-sm font-black hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ نشر الصنف في سَدِيم...</span>
              </>
            ) : (
              <span>نشر الصنف في سَدِيم</span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
