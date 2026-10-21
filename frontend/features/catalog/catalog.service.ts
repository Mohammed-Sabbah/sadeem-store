import { getRequest } from '@/shared/lib/coreApi';
import type { Product, Store } from '@/types';
import { getAttributeKey, getAttributeDisplayName } from '@/shared/lib/attributeUtils';

export interface ApiCategory {
  _id: string;
  title: string;
  slug: string;
  variantAttributes: { name: string; values: string[] }[];
}

export interface ApiVariant {
  _id: string;
  sku?: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  status?: 'active' | 'inActive';
  approveStatus?: 'pending' | 'approved' | 'rejected';
  isDeleted?: boolean;
  images?: string[];
  image?: string;
}

export interface ApiProduct {
  _id: string;
  title: string;
  name?: string;
  description: string;
  image: string;
  images?: string[];
  options?: {
    key?: string;
    name: string;
    label?: string;
    type?: string;
    values: string[];
    unit?: string | null;
  }[];
  categoryId: string | {
    _id: string;
    title: string;
    slug: string;
    icon?: string;
    variantAttributes?: { name: string; values: string[] }[];
  };
  storeId: string | {
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    address?: { governorate?: string; city?: string; detailedAddress?: string };
  };
  isAnonymousVendor?: boolean;
  isFeatured?: boolean;
  status?: 'active' | 'inActive';
  approveStatus?: 'pending' | 'approved' | 'rejected';
  variants?: ApiVariant[];
  createdAt?: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
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
  colorImageMap: Record<string, string>;
  isSimple: boolean;
  stock: number;
}

export interface CatalogStore extends Store {
  id: string;
}

const DEFAULT_CATALOG_PRODUCT_IMAGE = '/placeholder_product.svg';
const DEFAULT_CATALOG_STORE_IMAGE = '/canaan_store_fashion_cover.jpg';

export function mapCatalogProduct(product: ApiProduct): CatalogProduct | null {
  if (!product || !product._id) return null;

  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  const validVariants = rawVariants.filter((v) => !v.isDeleted);

  const resolvedImage =
    (product.image && product.image.trim()) ||
    product.images?.find((img) => img && img.trim()) ||
    DEFAULT_CATALOG_PRODUCT_IMAGE;

  const fallbackVariant: ApiVariant = {
    _id: product._id,
    price: (product as any).price || (product as any).minPrice || 0,
    compareAtPrice: (product as any).compareAtPrice || null,
    stock: (product as any).totalStock ?? (product as any).stock ?? 10,
    attributes: {},
    images: (product.images && product.images.length > 0) ? product.images : [resolvedImage],
  };

  const variants = validVariants.length > 0 ? validVariants : [fallbackVariant];
  const available = variants.find((v) => (Number(v.stock) || 0) > 0) || variants[0];

  // 1. Build complete Gallery
  const gallerySet = new Set<string>();
  if (resolvedImage && resolvedImage !== DEFAULT_CATALOG_PRODUCT_IMAGE) {
    gallerySet.add(resolvedImage);
  }
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (img && img.trim()) gallerySet.add(img.trim());
    });
  }
  variants.forEach((v) => {
    const hasColor = Boolean(v.attributes?.['اللون'] || v.attributes?.['color']);
    if (!hasColor) return;
    if (Array.isArray(v.images)) {
      v.images.forEach((img) => {
        if (img && img.trim()) gallerySet.add(img.trim());
      });
    } else if (v.image && v.image.trim()) {
      gallerySet.add(v.image.trim());
    }
  });
  const gallery = gallerySet.size > 0 ? Array.from(gallerySet) : [DEFAULT_CATALOG_PRODUCT_IMAGE];

  // 2. Build color-to-image map
  const colorImageMap: Record<string, string> = {};
  variants.forEach((v) => {
    const colorVal = v.attributes?.['اللون'] || v.attributes?.['color'];
    const vImg = v.images?.[0] || v.image;
    if (colorVal && vImg && !colorImageMap[colorVal]) {
      colorImageMap[colorVal] = vImg;
    }
  });

  // 3. Derive variant definitions
  let definitions: { name: string; values: string[] }[] = [];

  if (Array.isArray(product.options) && product.options.length > 0) {
    definitions = product.options
      .filter((o) => o.values && o.values.length > 0)
      .map((o) => {
        const rawName = o.name || o.label || o.key || '';
        return {
          key: getAttributeKey(o.key || rawName),
          name: getAttributeDisplayName(rawName),
          values: o.values,
        };
      });
  }

  if (definitions.length === 0) {
    const attrMap: Record<string, { key: string; name: string; values: Set<string> }> = {};
    variants.forEach((v) => {
      if (v.attributes && typeof v.attributes === 'object') {
        Object.entries(v.attributes).forEach(([k, val]) => {
          if (k && val && String(val).trim()) {
            const attrKey = getAttributeKey(k);
            if (!attrMap[attrKey]) {
              attrMap[attrKey] = {
                key: attrKey,
                name: getAttributeDisplayName(k),
                values: new Set(),
              };
            }
            attrMap[attrKey].values.add(String(val).trim());
          }
        });
      }
    });

    definitions = Object.values(attrMap).map((item) => ({
      key: item.key,
      name: item.name,
      values: Array.from(item.values),
    }));
  }

  const isSimple = definitions.length === 0;

  const category = typeof product.categoryId === 'object' ? product.categoryId : null;
  const store = typeof product.storeId === 'object' ? product.storeId : null;

  const price = available.price || (product as any).minPrice || 0;
  const compareAtPrice = available.compareAtPrice ?? (product as any).compareAtPrice ?? null;
  const originalPrice = compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined;
  const discountAmount = originalPrice ? Math.round(originalPrice - price) : undefined;
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  return {
    id: product._id,
    title: product.title || product.name || '',
    price,
    originalPrice,
    discountAmount,
    currency: '₪',
    image: resolvedImage,
    gallery,
    vendor: {
      id: store?._id || (typeof product.storeId === 'string' ? product.storeId : ''),
      name: product.isAnonymousVendor ? 'توريد مباشر وموثق عبر سَدِيم' : (store?.name || 'متجر معتمد في سَدِيم'),
      city: product.isAnonymousVendor ? 'المحافظة الوسطى' : (store?.address?.city || 'المحافظة الوسطى'),
      verified: true,
    },
    category: category?.title || '',
    categoryId: category?._id || (typeof product.categoryId === 'string' ? product.categoryId : ''),
    categoryTitle: category?.title || '',
    inStock: totalStock > 0 || variants.some((v) => (Number(v.stock) || 0) > 0),
    stock: totalStock,
    description: product.description || '',
    variantId: available._id,
    variantAttributes: available.attributes || {},
    variants,
    variantDefinitions: definitions,
    colorImageMap,
    isSimple,
    isAnonymousVendor: Boolean(product.isAnonymousVendor),
    rating: (product as any).ratingsAverage || 5.0,
    reviewsCount: (product as any).ratingsQuantity || 142,
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
