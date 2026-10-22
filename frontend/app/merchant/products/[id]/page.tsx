'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { merchantKeys } from '@/features/merchant/queries/merchant.keys';
import { useMerchantContext } from '@/features/merchant/context/MerchantContext';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';
import { merchantService } from '@/features/merchant/services/merchant.service';
import type { ProductItem, ProductVariant } from '@/features/merchant/types/merchant.types';
import { COLOR_SWATCHES } from '@/features/merchant/components/product-studio/ProductStudioTypes';
import {
  getAttributeKey,
  getAttributeDisplayName,
  isColorAttribute,
} from '@/shared/lib/attributeUtils';

interface VariantRowState {
  id: string; // Real DB _id or temp generated ID
  dbId?: string; // Present only if it already exists in MongoDB
  attributes: Record<string, string>;
  price: number | '';
  stock: number | '';
  sku: string;
  isEnabled: boolean; // Controls whether this combination is active or excluded
  image?: string;
  imageFile?: File;
}

/**
 * ضغط الصورة في المتصفح باستخدام Canvas لتلائم شبكات غزة الضعيفة
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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { store, isLoading: isAuthLoading } = useMerchantContext();

  // Loading & Product Data
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [rawDbVariants, setRawDbVariants] = useState<ProductVariant[]>([]);

  // Categories & Active Category State (from DB)
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryId, setCategoryId] = useState('');

  // Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product Active Status
  const [isProductActive, setIsProductActive] = useState(true);

  // Base Pricing & Stock (For simple products)
  const [basePrice, setBasePrice] = useState<number | ''>('');
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Gatekeeper: Redirect unapproved stores
  useEffect(() => {
    if (!isAuthLoading && store && store.approveStatus !== 'approved') {
      router.replace('/merchant/pending-approval');
    }
  }, [store, isAuthLoading, router]);

  // Load Categories & Product Hydration
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [cats, prodRes] = await Promise.all([
          taxonomyService.fetchCategories(),
          merchantService.getProductById(productId),
        ]);

        if (!isMounted) return;

        setCategories(cats);

        if (!prodRes.success || !prodRes.data) {
          setErrorMessage(prodRes.message || 'تعذر جلب تفاصيل الصنف المطلوب');
          setIsLoadingProduct(false);
          return;
        }

        const p = prodRes.data;
        setProduct(p);

        // 1. Basic Info
        setTitle(p.title || p.name || '');
        setDescription(p.description || '');
        setImages(Array.isArray(p.images) ? p.images : []);
        setIsProductActive(p.isActive !== false);

        const currentCatId = typeof p.categoryId === 'object' && p.categoryId !== null ? p.categoryId._id : p.categoryId;
        setCategoryId(currentCatId || (cats[0]?._id ?? ''));

        // 2. Variants & Options Hydration
        const dbVars = p.variants || [];
        setRawDbVariants(dbVars);

        const hasMultiVariants = dbVars.length > 1 || (dbVars.length === 1 && Object.keys(dbVars[0].attributes || {}).length > 0);

        if (!hasMultiVariants) {
          // Simple Product
          const singleVar = dbVars[0];
          setBasePrice(singleVar ? singleVar.price : (p.minPrice || ''));
          setBaseStock(singleVar ? singleVar.stock : (p.totalStock ?? 10));
          setActiveOptionKeys([]);
          setSelectedAttributeValues({});
          setVariantsRows([]);
        } else {
          // Multi-variant Product: Extract unique attribute keys and values from DB variants
          const extractedVals: Record<string, string[]> = {};

          dbVars.forEach((v) => {
            if (v.attributes) {
              Object.entries(v.attributes).forEach(([k, val]) => {
                if (!extractedVals[k]) extractedVals[k] = [];
                const strVal = String(val).trim();
                if (strVal && !extractedVals[k].includes(strVal)) {
                  extractedVals[k].push(strVal);
                }
              });
            }
          });

          const activeKeys = Object.keys(extractedVals);
          setActiveOptionKeys(activeKeys);
          setSelectedAttributeValues(extractedVals);
        }
      } catch (err: any) {
        console.error('Failed to load product data:', err);
        if (isMounted) setErrorMessage('حدث خطأ أثناء تحميل بيانات الصنف من الخادم.');
      } finally {
        if (isMounted) setIsLoadingProduct(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Active Category & its DB Variant Attributes
  const activeCategory = useMemo(() => {
    return categories.find((c) => c._id === categoryId);
  }, [categories, categoryId]);

  const categoryAttributes = useMemo(() => {
    return activeCategory?.variantAttributes || [];
  }, [activeCategory]);

  const categorySupportsVariants = categoryAttributes.length > 0;

  // Checks if options are active (locks category selector until options are cleared)
  const hasOptions = activeOptionKeys.length > 0 || variantsRows.length > 0;

  // Unused Attributes available to be added
  const availableUnusedAttributes = useMemo(() => {
    return categoryAttributes.filter((attr) => !activeOptionKeys.includes(getAttributeKey(attr)));
  }, [categoryAttributes, activeOptionKeys]);

  // Option Key Add / Remove
  const handleAddOption = (attrKey: string) => {
    if (!activeOptionKeys.includes(attrKey)) {
      setActiveOptionKeys((prev) => [...prev, attrKey]);
      setSelectedAttributeValues((prev) => ({ ...prev, [attrKey]: [] }));
    }
  };

  const handleRemoveOption = (attrKey: string) => {
    setActiveOptionKeys((prev) => prev.filter((k) => k !== attrKey));
    setSelectedAttributeValues((prev) => {
      const next = { ...prev };
      delete next[attrKey];
      return next;
    });
  };

  // Toggle values inside an active option
  const handleToggleValue = (attrKey: string, val: string) => {
    const cleanVal = val.trim();
    if (!cleanVal) return;

    setSelectedAttributeValues((prev) => {
      const currentList = prev[attrKey] || [];
      const exists = currentList.includes(cleanVal);
      const nextList = exists ? currentList.filter((v) => v !== cleanVal) : [...currentList, cleanVal];
      return { ...prev, [attrKey]: nextList };
    });
  };

  const handleClearAllValues = (attrKey: string) => {
    setSelectedAttributeValues((prev) => ({ ...prev, [attrKey]: [] }));
  };

  // Cartesian Combination Generator with DB Variant Matching
  useEffect(() => {
    const activeKeysWithValues = activeOptionKeys.filter(
      (k) => selectedAttributeValues[k] && selectedAttributeValues[k].length > 0
    );

    if (activeKeysWithValues.length === 0) {
      setVariantsRows([]);
      return;
    }

    // Helper: Cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
        [[]]
      );
    };

    const valueArrays = activeKeysWithValues.map((k) => selectedAttributeValues[k]);
    const combinations = cartesian(valueArrays);

    setVariantsRows((prevRows) => {
      return combinations.map((combo, idx) => {
        const attributes: Record<string, string> = {};
        activeKeysWithValues.forEach((k, i) => {
          attributes[k] = combo[i];
        });

        // 1. Check if an existing variant from DB matches this combination
        const dbMatch = rawDbVariants.find((v) => {
          if (!v.attributes) return false;
          return Object.entries(attributes).every(([ak, av]) => String(v.attributes[ak]).trim() === av.trim());
        });

        // 2. Check if a previously loaded UI row matches
        const prevMatch = prevRows.find((r) => {
          return Object.entries(attributes).every(([ak, av]) => r.attributes[ak] === av);
        });

        if (dbMatch) {
          const vImg = (dbMatch.images && dbMatch.images[0]) || (dbMatch as any).image || undefined;
          return {
            id: String(dbMatch._id),
            dbId: String(dbMatch._id),
            attributes,
            price: prevMatch ? prevMatch.price : dbMatch.price,
            stock: prevMatch ? prevMatch.stock : dbMatch.stock,
            sku: dbMatch.sku || '',
            isEnabled: prevMatch ? prevMatch.isEnabled : (dbMatch.isActive !== false),
            image: prevMatch?.image || vImg,
            imageFile: prevMatch?.imageFile,
          };
        }

        if (prevMatch) {
          return prevMatch;
        }

        // 3. New Cartesian combination (not in DB)
        return {
          id: `cartesian-${idx}-${Date.now()}`,
          attributes,
          price: basePrice !== '' ? basePrice : 45,
          stock: baseStock !== '' ? baseStock : 10,
          sku: '',
          isEnabled: true, // Default to true so newly added options/values are enabled by default
          image: undefined,
          imageFile: undefined,
        };
      });
    });
  }, [activeOptionKeys, selectedAttributeValues, rawDbVariants]);

  // Bulk Apply Price
  const handleApplyBulkPrice = () => {
    const p = parseFloat(bulkPrice);
    if (isNaN(p) || p <= 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.isEnabled !== false ? { ...r, price: p } : r))
    );
    setBulkPrice('');
  };

  // Bulk Apply Stock
  const handleApplyBulkStock = () => {
    const s = parseInt(bulkStock, 10);
    if (isNaN(s) || s < 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.isEnabled !== false ? { ...r, stock: s } : r))
    );
    setBulkStock('');
  };

  // Enable all disabled variants
  const handleEnableAllVariants = () => {
    setVariantsRows((prev) => prev.map((r) => ({ ...r, isEnabled: true })));
  };

  // Counts
  const enabledVariantsCount = useMemo(() => {
    return variantsRows.filter((r) => r.isEnabled !== false).length;
  }, [variantsRows]);

  const disabledVariantsCount = useMemo(() => {
    return variantsRows.filter((r) => r.isEnabled === false).length;
  }, [variantsRows]);

  // Image Upload Handler (Max 5 images)
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setErrorMessage('تنبيه: الحد الأقصى المسموح به هو 5 صور لكل منتج لضمان سرعة التحميل والتصفح.');
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

  // Has variants under the hood
  const hasVariantsUnderTheHood = useMemo(() => {
    const hasValuesSelected = Object.keys(selectedAttributeValues).some(
      (k) => selectedAttributeValues[k] && selectedAttributeValues[k].length > 0
    );
    return activeOptionKeys.length > 0 && hasValuesSelected && enabledVariantsCount > 0;
  }, [activeOptionKeys, selectedAttributeValues, enabledVariantsCount]);

  // Delete Product
  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await merchantService.deleteProduct(productId);
      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
        await queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
        router.refresh();
        setSuccessMessage('تم حذف الصنف بنجاح.');
        setTimeout(() => {
          router.push('/merchant/dashboard');
        }, 800);
      } else {
        setErrorMessage(res.message || 'تعذر حذف الصنف');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء محاولة حذف الصنف');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Orchestrated Save Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('يرجى كتابة اسم الصنف.');
      return;
    }

    if (images.length === 0) {
      setErrorMessage('يرجى إضافة صورة واحدة على الأقل للصنف.');
      return;
    }

    const enabledRows = variantsRows.filter((r) => r.isEnabled !== false);

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
        setErrorMessage('يرجى تفعيل توليفة واحدة على الأقل، أو مسح الخيارات لجعله صنفاً موحداً.');
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
      // 1. Separate existing HTTP(S) image URLs from new local base64 images
      const existingKeptUrls = images.filter(
        (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
      );
      const productStatus: 'active' | 'inActive' | undefined =
        product && product.isActive !== isProductActive
          ? isProductActive ? 'active' : 'inActive'
          : undefined;

      // 2. Base Product Update (Strictly sending existingImages to protect Cloudinary)
      const baseUpdatePayload = {
        title: cleanTitle,
        name: cleanTitle,
        description: description.trim(),
        categoryId: hasOptions ? undefined : categoryId,
        images: existingKeptUrls,
        existingImages: existingKeptUrls,
        imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
        status: productStatus,
      };

      const baseRes = await merchantService.updateProductBase(productId, baseUpdatePayload);
      if (!baseRes.success) {
        setErrorMessage(baseRes.message || 'فشل تحديث البيانات الأساسية للصنف');
        setIsSubmitting(false);
        return;
      }

      // 3. Simple Product vs Multi-Variant Sync
      if (!hasVariantsUnderTheHood) {
        // Simple product: Update default variant
        const defaultVar = rawDbVariants[0];
        if (defaultVar && defaultVar._id) {
          await merchantService.updateProductVariant(productId, defaultVar._id, {
            price: Number(basePrice) || 0,
            stock: Math.max(0, Math.floor(Number(baseStock) || 0)),
          });
        }
      } else {
        // Multi-variant product: Orchestrate PATCH, POST, and DELETE
        const fallbackImg = existingKeptUrls[0] || product?.images?.[0] || '';

        // A. Existing enabled variants: PATCH price & stock & image (if imageFile)
        for (const row of enabledRows) {
          if (row.dbId) {
            await merchantService.updateProductVariant(productId, row.dbId, {
              price: Number(row.price) || 0,
              stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
            });
            if (row.imageFile) {
              await merchantService.uploadVariantImage(productId, row.dbId, row.imageFile);
            }
          } else {
            // B. Newly enabled combination: POST to /variants
            const newRes = await merchantService.addCustomVariant(productId, {
              attributes: row.attributes,
              price: Number(row.price) || 0,
              stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
              image: row.image || fallbackImg,
            });
            const newVarId = newRes?.data?.variant?._id;
            if (row.imageFile && newVarId) {
              await merchantService.uploadVariantImage(productId, newVarId, row.imageFile);
            }
          }
        }

        // C. Disabled or removed variants: DELETE from DB
        const activeDbIds = new Set(enabledRows.map((r) => r.dbId).filter(Boolean));
        for (const oldVar of rawDbVariants) {
          if (oldVar._id && !activeDbIds.has(String(oldVar._id))) {
            try {
              await merchantService.deleteProductVariant(productId, String(oldVar._id));
            } catch (delErr) {
              console.warn('Failed to delete removed variant:', oldVar._id, delErr);
            }
          }
        }
      }

      // 4. Success feedback & refresh
      await queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
      await queryClient.invalidateQueries({ queryKey: merchantKeys.productDetail(productId) });
      await queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
      router.refresh();
      setSuccessMessage('تم حفظ وتحديث كافة بيانات الصنف بنجاح على سَدِيم.');
      setImageFiles([]);

      // Reload fresh data from backend
      const refreshed = await merchantService.getProductById(productId);
      if (refreshed.success && refreshed.data) {
        setProduct(refreshed.data);
        setRawDbVariants(refreshed.data.variants || []);
        setImages(refreshed.data.images || []);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء حفظ التعديلات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 text-center font-almarai space-y-3">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-brand-muted">جارٍ تحميل بيانات الصنف من سَدِيم...</p>
      </div>
    );
  }

  if (!product && !isLoadingProduct) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center font-almarai space-y-4">
        <div className="text-3xl">⚠️</div>
        <h2 className="text-base font-black text-brand-dark">الصنف غير موجود أو تم حذفه</h2>
        <p className="text-xs text-brand-muted">لم نتمكن من العثور على هذا الصنف في متجرك.</p>
        <Link
          href="/merchant/dashboard"
          className="inline-block px-5 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-xs hover:bg-brand-primary-hover transition-colors"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-28 font-almarai text-right">
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
            className="w-9 h-9 rounded-xl border border-brand-border/80 flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors shrink-0 shadow-2xs"
            title="العودة للوحة التاجر"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-brand-dark">تعديل الصنف</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                سَدِيم
              </span>
              {product?.approveStatus === 'rejected' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  موقوف إدارياً
                </span>
              ) : isProductActive ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  معروض للزبائن
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  متوقف مؤقتاً
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              عدّل الأسعار والمخزون والتفاصيل مع التحديث المباشر للمتجر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Status Switcher */}
          {product?.approveStatus === 'rejected' ? (
            <div
              className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs select-none"
              title="لا يمكن تفعيل الصنف لأنه موقوف إدارياً بواسطة إدارة سَدِيم"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>موقوف إدارياً</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsProductActive(!isProductActive)}
              className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                isProductActive
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isProductActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isProductActive ? 'الصنف معروض' : 'الصنف معطل'}</span>
            </button>
          )}

          {/* Delete Trigger */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="h-9 px-3 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs active:scale-95"
            title="حذف هذا الصنف نهائياً"
          >
            حذف الصنف
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="h-9 sm:h-10 px-5 sm:px-6 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <span>حفظ التعديلات</span>
            )}
          </button>
        </div>
      </div>

      {/* Admin Rejection Callout */}
      {product?.approveStatus === 'rejected' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50/90 border border-red-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-red-800">تم إيقاف هذا الصنف إدارياً من قبل إدارة سَدِيم</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200/60 text-red-800">
                  غير معروض للزبائن
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {product.rejectReason ? (
                  <>
                    <strong className="font-bold">سبب الإيقاف الموضح من الإدارة: </strong>
                    <span className="font-bold underline decoration-red-300 underline-offset-2">{product.rejectReason}</span>
                  </>
                ) : (
                  'لم يتم تدوين سبب محدد للإيقاف. يرجى تعديل الصنف ليتوافق مع سياسات منصة سَدِيم أو التواصل مع الإدارة.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 text-sm font-black p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-black p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Information & Gallery */}
        <section className="bg-white rounded-2xl border border-brand-border/70 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="border-b border-brand-border/40 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-black text-brand-dark">معلومات الصنف ومعرض الصور</h2>
            </div>
            <span className="text-[10px] font-bold text-brand-muted">المعرف: {product?._id ? product._id.slice(-6) : ''}</span>
          </div>

          {/* Desktop 2-Column Inline Row: Category Dropdown & Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={hasOptions}
                className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.title}
                  </option>
                ))}
              </select>
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

            <div>
              <label className="text-xs font-bold text-brand-dark block mb-1.5">
                اسم الصنف <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: فستان سهرة حرير كحلي"
                className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-brand-dark block mb-1.5">
              وصف الصنف <span className="text-brand-muted text-[10px]">(اختياري)</span>
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
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImagesUpload}
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

          {/* Base Pricing & Stock Inputs (Simple Product) */}
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
                      className="h-8 px-3 rounded-lg border border-brand-primary/40 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                    >
                      <span>+ إضافة {attrDisplay}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Options Customization Section */}
          {activeOptionKeys.length > 0 && (
            <div className="space-y-4 pt-2">
              {activeOptionKeys.map((attrKey) => {
                const attrDef = categoryAttributes.find((a) => getAttributeKey(a) === attrKey);
                const attrDisplay = attrDef?.name || getAttributeDisplayName(attrKey);
                const isColor = isColorAttribute(attrKey);

                const allowedValues: string[] = attrDef?.values || [];
                const selectedVals = selectedAttributeValues[attrKey] || [];
                const unselectedValues = allowedValues.filter((v) => !selectedVals.includes(v));

                const filteredUnselected = dropdownSearch
                  ? unselectedValues.filter((v) => v.toLowerCase().includes(dropdownSearch.toLowerCase()))
                  : unselectedValues;

                const isPopoverOpen = openDropdownKey === attrKey;

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

                    {/* Fixed Position Trigger: Popover with search and custom value entry */}
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

                            {filteredUnselected.length === 0 && !dropdownSearch.trim() && (
                              <div className="w-full py-4 text-center text-xs text-brand-muted">
                                تم اختيار كافة الخيارات المتاحة
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

                    {/* Selected Values Tags */}
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
          )}

          {/* Generated Variants Table */}
          {variantsRows.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-brand-border/50">
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

                {/* Unified Bulk Toolbar */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Bulk Price Input Group */}
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

                  {/* Bulk Stock Input Group */}
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

              {/* Matrix Rows with iOS Switch */}
              <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                {variantsRows.map((row, idx) => {
                  const isEnabled = row.isEnabled !== false;
                  const label = Object.entries(row.attributes)
                    .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
                    .join(' • ');

                  return (
                    <div
                      key={row.id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isEnabled
                          ? 'bg-brand-surface/25 border-brand-border/70 shadow-2xs'
                          : 'bg-brand-surface/10 border-brand-border/30 opacity-30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Toggle & Label */}
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={() => {
                              setVariantsRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, isEnabled: !isEnabled } : r))
                              );
                            }}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                              isEnabled ? 'bg-brand-primary' : 'bg-brand-border'
                            }`}
                            title={isEnabled ? 'تعطيل هذه التوليفة' : 'تفعيل هذه التوليفة'}
                          >
                            <span
                              className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                                isEnabled ? '-translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Variant Specific Image Picker */}
                          <div className="relative shrink-0">
                            <input
                              type="file"
                              id={`v-img-edit-${row.id}`}
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
                                htmlFor={`v-img-edit-${row.id}`}
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

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-brand-dark">{label}</span>
                            {!isEnabled && (
                              <span className="text-[10px] font-bold text-brand-muted bg-brand-surface/80 px-2 py-0.5 rounded-full border border-brand-border/50">
                                مستبعد
                              </span>
                            )}
                            {row.dbId && (
                              <span className="text-[9px] font-bold text-brand-muted/70 bg-white px-1.5 py-0.5 rounded border border-brand-border/40">
                                مسجل
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Inputs */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold text-brand-muted">السعر:</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                disabled={!isEnabled}
                                value={row.price}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setVariantsRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, price: val } : r))
                                  );
                                }}
                                className="w-20 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary disabled:opacity-50"
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
                              disabled={!isEnabled}
                              value={row.stock}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                setVariantsRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, stock: val } : r))
                                );
                              }}
                              className="w-18 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Sticky Bottom Dock */}
        <div className="fixed bottom-0 lg:right-68 right-0 left-0 z-30 bg-white/95 backdrop-blur-md border-t border-brand-border/80 p-3 sm:p-4 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-brand-dark">
                {hasVariantsUnderTheHood ? `التوليفات النشطة: ${enabledVariantsCount}` : 'صنف موحد'}
              </span>
              <span className="text-[10px] text-brand-muted hidden sm:inline">• التعديل ينعكس مباشرة في متجرك</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-7 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <span>حفظ التعديلات</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right font-almarai">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg mx-auto">
              🗑️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-brand-dark">تأكيد حذف الصنف</h3>
              <p className="text-xs text-brand-muted">
                هل أنت متأكد من حذف الصنف &quot;{title}&quot;؟ سيتم إزالته من المتجر نهائياً ولا يمكن التراجع.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex-1 h-9 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isDeleting ? 'جارٍ الحذف...' : 'نعم، احذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
