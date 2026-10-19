'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantKeys } from './merchant.keys';
import { merchantService } from '../services/merchant.service';
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
