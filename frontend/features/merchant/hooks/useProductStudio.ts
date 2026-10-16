'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { merchantService } from '@/features/merchant/services/merchant.service';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';
import type {
  ProductItem,
  ProductOption,
  OptionDefinition,
} from '@/features/merchant/types/merchant.types';
import type { StudioTab } from '../components/product-studio/ProductStudioTypes';

export interface VariantItemState {
  _id?: string;
  sku: string;
  attributes: Record<string, string>;
  attrKey: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isActive: boolean;
  images?: string[];
}

export function useProductStudio(productId: string) {
  const router = useRouter();

  // Active Hub Tab
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core entities
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allowedDefinitions, setAllowedDefinitions] = useState<OptionDefinition[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAnonymousVendor, setIsAnonymousVendor] = useState(false);

  // Gallery (Device Upload & Cloud Readiness)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Mode: Simple vs Configurable
  const [isSimple, setIsSimple] = useState(false);

  const handleSetIsSimple = (val: boolean) => {
    if (val) {
      const hasActiveVariants =
        options.some((o) => o.values && o.values.length > 0) || variants.length > 0;
      if (hasActiveVariants) {
        setErrorMessage(
          'لا يمكن تحويل الصنف إلى (صنف موحد) طالما توجد خيارات ومقاسات محددة. يرجى حذف الخيارات بالأسفل أولاً لتتمكن من تحويله.'
        );
        return;
      }
    }
    setErrorMessage(null);
    setIsSimple(val);
  };

  // Simple Product Fields
  const [simplePrice, setSimplePrice] = useState<number | string>(50);
  const [simpleCompareAtPrice, setSimpleCompareAtPrice] = useState<number | string>('');
  const [simpleStock, setSimpleStock] = useState<number | string>(10);
  const [simpleSku, setSimpleSku] = useState('');

  // Configurable Options & Visual Color-Image Map
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [optionTagInputs, setOptionTagInputs] = useState<Record<number, string>>({});
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({});
  const [deletedVariantKeys, setDeletedVariantKeys] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState<Record<number, boolean>>({});

  // Bulk Values Tool
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');

  // Generated Variants Matrix
  const [variants, setVariants] = useState<VariantItemState[]>([]);

  // Bespoke Apple Popovers & Menus State
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
  const [activeValuePopoverIdx, setActiveValuePopoverIdx] = useState<number | null>(null);
  const [activeColorPhotoPopover, setActiveColorPhotoPopover] = useState<string | null>(null);
  const [customColorInput, setCustomColorInput] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Global Click-Outside Listener to dismiss popovers seamlessly
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-popover]')) {
        setIsAddOptionOpen(false);
        setActiveValuePopoverIdx(null);
        setActiveColorPhotoPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Initial Load
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
          const currentCatId = typeof p.categoryId === 'object' ? (p.categoryId as any)._id : p.categoryId;
          setCategoryId(currentCatId || (cats[0]?._id ?? ''));
          setImages(p.images && p.images.length > 0 ? p.images : []);
          setIsActive(p.isActive !== undefined ? p.isActive : true);
          setIsFeatured(p.isFeatured || false);
          setIsAnonymousVendor(p.isAnonymousVendor || false);

          const hasOptions = Array.isArray(p.options) && p.options.length > 0;
          setIsSimple(!hasOptions);

          const mappedOptions: ProductOption[] = (p.options || []).map((o) => ({
            key: o.key,
            source: o.source || 'DEFINED',
            label: o.label || o.name,
            name: o.name || o.label || o.key || '',
            type: o.type || 'TEXT',
            unit: o.unit || null,
            values: o.values || [],
          }));
          setOptions(mappedOptions);

          const mappedVariants: VariantItemState[] = (p.variants || []).map((v) => ({
            _id: v._id,
            sku: v.sku,
            attributes:
              v.attributes instanceof Map ? Object.fromEntries(v.attributes) : v.attributes || {},
            attrKey: v.attrKey || 'default',
            price: Number(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            stock: Number(v.stock) || 0,
            isActive: v.isActive !== undefined ? v.isActive : true,
            images: v.images || (v.image ? [v.image] : []),
          }));
          setVariants(mappedVariants);

          if (!hasOptions && mappedVariants.length > 0) {
            setSimplePrice(mappedVariants[0].price);
            setSimpleCompareAtPrice(mappedVariants[0].compareAtPrice ?? '');
            setSimpleStock(mappedVariants[0].stock);
            setSimpleSku(mappedVariants[0].sku);
          }
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

  // Category Change with strict intentional guard
  const handleCategoryChange = (newCatId: string) => {
    if (newCatId === categoryId) return;

    const hasActiveVariants =
      !isSimple && (options.some((o) => o.values && o.values.length > 0) || variants.length > 0);

    if (hasActiveVariants) {
      setErrorMessage(
        'لا يمكن تغيير قسم الصنف طالما توجد خيارات ومقاسات محددة. يرجى حذف الخيارات الحالية أولاً أو تحويل الصنف إلى (صنف موحد) لتتمكن من تغيير القسم.'
      );
      return;
    }

    setErrorMessage(null);
    setCategoryId(newCatId);
  };

  // Load category options on category switch
  useEffect(() => {
    if (!categoryId) return;

    const activeCat = categories.find((c) => c._id === categoryId);
    if (activeCat?.variantAttributes && activeCat.variantAttributes.length > 0) {
      const mappedDefs: OptionDefinition[] = activeCat.variantAttributes.map((attr) => {
        const lower = attr.name.toLowerCase();
        const isColor = lower === 'color' || attr.name.includes('لون');
        const isSize = lower === 'size' || lower.includes('size_') || attr.name.includes('مقاس');
        const isVolume =
          lower === 'volume' ||
          attr.name.includes('حجم') ||
          attr.name.includes('مل') ||
          attr.name.includes('لتر');
        const isBattery =
          lower.includes('battery') ||
          attr.name.includes('بطارية') ||
          attr.name.includes('أمبير') ||
          attr.name.includes('واط');
        const isWeight =
          lower === 'weight' ||
          attr.name.includes('وزن') ||
          attr.name.includes('كغم') ||
          attr.name.includes('جرام');
        const isStorage =
          !isVolume &&
          !isBattery &&
          (lower === 'storage' ||
            attr.name.includes('تخزين') ||
            attr.name.includes('ذاكرة') ||
            attr.name.includes('جيجا'));

        let label = attr.name;
        let type: 'COLOR' | 'SIZE' | 'TEXT' | 'NUMERIC' = 'TEXT';
        let unit: string | null = null;

        if (isColor) {
          label = 'اللون';
          type = 'COLOR';
        } else if (isSize) {
          label = 'المقاس';
          type = 'SIZE';
        } else if (isVolume) {
          label = attr.name;
          type = 'NUMERIC';
          unit = 'ml';
        } else if (isBattery) {
          label = attr.name;
          type = 'NUMERIC';
          unit = 'mah';
        } else if (isStorage) {
          label = attr.name;
          type = 'NUMERIC';
          unit = 'gb';
        } else if (isWeight) {
          label = attr.name;
          type = 'NUMERIC';
          unit = 'kg';
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
      setAllowedDefinitions(mappedDefs);
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
        setAllowedDefinitions(refinedDefs);
      }
    });
  }, [categoryId, categories]);

  // Calculated Metrics
  const variantsCount = isSimple ? 1 : variants.length;

  const totalStock = useMemo(() => {
    if (isSimple) return Number(simpleStock) || 0;
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [isSimple, simpleStock, variants]);

  const minPrice = useMemo(() => {
    if (isSimple) return Number(simplePrice) || 0;
    if (variants.length === 0) return 0;
    return Math.min(...variants.map((v) => Number(v.price) || 0));
  }, [isSimple, simplePrice, variants]);

  const maxPrice = useMemo(() => {
    if (isSimple) return Number(simplePrice) || 0;
    if (variants.length === 0) return 0;
    return Math.max(...variants.map((v) => Number(v.price) || 0));
  }, [isSimple, simplePrice, variants]);

  // Dirty State Detection
  const isDirty = useMemo(() => {
    if (!product) return false;
    if (name !== (product.name || product.title || '')) return true;
    if (description !== (product.description || '')) return true;
    if (isActive !== (product.isActive !== undefined ? product.isActive : true)) return true;
    if (isFeatured !== Boolean(product.isFeatured)) return true;
    if (isAnonymousVendor !== Boolean(product.isAnonymousVendor)) return true;
    if (images.length !== (product.images || []).length) return true;
    return false;
  }, [product, name, description, isActive, isFeatured, isAnonymousVendor, images]);

  // Gallery Handlers with Client-Side Canvas Compression
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
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
        setUploadFeedback(`تم ضغط وإضافة ${validUrls.length} صور بنجاح`);
        setTimeout(() => setUploadFeedback(null), 3500);
      }
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setIsProcessingFiles(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const cleanUrl = newImageUrl.trim();
    if (!cleanUrl) return;
    setImages((prev) => [...prev, cleanUrl]);
    setNewImageUrl('');
    setShowUrlInput(false);
  };

  const handleSetPrimaryImage = (imgIdx: number) => {
    if (imgIdx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [target] = next.splice(imgIdx, 1);
      next.unshift(target);
      return next;
    });
  };

  const handleRemoveImage = (imgIdx: number) => {
    const targetUrl = images[imgIdx];
    setImages((prev) => prev.filter((_, idx) => idx !== imgIdx));

    const updatedMap = { ...colorImageMap };
    for (const color in updatedMap) {
      if (updatedMap[color] === targetUrl) {
        delete updatedMap[color];
      }
    }
    setColorImageMap(updatedMap);
  };

  // Options Helpers
  const handleAddPredefinedOption = (typeOrDef: 'COLOR' | 'SIZE' | 'CUSTOM' | OptionDefinition) => {
    if (typeof typeOrDef === 'object') {
      const def = typeOrDef;
      if (options.some((o) => o.key === def.key || o.name === def.label || o.label === def.label)) return;
      setOptions((prev) => [
        ...prev,
        {
          key: def.key,
          source: 'DEFINED',
          label: def.label,
          name: def.label,
          type: def.type || 'TEXT',
          unit: def.unit || null,
          values: [],
        },
      ]);
      return;
    }

    if (typeOrDef === 'COLOR') {
      if (options.some((o) => o.type === 'COLOR' || o.name === 'اللون')) return;
      setOptions((prev) => [
        ...prev,
        {
          key: 'opt_color',
          source: 'DEFINED',
          label: 'اللون',
          name: 'اللون',
          type: 'COLOR',
          unit: null,
          values: ['أسود', 'أبيض'],
        },
      ]);
    } else if (typeOrDef === 'SIZE') {
      if (options.some((o) => o.type === 'SIZE' || o.name === 'المقاس')) return;
      setOptions((prev) => [
        ...prev,
        {
          key: 'opt_size',
          source: 'DEFINED',
          label: 'المقاس',
          name: 'المقاس',
          type: 'SIZE',
          unit: null,
          values: ['M', 'L', 'XL'],
        },
      ]);
    } else {
      const idx = options.length + 1;
      setOptions((prev) => [
        ...prev,
        {
          key: `opt_custom_${Date.now()}`,
          source: 'CUSTOM',
          label: `خيار ${idx}`,
          name: `خيار ${idx}`,
          type: 'TEXT',
          unit: null,
          values: [],
        },
      ]);
    }
  };

  const handleRemoveOption = (indexToRemove: number) => {
    const remaining = options.filter((_, idx) => idx !== indexToRemove);
    setOptions(remaining);
    const validRemaining = remaining.filter((o) => o.values && o.values.length > 0);
    if (validRemaining.length === 0) {
      setVariants([]);
    }
    if (
      !remaining.some((o) => o.values && o.values.length > 0) &&
      errorMessage?.includes('لا يمكن تغيير قسم الصنف')
    ) {
      setErrorMessage(null);
    }
  };

  const handleAddOptionValue = (optIndex: number, specificVal?: string) => {
    const valToAdd = (specificVal || optionTagInputs[optIndex] || '').trim();
    if (!valToAdd) return;

    setOptions((prev) => {
      const copy = [...prev];
      const opt = copy[optIndex];
      if (!opt.values.includes(valToAdd)) {
        copy[optIndex] = { ...opt, values: [...opt.values, valToAdd] };
      }
      return copy;
    });

    if (!specificVal) {
      setOptionTagInputs((prev) => ({ ...prev, [optIndex]: '' }));
    }
  };

  const handleRemoveOptionValue = (optIndex: number, valToRemove: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      const opt = copy[optIndex];
      copy[optIndex] = {
        ...opt,
        values: opt.values.filter((v) => v !== valToRemove),
      };
      const valid = copy.filter((o) => o.values && o.values.length > 0);
      if (valid.length === 0) {
        setVariants([]);
      }
      const hasAnyValues = copy.some((o) => o.values && o.values.length > 0);
      if (!hasAnyValues && errorMessage?.includes('لا يمكن تغيير قسم الصنف')) {
        setErrorMessage(null);
      }
      return copy;
    });

    if (colorImageMap[valToRemove]) {
      const nextMap = { ...colorImageMap };
      delete nextMap[valToRemove];
      setColorImageMap(nextMap);
    }
  };

  // Visual Color-Image Tap Binding
  const handleBindColorImage = (colorVal: string, imageUrl: string) => {
    const nextMap = { ...colorImageMap, [colorVal]: imageUrl };
    setColorImageMap(nextMap);

    const colorOpt = options.find(
      (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
    );
    const colorKey = colorOpt ? colorOpt.name || colorOpt.label || 'اللون' : 'اللون';

    setVariants((prev) =>
      prev.map((v) => {
        if (v.attributes[colorKey] === colorVal) {
          return { ...v, images: [imageUrl] };
        }
        return v;
      })
    );
  };

  // Automatic Real-Time Live Sync of Variants
  useEffect(() => {
    if (isSimple) {
      setVariants([]);
      return;
    }
    const validOptions = options.filter((o) => o.values && o.values.length > 0);
    if (validOptions.length === 0) {
      setVariants([]);
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
      setErrorMessage('تجاوزت التركيبات المسموحة (100 صنف كحد أقصى). يرجى تقليل قيم الخيارات لحفظ المنتج بسلاسة.');
      return;
    }

    const categoryPrefix = (categories.find((c) => c._id === categoryId)?.slug || 'ITM')
      .slice(0, 3)
      .toUpperCase();

    const colorOpt = options.find(
      (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
    );
    const colorKey = colorOpt ? colorOpt.name || colorOpt.label || 'اللون' : 'اللون';

    setVariants((prev) => {
      return combos
        .map((combo, idx) => {
          const attrs: Record<string, string> = {};
          validOptions.forEach((opt, optIdx) => {
            attrs[opt.name || opt.label || `opt_${optIdx}`] = combo[optIdx];
          });

          const attrKey = Object.entries(attrs)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join('|');

          // Skip if user explicitly deleted this specific combination
          if (deletedVariantKeys.includes(attrKey)) {
            return null;
          }

          const existing = prev.find((v) => v.attrKey === attrKey);
          const boundImage = attrs[colorKey] ? colorImageMap[attrs[colorKey]] : undefined;

          if (existing) {
            if (boundImage && (!existing.images || existing.images[0] !== boundImage)) {
              return { ...existing, images: [boundImage] };
            }
            return existing;
          }

          const cleanValues = Object.values(attrs)
            .map((v) => v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'VAR')
            .slice(0, 2)
            .join('-');

          const defaultPrice = typeof simplePrice === 'number' && simplePrice > 0 ? simplePrice : 50;
          const defaultStock = typeof simpleStock === 'number' && simpleStock > 0 ? simpleStock : 10;

          return {
            sku: `SDM-${categoryPrefix}-${cleanValues || 'VAR'}-${idx + 1}-${Math.floor(
              100 + Math.random() * 900
            )}`,
            attributes: attrs,
            attrKey,
            price: Number(defaultPrice),
            compareAtPrice: null,
            stock: Number(defaultStock),
            isActive: true,
            images: boundImage ? [boundImage] : images.slice(0, 1),
          };
        })
        .filter(Boolean) as VariantItemState[];
    });
  }, [
    isSimple,
    options,
    categoryId,
    categories,
    colorImageMap,
    images,
    simplePrice,
    simpleStock,
    deletedVariantKeys,
  ]);

  // Bulk Apply Values
  const handleApplyBulkPrice = () => {
    const val = Number(bulkPriceInput);
    if (isNaN(val) || val < 0) {
      alert('يرجى إدخال سعر بيع صحيح');
      return;
    }
    setVariants((prev) => prev.map((v) => ({ ...v, price: val })));
    setBulkPriceInput('');
  };

  const handleApplyBulkStock = () => {
    const val = parseInt(bulkStockInput);
    if (isNaN(val) || val < 0) {
      alert('يرجى إدخال كمية مخزون صحيحة');
      return;
    }
    setVariants((prev) => prev.map((v) => ({ ...v, stock: val })));
    setBulkStockInput('');
  };

  // Quick Delta Stock
  const handleQuickDeltaStock = async (variantId: string | undefined, delta: number) => {
    if (!productId) return;
    const targetVariant = variants.find((v) => v._id === variantId || v.sku === variantId);
    if (!targetVariant) return;

    const newStock = Math.max(0, targetVariant.stock + delta);
    setVariants((prev) =>
      prev.map((v) =>
        v._id === variantId || v.sku === variantId ? { ...v, stock: newStock } : v
      )
    );

    await merchantService.quickUpdateStock(productId, newStock, targetVariant._id || targetVariant.sku);
  };

  // Save changes
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم الصنف');
      return;
    }

    if (!isSimple && variants.length === 0) {
      setErrorMessage('يجب إضافة خيار واحد على الأقل للمنتج متعدد الخيارات');
      return;
    }

    if (!isSimple && variants.length > 100) {
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
      options: isSimple ? [] : options,
      variants: isSimple
        ? [
            {
              _id: variants[0]?._id,
              sku: simpleSku.trim() || `SDM-ITM-${Math.floor(1000 + Math.random() * 9000)}`,
              attributes: {},
              attrKey: 'default',
              price: Number(simplePrice) || 0,
              compareAtPrice: simpleCompareAtPrice ? Number(simpleCompareAtPrice) : null,
              stock: Math.max(0, parseInt(String(simpleStock)) || 0),
              isActive: true,
              images: images.slice(0, 1),
            },
          ]
        : variants,
      isActive,
      isFeatured,
      isAnonymousVendor,
    });

    setIsSaving(false);
    if (result.success && result.data) {
      setProduct(result.data);
      setSaveSuccessMessage('تم حفظ كافة التعديلات بنجاح وتحديث كتالوج المتجر.');
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

  const primaryImage =
    images[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80';

  const colorOpt = options.find(
    (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
  );

  return {
    productId,
    activeTab,
    setActiveTab,
    isLoading,
    isSaving,
    saveSuccessMessage,
    setSaveSuccessMessage,
    errorMessage,
    setErrorMessage,
    product,
    categories,
    allowedDefinitions,
    name,
    setName,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    handleCategoryChange,
    isActive,
    setIsActive,
    isFeatured,
    setIsFeatured,
    isAnonymousVendor,
    setIsAnonymousVendor,
    fileInputRef,
    images,
    setImages,
    isProcessingFiles,
    uploadFeedback,
    showUrlInput,
    setShowUrlInput,
    newImageUrl,
    setNewImageUrl,
    handleDeviceFileUpload,
    handleAddImageUrl,
    handleSetPrimaryImage,
    handleRemoveImage,
    isSimple,
    setIsSimple: handleSetIsSimple,
    simplePrice,
    setSimplePrice,
    simpleCompareAtPrice,
    setSimpleCompareAtPrice,
    simpleStock,
    setSimpleStock,
    simpleSku,
    setSimpleSku,
    options,
    setOptions,
    optionTagInputs,
    setOptionTagInputs,
    colorImageMap,
    setColorImageMap,
    deletedVariantKeys,
    setDeletedVariantKeys,
    showCustomInput,
    setShowCustomInput,
    bulkPriceInput,
    setBulkPriceInput,
    bulkStockInput,
    setBulkStockInput,
    variants,
    setVariants,
    isAddOptionOpen,
    setIsAddOptionOpen,
    activeValuePopoverIdx,
    setActiveValuePopoverIdx,
    activeColorPhotoPopover,
    setActiveColorPhotoPopover,
    customColorInput,
    setCustomColorInput,
    customSizeInput,
    setCustomSizeInput,
    variantsCount,
    totalStock,
    minPrice,
    maxPrice,
    isDirty,
    primaryImage,
    colorOpt,
    handleAddPredefinedOption,
    handleRemoveOption,
    handleAddOptionValue,
    handleRemoveOptionValue,
    handleBindColorImage,
    handleApplyBulkPrice,
    handleApplyBulkStock,
    handleQuickDeltaStock,
    handleSaveProduct,
    handleDeleteProduct,
  };
}
