import { getRequest, postRequest, putRequest, patchRequest, deleteRequest } from '@/shared/lib/coreApi';
import type { StoreProfile, ProductItem, ProductFormData, MerchantMetrics } from '../types/merchant.types';

const LOCAL_PRODUCTS_KEY = 'sadeem_merchant_mock_products_v1';
const LOCAL_STORE_KEY = 'sadeem_merchant_mock_store_v1';

// Sample fallback store in Central Gaza
const DEFAULT_FALLBACK_STORE: StoreProfile = {
  _id: 'store_central_01',
  name: 'خياطة وأقمشة الأصالة',
  categoryId: 'cat_clothing',
  categoryName: 'أزياء وملبوسات',
  address: {
    governorate: 'central',
    city: 'deir_albalah',
    detailedAddress: 'شارع الشهداء، قرب مسجد النور، دير البلح',
    coordinates: { lat: 31.4185, lng: 34.3514 },
  },
  phoneNumber: '0599123456',
  approveStatus: 'approved',
  status: 'active',
  balance: 380,
};

// Initial realistic products with variants for Central Gaza merchant
const INITIAL_DEMO_PRODUCTS: ProductItem[] = [
  {
    _id: 'prod_001',
    storeId: 'store_central_01',
    categoryId: 'cat_clothing',
    categoryTitle: 'أزياء وملبوسات',
    name: 'قميص كتان بيج طبيعي مقلم',
    slug: 'natural-linen-striped-shirt',
    description: 'قميص رجالي مصمم من قماش الكتان الطبيعي الفاخر، مريح في درجات الحرارة المرتفعة مع تفصيل خياطة يدوي متين.',
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80'],
    options: [
      { name: 'اللون', values: ['بيج طبيعي', 'أبيض سحابي', 'كحلي ناعم'] },
      { name: 'المقاس', values: ['M', 'L', 'XL'] },
    ],
    minPrice: 55,
    maxPrice: 65,
    inStock: true,
    isFeatured: true,
    isActive: true,
    variantsCount: 9,
    totalStock: 34,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    variants: [
      { sku: 'SHIRT-BEG-M', attributes: { 'اللون': 'بيج طبيعي', 'المقاس': 'M' }, attrKey: 'اللون:بيج طبيعي|المقاس:M', price: 55, stock: 6, isActive: true },
      { sku: 'SHIRT-BEG-L', attributes: { 'اللون': 'بيج طبيعي', 'المقاس': 'L' }, attrKey: 'اللون:بيج طبيعي|المقاس:L', price: 55, stock: 8, isActive: true },
      { sku: 'SHIRT-BEG-XL', attributes: { 'اللون': 'بيج طبيعي', 'المقاس': 'XL' }, attrKey: 'اللون:بيج طبيعي|المقاس:XL', price: 60, stock: 4, isActive: true },
      { sku: 'SHIRT-WHT-M', attributes: { 'اللون': 'أبيض سحابي', 'المقاس': 'M' }, attrKey: 'اللون:أبيض سحابي|المقاس:M', price: 55, stock: 5, isActive: true },
      { sku: 'SHIRT-WHT-L', attributes: { 'اللون': 'أبيض سحابي', 'المقاس': 'L' }, attrKey: 'اللون:أبيض سحابي|المقاس:L', price: 55, stock: 7, isActive: true },
      { sku: 'SHIRT-WHT-XL', attributes: { 'اللون': 'أبيض سحابي', 'المقاس': 'XL' }, attrKey: 'اللون:أبيض سحابي|المقاس:XL', price: 60, stock: 0, isActive: true },
      { sku: 'SHIRT-NAV-M', attributes: { 'اللون': 'كحلي ناعم', 'المقاس': 'M' }, attrKey: 'اللون:كحلي ناعم|المقاس:M', price: 60, stock: 2, isActive: true },
      { sku: 'SHIRT-NAV-L', attributes: { 'اللون': 'كحلي ناعم', 'المقاس': 'L' }, attrKey: 'اللون:كحلي ناعم|المقاس:L', price: 60, stock: 2, isActive: true },
      { sku: 'SHIRT-NAV-XL', attributes: { 'اللون': 'كحلي ناعم', 'المقاس': 'XL' }, attrKey: 'اللون:كحلي ناعم|المقاس:XL', price: 65, stock: 0, isActive: true },
    ],
  },
  {
    _id: 'prod_002',
    storeId: 'store_central_01',
    categoryId: 'cat_clothing',
    categoryTitle: 'أزياء وملبوسات',
    name: 'سروال قطني واسع بقصة مريحة',
    slug: 'wide-cotton-comfort-pants',
    description: 'سروال قطني خفيف بخصر مطاطي وجيوب عميقة، خامة قطنية نقية 100% تدوم وتتحمل الاستخدام اليومي.',
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=80'],
    options: [
      { name: 'المقاس', values: ['30', '32', '34'] },
    ],
    minPrice: 40,
    maxPrice: 40,
    inStock: true,
    isFeatured: false,
    isActive: true,
    variantsCount: 3,
    totalStock: 18,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    variants: [
      { sku: 'PNT-30', attributes: { 'المقاس': '30' }, attrKey: 'المقاس:30', price: 40, stock: 5, isActive: true },
      { sku: 'PNT-32', attributes: { 'المقاس': '32' }, attrKey: 'المقاس:32', price: 40, stock: 8, isActive: true },
      { sku: 'PNT-34', attributes: { 'المقاس': '34' }, attrKey: 'المقاس:34', price: 40, stock: 5, isActive: true },
    ],
  },
  {
    _id: 'prod_003',
    storeId: 'store_central_01',
    categoryId: 'cat_clothing',
    categoryTitle: 'أزياء وملبوسات',
    name: 'شال حريري معتق بنقوش سديمية',
    slug: 'nebula-silk-vintage-scarf',
    description: 'منتج بسيط مفرد: شال حرير ناعم ومطرز يدوياً بحواف منتهية بدقة عالية، مناسب للهدايا والمناسبات.',
    images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=700&q=80'],
    options: [],
    minPrice: 35,
    maxPrice: 35,
    inStock: false,
    isFeatured: false,
    isActive: true,
    variantsCount: 1,
    totalStock: 0,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    variants: [
      { sku: 'SCARF-SLK-01', attributes: {}, attrKey: 'default', price: 35, stock: 0, isActive: true },
    ],
  },
];

function getLocalProducts(): ProductItem[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_PRODUCTS;
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(INITIAL_DEMO_PRODUCTS));
      return INITIAL_DEMO_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_PRODUCTS;
  }
}

function saveLocalProducts(list: ProductItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed saving products to localStorage', err);
  }
}

function getLocalStore(): StoreProfile {
  if (typeof window === 'undefined') return DEFAULT_FALLBACK_STORE;
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(DEFAULT_FALLBACK_STORE));
      return DEFAULT_FALLBACK_STORE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FALLBACK_STORE;
  }
}

function saveLocalStore(store: StoreProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed saving store to localStorage', err);
  }
}

export const merchantService = {
  /**
   * جلب بيانات المتجر وحالة القبول / الاعتماد
   */
  async getStoreProfile(): Promise<{ success: boolean; data: StoreProfile }> {
    try {
      const res = await getRequest<{ store: StoreProfile }>('/api/stores/me');
      if (res.success && res.data?.store) {
        return { success: true, data: res.data.store };
      }
    } catch {
      // Backend route pending or offline fallback
    }
    return { success: true, data: getLocalStore() };
  },

  /**
   * تحديث حالة المتجر المحلية (للمحاكاة والفحص المباشر)
   */
  updateLocalStoreApproval(status: 'pending' | 'approved' | 'rejected'): StoreProfile {
    const store = getLocalStore();
    store.approveStatus = status;
    saveLocalStore(store);
    return store;
  },

  /**
   * تبديل جاهزية المتجر (يستقبل الطلبيات / مغلق مؤقتاً)
   */
  async toggleStoreStatus(status: 'active' | 'inActive'): Promise<{ success: boolean; data?: StoreProfile }> {
    try {
      const res = await patchRequest<{ store: StoreProfile }>('/api/stores/me/status', { status });
      if (res.success && res.data?.store) {
        saveLocalStore(res.data.store);
        return { success: true, data: res.data.store };
      }
    } catch {
      // Offline fallback handling below
    }

    const current = getLocalStore();
    current.status = status;
    saveLocalStore(current);
    return { success: true, data: current };
  },

  /**
   * جلب كافة منتجات متجر التاجر الحالي
   */
  async getMyProducts(): Promise<{ success: boolean; data: ProductItem[] }> {
    try {
      const res = await getRequest<{ products: any[] }>('/api/products/merchant/my-products');
      if (res.success && res.data?.products) {
        const normalized = res.data.products.map((p) => ({
          ...p,
          name: p.title || p.name || 'بدون عنوان',
        }));
        return { success: true, data: normalized };
      }
    } catch {
      // Fallback during frontend-first dev
    }
    return { success: true, data: getLocalProducts() };
  },

  /**
   * إنشاء منتج جديد مع متغيراته واحتساب الملخص
   */
  async createProduct(formData: ProductFormData): Promise<{ success: boolean; data: ProductItem; message?: string }> {
    const payload = {
      title: formData.name,
      name: formData.name,
      categoryId: formData.categoryId,
      description: formData.description,
      images: formData.images,
      options: formData.isSimple ? [] : formData.options,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      variants: formData.isSimple
        ? [
            {
              price: Number(formData.simplePrice) || 0,
              stock: Number(formData.simpleStock) || 0,
              sku: formData.simpleSku || '',
              compareAtPrice: formData.simpleCompareAtPrice,
              attributes: {},
            },
          ]
        : formData.variants.map((v) => ({
            ...v,
            price: Number(v.price) || 0,
            stock: Number(v.stock) || 0,
          })),
    };

    try {
      const res = await postRequest<{ product: any }>('/api/products', payload);
      if (res.success && res.data?.product) {
        const prod = {
          ...res.data.product,
          name: res.data.product.title || res.data.product.name,
        };
        const current = getLocalProducts();
        saveLocalProducts([prod, ...current]);
        return { success: true, data: prod, message: res.message };
      }
    } catch {
      // Offline fallback handling below
    }

    // Build ProductItem locally
    const current = getLocalProducts();
    const isSimple = formData.isSimple;

    let variants: any[] = [];
    let minPrice = 0;
    let maxPrice = 0;
    let totalStock = 0;

    if (isSimple) {
      const price = Number(formData.simplePrice) || 0;
      const stock = Number(formData.simpleStock) || 0;
      minPrice = price;
      maxPrice = price;
      totalStock = stock;
      variants = [
        {
          sku: formData.simpleSku || `SKU-${Date.now().toString().slice(-5)}`,
          attributes: {},
          attrKey: 'default',
          price,
          compareAtPrice: formData.simpleCompareAtPrice,
          stock,
          isActive: true,
        },
      ];
    } else {
      variants = formData.variants.map((v, idx) => ({
        ...v,
        sku: v.sku || `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`,
      }));
      const activePrices = variants.filter((v) => v.isActive).map((v) => v.price);
      minPrice = activePrices.length ? Math.min(...activePrices) : 0;
      maxPrice = activePrices.length ? Math.max(...activePrices) : 0;
      totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    const newProduct: ProductItem = {
      _id: `prod_${Date.now()}`,
      storeId: 'store_central_01',
      categoryId: formData.categoryId || 'cat_general',
      name: formData.name,
      slug: encodeURIComponent(formData.name.trim().replace(/\s+/g, '-')),
      description: formData.description,
      images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80'],
      options: isSimple ? [] : formData.options,
      minPrice,
      maxPrice,
      inStock: totalStock > 0,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      variantsCount: variants.length,
      totalStock,
      variants,
      createdAt: new Date().toISOString(),
    };

    saveLocalProducts([newProduct, ...current]);
    return { success: true, data: newProduct, message: 'تم حفظ ونشر المنتج بنجاح' };
  },

  /**
   * تبديل تفعيل المنتج
   */
  async toggleProduct(productId: string, currentActive: boolean): Promise<{ success: boolean; data?: any }> {
    const nextState = !currentActive;
    try {
      const res = await patchRequest(`/api/products/${productId}/toggle`, { isActive: nextState });
      if (res.success) {
        // sync local
        const current = getLocalProducts().map((p) => (p._id === productId ? { ...p, isActive: nextState } : p));
        saveLocalProducts(current);
        return { success: true };
      }
    } catch {
      // offline fallback
    }

    const current = getLocalProducts().map((p) => (p._id === productId ? { ...p, isActive: nextState } : p));
    saveLocalProducts(current);
    return { success: true };
  },

  /**
   * تحديث سريع للمخزون (Micro-stepper) مباشرة من بطاقة المنتج دون فتح نماذج
   */
  async quickUpdateStock(
    productId: string,
    newStock: number,
    variantId?: string
  ): Promise<{ success: boolean; data?: ProductItem }> {
    const currentProducts = getLocalProducts();
    const cleanStock = Math.max(0, Number(newStock) || 0);

    const updatedProducts = currentProducts.map((p) => {
      if (p._id !== productId) return p;

      if (variantId && p.variants && p.variants.length > 0) {
        const updatedVariants = p.variants.map((v) =>
          v._id === variantId || v.sku === variantId ? { ...v, stock: cleanStock } : v
        );
        const newTotal = updatedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        return {
          ...p,
          variants: updatedVariants,
          totalStock: newTotal,
          inStock: newTotal > 0,
        };
      }

      // Simple product
      const updatedVariants = (p.variants || []).map((v) => ({ ...v, stock: cleanStock }));
      return {
        ...p,
        totalStock: cleanStock,
        inStock: cleanStock > 0,
        variants: updatedVariants.length > 0 ? updatedVariants : p.variants,
      };
    });

    saveLocalProducts(updatedProducts);
    const updatedProd = updatedProducts.find((p) => p._id === productId);

    try {
      const payload: any = {};
      if (variantId) {
        payload.variants = [{ _id: variantId, stock: cleanStock }];
      } else {
        payload.totalStock = cleanStock;
      }
      await patchRequest(`/api/products/${productId}`, payload);
    } catch {
      // offline fallback is already saved
    }

    return { success: true, data: updatedProd };
  },

  /**
   * حذف منتج
   */
  async deleteProduct(productId: string): Promise<{ success: boolean }> {
    try {
      const res = await deleteRequest(`/api/products/${productId}`);
      if (res.success) {
        const current = getLocalProducts().filter((p) => p._id !== productId);
        saveLocalProducts(current);
        return { success: true };
      }
    } catch {
      // offline fallback
    }

    const current = getLocalProducts().filter((p) => p._id !== productId);
    saveLocalProducts(current);
    return { success: true };
  },

  /**
   * حساب ملخص الإحصائيات الحية للمتجر
   */
  calculateMetrics(products: ProductItem[]): MerchantMetrics {
    const total = products.length;
    const inStock = products.filter((p) => p.inStock && p.totalStock! > 0).length;
    const outOfStock = products.filter((p) => !p.inStock || p.totalStock === 0).length;
    const active = products.filter((p) => p.isActive).length;
    const totalUnits = products.reduce((acc, p) => acc + (p.totalStock || 0), 0);

    return {
      totalProducts: total,
      inStockProducts: inStock,
      outOfStockProducts: outOfStock,
      totalInventoryUnits: totalUnits,
      activeProducts: active,
    };
  },
};
