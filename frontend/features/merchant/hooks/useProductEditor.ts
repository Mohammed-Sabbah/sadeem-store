'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchantContext } from '../context/MerchantContext';
import type { ProductItem, ProductVariant } from '../types/merchant.types';
import type { ProductEditorMode, VariantRowState } from '../types/product-studio.types';
import { useProductCategories } from './useProductCategories';
import { useProductMedia } from './useProductMedia';
import { useVariantMatrix } from './useVariantMatrix';
import {
  useMerchantProductDetailQuery,
  useSaveProductStudioMutation,
  useDeleteProductMutation,
} from '../queries/useMerchantQueries';
import { useToast } from '@/components/ui/toast';
import { getAttributeKey, getAttributeDisplayName } from '@/shared/lib/attributeUtils';

interface UseProductEditorOptions {
  mode: ProductEditorMode;
  productId?: string;
}

export function useProductEditor({ mode, productId }: UseProductEditorOptions) {
  const router = useRouter();
  const { store, isLoading: isAuthLoading } = useMerchantContext();
  const toast = useToast();

  // Basic Info State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [baseCompareAtPrice, setBaseCompareAtPrice] = useState<number | ''>('');
  const [baseStock, setBaseStock] = useState<number | ''>(10);
  const [isProductActive, setIsProductActive] = useState(true);

  // Edit Mode Specific State
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [rawDbVariants, setRawDbVariants] = useState<ProductVariant[]>([]);
  const [deletedDbIds, setDeletedDbIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Status & UI Modals
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [galleryPickerRowIdx, setGalleryPickerRowIdx] = useState<number | null>(null);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);

  // Sub-hooks
  const categoriesHook = useProductCategories();
  const mediaHook = useProductMedia();
  const matrixHook = useVariantMatrix();

  // TanStack Query Hooks (Server State & Mutations)
  const productDetailQuery = useMerchantProductDetailQuery(mode === 'edit' ? productId : undefined);
  const saveMutation = useSaveProductStudioMutation();
  const deleteMutation = useDeleteProductMutation();

  const isLoadingProduct = mode === 'edit' && productDetailQuery.isLoading;
  const isSubmitting = saveMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // Gatekeeper: Redirect unapproved stores
  useEffect(() => {
    if (!isAuthLoading && store && store.approveStatus !== 'approved') {
      router.replace('/merchant/pending-approval');
    }
  }, [store, isAuthLoading, router]);

  // Hydrate local form state when product data is fetched via TanStack Query
  useEffect(() => {
    if (mode !== 'edit' || !productDetailQuery.data) return;

    const prod = productDetailQuery.data;
    setProduct(prod);
    setTitle(prod.title || (prod as any).name || '');
    setDescription(prod.description || '');

    const catId =
      typeof prod.categoryId === 'object' && prod.categoryId !== null
        ? prod.categoryId._id
        : prod.categoryId;
    if (catId) {
      categoriesHook.setCategoryId(catId);
    }

    setIsProductActive(prod.isActive !== false);

    const loadedImages = Array.isArray(prod.images) ? prod.images : [];
    mediaHook.setImages(loadedImages);

    const loadedVariants: ProductVariant[] = (prod as any).variants || [];
    setRawDbVariants(loadedVariants);

    // Derive active options and rows
    const collectedOptionKeys = new Set<string>();
    const collectedValues: Record<string, Set<string>> = {};

    const initialRows: VariantRowState[] = loadedVariants.map((v: ProductVariant) => {
      const vAttrs = v.attributes || {};
      Object.entries(vAttrs).forEach(([k, val]) => {
        collectedOptionKeys.add(k);
        if (!collectedValues[k]) collectedValues[k] = new Set();
        if (val) collectedValues[k].add(String(val).trim());
      });

      const vStatus =
        ((v as any).status as 'active' | 'inActive') ||
        (v.isActive !== false ? 'active' : 'inActive');

      return {
        id: String(v._id),
        dbId: String(v._id),
        attributes: vAttrs,
        price: v.price !== undefined ? v.price : '',
        compareAtPrice: (v as any).compareAtPrice !== undefined ? (v as any).compareAtPrice : '',
        stock: v.stock !== undefined ? v.stock : 10,
        sku: v.sku || '',
        status: vStatus,
        isEnabled: vStatus === 'active',
        image: v.images && v.images.length > 0 ? v.images[0] : (v as any).image,
      };
    });

    const parsedValues: Record<string, string[]> = {};
    Object.entries(collectedValues).forEach(([k, set]) => {
      parsedValues[k] = Array.from(set);
    });

    matrixHook.setActiveOptionKeys(Array.from(collectedOptionKeys));
    matrixHook.setSelectedAttributeValues(parsedValues);
    matrixHook.setVariantsRows(initialRows);

    if (loadedVariants.length > 0) {
      setBasePrice(loadedVariants[0].price !== undefined ? loadedVariants[0].price : '');
      setBaseStock(loadedVariants[0].stock !== undefined ? loadedVariants[0].stock : 10);
    } else {
      const fallbackPrice = (prod as any).price !== undefined ? (prod as any).price : prod.minPrice;
      setBasePrice(fallbackPrice !== undefined ? fallbackPrice : '');
      setBaseStock(prod.totalStock !== undefined ? prod.totalStock : 10);
    }
  }, [mode, productDetailQuery.data]);

  // When category changes, prompt if options are present
  const handleCategoryChange = (newCatId: string) => {
    if (matrixHook.activeOptionKeys.length > 0) {
      const confirmReset = window.confirm(
        'تغيير القسم سيؤدي إلى مسح الخيارات والأصناف المحددة حالياً لتتوافق مع القسم الجديد. هل تريد المتابعة؟'
      );
      if (!confirmReset) return;
      matrixHook.resetMatrix();
    }
    categoriesHook.setCategoryId(newCatId);
  };

  const hasOptions = matrixHook.activeOptionKeys.length > 0;
  const hasVariantsUnderTheHood = matrixHook.variantsRows.length > 0;

  // Attributes from the category that haven't been added yet
  const availableUnusedAttributes = useMemo(() => {
    return categoriesHook.categoryAttributes.filter((catAttr) => {
      const key = getAttributeKey(catAttr);
      return !matrixHook.activeOptionKeys.includes(key);
    });
  }, [categoriesHook.categoryAttributes, matrixHook.activeOptionKeys]);

  // Remove a variant row (track DB id for deletion in edit mode)
  const handleRemoveVariantRow = useCallback(
    (index: number) => {
      const row = matrixHook.variantsRows[index];
      if (row && row.dbId) {
        setDeletedDbIds((prev) => [...prev, row.dbId!]);
      }
      matrixHook.handleRemoveVariantRow(index);
    },
    [matrixHook]
  );

  // Deterministic Dirty State Calculation
  const isDirty = useMemo(() => {
    if (mode === 'create') {
      return (
        title.trim() !== '' ||
        description.trim() !== '' ||
        mediaHook.images.length > 0 ||
        matrixHook.activeOptionKeys.length > 0 ||
        matrixHook.variantsRows.length > 0 ||
        basePrice !== '' ||
        baseStock !== 10
      );
    }

    if (!product) return false;

    // Check basic info
    const initialTitle = product.title || (product as any).name || '';
    if (title.trim() !== initialTitle.trim()) return true;

    const initialDesc = product.description || '';
    if (description.trim() !== initialDesc.trim()) return true;

    const initialCatId =
      typeof product.categoryId === 'object' && product.categoryId !== null
        ? product.categoryId._id
        : product.categoryId;
    if (categoriesHook.categoryId !== initialCatId) return true;

    if (isProductActive !== (product.isActive !== false)) return true;

    // Check images
    const initialImages = Array.isArray(product.images) ? product.images : [];
    if (mediaHook.images.length !== initialImages.length) return true;
    for (let i = 0; i < mediaHook.images.length; i++) {
      if (mediaHook.images[i] !== initialImages[i]) return true;
    }
    if (mediaHook.imageFiles.length > 0) return true;

    // Check variants count
    if (deletedDbIds.length > 0) return true;
    if (matrixHook.variantsRows.length !== rawDbVariants.length) return true;

    // Check simple product price & stock
    if (matrixHook.variantsRows.length === 0) {
      if (rawDbVariants.length > 0) {
        const v = rawDbVariants[0];
        if (Number(basePrice) !== Number(v.price)) return true;
        if (Number(baseStock) !== Number(v.stock)) return true;
      } else {
        const fallbackPrice = (product as any).price ?? product.minPrice ?? 0;
        if (Number(basePrice) !== Number(fallbackPrice)) return true;
        if (Number(baseStock) !== Number(product.totalStock || 0)) return true;
      }
      return false;
    }

    // Check rows diff against DB variants
    for (const row of matrixHook.variantsRows) {
      if (!row.dbId) return true; // newly added row

      const originalVar = rawDbVariants.find((v) => String(v._id) === String(row.dbId));
      if (!originalVar) return true;

      if (Number(row.price) !== Number(originalVar.price)) return true;
      if (Number(row.stock) !== Number(originalVar.stock)) return true;

      const rowStatus = row.status === 'inActive' ? 'inActive' : 'active';
      const origStatus =
        ((originalVar as any).status as 'active' | 'inActive') ||
        (originalVar.isActive !== false ? 'active' : 'inActive');
      if (rowStatus !== origStatus) return true;

      const origImg =
        originalVar.images && originalVar.images.length > 0
          ? originalVar.images[0]
          : (originalVar as any).image;
      if ((row.image || undefined) !== (origImg || undefined)) return true;
    }

    return false;
  }, [
    mode,
    title,
    description,
    categoriesHook.categoryId,
    isProductActive,
    mediaHook.images,
    mediaHook.imageFiles,
    basePrice,
    baseStock,
    deletedDbIds,
    matrixHook.activeOptionKeys,
    matrixHook.variantsRows,
    product,
    rawDbVariants,
  ]);

  // Keys required when adding a single variant manually
  const singleVariantRequiredKeys = useMemo(() => {
    if (matrixHook.activeOptionKeys.length > 0) {
      return matrixHook.activeOptionKeys;
    }
    return categoriesHook.categoryAttributes.map((a) => getAttributeKey(a));
  }, [matrixHook.activeOptionKeys, categoriesHook.categoryAttributes]);

  // Master Save Handler using TanStack Query useSaveProductStudioMutation
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('يرجى إدخال اسم الصنف أولاً.');
      toast.error('اسم الصنف مطلوب', 'يرجى إدخال اسم واضح للصنف قبل المتابعة.');
      return;
    }

    if (!categoriesHook.categoryId) {
      setErrorMessage('يرجى اختيار قسم الصنف.');
      toast.error('القسم مطلوب', 'اختر قسماً من القائمة يطابق نوع الصنف.');
      return;
    }

    if (mediaHook.images.length === 0) {
      setErrorMessage('يرجى إضافة صورة واحدة على الأقل للصنف (الغلاف).');
      toast.error('الصورة مطلوبة', 'أضف صورة واحدة على الأقل كغلاف للصنف.');
      return;
    }

    // Validation for simple product
    if (matrixHook.variantsRows.length === 0) {
      if (basePrice === '' || Number(basePrice) <= 0) {
        setErrorMessage('يرجى إدخال سعر بيع صحيح أكبر من 0.');
        toast.error('السعر غير صالح', 'يجب أن يكون سعر البيع أكبر من صفر شيكل.');
        return;
      }
      if (baseStock === '' || Number(baseStock) < 0) {
        setErrorMessage('يرجى إدخال كمية مخزون صحيحة (0 أو أكثر).');
        toast.error('المخزون غير صالح', 'حدد كمية المخزون المتوفرة.');
        return;
      }
    } else {
      // Validation for variants table
      for (const row of matrixHook.variantsRows) {
        if (row.price === '' || Number(row.price) <= 0) {
          const label = Object.entries(row.attributes)
            .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
            .join(' / ');
          const msg = `يرجى تحديد سعر بيع صحيح للصنف (${label}).`;
          setErrorMessage(msg);
          toast.error('خطأ في السعر', msg);
          return;
        }
        if (row.stock === '' || Number(row.stock) < 0) {
          const label = Object.entries(row.attributes)
            .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
            .join(' / ');
          const msg = `يرجى تحديد كمية مخزون صحيحة للصنف (${label}).`;
          setErrorMessage(msg);
          toast.error('خطأ في المخزون', msg);
          return;
        }
      }
    }

    try {
      await saveMutation.mutateAsync({
        mode,
        productId,
        cleanTitle,
        description: description.trim(),
        categoryId: categoriesHook.categoryId,
        hasOptions,
        basePrice,
        baseCompareAtPrice,
        baseStock,
        isProductActive,
        images: mediaHook.images,
        imageFiles: mediaHook.imageFiles,
        variantsRows: matrixHook.variantsRows,
        rawDbVariants,
        deletedDbIds,
        product,
      });

      toast.trust(
        mode === 'create' ? 'تم بنجاح' : 'تم الحفظ',
        mode === 'create'
          ? `تم حفظ ونشر الصنف «${cleanTitle}» بنجاح.`
          : 'تم حفظ وتحديث الصنف وكافة توليفاته بنجاح.'
      );
      router.push('/merchant/dashboard');
    } catch (err: any) {
      console.error('Error saving product via mutation:', err);
      const msg = err.message || 'حدث خطأ أثناء حفظ الصنف، يرجى المحاولة لاحقاً';
      setErrorMessage(msg);
      toast.error('فشل الحفظ', msg);
    }
  };

  // Delete Product Handler using TanStack Query useDeleteProductMutation
  const handleDeleteProduct = async () => {
    if (!productId) return;
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(productId);
      toast.trust('تم الحذف', 'تم حذف الصنف من الكتالوج بنجاح.');
      router.push('/merchant/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء محاولة حذف الصنف');
    } finally {
      setShowDeleteModal(false);
    }
  };

  return {
    mode,
    productId,
    isLoadingProduct,
    product,
    title,
    setTitle,
    description,
    setDescription,
    basePrice,
    setBasePrice,
    baseCompareAtPrice,
    setBaseCompareAtPrice,
    baseStock,
    setBaseStock,
    isProductActive,
    setIsProductActive,
    categories: categoriesHook.categories,
    isLoadingCategories: categoriesHook.isLoadingCategories,
    categoryId: categoriesHook.categoryId,
    handleCategoryChange,
    activeCategory: categoriesHook.activeCategory,
    categoryAttributes: categoriesHook.categoryAttributes,
    categorySupportsVariants: categoriesHook.categorySupportsVariants,
    availableUnusedAttributes,
    hasOptions,
    hasVariantsUnderTheHood,
    images: mediaHook.images,
    isUploadingImages: mediaHook.isUploadingImages,
    fileInputRef: mediaHook.fileInputRef,
    handleFilesSelected: mediaHook.handleFilesSelected,
    handleRemoveImage: mediaHook.handleRemoveImage,
    matrix: matrixHook,
    handleRemoveVariantRow,
    singleVariantRequiredKeys,
    galleryPickerRowIdx,
    setGalleryPickerRowIdx,
    showAddSingleModal,
    setShowAddSingleModal,
    isDirty,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    handleSave,
    handleDeleteProduct,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
  };
}
