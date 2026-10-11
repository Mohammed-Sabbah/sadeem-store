'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

function IconPhoto({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconUploadCloud({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
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

// Quick Preset Suggestions
const PRESET_COLORS = ['أسود', 'أبيض', 'كحلي', 'رمادي', 'بيج', 'زيتي', 'أزرق', 'عنابي', 'بني'];
const PRESET_CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const PRESET_SHOE_SIZES = ['39', '40', '41', '42', '43', '44', '45'];

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

  // Gallery (Device Upload & Cloud Readiness)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Mode: Simple vs Configurable
  const [isSimple, setIsSimple] = useState(false);

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

  // =========================================================
  // Gallery Handlers (Device Upload & Cloud Readiness)
  // =========================================================

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    const fileArray = Array.from(files);
    const newUrls: string[] = [];
    let loadedCount = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          newUrls.push(loadEvent.target.result as string);
        }
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setImages((prev) => [...prev, ...newUrls]);
          setIsProcessingFiles(false);
          setUploadFeedback(`تمت إضافة ${newUrls.length} صور من جهازك بنجاح`);
          setTimeout(() => setUploadFeedback(null), 3500);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
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

  // =========================================================
  // Effortless Options & Automatic Variants Live-Sync
  // =========================================================

  // Add Option helper (Color / Size / Custom)
  const handleAddPredefinedOption = (type: 'COLOR' | 'SIZE' | 'CUSTOM') => {
    if (type === 'COLOR') {
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
    } else if (type === 'SIZE') {
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
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

  // Automatic Real-Time Live Sync of Variants (No confusing manual button!)
  useEffect(() => {
    if (isSimple) return;
    const validOptions = options.filter((o) => o.values && o.values.length > 0);
    if (validOptions.length === 0) return;

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const arrays = validOptions.map((o) => o.values);
    const combos = cartesian(arrays);
    if (combos.length > 100) return;

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
        .filter(Boolean) as typeof variants;
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
                <span>تعديل الصنف</span>
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

        {/* Apple-Style Fluid Segmented Control (100% Mobile Visibility) */}
        <div className="pt-2">
          <div className="w-full grid grid-cols-3 p-1 rounded-2xl bg-brand-surface/90 border border-brand-border/70 gap-1 sm:w-auto sm:inline-flex">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                activeTab === 'overview'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconChartBar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span className="truncate">نظرة عامة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                activeTab === 'editor'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconSliders className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span className="truncate">بيانات الصنف</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 sm:px-4 rounded-xl text-center text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                activeTab === 'settings'
                  ? 'bg-brand-card text-brand-dark shadow-xs border border-brand-border/60 font-black'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
            >
              <IconSettings className="w-3.5 h-3.5 text-brand-muted shrink-0" />
              <span className="truncate">الإعدادات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Bar */}
      {saveSuccessMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-brand-trust-soft text-brand-trust border border-brand-trust/30 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <IconCheck className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <IconAlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & REVIEWS (Serene Product Dashboard)      */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Metrics Cards (Apple Design, Zero Emojis) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>المخزون الإجمالي</span>
                <IconPackage className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-dark">
                {totalStock}{' '}
                <span className="text-xs font-normal text-brand-muted">قطعة</span>
              </div>
              <div className="text-[11px] text-brand-muted mt-1">
                {totalStock > 0 ? 'متاح للطلب المباشر في الوسطى' : 'نفد المخزون حالياً'}
              </div>
            </div>

            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>نطاق الأسعار</span>
                <IconCurrencyShekel className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-dark">
                {minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} - ${maxPrice} ₪`}
              </div>
              <div className="text-[11px] text-brand-muted mt-1">شامل عمولة سَدِيم</div>
            </div>

            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>تقييم الزبائن</span>
                <IconStarSolid className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-dark flex items-center gap-1.5">
                <span>4.8</span>
                <span className="text-xs font-normal text-brand-muted">من 5</span>
              </div>
              <div className="text-[11px] text-brand-trust mt-1">100% نسبة رضا المشترين</div>
            </div>

            <div className="bg-brand-card rounded-2xl p-4 sm:p-5 border border-brand-border/60 shadow-xs">
              <div className="flex items-center justify-between text-xs text-brand-muted mb-2">
                <span>أمان الشحنة</span>
                <IconShieldCheck className="w-4 h-4 text-brand-trust" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-brand-trust">طرد موحد</div>
              <div className="text-[11px] text-brand-muted mt-1">توصيل 8 ₪ ومعاينة عند الباب</div>
            </div>
          </div>

          {/* Quick Variants Inventory Snapshot */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-6 border border-brand-border/60 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
              <div>
                <h2 className="text-sm font-black text-brand-dark">
                  حالة توفر الأصناف في المستودع
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  تعديل سريع للمخزون بدون الحاجة للدخول للمحرر
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer"
              >
                <span>إدارة كامل الخيارات</span>
                <IconArrowRight className="w-3 h-3" />
              </button>
            </div>

            {isSimple ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-brand-surface/30 border border-brand-border/60">
                <div className="flex items-center gap-3">
                  <img
                    src={primaryImage}
                    alt={name}
                    className="w-12 h-12 rounded-xl object-cover border border-brand-border/60 shrink-0 bg-brand-surface"
                  />
                  <div>
                    <div className="text-xs font-black text-brand-dark">{name}</div>
                    <div className="text-[11px] text-brand-muted mt-0.5">
                      صنف مفرد بسعر {simplePrice} ₪ · كود:{' '}
                      <span className="font-mono">{simpleSku || 'SDM-DEFAULT'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-brand-card p-1 rounded-xl border border-brand-border/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Math.max(0, Number(simpleStock) - 1);
                      setSimpleStock(cur);
                      merchantService.quickUpdateStock(productId, cur);
                    }}
                    className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-xs text-brand-dark tabular-nums">
                    {simpleStock}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(simpleStock) + 1;
                      setSimpleStock(cur);
                      merchantService.quickUpdateStock(productId, cur);
                    }}
                    className="w-8 h-8 rounded-lg bg-brand-surface hover:bg-brand-border/40 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-100"
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
      {/* TAB 2: PRODUCT STUDIO & OPTIONS EDITOR                    */}
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

          {/* Step 2: Gallery & Media (Device Selection + Cloud Storage Interface) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border/40">
              <div>
                <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                    2
                  </span>
                  <span>معرض صور الصنف ({images.length})</span>
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  اختر صور الصنف من هاتفك أو جهازك. الصورة الأولى ستكون غلاف الصنف الرئيسي.
                </p>
              </div>

              {uploadFeedback && (
                <span className="text-[11px] font-bold text-brand-trust bg-brand-trust-soft px-3 py-1 rounded-lg border border-brand-trust/30 flex items-center gap-1 self-start sm:self-auto animate-fadeIn">
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>{uploadFeedback}</span>
                </span>
              )}
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleDeviceFileUpload}
            />

            {/* Upload Zone & Thumbnails */}
            <div className="space-y-4">
              {/* If no images yet: Large Hero Drop/Upload Area */}
              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-border/90 hover:border-brand-primary/70 bg-brand-surface/40 hover:bg-brand-surface/70 rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary-soft text-brand-primary mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                    <IconPhoto className="w-6 h-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-black text-brand-dark mb-1">
                    اضغط لاختيار صور من هاتفك أو جهازك (أو اسحبها هنا)
                  </div>
                  <p className="text-[11px] text-brand-muted max-w-sm mx-auto leading-relaxed">
                    يدعم صور JPG, PNG, WEBP بدقة عالية · يمكنك اختيار عدة صور معاً
                  </p>
                  <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-card border border-brand-border/70 text-[10px] font-bold text-brand-muted">
                    <IconUploadCloud className="w-3.5 h-3.5 text-brand-primary" />
                    <span>واجهة مهيأة للربط التلقائي بخدمة الرفع السحابي</span>
                  </div>
                </div>
              ) : (
                /* Grid of selected images */
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-brand-border/80 group bg-brand-surface shadow-2xs"
                    >
                      <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />

                      {/* Primary Cover Badge */}
                      {idx === 0 ? (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          الغلاف الرئيسي
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-brand-card/95 hover:bg-white text-brand-dark text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs transition-opacity cursor-pointer"
                        >
                          تعيين كغلاف
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer shadow-xs"
                        title="حذف الصورة من المعرض"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add more button tile in the grid */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFiles}
                    className="aspect-square rounded-2xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/30 hover:bg-brand-surface/60 flex flex-col items-center justify-center gap-1.5 text-brand-muted hover:text-brand-primary transition-all cursor-pointer active:scale-95 group"
                  >
                    <IconPhoto className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold">+ صور أخرى</span>
                  </button>
                </div>
              )}

              {/* Sub-bar: Upload Status & Secondary URL input toggle */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-brand-border/30">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-bold border border-brand-border/70 flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                  >
                    <IconUploadCloud className="w-3.5 h-3.5 text-brand-primary" />
                    <span>اختيار صور من الجهاز</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-brand-muted hover:text-brand-primary underline transition-colors cursor-pointer"
                  >
                    {showUrlInput ? 'إخفاء حقل الرابط' : 'أو إضافة رابط صورة من الإنترنت (URL)'}
                  </button>
                </div>

                <div className="text-[10px] text-brand-muted flex items-center gap-1">
                  <IconShieldCheck className="w-3.5 h-3.5 text-brand-trust" />
                  <span>الصور تُحفظ وتُعرض بجودة محسّنة لشبكات غزة</span>
                </div>
              </div>

              {/* Secondary URL Field */}
              {showUrlInput && (
                <div className="p-3 bg-brand-surface/40 rounded-xl border border-brand-border/60 flex items-center gap-2 animate-fadeIn">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="الصق رابط صورة مباشر (https://...)"
                    className="flex-1 h-9 px-3 text-base sm:text-xs rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!newImageUrl.trim()}
                    className="h-9 px-3.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    إضافة الرابط
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Product Structure Decision (Simple vs Multi-Variant) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
            <h2 className="text-sm font-black text-brand-dark mb-4 pb-3 border-b border-brand-border/40 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                3
              </span>
              <span>نوع الصنف وطبيعة خياراته</span>
            </h2>

            {/* Clear Human-Centric Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div
                onClick={() => setIsSimple(true)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
                  isSimple
                    ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                    : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
                }`}
              >
                <div className="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center border-brand-primary">
                  {isSimple && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div>
                  <div className="text-xs font-black text-brand-dark">بدون خيارات (سعر ومخزون موحد)</div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    الصنف يتوفر بنوع واحد فقط بدون مقاسات أو ألوان (مثل: عسل سدر، ساعة، حقيبة، شال مفرد).
                  </div>
                </div>
              </div>

              <div
                onClick={() => setIsSimple(false)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
                  !isSimple
                    ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                    : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
                }`}
              >
                <div className="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center border-brand-primary">
                  {!isSimple && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
                </div>
                <div>
                  <div className="text-xs font-black text-brand-dark">خيارات متعددة (مقاسات أو ألوان)</div>
                  <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                    الصنف يتوفر بعدة ألوان أو مقاسات مختلفة (مثل: ملابس، عبايات، أحذية).
                  </div>
                </div>
              </div>
            </div>

            {/* If Simple Product: Instant Clean Form */}
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
                    الكمية المتوفرة (قطع) *
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

          {/* If Multi-Variant Product: Frictionless, Human-Friendly Flow */}
          {!isSimple && (
            <div className="space-y-6">
              {/* Step 4: Add Options (Colors & Sizes via Compact Select Dropdowns) */}
              <div className="bg-brand-card rounded-2xl p-4 sm:p-6 border border-brand-border/60 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border/40">
                  <div>
                    <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                        4
                      </span>
                      <span>خيارات ومقاسات الصنف</span>
                    </h2>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      اختر المقاسات أو الألوان من القوائم المنسدلة لإضافتها دون أن تأخذ حيزاً كبيراً
                    </p>
                  </div>

                  {/* Add Option Dropdown Select */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value as 'COLOR' | 'SIZE' | 'CUSTOM';
                        if (val) handleAddPredefinedOption(val);
                      }}
                      className="h-9 px-3 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-surface hover:bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
                    >
                      <option value="" disabled>
                        + إضافة خيار جديد... ▾
                      </option>
                      {!options.some((o) => o.type === 'COLOR' || o.name === 'اللون') && (
                        <option value="COLOR">الألوان (Colors)</option>
                      )}
                      {!options.some((o) => o.type === 'SIZE' || o.name === 'المقاس') && (
                        <option value="SIZE">المقاسات (Sizes)</option>
                      )}
                      <option value="CUSTOM">خيار مخصص آخر</option>
                    </select>
                  </div>
                </div>

                {/* Compact Options List */}
                {options.length === 0 ? (
                  <div className="py-6 text-center bg-brand-surface/20 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                    اختر «+ إضافة خيار جديد» أعلاه لتحديد المقاسات أو الألوان
                  </div>
                ) : (
                  <div className="space-y-3">
                    {options.map((opt, optIdx) => {
                      const isColor = opt.type === 'COLOR' || opt.name === 'اللون';
                      const isSize = opt.type === 'SIZE' || opt.name === 'المقاس';

                      return (
                        <div
                          key={optIdx}
                          className="bg-brand-surface/30 rounded-xl p-3 sm:p-4 border border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          {/* Label */}
                          <div className="flex items-center gap-2 shrink-0 min-w-24">
                            <span className="text-xs font-black text-brand-dark">
                              {opt.name || opt.label}
                            </span>
                            <span className="text-[10px] text-brand-muted bg-brand-card px-1.5 py-0.5 rounded border border-brand-border/60">
                              {opt.values.length}
                            </span>
                          </div>

                          {/* Selected Tags + Select Dropdown */}
                          <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            {/* Tags */}
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
                                  title="إزالة هذه القيمة"
                                >
                                  ×
                                </button>
                              </span>
                            ))}

                            {/* Select Dropdown to pick new value (Hidden inside dropdown!) */}
                            <select
                              value=""
                              onChange={(e) => {
                                const selectedVal = e.target.value;
                                if (selectedVal === '__CUSTOM__') {
                                  setShowCustomInput((prev) => ({ ...prev, [optIdx]: true }));
                                } else if (selectedVal) {
                                  handleAddOptionValue(optIdx, selectedVal);
                                }
                              }}
                              className="h-8 px-2.5 text-xs font-bold rounded-lg border border-brand-border/80 bg-brand-card text-brand-dark hover:border-brand-primary focus:outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
                            >
                              <option value="" disabled>
                                {isColor
                                  ? '+ إضافة لون من القائمة... ▾'
                                  : isSize
                                  ? '+ إضافة مقاس من القائمة... ▾'
                                  : '+ إضافة قيمة... ▾'}
                              </option>
                              {isColor &&
                                PRESET_COLORS.filter((c) => !opt.values.includes(c)).map((col) => (
                                  <option key={col} value={col}>
                                    {col}
                                  </option>
                                ))}
                              {isSize && (
                                <>
                                  <optgroup label="مقاسات الملابس">
                                    {PRESET_CLOTHING_SIZES.filter((s) => !opt.values.includes(s)).map(
                                      (sz) => (
                                        <option key={sz} value={sz}>
                                          {sz}
                                        </option>
                                      )
                                    )}
                                  </optgroup>
                                  <optgroup label="مقاسات الأحذية">
                                    {PRESET_SHOE_SIZES.filter((s) => !opt.values.includes(s)).map(
                                      (sz) => (
                                        <option key={sz} value={sz}>
                                          {sz}
                                        </option>
                                      )
                                    )}
                                  </optgroup>
                                </>
                              )}
                              <option value="__CUSTOM__">+ كتابة يدوية مخصصة...</option>
                            </select>

                            {/* Inline Custom Input when chosen */}
                            {showCustomInput[optIdx] && (
                              <div className="inline-flex items-center gap-1 animate-fadeIn">
                                <input
                                  type="text"
                                  autoFocus
                                  value={optionTagInputs[optIdx] || ''}
                                  onChange={(e) =>
                                    setOptionTagInputs((prev) => ({
                                      ...prev,
                                      [optIdx]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddOptionValue(optIdx);
                                      setShowCustomInput((prev) => ({ ...prev, [optIdx]: false }));
                                    } else if (e.key === 'Escape') {
                                      setShowCustomInput((prev) => ({ ...prev, [optIdx]: false }));
                                    }
                                  }}
                                  placeholder="اكتب القيمة ثم Enter..."
                                  className="h-8 px-2 text-xs rounded-lg border border-brand-primary bg-white text-brand-dark focus:outline-none w-32 shadow-2xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAddOptionValue(optIdx);
                                    setShowCustomInput((prev) => ({ ...prev, [optIdx]: false }));
                                  }}
                                  className="h-8 px-2 text-[11px] font-bold bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover cursor-pointer"
                                >
                                  إضافة
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowCustomInput((prev) => ({ ...prev, [optIdx]: false }))
                                  }
                                  className="h-8 px-1.5 text-xs text-brand-muted hover:text-brand-dark cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Delete Option */}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(optIdx)}
                            className="text-[11px] text-brand-muted hover:text-red-600 font-bold self-end sm:self-center transition-colors cursor-pointer shrink-0"
                          >
                            حذف الخيار ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Color-Image Binding (Compact single rows with select) */}
                {colorOpt && colorOpt.values.length > 0 && images.length > 0 && (
                  <div className="pt-3 border-t border-brand-border/40">
                    <div className="text-xs font-black text-brand-dark mb-1">
                      ربط صور الألوان (اختياري)
                    </div>
                    <p className="text-[11px] text-brand-muted mb-2.5">
                      حدد صورة المعرض الخاصة بكل لون من القائمة المنسدلة:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {colorOpt.values.map((colVal) => {
                        const currentBound = colorImageMap[colVal] || images[0];
                        return (
                          <div
                            key={colVal}
                            className="p-2.5 rounded-xl bg-brand-surface/40 border border-brand-border/60 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-16">
                              <img
                                src={currentBound}
                                alt={colVal}
                                className="w-7 h-7 rounded-lg object-cover border border-brand-border/70 shrink-0 bg-brand-surface"
                              />
                              <span className="text-xs font-black text-brand-dark truncate">
                                {colVal}
                              </span>
                            </div>

                            <select
                              value={colorImageMap[colVal] || images[0] || ''}
                              onChange={(e) => handleBindColorImage(colVal, e.target.value)}
                              className="h-7 px-2 text-[11px] font-bold rounded-lg border border-brand-border/80 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary cursor-pointer truncate max-w-36"
                            >
                              {images.map((imgUrl, imgI) => (
                                <option key={imgI} value={imgUrl}>
                                  {imgI === 0 ? 'صورة الغلاف' : `صورة المعرض #${imgI + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 5: Generated Combinations List (Clean, Calm & Fast) */}
              <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-border/40">
                  <div>
                    <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                        5
                      </span>
                      <span>قائمة المقاسات والأصناف المتوفرة ({variants.length})</span>
                    </h2>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      تتولد التوليفات تلقائياً. يمكنك توحيد السعر بنقرة واحدة، أو تعديل أي مقاس بشكل منفصل.
                    </p>
                  </div>

                  {/* Fast Bulk Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto bg-brand-surface/40 p-1.5 rounded-xl border border-brand-border/60">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="السعر (₪)"
                        value={bulkPriceInput}
                        onChange={(e) => setBulkPriceInput(e.target.value)}
                        className="w-20 h-8 px-2 text-base sm:text-xs rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkPrice}
                        disabled={!bulkPriceInput}
                        className="h-8 px-2 bg-brand-card hover:bg-brand-surface text-brand-dark text-[11px] font-bold rounded-lg border border-brand-border/70 disabled:opacity-40 cursor-pointer active:scale-95"
                      >
                        توحيد السعر
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="المخزون"
                        value={bulkStockInput}
                        onChange={(e) => setBulkStockInput(e.target.value)}
                        className="w-16 h-8 px-2 text-base sm:text-xs rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={handleApplyBulkStock}
                        disabled={!bulkStockInput}
                        className="h-8 px-2 bg-brand-card hover:bg-brand-surface text-brand-dark text-[11px] font-bold rounded-lg border border-brand-border/70 disabled:opacity-40 cursor-pointer active:scale-95"
                      >
                        توحيد المخزون
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compact Variant Cards */}
                <div className="space-y-2.5">
                  {variants.map((v, vIdx) => {
                    const attrSummary =
                      Object.entries(v.attributes || {})
                        .map(([_, val]) => val)
                        .join(' · ') || 'افتراضي';

                    const variantPhoto =
                      v.images && v.images.length > 0 ? v.images[0] : primaryImage;

                    return (
                      <div
                        key={v.attrKey || vIdx}
                        className={`p-3.5 rounded-xl border transition-all ${
                          v.isActive
                            ? 'bg-brand-surface/20 border-brand-border/60 hover:border-brand-primary/40'
                            : 'bg-zinc-50 border-zinc-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Left / Identity */}
                          <div className="flex items-center gap-3">
                            <img
                              src={variantPhoto}
                              alt={attrSummary}
                              className="w-10 h-10 rounded-xl object-cover border border-brand-border/60 shrink-0 bg-brand-surface"
                            />
                            <div>
                              <div className="text-xs font-black text-brand-dark">{attrSummary}</div>
                              <div className="text-[10px] text-brand-muted font-mono">{v.sku}</div>
                            </div>
                          </div>

                          {/* Right / Inline Controls */}
                          <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
                            {/* Price */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-brand-muted font-bold">السعر:</span>
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
                                  className="w-20 h-9 px-2 text-base sm:text-xs font-black rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                                />
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted">
                                  ₪
                                </span>
                              </div>
                            </div>

                            {/* Stock with Stepper */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-brand-muted font-bold">المخزون:</span>
                              <div className="flex items-center h-9 bg-brand-card rounded-lg border border-brand-border/70 px-1 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...variants];
                                    updated[vIdx] = { ...v, stock: Math.max(0, v.stock - 1) };
                                    setVariants(updated);
                                  }}
                                  className="w-6 h-6 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
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
                                  className="w-10 text-center font-black text-xs bg-transparent focus:outline-none tabular-nums"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...variants];
                                    updated[vIdx] = { ...v, stock: v.stock + 1 };
                                    setVariants(updated);
                                  }}
                                  className="w-6 h-6 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Active Toggle */}
                            <label className="flex items-center gap-1 text-[11px] font-bold text-brand-dark cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={v.isActive}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, isActive: e.target.checked };
                                  setVariants(updated);
                                }}
                                className="w-3.5 h-3.5 accent-brand-trust rounded cursor-pointer"
                              />
                              <span className={v.isActive ? 'text-brand-trust' : 'text-zinc-400'}>
                                {v.isActive ? 'متاح' : 'معطل'}
                              </span>
                            </label>

                            {/* Delete Variant */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeletedVariantKeys((prev) => [...prev, v.attrKey]);
                                setVariants((prev) => prev.filter((_, idx) => idx !== vIdx));
                              }}
                              className="text-brand-muted hover:text-red-600 text-xs font-bold p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="حذف هذا الصنف المحدد"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {variants.length === 0 && (
                    <div className="text-center py-6 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                      أضف قيم المقاسات أو الألوان في الخطوة 4 أعلاه لتوليد القائمة فورياً
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                  إلغاء
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
