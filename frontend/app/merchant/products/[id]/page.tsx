'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { merchantService } from '@/features/merchant/services/merchant.service';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';
import type {
  ProductItem,
  ProductOption,
  OptionDefinition,
} from '@/features/merchant/types/merchant.types';

// =========================================================
// Apple-Grade Crisp Architectural SVGs (Zero Emojis)
// =========================================================

function IconChartBar({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconSliders({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}

function IconSettings({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconEye({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconEditPencil({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

function IconPackage({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconCurrencyShekel({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconStarSolid({ className = 'w-3.5 h-3.5 text-amber-500' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
    </svg>
  );
}

function IconShieldCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconSpark({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconCheck({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconAlertTriangle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconArrowRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// Data models
interface ProductReview {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  date: string;
  variantSummary?: string;
  comment: string;
  verifiedPurchase: boolean;
}

const SAMPLE_REVIEWS: ProductReview[] = [
  {
    id: 'rev_1',
    authorName: 'أحمد محمود',
    city: 'دير البلح',
    rating: 5,
    date: 'منذ يومين',
    variantSummary: 'اللون: كحلي ناعم · المقاس: L',
    comment: 'الخامة ممتازة والتفصيل دقيق، قمت بمعاينة وتجربة القطعة عند الباب مع مندوب سَدِيم قبل دفع المبلغ. مصداقية تشغيلية نادرة.',
    verifiedPurchase: true,
  },
  {
    id: 'rev_2',
    authorName: 'سارة عبد الرحمن',
    city: 'مخيم النصيرات',
    rating: 5,
    date: 'منذ 5 أيام',
    variantSummary: 'اللون: بيج طبيعي · المقاس: M',
    comment: 'اللون في الواقع مطابق للصور تماماً، وصل في طرد سَدِيم الموحد وجمعت معه مشتريات من متجرين مختلفين بتوصيل 8 شيكل فقط.',
    verifiedPurchase: true,
  },
  {
    id: 'rev_3',
    authorName: 'إبراهيم سلامة',
    city: 'الزوايدة',
    rating: 4,
    date: 'منذ أسبوع',
    variantSummary: 'اللون: أبيض سحابي · المقاس: XL',
    comment: 'القطن مريح والمقاس مضبوط ومناسب للأجواء الحارة، أنصح بتوفير المزيد من الألوان الصيفية.',
    verifiedPurchase: true,
  },
];

type StudioTab = 'overview' | 'editor' | 'settings';

export default function MerchantProductStudioPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

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

  // Gallery
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Mode: Simple vs Configurable
  const [isSimple, setIsSimple] = useState(false);

  // Simple Product Fields
  const [simplePrice, setSimplePrice] = useState<number | string>(50);
  const [simpleCompareAtPrice, setSimpleCompareAtPrice] = useState<number | string>('');
  const [simpleStock, setSimpleStock] = useState<number | string>(10);
  const [simpleSku, setSimpleSku] = useState('');

  // Options & Color-Image Map
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [optionTagInputs, setOptionTagInputs] = useState<Record<number, string>>({});
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({});

  // Bulk Actions
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');

  // Generated Variants Matrix
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
          const currentCatId = typeof p.categoryId === 'object' ? p.categoryId._id : p.categoryId;
          setCategoryId(currentCatId || (cats[0]?._id ?? ''));
          setImages(p.images && p.images.length > 0 ? p.images : []);
          setIsActive(p.isActive !== undefined ? p.isActive : true);
          setIsFeatured(p.isFeatured || false);

          const hasOptions = Array.isArray(p.options) && p.options.length > 0;
          setIsSimple(!hasOptions);

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

  // Load category options on category switch
  useEffect(() => {
    if (!categoryId) return;
    merchantService.fetchOptionsByCategory(categoryId).then((res) => {
      if (res.success && res.data?.definitions) {
        setAllowedDefinitions(res.data.definitions);
      }
    });
  }, [categoryId]);

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

  // Gallery handlers
  const handleAddImage = () => {
    const cleanUrl = newImageUrl.trim();
    if (!cleanUrl) return;
    setImages([...images, cleanUrl]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (imgIdx: number) => {
    const targetUrl = images[imgIdx];
    setImages(images.filter((_, idx) => idx !== imgIdx));

    const updatedMap = { ...colorImageMap };
    for (const color in updatedMap) {
      if (updatedMap[color] === targetUrl) {
        delete updatedMap[color];
      }
    }
    setColorImageMap(updatedMap);
  };

  // Options Handlers
  const handleAddOptionPreset = (def: OptionDefinition) => {
    if (options.some((o) => o.key === def.key || o.name === def.label)) return;
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
        label: `خيار مخصص ${customIndex}`,
        name: `خيار مخصص ${customIndex}`,
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

    const updatedVariants = variants.map((v) => {
      if (v.attributes[colorKey] === colorVal) {
        return {
          ...v,
          images: [imageUrl],
        };
      }
      return v;
    });
    setVariants(updatedVariants);
  };

  // Matrix Generator
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
      alert(`هذه الخيارات ستنتج ${combos.length} صنف، بينما الحد الأقصى المسموح في سَدِيم هو 100 صنف`);
      return;
    }

    const categoryPrefix = (categories.find((c) => c._id === categoryId)?.slug || 'ITM')
      .slice(0, 3)
      .toUpperCase();

    const colorOpt = options.find(
      (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
    );
    const colorKey = colorOpt ? colorOpt.name || colorOpt.label || 'اللون' : 'اللون';

    const newVariants = combos.map((combo, idx) => {
      const attrs: Record<string, string> = {};
      validOptions.forEach((opt, optIdx) => {
        attrs[opt.name || opt.label || `opt_${optIdx}`] = combo[optIdx];
      });

      const attrKey = Object.entries(attrs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');

      const existing = variants.find((v) => v.attrKey === attrKey);
      if (existing) {
        return existing;
      }

      const boundImage = attrs[colorKey] ? colorImageMap[attrs[colorKey]] : undefined;

      const cleanValues = Object.values(attrs)
        .map((v) => v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'VAL')
        .slice(0, 2)
        .join('-');

      return {
        sku: `SDM-${categoryPrefix}-${cleanValues || 'VAR'}-${idx + 1}-${Math.floor(
          100 + Math.random() * 900
        )}`,
        attributes: attrs,
        attrKey,
        price: minPrice > 0 ? minPrice : 50,
        compareAtPrice: null,
        stock: 5,
        isActive: true,
        images: boundImage ? [boundImage] : images.slice(0, 1),
      };
    });

    setVariants(newVariants);
  };

  // Bulk values
  const handleApplyBulkPrice = () => {
    const val = Number(bulkPriceInput);
    if (isNaN(val) || val < 0) {
      alert('يرجى إدخال سعر بيع صحيح');
      return;
    }
    setVariants(variants.map((v) => ({ ...v, price: val })));
    setBulkPriceInput('');
  };

  const handleApplyBulkStock = () => {
    const val = parseInt(bulkStockInput);
    if (isNaN(val) || val < 0) {
      alert('يرجى إدخال كمية مخزون صحيحة');
      return;
    }
    setVariants(variants.map((v) => ({ ...v, stock: val })));
    setBulkStockInput('');
  };

  // Quick Delta Stock
  const handleQuickDeltaStock = async (variantId: string | undefined, delta: number) => {
    if (!productId) return;
    const targetVariant = variants.find((v) => v._id === variantId || v.sku === variantId);
    if (!targetVariant) return;

    const newStock = Math.max(0, targetVariant.stock + delta);
    const updatedVariants = variants.map((v) =>
      v._id === variantId || v.sku === variantId ? { ...v, stock: newStock } : v
    );
    setVariants(updatedVariants);

    await merchantService.quickUpdateStock(productId, newStock, targetVariant._id || targetVariant.sku);
  };

  // Save changes
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      setErrorMessage('يرجى إدخال اسم الصنف');
      return;
    }

    if (!isSimple && variants.length === 0) {
      setErrorMessage('يجب توليد صنف واحد على الأقل للمنتج متعدد الخيارات');
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

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center font-almarai text-right">
        <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
        <h2 className="text-xs font-bold text-brand-dark">جاري فتح مركز إدارة الصنف...</h2>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="max-w-md mx-auto p-8 text-center font-almarai text-right">
        <div className="bg-brand-card p-6 rounded-2xl border border-brand-border/60 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-brand-surface mx-auto flex items-center justify-center text-brand-muted mb-3">
            <IconAlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-brand-dark mb-1">المنتج غير موجود</h2>
          <p className="text-xs text-brand-muted mb-4">قد يكون تم نقله أو حذفه من قبل إدارة المتجر.</p>
          <Link
            href="/merchant/dashboard"
            className="inline-flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100"
          >
            <span>العودة للكتالوج</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage =
    images[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80';

  const colorOpt = options.find(
    (o) => o.type === 'COLOR' || o.name === 'اللون' || o.label === 'اللون'
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 font-almarai text-right pb-28">
      {/* ========================================================= */}
      {/* 1. Serene Master Header (No Nested Boxiness)              */}
      {/* ========================================================= */}
      <div className="mb-6 space-y-4">
        {/* Top Breadcrumb & Metadata */}
        <div className="flex items-center justify-between gap-3 text-xs text-brand-muted/80">
          <Link
            href="/merchant/dashboard"
            className="hover:text-brand-primary transition-colors flex items-center gap-1 font-bold"
          >
            <IconArrowRight className="w-3.5 h-3.5" />
            <span>كتالوج المتجر</span>
            <span className="text-brand-border mx-1">/</span>
            <span>{categories.find((c) => c._id === categoryId)?.title || 'عام'}</span>
          </Link>

          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="text-brand-muted">الرمز المرجعي:</span>
            <span className="font-mono text-brand-dark bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border/60">
              {productId.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title, Photo & Global Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-brand-border/70 bg-brand-surface shrink-0 shadow-2xs">
              <img src={primaryImage} alt={name} className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight leading-tight">
                  {name || 'صنف بدون اسم'}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isActive
                      ? 'bg-brand-trust-soft text-brand-trust border-brand-trust/30'
                      : 'bg-brand-surface text-brand-muted border-brand-border/60'
                  }`}
                >
                  {isActive ? 'معروض بالمتجر' : 'مخفي مؤقتاً'}
                </span>
                {isFeatured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                    <IconStarSolid className="w-3 h-3 text-amber-600" />
                    <span>مميز بالصدارة</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs mt-1 text-brand-muted">
                <span className="font-black text-brand-dark">
                  {minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} - ${maxPrice} ₪`}
                </span>
                <span>•</span>
                <span className="font-bold text-brand-trust">{totalStock} قطعة متوفرة</span>
                <span>•</span>
                <span>{isSimple ? 'صنف مفرد بسيط' : `${variantsCount} أصناف مصفوفية`}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Navigation Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href={`/product/${productId}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-brand-card hover:bg-brand-surface text-brand-dark text-xs font-bold border border-brand-border/80 transition-colors flex items-center gap-1.5 shadow-2xs active:scale-[0.97]"
              title="معاينة كيف يرى الزبون هذا الصنف في متجر سَدِيم"
            >
              <IconEye className="w-3.5 h-3.5 text-brand-muted" />
              <span>معاينة كزبون</span>
            </Link>

            {activeTab !== 'editor' ? (
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <IconEditPencil className="w-3.5 h-3.5" />
                <span>تعديل الصنف والخيارات</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] transition-transform duration-100 shadow-2xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSaving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>حفظ التعديلات</span>
              </button>
            )}
          </div>
        </div>

        {/* Apple-Style Fluid Segmented Control */}
        <div className="pt-2">
          <div className="inline-flex p-1 rounded-2xl bg-brand-surface/90 border border-brand-border/70 gap-1 overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] ${
                activeTab === 'overview'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconChartBar className="w-3.5 h-3.5 text-brand-primary" />
              <span>لوحة الصنف والتقييمات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] ${
                activeTab === 'editor'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconSliders className="w-3.5 h-3.5 text-brand-primary" />
              <span>استوديو التحرير والخيارات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 active:scale-[0.98] ${
                activeTab === 'settings'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconSettings className="w-3.5 h-3.5 text-brand-muted" />
              <span>العمليات وإعدادات الأمان</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="mb-5 p-3.5 bg-brand-trust-soft border border-brand-trust/30 rounded-2xl text-brand-trust text-xs font-bold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <IconCheck className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <IconAlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & CUSTOMER PULSE (Calm, Breathing Layout) */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 4 Quiet Luxury KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Sales */}
            <div className="bg-brand-card rounded-2xl border border-brand-border/60 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-brand-muted">المبيعات الإجمالية</span>
                <div className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center text-brand-dark/70 border border-brand-border/60">
                  <IconPackage className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">38</span>
                  <span className="text-xs font-bold text-brand-muted">قطعة</span>
                </div>
                <p className="text-[11px] text-brand-trust font-bold mt-1">طرد موحد 8 ₪ بالوسطى</p>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-brand-card rounded-2xl border border-brand-border/60 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-brand-muted">إجمالي الإيرادات</span>
                <div className="w-8 h-8 rounded-xl bg-brand-surface flex items-center justify-center text-brand-dark/70 border border-brand-border/60">
                  <IconCurrencyShekel className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">2,280</span>
                  <span className="text-xs font-bold text-brand-muted">₪</span>
                </div>
                <p className="text-[11px] text-brand-muted mt-1">محصلة عبر كاش وجوال باي</p>
              </div>
            </div>

            {/* Rating */}
            <div className="bg-brand-card rounded-2xl border border-brand-border/60 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-brand-muted">تقييم الزبائن</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/70">
                  <IconStarSolid className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">4.8</span>
                  <span className="text-xs font-bold text-brand-muted">من 5</span>
                </div>
                <p className="text-[11px] text-brand-muted mt-1">استناداً لـ 14 تقييماً موثقاً</p>
              </div>
            </div>

            {/* Door Inspection Pass Rate */}
            <div className="bg-brand-card rounded-2xl border border-brand-border/60 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-brand-muted">القبول عند الباب</span>
                <div className="w-8 h-8 rounded-xl bg-brand-trust-soft flex items-center justify-center text-brand-trust border border-brand-trust/30">
                  <IconShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-brand-trust tracking-tight">96%</span>
                  <span className="text-xs font-bold text-brand-muted">استلام ناجح</span>
                </div>
                <p className="text-[11px] text-brand-trust font-bold mt-1">معدل رفض 4% فقط</p>
              </div>
            </div>
          </div>

          {/* Quick Inventory Pulse & Stepper (Engineered for Touch) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border/40">
              <div>
                <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-trust" />
                  <span>المخزون الميداني اللحظي للأصناف</span>
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  زيادة أو إنقاص مخزون أي صنف مباشرة بنقرة واحدة سريعة دون مغادرة هذه اللوحة
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="text-xs font-bold text-brand-primary hover:underline cursor-pointer self-start sm:self-auto flex items-center gap-1 active:scale-95"
              >
                <span>إدارة الخيارات والأسعار</span>
                <IconArrowRight className="w-3 h-3" />
              </button>
            </div>

            {isSimple ? (
              <div className="p-4 rounded-xl bg-brand-surface/40 border border-brand-border/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-brand-dark">صنف مفرد (قطعة واحدة)</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">
                    السعر: {simplePrice} ₪ · الرمز: {simpleSku || 'SDM-SIMPLE'}
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-brand-card p-1 rounded-xl border border-brand-border/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(simpleStock) || 0;
                      const next = Math.max(0, cur - 1);
                      setSimpleStock(next);
                      merchantService.quickUpdateStock(productId, next);
                    }}
                    className="w-8 h-8 rounded-lg bg-brand-surface font-black text-xs hover:bg-brand-border/40 active:scale-90 transition-transform duration-100 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-black text-sm text-brand-dark tabular-nums">
                    {simpleStock}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(simpleStock) || 0;
                      const next = cur + 1;
                      setSimpleStock(next);
                      merchantService.quickUpdateStock(productId, next);
                    }}
                    className="w-8 h-8 rounded-lg bg-brand-surface font-black text-xs hover:bg-brand-border/40 active:scale-90 transition-transform duration-100 flex items-center justify-center cursor-pointer"
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
          <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border/40">
              <div>
                <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>تقييمات وملاحظات الزبائن ({SAMPLE_REVIEWS.length})</span>
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  انطباعات حقيقية من زبائن استلموا وعاينوا هذا الصنف في المحافظة الوسطى
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50/80 px-3 py-1 rounded-xl border border-amber-200/70 text-amber-900 text-xs font-bold self-start sm:self-auto">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <IconStarSolid className="w-3.5 h-3.5" />
                </div>
                <span>4.8 من 5</span>
                <span className="text-[11px] text-amber-700 font-normal">(ممتاز جداً)</span>
              </div>
            </div>

            <div className="space-y-3">
              {SAMPLE_REVIEWS.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-brand-surface/20 border border-brand-border/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-brand-dark">{rev.authorName}</span>
                      <span className="text-[10px] text-brand-muted">({rev.city})</span>
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] font-bold text-brand-trust bg-brand-trust-soft px-2 py-0.5 rounded-md border border-brand-trust/20 flex items-center gap-1">
                          <IconCheck className="w-3 h-3" />
                          <span>مشترٍ موثق</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <IconStarSolid key={i} className="w-3.5 h-3.5 text-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] text-brand-muted mr-1.5">{rev.date}</span>
                    </div>
                  </div>

                  {rev.variantSummary && (
                    <div className="text-[10px] text-brand-muted font-bold">
                      القطعة المشتراة: {rev.variantSummary}
                    </div>
                  )}

                  <p className="text-xs text-brand-dark/90 leading-relaxed font-medium">
                    «{rev.comment}»
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: STUDIO & MATRIX EDITOR (The Full Dependency Flow)  */}
      {/* ========================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Step 1: Basic Identity & Classification */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <h2 className="text-sm font-black text-brand-dark mb-4 pb-3 border-b border-brand-border/40 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                1
              </span>
              <span>البيانات الأساسية والتصنيف</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">
                  اسم الصنف المعروض للزبائن *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: قميص كتان سديمي ناعم"
                  className="w-full h-11 px-3.5 text-base sm:text-xs font-bold rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">التصنيف المعتمد *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-11 px-3 text-base sm:text-xs font-bold rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-dark mb-1.5">الظهور في الصدارة</label>
                  <label className="flex items-center gap-2.5 h-11 px-3.5 bg-brand-surface/40 rounded-xl border border-brand-border/70 text-xs font-bold text-brand-dark cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 accent-brand-primary rounded"
                    />
                    <span>إبراز الصنف في واجهة المتجر الرئيسية (Featured)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-dark mb-1.5">الوصف والمواصفات</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفاً دقيقاً للمنتج وخاماته وطريقة العناية به..."
                  className="w-full p-3.5 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Gallery Pool (Source for all color bindings) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
              <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                  2
                </span>
                <span>معرض صور الصنف العام ({images.length})</span>
              </h2>
              <span className="text-[11px] text-brand-muted">
                الصور هنا ستكون متاحة للاختيار عند تخصيص صور الألوان لاحقاً
              </span>
            </div>

            {/* Gallery Thumbnails Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-brand-border/80 group bg-brand-surface shadow-2xs"
                >
                  <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      الغلاف
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 left-1 w-5 h-5 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer"
                    title="حذف الصورة من المعرض"
                  >
                    ×
                  </button>
                </div>
              ))}

              {images.length === 0 && (
                <div className="col-span-full py-6 text-center bg-brand-surface/30 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                  لا توجد صور مضافة للصنف بعد
                </div>
              )}
            </div>

            {/* Add Image URL Input */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="أدخل رابط صورة (https://...)"
                className="flex-1 h-11 px-3.5 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!newImageUrl.trim()}
                className="h-11 px-4 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-hover active:scale-[0.97] disabled:opacity-40 cursor-pointer transition-transform duration-100"
              >
                + إضافة للمعرض
              </button>
            </div>
          </div>

          {/* Step 3: Product Structure Decision */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <h2 className="text-sm font-black text-brand-dark mb-4 pb-3 border-b border-brand-border/40 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                3
              </span>
              <span>نوع وهيكلية الصنف</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 ${
                  isSimple
                    ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                    : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
                }`}
              >
                <input
                  type="radio"
                  name="product_type"
                  checked={isSimple}
                  onChange={() => setIsSimple(true)}
                  className="mt-1 accent-brand-primary"
                />
                <div>
                  <div className="text-xs font-black text-brand-dark">صنف مفرد بسيط (Simple Item)</div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    قطعة واحدة بسعر موحد ومخزون موحد دون أي مقاسات أو ألوان (مثل: عسل سدر، ساعة يد، شال مفرد).
                  </div>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 ${
                  !isSimple
                    ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                    : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
                }`}
              >
                <input
                  type="radio"
                  name="product_type"
                  checked={!isSimple}
                  onChange={() => setIsSimple(false)}
                  className="mt-1 accent-brand-primary"
                />
                <div>
                  <div className="text-xs font-black text-brand-dark">
                    صنف متعدد الخيارات والمصفوفة (Configurable)
                  </div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    يحتوي على سمات مثل الألوان والمقاسات مع كود SKU وسعر ومخزون منفصل لكل توليفة.
                  </div>
                </div>
              </label>
            </div>

            {/* Simple Product Direct Form */}
            {isSimple && (
              <div className="mt-4 p-4 rounded-xl bg-brand-surface/40 border border-brand-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    سعر البيع (₪) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={simplePrice}
                    onChange={(e) => setSimplePrice(e.target.value)}
                    className="w-full h-10 px-2.5 text-base sm:text-xs font-black rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    السعر السابق (₪)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={simpleCompareAtPrice}
                    onChange={(e) => setSimpleCompareAtPrice(e.target.value)}
                    placeholder="اختياري"
                    className="w-full h-10 px-2.5 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    المخزون الفعلي (قطع) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(e.target.value)}
                    className="w-full h-10 px-2.5 text-base sm:text-xs font-black rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-muted mb-1">
                    رمز SKU
                  </label>
                  <input
                    type="text"
                    value={simpleSku}
                    onChange={(e) => setSimpleSku(e.target.value.toUpperCase())}
                    placeholder="SDM-ITM-01"
                    className="w-full h-10 px-2.5 text-base sm:text-xs font-mono uppercase rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* If Configurable: Steps 4, 5, 6 */}
          {!isSimple && (
            <>
              {/* Step 4: Options Architecture & Visual Color-Image Tap Binding */}
              <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-brand-border/40">
                  <div>
                    <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                        4
                      </span>
                      <span>هندسة الخيارات وتخصيص صور الألوان</span>
                    </h2>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      حدد السمات وقيمها، وانقر على صورة المعرض المناسبة لكل لون لربطها فورياً
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleAddCustomOption}
                      className="px-3 py-1.5 bg-brand-surface hover:bg-brand-border/40 text-brand-dark text-xs font-bold rounded-xl border border-brand-border/70 transition-colors cursor-pointer active:scale-95"
                    >
                      + خيار مخصص
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerateCombinations}
                      className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-hover shadow-2xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <IconSpark className="w-3.5 h-3.5" />
                      <span>توليد الأصناف</span>
                    </button>
                  </div>
                </div>

                {/* Presets Chips Bar */}
                {allowedDefinitions.length > 0 && (
                  <div className="mb-4 p-3 bg-brand-surface/50 rounded-xl border border-brand-border/60">
                    <span className="text-[11px] font-bold text-brand-muted block mb-2">
                      خيارات معتمدة لهذا التصنيف:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {allowedDefinitions.map((def) => {
                        const isAdded = options.some(
                          (o) => o.key === def.key || o.name === def.label
                        );
                        return (
                          <button
                            key={def.key}
                            type="button"
                            onClick={() => handleAddOptionPreset(def)}
                            disabled={isAdded}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              isAdded
                                ? 'bg-brand-card text-brand-muted border-brand-border/40 opacity-50 cursor-not-allowed'
                                : 'bg-white text-brand-dark hover:border-brand-primary hover:text-brand-primary border-brand-border/80 shadow-2xs active:scale-95'
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
                    <div
                      key={optIdx}
                      className="bg-brand-surface/30 rounded-xl p-3.5 border border-brand-border/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-dark">
                            {opt.name || opt.label}
                          </span>
                          <span className="text-[10px] text-brand-muted bg-brand-card px-1.5 py-0.5 rounded border border-brand-border/60">
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
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-card text-brand-dark px-2.5 py-1 rounded-lg border border-brand-border/70 shadow-2xs"
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
                            onChange={(e) =>
                              setOptionTagInputs({ ...optionTagInputs, [optIdx]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddOptionValue(optIdx);
                              }
                            }}
                            placeholder="+ أضف قيمة..."
                            className="h-7 px-2 text-base sm:text-xs rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary w-24"
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
                </div>

                {/* Color-Specific Visual Swatch Selector (No Ugly Dropdowns) */}
                {colorOpt && colorOpt.values.length > 0 && images.length > 0 && (
                  <div className="mt-5 p-4 rounded-xl bg-brand-surface/40 border border-brand-border/60">
                    <div className="text-xs font-black text-brand-dark mb-1">
                      تخصيص صور الألوان بنقرة بصرية مباشرة
                    </div>
                    <p className="text-[11px] text-brand-muted mb-3 leading-relaxed">
                      انقر على الصورة المناسبة من المعرض لكل لون لتخصيصها. ستتحول الصورة تلقائياً عند اختيار الزبون لهذا اللون في المتجر.
                    </p>

                    <div className="space-y-3">
                      {colorOpt.values.map((colVal) => {
                        const currentBound = colorImageMap[colVal] || images[0];
                        return (
                          <div
                            key={colVal}
                            className="p-3 rounded-xl bg-brand-card border border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-black text-brand-dark min-w-16">
                                {colVal}
                              </span>
                              <span className="text-[10px] text-brand-muted">
                                {colorImageMap[colVal] ? 'صورة مخصصة' : 'صورة الغلاف (افتراضي)'}
                              </span>
                            </div>

                            {/* Visual Thumbnail Strip to tap and bind */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                              {images.map((imgUrl, imgI) => {
                                const isSelected = currentBound === imgUrl;
                                return (
                                  <button
                                    key={imgI}
                                    type="button"
                                    onClick={() => handleBindColorImage(colVal, imgUrl)}
                                    className={`relative w-10 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
                                      isSelected
                                        ? 'ring-2 ring-brand-primary border-brand-primary scale-105 shadow-xs'
                                        : 'border-brand-border/60 opacity-60 hover:opacity-100'
                                    }`}
                                    title={`تعيين صورة ${imgI + 1} للون ${colVal}`}
                                  >
                                    <img src={imgUrl} alt={`خيار ${imgI + 1}`} className="w-full h-full object-cover" />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
                                        <IconCheck className="w-3.5 h-3.5 text-white stroke-[3]" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 5: Bulk Actions Toolbar */}
              <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-brand-dark flex items-center gap-1.5">
                      <IconSpark className="w-3.5 h-3.5 text-brand-primary" />
                      <span>التطبيق الجماعي للأسعار والمخزون (Bulk Apply)</span>
                    </h3>
                    <p className="text-[10px] text-brand-muted mt-0.5">
                      طبق سعراً أو مخزوناً موحداً على كافة الأصناف الـ {variants.length} بنقرة واحدة
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Bulk Price */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="السعر (₪)"
                        value={bulkPriceInput}
                        onChange={(e) => setBulkPriceInput(e.target.value)}
                        className="w-24 h-9 px-2 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkPrice}
                        disabled={!bulkPriceInput}
                        className="h-9 px-2.5 bg-brand-surface hover:bg-brand-border/50 text-brand-dark text-xs font-bold rounded-xl border border-brand-border/70 disabled:opacity-40 cursor-pointer active:scale-95"
                      >
                        تطبيق السعر
                      </button>
                    </div>

                    {/* Bulk Stock */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        placeholder="المخزون (ق)"
                        value={bulkStockInput}
                        onChange={(e) => setBulkStockInput(e.target.value)}
                        className="w-24 h-9 px-2 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-surface text-brand-dark focus:outline-none focus:border-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkStock}
                        disabled={!bulkStockInput}
                        className="h-9 px-2.5 bg-brand-surface hover:bg-brand-border/50 text-brand-dark text-xs font-bold rounded-xl border border-brand-border/70 disabled:opacity-40 cursor-pointer active:scale-95"
                      >
                        تطبيق المخزون
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6: Generated Variants Matrix */}
              <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border/40">
                  <div>
                    <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                        6
                      </span>
                      <span>مصفوفة الأصناف والأسعار والمخزون</span>
                    </h2>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      تعديل التوليفات الفردية، كود SKU، والأسعار الخاصة
                    </p>
                  </div>

                  <span className="text-xs font-black text-brand-primary bg-brand-primary-soft px-3 py-1 rounded-xl border border-brand-primary-border self-start sm:self-auto">
                    {variants.length} أصناف مسجلة
                  </span>
                </div>

                <div className="space-y-3">
                  {variants.map((v, vIdx) => {
                    const attrEntries = Object.entries(v.attributes || {});
                    const variantPhoto =
                      v.images && v.images.length > 0 ? v.images[0] : primaryImage;

                    return (
                      <div
                        key={v._id || vIdx}
                        className={`rounded-xl border p-4 transition-all ${
                          v.isActive
                            ? 'bg-brand-surface/20 border-brand-border/60 hover:border-brand-primary/40'
                            : 'bg-zinc-50 border-zinc-200 opacity-60'
                        }`}
                      >
                        {/* Top bar */}
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-brand-border/40">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={variantPhoto}
                              alt="صورة الصنف"
                              className="w-9 h-9 rounded-xl object-cover border border-brand-border/60 shrink-0 bg-brand-surface"
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              {attrEntries.map(([k, val]) => (
                                <span
                                  key={k}
                                  className="text-xs font-black bg-brand-card text-brand-dark px-2.5 py-0.5 rounded-lg border border-brand-border/60 shadow-2xs"
                                >
                                  <span className="text-brand-muted text-[10px] font-normal ml-1">
                                    {k}:
                                  </span>
                                  <span>{val}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Toggle */}
                            <label className="flex items-center gap-1.5 text-[11px] font-bold text-brand-dark cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={v.isActive}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, isActive: e.target.checked };
                                  setVariants(updated);
                                }}
                                className="w-4 h-4 accent-brand-trust rounded cursor-pointer"
                              />
                              <span className={v.isActive ? 'text-brand-trust' : 'text-zinc-400'}>
                                {v.isActive ? 'متاح' : 'معطل'}
                              </span>
                            </label>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                if (variants.length <= 1) {
                                  alert('لا يمكن حذف الصنف الوحيد المتبقي للمنتج');
                                  return;
                                }
                                setVariants(variants.filter((_, idx) => idx !== vIdx));
                              }}
                              className="text-brand-muted hover:text-red-600 text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="حذف هذا الصنف"
                            >
                              حذف ×
                            </button>
                          </div>
                        </div>

                        {/* Input Grid (Touch & Desktop Ergonomics) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-muted mb-1">
                              رمز SKU
                            </label>
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[vIdx] = { ...v, sku: e.target.value.toUpperCase() };
                                setVariants(updated);
                              }}
                              className="w-full h-10 px-2.5 text-base sm:text-xs font-mono uppercase font-bold rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-brand-muted mb-1">
                              سعر البيع (₪) *
                            </label>
                            <div className="relative">
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
                                className="w-full h-10 px-2.5 pr-6 text-base sm:text-xs font-black rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                              />
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brand-muted">
                                ₪
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-brand-muted mb-1">
                              السعر السابق (₪)
                            </label>
                            <div className="relative">
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
                                placeholder="بدون خصم"
                                className="w-full h-10 px-2.5 pr-6 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                              />
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-brand-muted">
                                ₪
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-brand-muted mb-1">
                              المخزون (قطع)
                            </label>
                            <div className="flex items-center h-10 bg-brand-card rounded-xl border border-brand-border/70 px-1 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, stock: Math.max(0, v.stock - 1) };
                                  setVariants(updated);
                                }}
                                className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx] = {
                                    ...v,
                                    stock: Math.max(0, parseInt(e.target.value) || 0),
                                  };
                                  setVariants(updated);
                                }}
                                className="flex-1 text-center font-black text-xs bg-transparent focus:outline-none tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, stock: v.stock + 1 };
                                  setVariants(updated);
                                }}
                                className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {variants.length === 0 && (
                    <div className="text-center py-8 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                      لا توجد أصناف مسجلة. انقر على «توليد الأصناف» أعلاه لإنشاء المصفوفة.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Sticky Bottom Save Bar (Translucent Apple Material) */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-brand-card/85 backdrop-blur-xl border-t border-brand-border/70 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-xl font-almarai">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-brand-muted">
                <span>الصنف:</span>
                <span className="font-bold text-brand-dark">{name || 'بدون اسم'}</span>
                <span>•</span>
                <span>{variantsCount} أصناف</span>
                <span>•</span>
                <span className="font-bold text-brand-trust">{totalStock} قطعة بالمخزون</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2.5 rounded-xl border border-brand-border/80 text-brand-dark text-xs font-bold hover:bg-brand-surface active:scale-[0.97] transition-all cursor-pointer"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-[0.97] shadow-xs transition-transform duration-100 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>حفظ التعديلات في المتجر</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SETTINGS & DANGER ZONE                             */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn max-w-3xl">
          <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs space-y-5">
            <h2 className="text-sm font-black text-brand-dark pb-3 border-b border-brand-border/40">
              إعدادات العرض والعمليات الميدانية
            </h2>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface/30 border border-brand-border/60">
              <div>
                <div className="text-xs font-black text-brand-dark">ظهور الصنف في المتجر</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  عند الإخفاء، يتوقف الصنف فورياً عن الظهور للزبائن دون حذف أي بيانات أو أصناف.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer active:scale-[0.97] ${
                  isActive
                    ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                    : 'border-brand-trust text-brand-trust bg-brand-trust-soft hover:bg-brand-trust-soft/80'
                }`}
              >
                {isActive ? 'إخفاء مؤقت عن الزبائن' : 'إعادة إظهار الصنف'}
              </button>
            </div>

            {/* Operational Policies Summary */}
            <div className="p-4 rounded-xl bg-brand-surface/20 border border-brand-border/40 space-y-2 text-xs">
              <div className="font-bold text-brand-dark">سياسات سَدِيم الميدانية المطبقة على الصنف:</div>
              <ul className="text-[11px] text-brand-muted space-y-1.5 list-disc list-inside">
                <li>
                  <span className="text-brand-dark font-bold">طرد موحد 8 ₪:</span> يتم شحن هذا الصنف في طرد موحد لزبائن المحافظة الوسطى.
                </li>
                <li>
                  <span className="text-brand-dark font-bold">معاينة عند الباب:</span> للزبون حق فحص وتجربة القطعة قبل دفع أي مبلغ.
                </li>
                <li>
                  <span className="text-brand-dark font-bold">الاستبدال خلال 3 أيام:</span> يحق للزبون طلب استبدال المقاس أو اللون خلال 3 أيام من الاستلام.
                </li>
              </ul>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-red-200/80 shadow-xs space-y-3">
            <h2 className="text-sm font-black text-red-700">منطقة الخطر</h2>
            <p className="text-xs text-brand-muted leading-relaxed">
              حذف الصنف يؤدي لإزالته نهائياً من قاعدة بيانات المتجر. إذا كان الصنف مرتبطاً بطلبات سابقة، سيتم إيقاف تفعيله للحفاظ على سلامة فواتير الزبائن.
            </p>
            <button
              type="button"
              onClick={handleDeleteProduct}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 active:scale-[0.97] transition-transform duration-100 cursor-pointer shadow-2xs"
            >
              حذف هذا الصنف نهائياً من المتجر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
