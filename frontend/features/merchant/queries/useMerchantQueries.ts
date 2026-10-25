'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantKeys } from './merchant.keys';
import { merchantService } from '../services/merchant.service';
import type { VariantRowState } from '../types/product-studio.types';
import type {
  ProductItem,
  StoreProfile,
  ProductFormData,
  ProductVariant,
} from '../types/merchant.types';

/**
 * 1. Store Profile Query
 */
export function useMerchantProfileQuery() {
  return useQuery<StoreProfile | null>({
    queryKey: merchantKeys.profile(),
    queryFn: async () => {
      const res = await merchantService.getStoreProfile();
      return res.data || null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * 2. Merchant Products Query
 */
export function useMerchantProductsQuery() {
  return useQuery<ProductItem[]>({
    queryKey: merchantKeys.products(),
    queryFn: async () => {
      const res = await merchantService.getMyProducts();
      return res.data || [];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

/**
 * 3. Single Product Detail Query
 */
export function useMerchantProductDetailQuery(productId: string | undefined | null) {
  return useQuery<ProductItem | null>({
    queryKey: merchantKeys.productDetail(productId || ''),
    queryFn: async () => {
      if (!productId) return null;
      const res = await merchantService.getProductById(productId);
      return res.data || null;
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * 4. Toggle Product Active Mutation (Optimistic Update)
 */
export function useToggleProductActiveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, currentActive }: { productId: string; currentActive: boolean }) => {
      return merchantService.toggleProduct(productId, currentActive);
    },
    onMutate: async ({ productId, currentActive }) => {
      // Cancel outgoing queries to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: merchantKeys.products() });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<ProductItem[]>(merchantKeys.products());

      // Optimistically update products list
      if (previousProducts) {
        queryClient.setQueryData<ProductItem[]>(
          merchantKeys.products(),
          previousProducts.map((p) =>
            p._id === productId ? { ...p, isActive: !currentActive } : p
          )
        );
      }

      // Also optimistically update single product detail cache if exists
      const previousDetail = queryClient.getQueryData<ProductItem>(merchantKeys.productDetail(productId));
      if (previousDetail) {
        queryClient.setQueryData<ProductItem>(merchantKeys.productDetail(productId), {
          ...previousDetail,
          isActive: !currentActive,
        });
      }

      return { previousProducts, previousDetail, productId };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(merchantKeys.products(), context.previousProducts);
      }
      if (context?.productId && context?.previousDetail) {
        queryClient.setQueryData(merchantKeys.productDetail(context.productId), context.previousDetail);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
    },
  });
}

/**
 * 5. Delete Product Mutation (Instant 0ms Optimistic Removal)
 */
export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      return merchantService.deleteProduct(productId);
    },
    onMutate: async (productId: string) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: merchantKeys.products() });

      // Snapshot previous products
      const previousProducts = queryClient.getQueryData<ProductItem[]>(merchantKeys.products());

      // Optimistically remove from list immediately (0ms feedback)
      if (previousProducts) {
        queryClient.setQueryData<ProductItem[]>(
          merchantKeys.products(),
          previousProducts.filter((p) => p._id !== productId)
        );
      }

      return { previousProducts, productId };
    },
    onError: (_err, _productId, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(merchantKeys.products(), context.previousProducts);
      }
    },
    onSettled: (_data, _err, productId) => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
      queryClient.removeQueries({ queryKey: merchantKeys.productDetail(productId) });
    },
  });
}

/**
 * 6. Quick Stock Update Mutation (Optimistic Update)
 */
export function useQuickStockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      newStock,
      variantId,
    }: {
      productId: string;
      newStock: number;
      variantId?: string;
    }) => {
      return merchantService.quickUpdateStock(productId, newStock, variantId);
    },
    onMutate: async ({ productId, newStock, variantId }) => {
      await queryClient.cancelQueries({ queryKey: merchantKeys.products() });
      const previousProducts = queryClient.getQueryData<ProductItem[]>(merchantKeys.products());
      const clampedStock = Math.max(0, newStock);

      if (previousProducts) {
        queryClient.setQueryData<ProductItem[]>(
          merchantKeys.products(),
          previousProducts.map((p) => {
            if (p._id !== productId) return p;

            if (variantId && p.variants && p.variants.length > 0) {
              const updatedVariants = p.variants.map((v) =>
                v._id === variantId ? { ...v, stock: clampedStock } : v
              );
              const newTotalStock = updatedVariants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
              return {
                ...p,
                variants: updatedVariants,
                totalStock: newTotalStock,
                inStock: newTotalStock > 0,
              };
            }

            return {
              ...p,
              totalStock: clampedStock,
              inStock: clampedStock > 0,
            };
          })
        );
      }

      return { previousProducts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(merchantKeys.products(), context.previousProducts);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
    },
  });
}

/**
 * 7. Create Product Mutation
 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ProductFormData) => {
      return merchantService.createProduct(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
    },
  });
}

/**
 * 8. Update Product Mutation
 */
export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: Partial<ProductFormData> }) => {
      return merchantService.updateProduct(productId, data);
    },
    onSuccess: (res, { productId }) => {
      if (res.data) {
        queryClient.setQueryData(merchantKeys.productDetail(productId), res.data);
      }
      void queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
      void queryClient.invalidateQueries({ queryKey: merchantKeys.productDetail(productId) });
    },
  });
}


/**
 * 9. Save Product Studio Mutation (Orchestrated Multi-Step Pipeline)
 */
export interface SaveProductStudioPayload {
  mode: 'create' | 'edit';
  productId?: string;
  cleanTitle: string;
  description: string;
  categoryId?: string;
  hasOptions: boolean;
  basePrice: number | '';
  baseCompareAtPrice: number | '';
  baseStock: number | '';
  isProductActive: boolean;
  images: string[];
  imageFiles: File[];
  variantsRows: VariantRowState[];
  rawDbVariants?: ProductVariant[];
  deletedDbIds?: string[];
  product?: ProductItem | null;
}

export function useSaveProductStudioMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveProductStudioPayload) => {
      const {
        mode,
        productId,
        cleanTitle,
        description,
        categoryId,
        hasOptions,
        basePrice,
        baseCompareAtPrice,
        baseStock,
        isProductActive,
        images,
        imageFiles,
        variantsRows,
        rawDbVariants = [],
        deletedDbIds = [],
        product,
      } = payload;

      const existingKeptUrls = images.filter(
        (u) =>
          typeof u === 'string' &&
          (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
      );

      if (mode === 'create') {
        const isSimple = variantsRows.length === 0;

        const hasActiveVariant = variantsRows.some(
          (r) => (r.status ? r.status === 'active' : r.isEnabled !== false)
        );
        const targetProductActive =
          variantsRows.length > 0 ? hasActiveVariant && isProductActive : isProductActive;

        const createPayload: any = {
          name: cleanTitle,
          title: cleanTitle,
          description: description.trim(),
          categoryId,
          isSimple,
          simplePrice: isSimple ? (Number(basePrice) || 0) : undefined,
          simpleStock: isSimple ? (Number(baseStock) || 0) : undefined,
          price: isSimple
            ? (Number(basePrice) || 0)
            : (variantsRows[0]?.price !== '' ? Number(variantsRows[0].price) : 0),
          totalStock: isSimple
            ? (Number(baseStock) || 0)
            : variantsRows.reduce((sum, r) => sum + (Number(r.stock) || 0), 0),
          variants: isSimple
            ? undefined
            : variantsRows.map((r) => {
                const rowActive = r.status ? r.status === 'active' : r.isEnabled !== false;
                return {
                  attributes: r.attributes,
                  price: Number(r.price),
                  compareAtPrice:
                    r.compareAtPrice !== '' && r.compareAtPrice !== undefined
                      ? Number(r.compareAtPrice)
                      : undefined,
                  stock: Number(r.stock) || 0,
                  sku: r.sku || undefined,
                  status: rowActive ? ('active' as const) : ('inActive' as const),
                  image: r.image || undefined,
                };
              }),
          images: existingKeptUrls,
          existingImages: existingKeptUrls,
          imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
          status: targetProductActive ? 'active' : 'inActive',
        };

        const createRes = await merchantService.createProduct(createPayload);
        if (!createRes.success || !createRes.data) {
          throw new Error(createRes.message || 'فشل إنشاء الصنف');
        }

        return { productId: createRes.data._id, title: cleanTitle };
      } else {
        // mode === 'edit'
        if (!productId) {
          throw new Error('معرف الصنف مفقود');
        }

        const hasActiveVariant = variantsRows.some((r) => r.status === 'active');
        const targetProductActive =
          variantsRows.length > 0 ? hasActiveVariant && isProductActive : isProductActive;

        const productStatus: 'active' | 'inActive' | undefined =
          product && product.isActive !== targetProductActive
            ? targetProductActive
              ? 'active'
              : 'inActive'
            : undefined;

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
          throw new Error(baseRes.message || 'فشل تحديث البيانات الأساسية للصنف');
        }

        // Variants Batch Sync
        if (variantsRows.length === 0) {
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
                .filter((id) => !variantsRows.some((r) => String(r.dbId) === id)),
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

          for (const row of variantsRows) {
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

        return { productId, title: cleanTitle };
      }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: merchantKeys.products() });
      void queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
      if (result.productId) {
        void queryClient.invalidateQueries({ queryKey: merchantKeys.productDetail(result.productId) });
      }
    },
  });
}
