'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { merchantKeys } from '../queries/merchant.keys';
import { useMerchantContext } from '../context/MerchantContext';
import { merchantService } from '../services/merchant.service';
import type { ProductItem, ProductVariant } from '../types/merchant.types';
import type { ProductEditorMode, VariantRowState } from '../types/product-studio.types';
import { useProductCategories } from './useProductCategories';
import { useProductMedia } from './useProductMedia';
import { useVariantMatrix } from './useVariantMatrix';
import { useToast } from '@/components/ui/toast';
import { getAttributeKey, getAttributeDisplayName } from '@/shared/lib/attributeUtils';

interface UseProductEditorOptions {
  mode: ProductEditorMode;
  productId?: string;
}

export function useProductEditor({ mode, productId }: UseProductEditorOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [isLoadingProduct, setIsLoadingProduct] = useState(mode === 'edit');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Status & UI Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [galleryPickerRowIdx, setGalleryPickerRowIdx] = useState<number | null>(null);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);

  // Sub-hooks
  const categoriesHook = useProductCategories();
  const mediaHook = useProductMedia();
  const matrixHook = useVariantMatrix();

  // Gatekeeper: Redirect unapproved stores
  useEffect(() => {
    if (!isAuthLoading && store && store.approveStatus !== 'approved') {
      router.replace('/merchant/pending-approval');
    }
  }, [store, isAuthLoading, router]);

  // Load existing product if in Edit mode
  useEffect(() => {
    if (mode !== 'edit' || !productId) return;

    let isMounted = true;
    setIsLoadingProduct(true);

    merchantService
      .getProductById(productId)
      .then((prodRes) => {
        if (!isMounted) return;

        const prod = prodRes.data;
        if (!prod) {
          setErrorMessage('تعذر العثور على بيانات المنتج.');
          return;
        }

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
            price: Number(v.price) || 0,
            stock: Number(v.stock) || 0,
            sku: v.sku || '',
            status: vStatus,
            isEnabled: vStatus === 'active',
            image: (v.images && v.images[0]) || (v as any).image || undefined,
          };
        });

        // Set simple product price/stock defaults if <= 1 variant
        if (initialRows.length <= 1) {
          const first = initialRows[0];
          if (first) {
            setBasePrice(first.price);
            setBaseStock(first.stock);
          }
        }

        matrixHook.setActiveOptionKeys(Array.from(collectedOptionKeys));
        const normalizedValues: Record<string, string[]> = {};
        Object.entries(collectedValues).forEach(([k, setVals]) => {
          normalizedValues[k] = Array.from(setVals);
        });
        matrixHook.setSelectedAttributeValues(normalizedValues);
        matrixHook.setVariantsRows(initialRows);
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
        if (isMounted) setErrorMessage('حدث خطأ أثناء تحميل بيانات المنتج');
      })
      .finally(() => {
        if (isMounted) setIsLoadingProduct(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, productId]);

  // Derived state
  const availableUnusedAttributes = useMemo(() => {
    return categoriesHook.categoryAttributes.filter(
      (attr) => !matrixHook.activeOptionKeys.includes(getAttributeKey(attr))
    );
  }, [categoriesHook.categoryAttributes, matrixHook.activeOptionKeys]);

  const hasOptions = matrixHook.activeOptionKeys.length > 0 || matrixHook.variantsRows.length > 0;

  const hasVariantsUnderTheHood = useMemo(() => {
    const hasValuesSelected = Object.keys(matrixHook.selectedAttributeValues).some(
      (k) => matrixHook.selectedAttributeValues[k] && matrixHook.selectedAttributeValues[k].length > 0
    );
    const enabledCount = matrixHook.variantsRows.filter(
      (r) => (r.status ? r.status === 'active' : r.isEnabled !== false)
    ).length;
    return matrixHook.activeOptionKeys.length > 0 && hasValuesSelected && enabledCount > 0;
  }, [matrixHook.activeOptionKeys, matrixHook.selectedAttributeValues, matrixHook.variantsRows]);

  const singleVariantRequiredKeys = useMemo(() => {
    if (matrixHook.variantsRows.length > 0) {
      return Object.keys(matrixHook.variantsRows[0].attributes);
    }
    if (matrixHook.activeOptionKeys.length > 0) {
      return matrixHook.activeOptionKeys;
    }
    return categoriesHook.categoryAttributes.map((a) => getAttributeKey(a));
  }, [matrixHook.variantsRows, matrixHook.activeOptionKeys, categoriesHook.categoryAttributes]);

  // When Category changes: reset options
  const handleCategoryChange = useCallback(
    (newCatId: string) => {
      categoriesHook.setCategoryId(newCatId);
      matrixHook.resetMatrix();
      setErrorMessage(null);
    },
    [categoriesHook, matrixHook]
  );

  // Remove Variant Row (Tracks deletedDbIds in edit mode)
  const handleRemoveVariantRow = useCallback(
    (idx: number) => {
      const targetRow = matrixHook.variantsRows[idx];
      if (targetRow && targetRow.dbId) {
        setDeletedDbIds((prev) => [...prev, targetRow.dbId!]);
      }
      matrixHook.handleRemoveVariantRow(idx);
    },
    [matrixHook]
  );

  // Calculate if there are pending unsaved changes (isDirty)
  const isDirty = useMemo(() => {
    if (mode === 'create') return true;
    if (!product) return false;

    // 1. Basic fields
    if (title.trim() !== (product.title || '').trim()) return true;
    if (description.trim() !== (product.description || '').trim()) return true;

    const currentCatId =
      typeof product.categoryId === 'object' && product.categoryId !== null
        ? product.categoryId._id
        : product.categoryId;
    if (categoriesHook.categoryId !== (currentCatId || '')) return true;

    if (isProductActive !== (product.isActive !== false)) return true;

    // 2. Images
    if (mediaHook.imageFiles.length > 0) return true;
    const origImages = Array.isArray(product.images) ? product.images : [];
    if (mediaHook.images.length !== origImages.length) return true;
    if (mediaHook.images.some((img, idx) => img !== origImages[idx])) return true;

    // 3. Simple Product Price/Stock check
    if (matrixHook.variantsRows.length === 0 && rawDbVariants.length <= 1) {
      const origVar = rawDbVariants[0];
      if (origVar) {
        if (Number(basePrice) !== Number(origVar.price)) return true;
        if (Number(baseStock) !== Number(origVar.stock)) return true;
      }
    }

    // 4. Variants queue changes
    if (deletedDbIds.length > 0) return true;
    if (matrixHook.variantsRows.some((r) => !r.dbId)) return true;
    if (matrixHook.variantsRows.length !== rawDbVariants.length) return true;

    // 5. Check each variant row for modifications
    for (const row of matrixHook.variantsRows) {
      const orig = rawDbVariants.find((v) => String(v._id) === String(row.dbId));
      if (!orig) return true;

      if (Number(row.price) !== Number(orig.price)) return true;
      if (Number(row.stock) !== Number(orig.stock)) return true;

      const origStatus =
        ((orig as any).status as string) || (orig.isActive !== false ? 'active' : 'inActive');
      if (row.status !== origStatus) return true;

      const origImg = (orig.images && orig.images[0]) || (orig as any).image || '';
      const rowImg = row.image || '';
      if (rowImg !== origImg) return true;
    }

    return false;
  }, [
    mode,
    product,
    title,
    description,
    categoriesHook.categoryId,
    isProductActive,
    mediaHook.imageFiles,
    mediaHook.images,
    basePrice,
    baseStock,
    deletedDbIds,
    matrixHook.variantsRows,
    rawDbVariants,
  ]);

  // Master Save Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      const msg = 'يرجى كتابة اسم الصنف.';
      setErrorMessage(msg);
      toast.error('نقص بيانات', msg);
      return;
    }

    if (mediaHook.images.length === 0) {
      const msg = 'يرجى إضافة صورة واحدة على الأقل للصنف.';
      setErrorMessage(msg);
      toast.error('نقص بيانات', msg);
      return;
    }

    if (matrixHook.variantsRows.length === 0) {
      if (basePrice === '' || Number(basePrice) <= 0) {
        const msg = 'يرجى تحديد سعر بيع صحيح للصنف (أكبر من 0).';
        setErrorMessage(msg);
        toast.error('خطأ في السعر', msg);
        return;
      }
      if (baseStock === '' || Number(baseStock) < 0) {
        const msg = 'يرجى تحديد كمية مخزون صحيحة (0 أو أكثر).';
        setErrorMessage(msg);
        toast.error('خطأ في المخزون', msg);
        return;
      }
    } else {
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

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        // --- CREATE MODE ---
        const existingKeptUrls = mediaHook.images.filter(
          (u) =>
            typeof u === 'string' &&
            (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
        );

        const hasActiveVariant = matrixHook.variantsRows.some(
          (r) => (r.status ? r.status === 'active' : r.isEnabled !== false)
        );
        const targetProductActive =
          matrixHook.variantsRows.length > 0 ? hasActiveVariant && isProductActive : isProductActive;

        const payload: any = {
          name: cleanTitle,
          title: cleanTitle,
          description: description.trim(),
          categoryId: categoriesHook.categoryId,
          price:
            matrixHook.variantsRows.length > 0 && matrixHook.variantsRows[0].price !== ''
              ? Number(matrixHook.variantsRows[0].price)
              : Number(basePrice) || 0,
          compareAtPrice: baseCompareAtPrice !== '' ? Number(baseCompareAtPrice) : undefined,
          totalStock:
            matrixHook.variantsRows.length > 0
              ? matrixHook.variantsRows.reduce((sum, r) => sum + (Number(r.stock) || 0), 0)
              : Number(baseStock) || 0,
          existingImages: existingKeptUrls,
          imageFiles: mediaHook.imageFiles.length > 0 ? mediaHook.imageFiles : undefined,
          status: targetProductActive ? 'active' : 'inActive',
        };

        const createRes = await merchantService.createProduct(payload);
        if (!createRes.success || !createRes.data) {
          throw new Error(createRes.message || 'فشل إنشاء الصنف');
        }

        const createdId = createRes.data._id;

        // Batch create variants if options were defined
        if (matrixHook.variantsRows.length > 0) {
          const variantsPayload = matrixHook.variantsRows.map((r) => {
            const rowActive = r.status ? r.status === 'active' : r.isEnabled !== false;
            return {
              attributes: r.attributes,
              price: Number(r.price),
              compareAtPrice: r.compareAtPrice !== '' && r.compareAtPrice !== undefined ? Number(r.compareAtPrice) : undefined,
              stock: Number(r.stock) || 0,
              sku: r.sku || undefined,
              status: rowActive ? ('active' as const) : ('inActive' as const),
              images: r.image ? [r.image] : undefined,
            };
          });

          await merchantService.batchCreateVariants(createdId, variantsPayload);
        }

        await queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
        await queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
        toast.trust('تم بنجاح', `تم حفظ ونشر الصنف «${cleanTitle}» بنجاح.`);
        router.push('/merchant/dashboard');
      } else if (mode === 'edit' && productId) {
        // --- EDIT MODE ---
        const existingKeptUrls = mediaHook.images.filter(
          (u) =>
            typeof u === 'string' &&
            (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
        );

        const hasActiveVariant = matrixHook.variantsRows.some((r) => r.status === 'active');
        const targetProductActive =
          matrixHook.variantsRows.length > 0 ? hasActiveVariant && isProductActive : isProductActive;

        const productStatus: 'active' | 'inActive' | undefined =
          product && product.isActive !== targetProductActive
            ? targetProductActive ? 'active' : 'inActive'
            : undefined;

        const baseUpdatePayload = {
          title: cleanTitle,
          name: cleanTitle,
          description: description.trim(),
          categoryId: hasOptions ? undefined : categoriesHook.categoryId,
          images: existingKeptUrls,
          existingImages: existingKeptUrls,
          imageFiles: mediaHook.imageFiles.length > 0 ? mediaHook.imageFiles : undefined,
          status: productStatus,
        };

        const baseRes = await merchantService.updateProductBase(productId, baseUpdatePayload);
        if (!baseRes.success) {
          throw new Error(baseRes.message || 'فشل تحديث البيانات الأساسية للصنف');
        }

        // Variants Batch Sync
        if (matrixHook.variantsRows.length === 0) {
          // Simple product sync
          const defaultVar = rawDbVariants[0];
          if (defaultVar && defaultVar._id) {
            const keptId = String(defaultVar._id);
            const extraIds = Array.from(
              new Set([
                ...rawDbVariants.slice(1).map((v) => String(v._id)),
                ...deletedDbIds.filter((id) => String(id) !== keptId),
              ])
            );

            await merchantService.batchUpdateVariants(productId, [
              {
                variantId: keptId,
                price: Number(basePrice) || 0,
                stock: Number(baseStock) || 0,
                status: targetProductActive ? 'active' : 'inActive',
              },
            ]);

            if (extraIds.length > 0) {
              await merchantService.batchDeleteVariants(productId, extraIds);
            }
          }
        } else {
          // Multi-variant batch sync
          const toDeleteIds = Array.from(
            new Set([
              ...deletedDbIds,
              ...rawDbVariants
                .map((v) => String(v._id))
                .filter((id) => !matrixHook.variantsRows.some((r) => String(r.dbId) === id)),
            ])
          );

          if (toDeleteIds.length > 0) {
            await merchantService.batchDeleteVariants(productId, toDeleteIds);
          }

          const toUpdateList: Array<{
            variantId: string;
            price?: number;
            stock?: number;
            status?: 'active' | 'inActive';
            attributes?: Record<string, string>;
            image?: string;
          }> = [];
          const toCreateList: any[] = [];

          for (const row of matrixHook.variantsRows) {
            const variantStatus = row.status === 'inActive' ? ('inActive' as const) : ('active' as const);

            if (row.dbId) {
              toUpdateList.push({
                variantId: row.dbId,
                attributes: row.attributes,
                price: Number(row.price),
                stock: Number(row.stock),
                status: variantStatus,
                image: row.image,
              });
            } else {
              toCreateList.push({
                attributes: row.attributes,
                price: Number(row.price),
                stock: Number(row.stock),
                status: variantStatus,
                images: row.image ? [row.image] : undefined,
              });
            }
          }

          if (toUpdateList.length > 0) {
            await merchantService.batchUpdateVariants(productId, toUpdateList);
          }

          if (toCreateList.length > 0) {
            await merchantService.batchCreateVariants(productId, toCreateList);
          }
        }

        await queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
        await queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
        toast.trust('تم الحفظ', 'تم حفظ وتحديث الصنف وكافة توليفاته بنجاح.');
        router.push('/merchant/dashboard');
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      const msg = err.message || 'حدث خطأ أثناء حفظ الصنف، يرجى المحاولة لاحقاً';
      setErrorMessage(msg);
      toast.error('فشل الحفظ', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product Handler (for edit mode)
  const handleDeleteProduct = async () => {
    if (!productId) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await merchantService.deleteProduct(productId);
      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
        await queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
        toast.trust('تم الحذف', 'تم حذف الصنف من الكتالوج بنجاح.');
        router.push('/merchant/dashboard');
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
    handleSave,
    handleDeleteProduct,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
  };
}
