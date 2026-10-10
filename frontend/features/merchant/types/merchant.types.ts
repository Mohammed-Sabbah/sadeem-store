export type StoreApproveStatus = 'pending' | 'approved' | 'rejected';
export type StoreStatus = 'active' | 'inActive';

export interface StoreAddress {
  governorate: string;
  city: string;
  detailedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface StoreProfile {
  _id: string;
  name: string;
  categoryId: string | { _id: string; title: string; slug: string };
  categoryName?: string;
  address: StoreAddress;
  phoneNumber?: string;
  approveStatus: StoreApproveStatus;
  status: StoreStatus;
  balance?: number;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductOption {
  name: string; // e.g. "اللون", "المقاس"
  values: string[]; // e.g. ["أسود", "بيج"], ["S", "M", "L"]
}

export interface ProductVariant {
  _id?: string;
  productId?: string;
  sku: string;
  attributes: Record<string, string>; // e.g. { "اللون": "أسود", "المقاس": "L" }
  attrKey: string; // e.g. "اللون:أسود|المقاس:L" or "default"
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  image?: string;
}

export interface ProductItem {
  _id: string;
  storeId: string;
  categoryId: string | { _id: string; title: string; slug?: string };
  categoryTitle?: string;
  name: string;
  slug?: string;
  description?: string;
  images: string[];
  options: ProductOption[];
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isDeleted?: boolean;
  variants?: ProductVariant[];
  variantsCount?: number;
  totalStock?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  images: string[];
  isSimple: boolean;
  simplePrice: number;
  simpleCompareAtPrice?: number;
  simpleStock: number;
  simpleSku: string;
  options: ProductOption[];
  variants: Array<{
    attributes: Record<string, string>;
    attrKey: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    isActive: boolean;
  }>;
  isFeatured: boolean;
  isActive: boolean;
}

export interface MerchantMetrics {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  totalInventoryUnits: number;
  activeProducts: number;
}
