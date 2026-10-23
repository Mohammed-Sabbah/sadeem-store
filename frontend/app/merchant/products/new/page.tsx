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
  compareAtPrice?: number | '';
  stock: number | '';
  sku?: string;
  status?: 'active' | 'inActive';
  isEnabled?: boolean; // Controls whether this combination is active or disabled
  image?: string;
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
  const [customPopoverAttrKey, setCustomPopoverAttrKey] = useState<string | null>(null);
  const [customPopoverVal, setCustomPopoverVal] = useState('');

  // Generated Variants Matrix
  const [variantsRows, setVariantsRows] = useState<VariantRowState[]>([]);

  // Image Gallery Picker Modal state
  const [galleryPickerRowIdx, setGalleryPickerRowIdx] = useState<number | null>(null);

  // Add Single Custom Variant Modal state
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [singleVariantAttributes, setSingleVariantAttributes] = useState<Record<string, string>>({});
  const [singleVariantPrice, setSingleVariantPrice] = useState<number | ''>('');
  const [singleVariantStock, setSingleVariantStock] = useState<number | ''>(10);
  const [singleVariantImage, setSingleVariantImage] = useState<string | undefined>(undefined);
  const [customInputMode, setCustomInputMode] = useState<Record<string, boolean>>({});

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

  // Decoupled Cartesian Generator with Full Smart Reconciliation
  const handleGenerateCartesian = () => {
    const activeKeysWithValues = activeOptionKeys.filter(
      (k) => selectedAttributeValues[k] && selectedAttributeValues[k].length > 0
    );

    if (activeKeysWithValues.length === 0) {
      toast.error('تنبيه', 'يرجى تحديد خيار واحد على الأقل مع قيمه لتوليد التوليفات');
      return;
    }

    // Verify all active option keys have values selected
    const missingKeys = activeOptionKeys.filter(
      (k) => !selectedAttributeValues[k] || selectedAttributeValues[k].length === 0
    );
    if (missingKeys.length > 0) {
      const missingNames = missingKeys.map((k) => getAttributeDisplayName(k)).join('، ');
      toast.error('خيارات غير مكتملة', `يرجى اختيار قيم لـ (${missingNames}) قبل التوليد.`);
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

    const newCombinations = cartesian(activeOptionKeys);

    const defaultPrice =
      basePrice !== ''
        ? basePrice
        : (variantsRows.find((r) => Number(r.price) > 0)?.price ?? '');

    const defaultStock =
      baseStock !== ''
        ? baseStock
        : (variantsRows.find((r) => r.stock !== undefined)?.stock ?? 10);

    // Smart Reconciliation:
    // 1. Keep rows whose combination is in newCombinations (preserving price, stock, image, status)
    // 2. Add combinations that are not yet in the table
    // 3. Remove rows whose combination is no longer in newCombinations (e.g. unselected color/size)
    const nextRows: VariantRowState[] = [];

    newCombinations.forEach((combo) => {
      const existing = variantsRows.find((row) =>
        Object.entries(combo).every(
          ([ak, av]) => String(row.attributes[ak] || '').trim().toLowerCase() === av.trim().toLowerCase()
        ) && Object.keys(row.attributes).length === Object.keys(combo).length
      );

      if (existing) {
        nextRows.push(existing);
      } else {
        nextRows.push({
          id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          attributes: combo,
          price: defaultPrice,
          compareAtPrice: baseCompareAtPrice !== '' ? Number(baseCompareAtPrice) : '',
          stock: defaultStock,
          sku: '',
          status: 'active',
          isEnabled: true,
        });
      }
    });

    setVariantsRows(nextRows);
    toast.trust('تم التحديث', `تم تحديث جدول الأصناف (${nextRows.length} توليفة)`);
  };

  // Bulk Apply Price to all Enabled Variants
  const handleApplyBulkPrice = () => {
    const p = parseFloat(bulkPrice);
    if (isNaN(p) || p <= 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.status !== 'inActive' && r.isEnabled !== false ? { ...r, price: p } : r))
    );
    setBulkPrice('');
  };

  // Bulk Apply Stock to all Enabled Variants
  const handleApplyBulkStock = () => {
    const s = parseInt(bulkStock, 10);
    if (isNaN(s) || s < 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.status !== 'inActive' && r.isEnabled !== false ? { ...r, stock: s } : r))
    );
    setBulkStock('');
  };

  // Toggle specific variant row status (active vs inActive)
  const handleToggleVariantStatus = (idx: number) => {
    setVariantsRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const currentActive = r.status ? r.status === 'active' : r.isEnabled !== false;
        const nextActive = !currentActive;
        return {
          ...r,
          status: nextActive ? 'active' : 'inActive',
          isEnabled: nextActive,
        };
      })
    );
  };

  // Enable all variant rows
  const handleEnableAllVariants = () => {
    setVariantsRows((prev) => prev.map((r) => ({ ...r, status: 'active', isEnabled: true })));
  };

  // Remove variant row
  const handleRemoveRow = (rowIdx: number) => {
    setVariantsRows((prev) => prev.filter((_, i) => i !== rowIdx));
    toast.trust('تم الحذف', 'تم حذف السطر من جدول التوليفات');
  };

  // Add Single Custom Variant
  const handleAddSingleVariant = () => {
    const requiredKeys =
      variantsRows.length > 0
        ? Object.keys(variantsRows[0].attributes)
        : activeOptionKeys.length > 0
        ? activeOptionKeys
        : categoryAttributes.map((a) => getAttributeKey(a));

    if (requiredKeys.length === 0) {
      toast.error('خطأ', 'يرجى تفعيل خيار واحد على الأقل أولاً لإضافة صنف');
      return;
    }

    // Verify all required keys are filled and match attribute data types
    for (const key of requiredKeys) {
      const rawVal = singleVariantAttributes[key];
      if (!rawVal || !rawVal.trim()) {
        toast.error('نقص بيانات', `يرجى تحديد قيمة لخاصية ${getAttributeDisplayName(key)}`);
        return;
      }
      const def = categoryAttributes.find((a) => getAttributeKey(a) === key);
      if (def?.type === 'number') {
        const num = Number(rawVal.trim());
        if (isNaN(num) || rawVal.trim() === '') {
          toast.error('قيمة غير صالحة', `قيمة «${getAttributeDisplayName(key)}» يجب أن تكون رقماً صالحاً`);
          return;
        }
      }
    }

    if (singleVariantPrice === '' || Number(singleVariantPrice) <= 0) {
      toast.error('خطأ في السعر', 'يرجى إدخال سعر بيع صحيح أكبر من 0');
      return;
    }

    if (singleVariantStock === '' || Number(singleVariantStock) < 0) {
      toast.error('خطأ في المخزون', 'يرجى إدخال كمية مخزون صحيحة 0 أو أكثر');
      return;
    }

    const cleanAttrs: Record<string, string> = {};
    requiredKeys.forEach((k) => {
      cleanAttrs[k] = singleVariantAttributes[k].trim();
    });

    const exists = variantsRows.some((r) =>
      Object.entries(cleanAttrs).every(([ak, av]) => String(r.attributes[ak]).trim().toLowerCase() === av.trim().toLowerCase()) &&
      Object.keys(r.attributes).length === Object.keys(cleanAttrs).length
    );

    if (exists) {
      toast.error('صنف مكرر', 'هذه التوليفة موجودة بالفعل في الجدول');
      return;
    }

    setVariantsRows((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        attributes: cleanAttrs,
        price: Number(singleVariantPrice),
        compareAtPrice: baseCompareAtPrice !== '' ? Number(baseCompareAtPrice) : '',
        stock: Number(singleVariantStock),
        sku: '',
        status: 'active',
        isEnabled: true,
        image: singleVariantImage || undefined,
      },
    ]);

    setActiveOptionKeys((prev) => Array.from(new Set([...prev, ...requiredKeys])));

    setShowAddSingleModal(false);
    setSingleVariantAttributes({});
    setSingleVariantImage(undefined);
    toast.trust('تمت الإضافة', 'تمت إضافة الصنف الجديد للجدول بنجاح');
  };

  // Required keys for single custom variant modal
  const singleVariantRequiredKeys = useMemo(() => {
    if (variantsRows.length > 0) {
      return Object.keys(variantsRows[0].attributes);
    }
    if (activeOptionKeys.length > 0) {
      return activeOptionKeys;
    }
    return categoryAttributes.map((a) => getAttributeKey(a));
  }, [variantsRows, activeOptionKeys, categoryAttributes]);

  // Proactive live check if the combination currently entered already exists in variantsRows
  const isDuplicateCombination = useMemo(() => {
    if (singleVariantRequiredKeys.length === 0) return false;
    const allFilled = singleVariantRequiredKeys.every(
      (k) => singleVariantAttributes[k] && singleVariantAttributes[k].trim()
    );
    if (!allFilled) return false;

    return variantsRows.some((r) =>
      singleVariantRequiredKeys.every(
        (k) =>
          String(r.attributes[k] || '').trim().toLowerCase() ===
          singleVariantAttributes[k].trim().toLowerCase()
      ) && Object.keys(r.attributes).length === singleVariantRequiredKeys.length
    );
  }, [variantsRows, singleVariantRequiredKeys, singleVariantAttributes]);

  /**
   * Generalized N-Attribute Cascade Exhaustion Check
   * Checks whether choosing `candidateValue` for the attribute at `keyIndex`
   * is completely exhausted (all possible downstream combinations are already present in variantsRows).
   */
  const isOptionValueExhausted = (keyIndex: number, candidateValue: string): boolean => {
    if (!candidateValue || !candidateValue.trim()) return false;
    const cleanVal = candidateValue.trim();

    // Construct the prefix path up to keyIndex
    const currentPath: Record<string, string> = {};
    for (let i = 0; i < keyIndex; i++) {
      const k = singleVariantRequiredKeys[i];
      if (singleVariantAttributes[k]) {
        currentPath[k] = singleVariantAttributes[k].trim();
      }
    }
    currentPath[singleVariantRequiredKeys[keyIndex]] = cleanVal;

    // The remaining keys after keyIndex
    const remainingKeys = singleVariantRequiredKeys.slice(keyIndex + 1);

    // Leaf node: this is the final attribute in the combination
    if (remainingKeys.length === 0) {
      return variantsRows.some((row) =>
        singleVariantRequiredKeys.every(
          (k) => String(row.attributes[k] || '').trim().toLowerCase() === String(currentPath[k] || '').trim().toLowerCase()
        ) && Object.keys(row.attributes).length === singleVariantRequiredKeys.length
      );
    }

    // Intermediate node: check if every possible downstream combination from known options exists
    const downstreamArrays: string[][] = remainingKeys.map((rk) => {
      const pageVals = selectedAttributeValues[rk] || [];
      const catDef = categoryAttributes.find((a) => getAttributeKey(a) === rk);
      const catVals = catDef?.values || [];
      const rowVals = variantsRows.map((r) => r.attributes[rk]).filter(Boolean) as string[];

      const combined = Array.from(new Set([...pageVals, ...catVals, ...rowVals].map((v) => v.trim()))).filter(Boolean);
      return combined.length > 0 ? combined : [''];
    });

    const cartesianDownstream = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
        [[]]
      );
    };

    const downstreamCombos = cartesianDownstream(downstreamArrays);
    if (downstreamCombos.length === 0) return false;

    return downstreamCombos.every((dCombo) => {
      const fullCombo: Record<string, string> = { ...currentPath };
      remainingKeys.forEach((rk, idx) => {
        fullCombo[rk] = dCombo[idx];
      });

      return variantsRows.some((row) =>
        singleVariantRequiredKeys.every(
          (k) => String(row.attributes[k] || '').trim().toLowerCase() === String(fullCombo[k] || '').trim().toLowerCase()
        ) && Object.keys(row.attributes).length === singleVariantRequiredKeys.length
      );
    });
  };

  // Counts of enabled and disabled variants
  const enabledVariantsCount = useMemo(() => {
    return variantsRows.filter((r) => r.status ? r.status === 'active' : r.isEnabled !== false).length;
  }, [variantsRows]);

  const disabledVariantsCount = useMemo(() => {
    return variantsRows.filter((r) => r.status ? r.status === 'inActive' : r.isEnabled === false).length;
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

const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Computed: the product is multi-variant as long as the variants table has rows.
  // Rows disabled by the merchant stay in the table and are submitted as `inActive`.
  const hasVariantsUnderTheHood = useMemo(() => variantsRows.length > 0, [variantsRows.length]);

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

    const hasActiveVariant = variantsRows.some((r) => r.status ? r.status === 'active' : r.isEnabled !== false);

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
      if (!hasActiveVariant) {
        setErrorMessage('يرجى تفعيل توليفة واحدة على الأقل لنشر الصنف، أو إزالة الخيارات لجعله صنفاً موحداً.');
        return;
      }
      for (const row of variantsRows) {
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
          : variantsRows.map((r) => {
              const attrKey = Object.entries(r.attributes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}:${v}`)
                .join('|');
              const isRowActive = r.status ? r.status === 'active' : r.isEnabled !== false;
              return {
                attributes: r.attributes,
                attrKey,
                sku: r.sku || '',
                price: Number(r.price) || 0,
                compareAtPrice: r.compareAtPrice !== '' ? Number(r.compareAtPrice) : null,
                stock: Number(r.stock) || 0,
                status: isRowActive ? 'active' : 'inActive',
                isActive: isRowActive,
                image: r.image,
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
    <div className="w-full space-y-6 pb-24 font-almarai text-right">
      {/* Click-outside backdrop for open option pickers */}
      {openDropdownKey && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setOpenDropdownKey(null);
            setDropdownSearch('');
            setCustomPopoverAttrKey(null);
            setCustomPopoverVal('');
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

        {/* Product Title & Category in 1 Row on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                setCustomPopoverAttrKey(null);
                                setCustomPopoverVal('');
                              }}
                              className="text-brand-muted hover:text-brand-dark text-xs p-0.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Quick Search */}
                          <input
                            type="text"
                            placeholder={`بحث سريع في خيارات ${attrDisplay}...`}
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface/30 focus:bg-white focus:outline-none focus:border-brand-primary"
                            autoFocus
                          />

                          {/* Unselected Options List */}
                          <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5 no-scrollbar flex flex-wrap gap-1.5 pt-1">
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
                              <div className="w-full py-2 text-center text-xs text-brand-muted">
                                تم اختيار كافة الخيارات المقترحة
                              </div>
                            )}
                          </div>

                          {/* Dedicated Explicit Custom Value Section */}
                          {(() => {
                            const attrDef = categoryAttributes.find((a) => getAttributeKey(a) === attrKey);
                            const isNumberType = attrDef?.type === 'number';
                            const isBoxOpen = customPopoverAttrKey === attrKey;
                            const trimmedVal = customPopoverVal.trim();
                            const isValidNum = !isNaN(Number(trimmedVal)) && trimmedVal !== '';
                            const canAdd = isNumberType ? isValidNum : trimmedVal.length > 0;

                            const handleConfirmCustom = () => {
                              if (!canAdd) return;
                              const cleanVal = trimmedVal.slice(0, 80);
                              handleToggleValue(attrKey, cleanVal);
                              setCustomPopoverVal('');
                              setCustomPopoverAttrKey(null);
                            };

                            if (!isBoxOpen) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomPopoverAttrKey(attrKey);
                                    setCustomPopoverVal('');
                                  }}
                                  className="w-full h-8 px-3 rounded-lg border border-dashed border-brand-primary/60 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                                >
                                  <span>✍️ + إضافة {attrDisplay} مخصص</span>
                                </button>
                              );
                            }

                            return (
                              <div className="p-2.5 rounded-xl border border-brand-primary/40 bg-brand-primary/5 space-y-2 animate-in fade-in">
                                <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                                  <span>✍️ كتابة {attrDisplay} مخصص:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomPopoverAttrKey(null);
                                      setCustomPopoverVal('');
                                    }}
                                    className="text-brand-muted hover:text-brand-dark text-xs p-0.5 cursor-pointer"
                                  >
                                    إلغاء ✕
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type={isNumberType ? 'number' : 'text'}
                                    maxLength={isNumberType ? undefined : 80}
                                    placeholder={isNumberType ? `أدخل رقماً لـ ${attrDisplay}...` : `اكتب ${attrDisplay} مخصص...`}
                                    value={customPopoverVal}
                                    onChange={(e) => setCustomPopoverVal(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleConfirmCustom();
                                      }
                                    }}
                                    className="flex-1 h-8 px-2.5 text-xs font-bold rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={handleConfirmCustom}
                                    disabled={!canAdd}
                                    className="h-8 px-3 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover disabled:opacity-40 cursor-pointer shadow-2xs shrink-0"
                                  >
                                    إضافة
                                  </button>
                                </div>
                                {trimmedVal && isNumberType && !isValidNum && (
                                  <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-md border border-amber-200">
                                    ⚠️ خاصية «{attrDisplay}» تقبل أرقاماً فقط (مثال: 42 أو 10.5).
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between text-[10px]">
                            <span className="text-brand-muted">انقر لإضافة الخيار</span>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownKey(null);
                                setDropdownSearch('');
                                setCustomPopoverAttrKey(null);
                                setCustomPopoverVal('');
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

            {/* Generate Action Button */}
            {activeOptionKeys.length > 0 && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-brand-border/80 bg-brand-surface/30 mt-3">
                <div>
                  <h4 className="text-xs font-black text-brand-dark flex items-center gap-1.5">
                    <span>توليد جدول التوليفات والأصناف</span>
                    <span className="text-[10px] text-brand-primary font-bold">
                      ({Object.values(selectedAttributeValues).reduce((acc, curr) => acc * (curr.length || 1), 1)} توليفة محتملة)
                    </span>
                  </h4>
                  <p className="text-[11px] text-brand-muted">
                    انقر لدمج الخيارات المحددة وإضافتها مباشرة إلى جدول الأصناف دون مسح السطور المخصصة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCartesian}
                  className="h-8 px-4 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-95 transition-all shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>توليد / تحديث الأصناف</span>
                </button>
              </div>
            )}

            {/* Generated Variants Table */}
            {variantsRows.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-brand-border bg-brand-surface/40 text-center space-y-3 mt-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-brand-dark">لا توجد أصناف في الجدول حالياً</h4>
                  <p className="text-[11px] text-brand-muted max-w-md mx-auto">
                    اختر المقاسات والألوان أعلاه واضغط على &quot;توليد جدول الأصناف&quot; لتجهيزها فوراً، أو أضف صنفاً يدوياً.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSingleVariantAttributes({});
                    setSingleVariantPrice(basePrice !== '' ? basePrice : '');
                    setSingleVariantStock(baseStock !== '' ? baseStock : 10);
                    setSingleVariantImage(undefined);
                    setCustomInputMode({});
                    setShowAddSingleModal(true);
                  }}
                  className="h-9 px-4 rounded-xl border border-brand-border bg-white hover:border-brand-primary text-brand-dark hover:text-brand-primary text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ إضافة صنف / توليفة مفردة</span>
                </button>
              </div>
            ) : (
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
                          className="w-16 h-full px-2 text-xs font-bold text-brand-dark bg-transparent focus:outline-none"
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

                {/* Variants List Items */}
                <div className="divide-y divide-brand-border/60 border border-brand-border/70 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {variantsRows.map((row, idx) => {
                    const isActive = row.status ? row.status === 'active' : row.isEnabled !== false;
                    const label = Object.entries(row.attributes)
                      .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
                      .join(' • ');

                    return (
                      <div
                        key={row.id || idx}
                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          !isActive ? 'bg-zinc-50/70 opacity-60' : 'hover:bg-brand-surface/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* iOS Status Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => handleToggleVariantStatus(idx)}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                              isActive ? 'bg-brand-primary' : 'bg-brand-border'
                            }`}
                            title={isActive ? 'إيقاف الصنف مؤقتاً (معطل)' : 'تفعيل الصنف للبيع (معروض)'}
                          >
                            <span
                              className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                                isActive ? '-translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Variant Specific Image Picker */}
                          <div className="relative shrink-0">
                            {row.image ? (
                              <div
                                onClick={() => setGalleryPickerRowIdx(idx)}
                                title="تغيير صورة الصنف من المعرض"
                                className="relative group w-9 h-9 rounded-lg overflow-hidden border border-brand-border/80 shadow-2xs cursor-pointer"
                              >
                                <img src={row.image} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-bold">
                                  تغيير
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setGalleryPickerRowIdx(idx)}
                                title="اختيار صورة للصنف من المعرض"
                                className="w-9 h-9 rounded-lg border border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/50 hover:bg-brand-primary/5 text-brand-muted hover:text-brand-primary flex flex-col items-center justify-center cursor-pointer transition-all"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-[7px] font-bold">صورة</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-brand-dark">{label}</span>
                          </div>
                        </div>

                        {/* Inline Inputs & Delete Button */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-brand-muted">السعر:</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={row.price}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setVariantsRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, price: val } : r))
                                  );
                                }}
                                className="w-20 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                              />
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted">
                                ₪
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-brand-muted">المخزون:</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={row.stock}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                setVariantsRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, stock: val } : r))
                                );
                              }}
                              className="w-18 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                            />
                          </div>

                          {/* Delete Button (✕) */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            title="حذف هذا الصنف نهائياً"
                            className="w-8 h-8 rounded-lg border border-red-200/70 bg-red-50/50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Single Variant Bottom Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSingleVariantAttributes({});
                    setSingleVariantPrice(basePrice !== '' ? basePrice : '');
                    setSingleVariantStock(baseStock !== '' ? baseStock : 10);
                    setSingleVariantImage(undefined);
                    setCustomInputMode({});
                    setShowAddSingleModal(true);
                  }}
                  className="w-full h-10 rounded-xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/20 hover:bg-brand-primary/5 text-brand-dark hover:text-brand-primary text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>+ إضافة صنف / توليفة مفردة</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Sticky Bottom Actions Bar (Properly docks with desktop sidebar: lg:right-68) */}
      <footer className="fixed bottom-0 left-0 right-0 lg:right-68 bg-white/95 backdrop-blur-md border-t border-brand-border/80 px-4 sm:px-8 py-3.5 z-20 shadow-lg">
        <div className="w-full max-w-[1500px] mx-auto flex items-center justify-between gap-4">
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

      {/* Gallery Picker Modal */}
      {galleryPickerRowIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right font-almarai">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="text-xs font-black text-brand-dark">اختيار صورة للصنف من المعرض</h3>
              <button
                type="button"
                onClick={() => setGalleryPickerRowIdx(null)}
                className="text-brand-muted hover:text-brand-dark text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {images.filter((img) => img && img.trim()).length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {images
                    .filter((img) => img && img.trim())
                    .map((imgUrl, i) => {
                      const isSelected = variantsRows[galleryPickerRowIdx]?.image === imgUrl;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setVariantsRows((prev) =>
                              prev.map((r, idx) => (idx === galleryPickerRowIdx ? { ...r, image: imgUrl } : r))
                            );
                            setGalleryPickerRowIdx(null);
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-brand-primary ring-2 ring-brand-primary/20'
                              : 'border-brand-border hover:border-brand-primary/50'
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-black flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <span className="text-2xl">🖼️</span>
                  <p className="text-xs font-bold text-brand-muted">
                    لم يتم رفع صور في قسم معرض المنتج بعد.
                  </p>
                  <p className="text-[11px] text-brand-muted/70">
                    ارفع صوراً في قسم صور المنتج أولاً لتتمكن من تخصيصها لكل صنف.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-brand-border">
              {variantsRows[galleryPickerRowIdx]?.image && (
                <button
                  type="button"
                  onClick={() => {
                    setVariantsRows((prev) =>
                      prev.map((r, idx) => (idx === galleryPickerRowIdx ? { ...r, image: undefined } : r))
                    );
                    setGalleryPickerRowIdx(null);
                  }}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  إزالة صورة الصنف
                </button>
              )}
              <button
                type="button"
                onClick={() => setGalleryPickerRowIdx(null)}
                className="h-8 px-4 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface cursor-pointer ms-auto"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Variant Modal */}
      {showAddSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right font-almarai max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <h3 className="text-xs font-black text-brand-dark">إضافة صنف / توليفة مفردة</h3>
              <button
                type="button"
                onClick={() => setShowAddSingleModal(false)}
                className="text-brand-muted hover:text-brand-dark text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Cascading Accessible Attribute Selects */}
            <div className="space-y-3.5">
              {singleVariantRequiredKeys.map((key, keyIndex) => {
                const catDef = categoryAttributes.find((a) => getAttributeKey(a) === key);
                const allKnownValues = Array.from(
                  new Set([
                    ...(catDef?.values || []),
                    ...(selectedAttributeValues[key] || []),
                    ...variantsRows.map((r) => r.attributes[key]).filter(Boolean),
                  ].map((v) => v.trim()))
                ).filter(Boolean);

                const currentVal = singleVariantAttributes[key] || '';
                const isCustomMode = customInputMode[key] || false;

                return (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black flex items-center justify-center">
                          {keyIndex + 1}
                        </span>
                        <span>{getAttributeDisplayName(key)}</span>
                      </span>
                      <span className="text-[10px] text-brand-muted font-normal">
                        {keyIndex === 0 ? 'اختر القيمة الأساسية' : `تعتمد على ${getAttributeDisplayName(singleVariantRequiredKeys[keyIndex - 1])}`}
                      </span>
                    </label>

                    {/* Clean Dropdown */}
                    <div className="relative">
                      <select
                        value={isCustomMode ? '__CUSTOM__' : currentVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__CUSTOM__') {
                            setCustomInputMode((prev) => ({ ...prev, [key]: true }));
                            setSingleVariantAttributes((prev) => {
                              const next = { ...prev, [key]: '' };
                              for (let i = keyIndex + 1; i < singleVariantRequiredKeys.length; i++) {
                                delete next[singleVariantRequiredKeys[i]];
                              }
                              return next;
                            });
                          } else {
                            setCustomInputMode((prev) => ({ ...prev, [key]: false }));
                            setSingleVariantAttributes((prev) => {
                              const next = { ...prev, [key]: val };
                              for (let i = keyIndex + 1; i < singleVariantRequiredKeys.length; i++) {
                                delete next[singleVariantRequiredKeys[i]];
                              }
                              return next;
                            });
                          }
                        }}
                        className="w-full h-10 px-3.5 pl-8 text-xs font-bold rounded-xl border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- اختر {getAttributeDisplayName(key)} --</option>
                        {allKnownValues.map((pv) => {
                          const isExhausted = isOptionValueExhausted(keyIndex, pv);
                          return (
                            <option
                              key={pv}
                              value={pv}
                              disabled={isExhausted}
                              className={isExhausted ? 'text-gray-400 bg-gray-50' : 'text-brand-dark font-medium'}
                            >
                              {pv} {isExhausted ? '(مضاف بالكامل)' : ''}
                            </option>
                          );
                        })}
                        <option value="__CUSTOM__">✍️ كتابة قيمة مخصصة أخرى...</option>
                      </select>
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted text-xs">
                        ▼
                      </div>
                    </div>

                    {/* Custom Input Field if selected */}
                    {isCustomMode && (
                      <div className="pt-1 animate-in fade-in">
                        {(() => {
                          const def = categoryAttributes.find((a) => getAttributeKey(a) === key);
                          const isNum = def?.type === 'number';
                          return (
                            <input
                              type={isNum ? 'number' : 'text'}
                              maxLength={isNum ? undefined : 80}
                              autoFocus
                              placeholder={isNum ? `أدخل رقماً لـ ${getAttributeDisplayName(key)}...` : `اكتب قيمة جديدة لـ ${getAttributeDisplayName(key)}...`}
                              value={currentVal}
                              onChange={(e) =>
                                setSingleVariantAttributes((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              className="w-full h-9 px-3.5 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                            />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-dark">السعر (₪) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="السعر"
                      value={singleVariantPrice}
                      onChange={(e) =>
                        setSingleVariantPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className="w-full h-9 px-3 pl-7 text-xs font-bold rounded-xl border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted">
                      ₪
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-dark">المخزون *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="الكمية"
                    value={singleVariantStock}
                    onChange={(e) =>
                      setSingleVariantStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Optional Image Assignment */}
              {images.filter((img) => img && img.trim()).length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-brand-dark">صورة الصنف (اختياري)</label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSingleVariantImage(undefined)}
                      className={`w-11 h-11 rounded-lg border text-[10px] font-bold shrink-0 flex items-center justify-center cursor-pointer ${
                        !singleVariantImage
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-brand-border bg-brand-surface text-brand-muted'
                      }`}
                    >
                      تلقائي
                    </button>
                    {images
                      .filter((img) => img && img.trim())
                      .map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSingleVariantImage(imgUrl)}
                          className={`relative w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                            singleVariantImage === imgUrl
                              ? 'border-brand-primary ring-2 ring-brand-primary/20'
                              : 'border-brand-border hover:border-brand-primary/50'
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Duplicate Warning Banner */}
            {isDuplicateCombination && (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2 shadow-2xs animate-in fade-in">
                <span className="text-base leading-none shrink-0">⚠️</span>
                <div className="space-y-0.5">
                  <p className="font-black text-amber-950">هذه التوليفة موجودة بالفعل في الجدول!</p>
                  <p className="text-[11px] text-amber-800 font-normal">
                    تمت إضافة الصنف بهذه الخصائص مسبقاً. لتعديل سعره أو مخزونه، يمكنك تحديثه مباشرة من جدول الأصناف بالأسفل.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setShowAddSingleModal(false)}
                className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddSingleVariant}
                disabled={isDuplicateCombination}
                className="flex-1 h-9 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs transition-all"
              >
                {isDuplicateCombination ? 'التوليفة مضافة مسبقاً' : 'إضافة الصنف للجدول'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
