import { getRequest } from '@/shared/lib/coreApi';
import type { Product, Store } from '@/types';

export interface ApiCategory {
  _id: string;
  title: string;
  slug: string;
  variantAttributes: { name: string; values: string[] }[];
}

export interface ApiVariant {
  _id: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  status: 'active' | 'inActive';
  approveStatus: 'pending' | 'approved' | 'rejected';
  isDeleted?: boolean;
}

export interface ApiProduct {
  _id: string;
  title: string;
  description: string;
  image: string;
  images?: string[];
  categoryId: string | { _id: string; title: string; slug: string; variantAttributes?: { name: string; values: string[] }[] };
  storeId: string | {
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    address?: { governorate?: string; city?: string; detailedAddress?: string };
  };
  status: 'active' | 'inActive';
  approveStatus: 'pending' | 'approved' | 'rejected';
  variants: ApiVariant[];
  createdAt: string;
}

export interface ApiStore {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  address?: { governorate?: string; city?: string; detailedAddress?: string };
}

export interface CatalogProduct extends Product {
  categoryId: string;
  categoryTitle: string;
  variants: ApiVariant[];
  variantDefinitions: { name: string; values: string[] }[];
}

export interface CatalogStore extends Store {
  id: string;
}

function isPublicVariant(variant: ApiVariant): boolean {
  return variant.status === 'active' && variant.approveStatus === 'approved' && !variant.isDeleted;
}

const DEFAULT_CATALOG_PRODUCT_IMAGE = '/canaan_product_hoodie_olive.jpg';
const DEFAULT_CATALOG_STORE_IMAGE = '/canaan_store_fashion_cover.jpg';

export function mapCatalogProduct(product: ApiProduct): CatalogProduct | null {
  const variants = product.variants.filter(isPublicVariant);
  if (variants.length === 0) return null;
  const category = typeof product.categoryId === 'object' ? product.categoryId : null;
  const store = typeof product.storeId === 'object' ? product.storeId : null;
  const available = variants.find((variant) => variant.stock > 0) || variants[0];
  const attributes = category?.variantAttributes || [];
  const resolvedImage =
    (product.image && product.image.trim()) ||
    product.images?.find((img) => img && img.trim()) ||
    DEFAULT_CATALOG_PRODUCT_IMAGE;

  return {
    id: product._id,
    title: product.title,
    price: available.price,
    currency: '₪',
    image: resolvedImage,
    vendor: {
      id: store?._id || (typeof product.storeId === 'string' ? product.storeId : ''),
      name: store?.name || 'متجر معتمد في سَدِيم',
      city: store?.address?.city || 'المحافظة الوسطى',
      verified: Boolean(store),
    },
    category: category?.title || '',
    categoryId: category?._id || (typeof product.categoryId === 'string' ? product.categoryId : ''),
    categoryTitle: category?.title || '',
    inStock: variants.some((variant) => variant.stock > 0),
    description: product.description,
    variantId: available._id,
    variantAttributes: available.attributes,
    variants,
    variantDefinitions: attributes,
    createdAt: product.createdAt,
  };
}

function mapCatalogStore(store: ApiStore): CatalogStore {
  return {
    id: store._id,
    name: store.name,
    city: store.address?.city || 'المحافظة الوسطى',
    address: store.address?.detailedAddress || '',
    verified: true,
    image: (store.logo && store.logo.trim()) || DEFAULT_CATALOG_STORE_IMAGE,
    description: store.description || '',
    deliveryBadge: 'طرد موحد 8 ₪',
  };
}

async function requestData<T>(path: string): Promise<T> {
  const response = await getRequest<T>(path);
  if (!response.success || response.data === undefined || response.data === null) {
    throw new Error(response.message || 'تعذر تحميل البيانات');
  }
  return response.data;
}

export const catalogService = {
  async getProducts(params: { storeId?: string; categoryId?: string; excludeId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.storeId) query.set('storeId', params.storeId);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const data = await requestData<{ products: ApiProduct[] }>(`/api/products${suffix}`);
    return data.products
      .filter((product) => product._id !== params.excludeId)
      .map(mapCatalogProduct)
      .filter((product): product is CatalogProduct => product !== null);
  },

  async getProduct(productId: string) {
    const data = await requestData<{ product: ApiProduct }>(`/api/products/${productId}`);
    const product = mapCatalogProduct(data.product);
    if (!product) throw new Error('المنتج غير متاح حالياً');
    return product;
  },

  async getStore(storeId: string) {
    const data = await requestData<{ store: ApiStore }>(`/api/stores/${storeId}`);
    return mapCatalogStore(data.store);
  },

  async getCategories() {
    const data = await requestData<{ categories: ApiCategory[] }>('/api/categories');
    return data.categories;
  },
};
