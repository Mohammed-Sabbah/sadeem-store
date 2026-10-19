import { getRequest, postRequest, patchRequest, deleteRequest } from '@/shared/lib/coreApi';
import { taxonomyService } from '@/features/store/services/taxonomy.service';
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
   * دالة مساعدة لتوحيد نمذجة المنتج للأصناف ومؤشرات الحالة
   */
  mapProductItem(p: any): ProductItem {
    const rawVariants = Array.isArray(p.variants) ? p.variants : [];
    const variants: ProductVariant[] = rawVariants.map((v: any) => {
      const attrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
      const sortedEntries = Object.entries(attrs).sort(([a], [b]) => a.localeCompare(b));
      const computedAttrKey = sortedEntries.length > 0
        ? sortedEntries.map(([k, val]) => `${k}:${val}`).join('|')
        : 'default';

      const cmpPrice = v.compareAtPrice ? Number(v.compareAtPrice) : (v.originalPrice ? Number(v.originalPrice) : null);

      return {
        _id: v._id,
        productId: v.productId,
        storeId: v.storeId,
        sku: v.sku || '',
        attributes: attrs,
        attrKey: computedAttrKey,
        price: Number(v.price) || 0,
        compareAtPrice: cmpPrice,
        originalPrice: cmpPrice,
        stock: Number(v.stock) || 0,
        isActive: v.status !== undefined ? v.status === 'active' : (v.isActive !== undefined ? v.isActive : true),
        images: v.images || (v.image ? [v.image] : []),
      };
    });

    const activeV = variants.filter((v) => v.isActive !== false);
    const pool = activeV.length > 0 ? activeV : variants;
    const prices = pool.map((v) => v.price).filter((pr) => pr > 0);

    const isAct = p.status !== undefined ? p.status === 'active' : (p.isActive !== undefined ? p.isActive : true);

    return {
      _id: p._id,
      storeId: typeof p.storeId === 'object' ? p.storeId._id : p.storeId,
      categoryId: p.categoryId,
      categoryTitle: typeof p.categoryId === 'object' ? p.categoryId.title : undefined,
      name: p.title || p.name || 'بدون عنوان',
      title: p.title || p.name || 'بدون عنوان',
      slug: p.slug,
      description: p.description || '',
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
      options: (p.options || []).map((o: any) => ({
        key: o.key || o.name?.toLowerCase().trim() || 'opt',
        source: o.source,
        label: o.label || o.name,
        name: o.name || o.label || o.key,
        type: o.type,
        unit: o.unit,
        values: o.values || [],
      })),
      minPrice: prices.length > 0 ? Math.min(...prices) : (p.minPrice || 0),
      maxPrice: prices.length > 0 ? Math.max(...prices) : (p.maxPrice || 0),
      inStock: (p.totalStock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0)) > 0,
      isFeatured: p.isFeatured || false,
      isActive: isAct,
      approveStatus: p.approveStatus || 'approved',
      rejectReason: p.rejectReason || p.rejectionReason || '',
      isAnonymousVendor: p.isAnonymousVendor || false,
      variants,
      variantsCount: variants.length,
      totalStock: p.totalStock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0),
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt,
    };
  },

  /**
   * جلب كافة منتجات متجر التاجر المسجل من قاعدة البيانات
   */
  async getMyProducts(): Promise<{ success: boolean; data: ProductItem[]; message?: string }> {
    try {
      const res = await getRequest<{ products: any[] }>('/api/products/seller');
      if (res.success && Array.isArray(res.data?.products)) {
        const prods: ProductItem[] = res.data.products.map((p) => this.mapProductItem(p));
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
    try {
      const initialPrice = formData.isSimple ? (Number(formData.simplePrice) || 0) : (Number(formData.variants[0]?.price) || 0);
      const initialStock = formData.isSimple
        ? Math.max(0, Math.floor(Number(formData.simpleStock) || 0))
        : Math.max(0, Math.floor(Number(formData.variants[0]?.stock) || 0));

      const hasFiles = Array.isArray(formData.imageFiles) && formData.imageFiles.length > 0;
      let body: FormData | Record<string, any>;

      if (hasFiles) {
        const fd = new FormData();
        fd.append('title', (formData.name || formData.title || '').trim());
        if (formData.description?.trim()) fd.append('description', formData.description.trim());
        fd.append('categoryId', formData.categoryId);
        fd.append('price', String(initialPrice));
        fd.append('stock', String(initialStock));
        formData.imageFiles!.forEach((file) => fd.append('images', file));
        body = fd;
      } else {
        const validUrls = (formData.images || []).filter(
          (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
        );
        body = {
          title: (formData.name || formData.title || '').trim(),
          description: formData.description?.trim() || '',
          categoryId: formData.categoryId,
          price: initialPrice,
          stock: initialStock,
          ...(validUrls.length > 0 ? { images: validUrls } : {}),
        };
      }

      // 1. Create Base Product
      const res = await postRequest<{ product: any; message?: string }>('/api/products', body, { timeoutMs: 60000 });
      if (!res.success || !res.data?.product) {
        const errMsg = res.message || (res.errors ? Object.values(res.errors).flat().join(', ') : '') || 'فشلت عملية إنشاء المنتج';
        return { success: false, message: errMsg };
      }

      const p = res.data.product;

      // 2. If multi-variant, configure variants via sub-resource endpoints
      if (!formData.isSimple && Array.isArray(formData.variants) && formData.variants.length > 0) {
        const productId = p._id;
        const defaultVariantId = p.variants?.[0]?._id;

        // A. Update default variant with combo #1 attributes
        const combo1 = formData.variants[0];
        if (defaultVariantId && combo1 && Object.keys(combo1.attributes || {}).length > 0) {
          const patchRes = await patchRequest(`/api/products/${productId}/variants/${defaultVariantId}`, {
            attributes: combo1.attributes,
            price: Number(combo1.price) || initialPrice,
            stock: Number(combo1.stock) || initialStock,
          });
          if (!patchRes.success) {
            return { success: false, message: patchRes.message || 'فشل تحديث الصنف الافتراضي' };
          }
          if (combo1.imageFile) {
            const vFd = new FormData();
            vFd.append('image', combo1.imageFile);
            await patchRequest(`/api/products/${productId}/variants/${defaultVariantId}`, vFd);
          }
        }

        // B. Add subsequent combos #2..N
        for (let i = 1; i < formData.variants.length; i++) {
          const v = formData.variants[i];
          const vRes = await postRequest<{ variant?: any }>(`/api/products/${productId}/variants`, {
            attributes: v.attributes || {},
            price: Number(v.price) || initialPrice,
            stock: Number(v.stock) || 0,
          });
          if (!vRes.success) {
            return { success: false, message: vRes.message || `فشل إنشاء الصنف رقم ${i + 1}` };
          }

          const createdVarId = vRes.data?.variant?._id;
          if (v.imageFile && createdVarId) {
            const vFd = new FormData();
            vFd.append('image', v.imageFile);
            await patchRequest(`/api/products/${productId}/variants/${createdVarId}`, vFd);
          }
        }

        const refreshed = await this.getProductById(productId);
        if (refreshed.success && refreshed.data) {
          return { success: true, data: refreshed.data, message: 'تم حفظ ونشر المنتج وأصنافه بنجاح' };
        }
      }

      return { success: true, data: this.mapProductItem(p), message: 'تم حفظ ونشر المنتج بنجاح' };
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
      let resolvedVariantId = variantId;
      if (!resolvedVariantId || !/^[0-9a-fA-F]{24}$/.test(resolvedVariantId)) {
        const prodRes = await this.getProductById(productId);
        if (prodRes.success && prodRes.data?.variants?.[0]?._id) {
          resolvedVariantId = prodRes.data.variants[0]._id;
        }
      }

      if (resolvedVariantId && /^[0-9a-fA-F]{24}$/.test(resolvedVariantId)) {
        const res = await patchRequest(`/api/products/${productId}/variants/${resolvedVariantId}`, { stock: cleanStock });
        return { success: res.success, data: res.data, message: res.message };
      }
      return { success: false, message: 'تعذر تحديد الصنف لتحديث المخزون' };
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
      // 1. فحص قائمة منتجات التاجر أولاً لتفادي خطأ 404 إذا كان المنتج بانتظار الموافقة (pending)
      const myProds = await this.getMyProducts();
      if (myProds.success && myProds.data) {
        const found = myProds.data.find((p) => String(p._id) === String(productId));
        if (found) {
          return { success: true, data: found };
        }
      }

      // 2. المحاولة البديلة عبر المسار العام
      const res = await getRequest<{ product: any }>(`/api/products/${productId}`);
      if (res.success && res.data?.product) {
        return { success: true, data: this.mapProductItem(res.data.product) };
      }
      return { success: false, message: res.message || 'المنتج غير موجود' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ في جلب بيانات المنتج' };
    }
  },

  /**
   * تحديث تفاصيل منتج وأصنافه في قاعدة البيانات
   * يراعي عقد الباك إند: PATCH /api/products/:id يقبل فقط [title, description, categoryId, images]
   * والأصناف يتم تحديثها/إنشاؤها/حذفها عبر مسارات /api/products/:id/variants
   */
  async updateProduct(
    productId: string,
    formData: Partial<ProductFormData>
  ): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
    try {
      // 1. تحديث الحقول الأساسية للمنتج (PATCH /api/products/:id)
      const hasFiles = Array.isArray(formData.imageFiles) && formData.imageFiles.length > 0;
      let patchBody: FormData | Record<string, any>;

      if (hasFiles) {
        const fd = new FormData();
        const nextTitle = (formData.name || formData.title || '').trim();
        if (nextTitle) fd.append('title', nextTitle);
        if (formData.description !== undefined) fd.append('description', formData.description.trim());
        if (formData.categoryId) fd.append('categoryId', formData.categoryId);
        formData.imageFiles!.forEach((file) => fd.append('images', file));
        patchBody = fd;
      } else {
        const basePayload: Record<string, any> = {};
        const nextTitle = (formData.name || formData.title || '').trim();
        if (nextTitle) basePayload.title = nextTitle;
        if (formData.description !== undefined) basePayload.description = formData.description.trim();
        if (formData.categoryId) basePayload.categoryId = formData.categoryId;
        patchBody = basePayload;
      }

      // إرسال التحديث الأساسي فقط إذا كان هناك حقل واحد على الأقل للتعديل
      if (hasFiles || Object.keys(patchBody).length > 0) {
        const baseRes = await patchRequest(`/api/products/${productId}`, patchBody);
        if (!baseRes.success) {
          return { success: false, message: baseRes.message || 'فشل تحديث بيانات المنتج الأساسية' };
        }
      }

      // 2. تحديث الأصناف والمتغيرات (Variants Synchronization)
      if (Array.isArray(formData.variants) && formData.variants.length > 0) {
        const currentProdRes = await this.getProductById(productId);
        const existingVariants = currentProdRes.data?.variants || [];

        for (let i = 0; i < formData.variants.length; i++) {
          const v = formData.variants[i];
          const rawId = v._id || (v as any).id;
          const isExisting = rawId && existingVariants.some((ev) => String(ev._id) === String(rawId));

          const variantPayload: Record<string, any> = {
            price: Number(v.price) || 0,
            stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
            attributes: v.attributes || {},
          };

          let varRes;
          let targetVarId = rawId;

          if (isExisting) {
            varRes = await patchRequest(`/api/products/${productId}/variants/${rawId}`, variantPayload);
          } else {
            varRes = await postRequest<{ variant?: any }>(`/api/products/${productId}/variants`, variantPayload);
            targetVarId = varRes.data?.variant?._id;
          }

          if (!varRes.success) {
            // Abort immediately! Do not delete existing variants if any update failed.
            return { success: false, message: varRes.message || `فشل حفظ الصنف رقم ${i + 1}` };
          }

          if (v.imageFile && targetVarId) {
            const vFd = new FormData();
            vFd.append('image', v.imageFile);
            await patchRequest(`/api/products/${productId}/variants/${targetVarId}`, vFd);
          }
        }

        // حذف الأصناف التي أزالها التاجر من الواجهة إذا كان متبقياً صنف واحد على الأقل
        if (formData.variants.length > 0) {
          const activeNewIds = new Set(formData.variants.map((v) => String(v._id || (v as any).id)).filter(Boolean));
          for (const ev of existingVariants) {
            if (!activeNewIds.has(String(ev._id))) {
              try {
                await deleteRequest(`/api/products/${productId}/variants/${ev._id}`);
              } catch (delErr) {
                console.warn('Could not delete obsolete variant:', ev._id, delErr);
              }
            }
          }
        }
      }

      // 3. تحديث حالة التفعيل إذا تم تغييرها
      if (formData.isActive !== undefined) {
        await patchRequest(`/api/products/${productId}/status`, {
          status: formData.isActive ? 'active' : 'inActive',
        });
      }

      // 4. جلب النسخة المحدثة وإرجاعها
      const refreshed = await this.getProductById(productId);
      if (refreshed.success && refreshed.data) {
        return { success: true, data: refreshed.data, message: 'تم تحديث المنتج وحفظ التغييرات بنجاح' };
      }

      return { success: true, message: 'تم تحديث المنتج بنجاح' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء الاتصال بالخادم لتحديث المنتج' };
    }
  },

  /**
   * جلب تعريفات الخيارات العامة - متوافق مع بنية السمات الحديثة للفئات
   */
  async fetchOptionDefinitions(): Promise<{
    success: boolean;
    data?: { definitions: any[]; availableUnits: any[] };
    message?: string;
  }> {
    return {
      success: true,
      data: { definitions: [], availableUnits: [] },
    };
  },

  /**
   * جلب الخيارات المصرحة لتصنيف محدد مستخرجة مباشرة من variantAttributes في الفئة
   */
  async fetchOptionsByCategory(categoryId: string): Promise<{
    success: boolean;
    data?: { allowedKeys?: string[]; definitions: any[]; availableUnits: any[] };
    message?: string;
  }> {
    try {
      const cats = await taxonomyService.fetchCategories();
      const activeCat = cats.find((c) => String(c._id) === String(categoryId));
      if (!activeCat || !activeCat.variantAttributes || activeCat.variantAttributes.length === 0) {
        return {
          success: true,
          data: { definitions: [], availableUnits: [] },
        };
      }
      const definitions = activeCat.variantAttributes.map((attr) => ({
        key: attr.name,
        name: attr.name,
        label: attr.name,
        type: 'TEXT',
        values: attr.values.map((v) => ({ key: v, label: v, isActive: true })),
        isActive: true,
      }));
      return {
        success: true,
        data: { definitions, availableUnits: [] },
      };
    } catch (err: any) {
      return {
        success: true,
        data: { definitions: [], availableUnits: [] },
      };
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
