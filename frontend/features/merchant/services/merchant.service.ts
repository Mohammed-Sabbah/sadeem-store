import { getRequest, postRequest, patchRequest, deleteRequest } from '@/shared/lib/coreApi';
import type {
  StoreProfile,
  ProductItem,
  ProductVariant,
  ProductOption,
  ProductFormData,
  MerchantMetrics,
} from '../types/merchant.types';

/**
 * خدمة التاجر المركزية - سَدِيم (Sadeem Merchant Service)
 * متصلة حصراً ومباشرة بقاعدة البيانات عبر Backend REST APIs
 * دون أي بيانات وهمية (Mock Data) أو تخزين مؤقت محلي (localStorage)
 */
export const merchantService = {
  /**
   * جلب بيانات المتجر وحالة القبول / الاعتماد للتاجر المسجل حالياً
   */
  async getStoreProfile(): Promise<{ success: boolean; data: StoreProfile | null; message?: string }> {
    try {
      const res = await getRequest<{ store: StoreProfile }>('/api/stores/me');
      if (res.success && res.data?.store) {
        return { success: true, data: res.data.store };
      }
      return { success: false, data: null, message: res.message || 'لم يتم العثور على متجر مسجل' };
    } catch (err: any) {
      return { success: false, data: null, message: err?.message || 'تعذر الاتصال ببيانات المتجر' };
    }
  },

  /**
   * تبديل جاهزية المتجر (نشط يستقبل الطلبيات / مغلق مؤقتاً)
   */
  async toggleStoreStatus(status: 'active' | 'inActive'): Promise<{ success: boolean; data?: StoreProfile; message?: string }> {
    try {
      const res = await patchRequest<{ store: StoreProfile }>('/api/stores/me/status', { status });
      if (res.success && res.data?.store) {
        return { success: true, data: res.data.store };
      }
      return { success: false, message: res.message || 'تعذر تغيير حالة المتجر' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء الاتصال بالخادم' };
    }
  },

  /**
   * دالة مساعدة لتحديث حالة الاعتماد محلياً (مخصصة لاختبارات واجهة التطوير)
   */
  updateLocalStoreApproval(status: 'pending' | 'approved' | 'rejected'): StoreProfile | null {
    return null;
  },

  /**
   * جلب كافة منتجات متجر التاجر المسجل من قاعدة البيانات
   */
  async getMyProducts(): Promise<{ success: boolean; data: ProductItem[]; message?: string }> {
    try {
      const res = await getRequest<{ products: any[] }>('/api/products/seller');
      if (res.success && Array.isArray(res.data?.products)) {
        const prods: ProductItem[] = res.data.products.map((p) => {
          const variants: ProductVariant[] = (p.variants || []).map((v: any) => ({
            _id: v._id,
            productId: v.productId,
            storeId: v.storeId,
            sku: v.sku,
            attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {}),
            attrKey: v.attrKey || 'default',
            price: Number(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            stock: Number(v.stock) || 0,
            isActive: v.isActive !== undefined ? v.isActive : true,
            images: v.images || (v.image ? [v.image] : []),
          }));

          const activeV = variants.filter((v) => v.isActive !== false);
          const pool = activeV.length > 0 ? activeV : variants;
          const prices = pool.map((v) => v.price).filter((pr) => pr > 0);

          return {
            ...p,
            name: p.title || p.name || 'بدون عنوان',
            title: p.title || p.name || 'بدون عنوان',
            images: p.images || (p.image ? [p.image] : []),
            variants,
            variantsCount: variants.length,
            minPrice: prices.length > 0 ? Math.min(...prices) : (p.minPrice || 0),
            maxPrice: prices.length > 0 ? Math.max(...prices) : (p.maxPrice || 0),
            totalStock: p.totalStock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0),
            inStock: (p.totalStock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0)) > 0,
          };
        });
        return { success: true, data: prods };
      }
      return { success: false, data: [], message: res.message || 'تعذر جلب المنتجات' };
    } catch (err: any) {
      return { success: false, data: [], message: err?.message || 'خطأ في جلب منتجات المتجر' };
    }
  },

  /**
   * إنشاء منتج جديد مع متغيراته وحفظه مباشرة في قاعدة البيانات
   */
  async createProduct(formData: ProductFormData): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
    const rawVariants = formData.isSimple
      ? [
          {
            sku: formData.simpleSku?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
            attributes: {},
            price: Number(formData.simplePrice) || 0,
            stock: Math.max(0, Math.floor(Number(formData.simpleStock) || 0)),
            compareAtPrice: formData.simpleCompareAtPrice ? Number(formData.simpleCompareAtPrice) : null,
            images: formData.images || [],
            image: formData.images?.[0] || '',
            isActive: true,
          },
        ]
      : formData.variants.map((v, idx) => {
          const item: any = {
            sku: v.sku?.trim() || `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`,
            attributes: v.attributes || {},
            price: Number(v.price) || 0,
            stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            isActive: v.isActive !== undefined ? v.isActive : true,
          };
          if (v.images && v.images.length > 0) item.images = v.images;
          if (v.image) item.image = v.image;
          return item;
        });

    const payload = {
      title: formData.name.trim(),
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      description: formData.description?.trim() || '',
      images: formData.images,
      image: formData.images?.[0] || '',
      options: formData.isSimple
        ? []
        : (formData.options || []).map((opt) => ({
            key: opt.key || (opt.name ? opt.name.toLowerCase().trim() : 'opt'),
            source: opt.source || 'DEFINED',
            label: opt.label || opt.name,
            name: opt.name || opt.label || opt.key,
            type: opt.type || 'TEXT',
            unit: opt.unit && String(opt.unit).trim() ? String(opt.unit).trim() : null,
            values: Array.isArray(opt.values) ? opt.values : [],
          })),
      isFeatured: Boolean(formData.isFeatured),
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      isAnonymousVendor: Boolean(formData.isAnonymousVendor),
      variants: rawVariants,
    };

    try {
      const res = await postRequest<{ product: any; message?: string }>('/api/products', payload);
      if (res.success && res.data?.product) {
        const p = res.data.product;
        const variants: ProductVariant[] = (p.variants || []).map((v: any) => ({
          _id: v._id,
          productId: v.productId,
          storeId: v.storeId,
          sku: v.sku,
          attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {}),
          attrKey: v.attrKey || 'default',
          price: Number(v.price) || 0,
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          stock: Number(v.stock) || 0,
          isActive: v.isActive !== undefined ? v.isActive : true,
          images: v.images || (v.image ? [v.image] : []),
        }));

        const prod: ProductItem = {
          ...p,
          name: p.title || p.name,
          title: p.title || p.name,
          images: p.images || (p.image ? [p.image] : []),
          variants,
          variantsCount: variants.length,
          totalStock: p.totalStock ?? variants.reduce((s, v) => s + (v.stock || 0), 0),
          inStock: (p.totalStock ?? variants.reduce((s, v) => s + (v.stock || 0), 0)) > 0,
        };
        return { success: true, data: prod, message: res.data.message || res.message || 'تم حفظ ونشر المنتج بنجاح' };
      }
      return { success: false, message: res.message || 'فشلت عملية إنشاء المنتج' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء الاتصال بالخادم لإنشاء المنتج' };
    }
  },

  /**
   * تبديل تفعيل ظهور المنتج للزبائن
   */
  async toggleProduct(productId: string, currentActive: boolean): Promise<{ success: boolean; message?: string }> {
    const nextState = !currentActive;
    try {
      const res = await patchRequest(`/api/products/${productId}/status`, {
        isActive: nextState,
        status: nextState ? 'active' : 'inActive',
      });
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تغيير حالة المنتج' };
    }
  },

  /**
   * تحديث سريع للمخزون (Micro-stepper) مباشرة من بطاقة المنتج دون فتح نماذج
   */
  async quickUpdateStock(
    productId: string,
    newStock: number,
    variantId?: string
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    const cleanStock = Math.max(0, Math.floor(Number(newStock) || 0));
    try {
      if (variantId && /^[0-9a-fA-F]{24}$/.test(variantId)) {
        const res = await patchRequest(`/api/products/${productId}/variants/${variantId}`, { stock: cleanStock });
        return { success: res.success, data: res.data, message: res.message };
      } else {
        const res = await patchRequest(`/api/products/${productId}`, { stock: cleanStock });
        return { success: res.success, data: res.data, message: res.message };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث المخزون' };
    }
  },

  /**
   * حذف منتج من قاعدة البيانات (Soft Delete)
   */
  async deleteProduct(productId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await deleteRequest(`/api/products/${productId}`);
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حذف المنتج' };
    }
  },

  /**
   * جلب تفاصيل منتج محدد مع أصنافه ومتغيراته
   */
  async getProductById(productId: string): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
    try {
      let res = await getRequest<{ product: any }>(`/api/products/seller/${productId}`);
      if (!res.success || !res.data?.product) {
        res = await getRequest<{ product: any }>(`/api/products/${productId}`);
      }

      if (res.success && res.data?.product) {
        const prod = res.data.product;
        const variants: ProductVariant[] = (prod.variants || []).map((v: any) => ({
          _id: v._id,
          productId: v.productId,
          storeId: v.storeId,
          sku: v.sku,
          attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {}),
          attrKey: v.attrKey || 'default',
          price: Number(v.price) || 0,
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          stock: Number(v.stock) || 0,
          isActive: v.isActive !== undefined ? v.isActive : true,
          images: v.images || (v.image ? [v.image] : []),
        }));

        const activeV = variants.filter((v) => v.isActive !== false);
        const pool = activeV.length > 0 ? activeV : variants;
        const prices = pool.map((v) => v.price).filter((pr) => pr > 0);

        const mapped: ProductItem = {
          _id: prod._id,
          storeId: typeof prod.storeId === 'object' ? prod.storeId._id : prod.storeId,
          categoryId: prod.categoryId,
          categoryTitle: typeof prod.categoryId === 'object' ? prod.categoryId.title : undefined,
          name: prod.title || prod.name || '',
          title: prod.title || prod.name || '',
          slug: prod.slug,
          description: prod.description || '',
          images: prod.images || (prod.image ? [prod.image] : []),
          options: (prod.options || []).map((o: any) => ({
            key: o.key,
            source: o.source,
            label: o.label || o.name,
            name: o.name || o.label || o.key,
            type: o.type,
            unit: o.unit,
            values: o.values || [],
          })),
          minPrice: prices.length > 0 ? Math.min(...prices) : (prod.minPrice || 0),
          maxPrice: prices.length > 0 ? Math.max(...prices) : (prod.maxPrice || 0),
          inStock: prod.inStock || false,
          isFeatured: prod.isFeatured || false,
          isActive: prod.isActive !== undefined ? prod.isActive : true,
          isAnonymousVendor: prod.isAnonymousVendor || false,
          variants,
          variantsCount: variants.length,
          totalStock: prod.totalStock ?? variants.reduce((s: number, v: any) => s + (v.stock || 0), 0),
          createdAt: prod.createdAt || new Date().toISOString(),
          updatedAt: prod.updatedAt,
        };
        return { success: true, data: mapped };
      }
      return { success: false, message: res.message || 'المنتج غير موجود' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ في جلب بيانات المنتج' };
    }
  },

  /**
   * تحديث تفاصيل منتج وأصنافه في قاعدة البيانات
   */
  async updateProduct(
    productId: string,
    formData: Partial<ProductFormData>
  ): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
    try {
      const cleanVariants = formData.variants?.map((v) => {
        const item: any = {
          sku: v.sku,
          attributes: v.attributes || {},
          price: Number(v.price) || 0,
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
          isActive: v.isActive !== undefined ? v.isActive : true,
          images: v.images || [],
        };
        if (v._id && /^[0-9a-fA-F]{24}$/.test(v._id)) {
          item._id = v._id;
        }
        return item;
      });

      const payload: any = {};
      if (formData.name || formData.title) payload.title = formData.name || formData.title;
      if (formData.description !== undefined) payload.description = formData.description;
      if (formData.categoryId !== undefined) payload.categoryId = formData.categoryId;
      if (formData.images !== undefined) payload.images = formData.images;
      if (formData.isFeatured !== undefined) payload.isFeatured = formData.isFeatured;
      if (formData.isActive !== undefined) payload.isActive = formData.isActive;
      if (formData.isAnonymousVendor !== undefined) payload.isAnonymousVendor = formData.isAnonymousVendor;

      if (formData.options !== undefined) {
        payload.options = formData.options.map((opt) => ({
          key: opt.key || opt.name.toLowerCase().trim(),
          source: opt.source || 'DEFINED',
          label: opt.label || opt.name,
          type: opt.type || 'TEXT',
          unit: opt.unit || null,
          values: opt.values,
        }));
      }

      if (cleanVariants !== undefined) {
        payload.variants = cleanVariants;
      }

      const res = await patchRequest<{ product: any; message?: string }>(`/api/products/${productId}`, payload);
      if (res.success && res.data?.product) {
        const prod = res.data.product;
        const variants: ProductVariant[] = (prod.variants || []).map((v: any) => ({
          _id: v._id,
          productId: v.productId,
          storeId: v.storeId,
          sku: v.sku,
          attributes: v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {}),
          attrKey: v.attrKey || 'default',
          price: Number(v.price) || 0,
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          stock: Number(v.stock) || 0,
          isActive: v.isActive !== undefined ? v.isActive : true,
          images: v.images || (v.image ? [v.image] : []),
        }));

        const activeV = variants.filter((v) => v.isActive !== false);
        const pool = activeV.length > 0 ? activeV : variants;
        const prices = pool.map((v) => v.price).filter((p) => p > 0);

        const mapped: ProductItem = {
          _id: prod._id,
          storeId: typeof prod.storeId === 'object' ? prod.storeId._id : prod.storeId,
          categoryId: prod.categoryId,
          categoryTitle: typeof prod.categoryId === 'object' ? prod.categoryId.title : undefined,
          name: prod.title || prod.name,
          title: prod.title || prod.name,
          slug: prod.slug,
          description: prod.description || '',
          images: prod.images || (prod.image ? [prod.image] : []),
          options: prod.options || [],
          minPrice: prices.length > 0 ? Math.min(...prices) : (prod.minPrice || 0),
          maxPrice: prices.length > 0 ? Math.max(...prices) : (prod.maxPrice || 0),
          inStock: prod.inStock || false,
          isFeatured: prod.isFeatured || false,
          isActive: prod.isActive !== undefined ? prod.isActive : true,
          isAnonymousVendor: formData.isAnonymousVendor !== undefined ? formData.isAnonymousVendor : (prod.isAnonymousVendor || false),
          variants,
          variantsCount: variants.length,
          totalStock: prod.totalStock ?? variants.reduce((s: number, v: any) => s + (v.stock || 0), 0),
          createdAt: prod.createdAt || new Date().toISOString(),
          updatedAt: prod.updatedAt,
        };

        return { success: true, data: mapped, message: res.data?.message || res.message || 'تم تحديث المنتج وحفظ التغييرات بنجاح' };
      }
      return { success: false, message: res.message || 'تعذر تحديث المنتج' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء الاتصال بالخادم لتحديث المنتج' };
    }
  },

  /**
   * جلب تعريفات الخيارات العامة والوحدات المتاحة من الباك إند
   */
  async fetchOptionDefinitions(): Promise<{
    success: boolean;
    data?: { definitions: any[]; availableUnits: any[] };
    message?: string;
  }> {
    try {
      const res = await getRequest<any>('/api/options');
      if (res.success && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'تعذر جلب خيارات الفئات' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ في جلب خيارات الفئات' };
    }
  },

  /**
   * جلب الخيارات المصرحة لتصنيف محدد
   */
  async fetchOptionsByCategory(categoryId: string): Promise<{
    success: boolean;
    data?: { allowedKeys?: string[]; definitions: any[]; availableUnits: any[] };
    message?: string;
  }> {
    try {
      const res = await getRequest<any>(`/api/options/category/${categoryId}`);
      if (res.success && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'تعذر جلب خيارات القسم' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ في جلب خيارات القسم' };
    }
  },

  /**
   * حساب ملخص الإحصائيات الحية لمتجر التاجر
   */
  calculateMetrics(products: ProductItem[]): MerchantMetrics {
    const total = products.length;
    const inStock = products.filter((p) => p.inStock && (p.totalStock ?? 0) > 0).length;
    const outOfStock = products.filter((p) => !p.inStock || (p.totalStock ?? 0) === 0).length;
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
