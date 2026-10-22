import {
  deleteRequest,
  getRequest,
  patchRequest,
  postRequest,
} from '@/shared/lib/coreApi';

export interface VariantAttributeItem {
  key?: string;
  name: string;
  values?: string[];
  type?: string;
}

export interface SellerVariant {
  _id: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  status: 'active' | 'inActive';
  approveStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface SellerProduct {
  _id: string;
  title: string;
  description: string;
  image: string;
  categoryId: string | {
    _id: string;
    title: string;
    slug: string;
    variantAttributes: VariantAttributeItem[];
  };
  status: 'active' | 'inActive';
  approveStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  variants: SellerVariant[];
}

export interface SellerCategory {
  _id: string;
  title: string;
  variantAttributes: VariantAttributeItem[];
}

async function unwrap<T>(promise: Promise<{
  success: boolean;
  data?: T;
  message?: string;
}>): Promise<T> {
  const response = await promise;
  if (!response.success || !response.data) {
    throw new Error(response.message || 'تعذر تنفيذ الطلب');
  }
  return response.data;
}

export const sellerProductService = {
  async getProduct(productId: string): Promise<SellerProduct> {
    const result = await unwrap(getRequest<{ products: SellerProduct[] }>('/api/products/seller'));
    const product = result.products.find((item) => item._id === productId);
    if (!product) throw new Error('المنتج غير موجود');
    return product;
  },

  getCategories() {
    return unwrap(getRequest<{ categories: SellerCategory[] }>('/api/categories'))
      .then((result) => result.categories);
  },

  updateProduct(productId: string, values: Partial<Pick<SellerProduct, 'title' | 'description' | 'image' | 'categoryId' | 'status'>>) {
    return unwrap(patchRequest<{ product: SellerProduct }>(`/api/products/${productId}`, values))
      .then((result) => result.product);
  },

  updateVariant(productId: string, variantId: string, values: Partial<Pick<SellerVariant, 'attributes' | 'price' | 'stock' | 'status'>>) {
    return unwrap(patchRequest<{ product: SellerProduct }>(
      `/api/products/${productId}/variants/${variantId}`,
      values
    )).then((result) => result.product);
  },

  createVariant(productId: string, values: Pick<SellerVariant, 'attributes' | 'price' | 'stock'>) {
    return unwrap(postRequest<{ product: SellerProduct }>(
      `/api/products/${productId}/variants`,
      values
    )).then((result) => result.product);
  },

  deleteVariant(productId: string, variantId: string) {
    return unwrap(deleteRequest<{ product: SellerProduct }>(
      `/api/products/${productId}/variants/${variantId}`
    )).then((result) => result.product);
  },

  deleteProduct(productId: string) {
    return unwrap(deleteRequest<{ message: string }>(`/api/products/${productId}`));
  },
};
