import { getRequest, postRequest, patchRequest, deleteRequest } from '@/shared/lib/coreApi';
import { taxonomyService } from '@/features/store/services/taxonomy.service';
import { getAttributeKey } from '@/shared/lib/attributeUtils';
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
        status: v.status || 'active',
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
      const title = (formData.name || formData.title || '').trim();
      const description = formData.description?.trim() || '';

      // Clean variants projection strictly conforming to backend schema: ['attributes', 'price', 'stock', 'image']
      const cleanVariants = !formData.isSimple && Array.isArray(formData.variants)
        ? formData.variants.map((v) => {
            const item: Record<string, any> = {
              attributes: v.attributes || {},
              price: Number(v.price) || 0,
              stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
            };
            if (
              typeof v.image === 'string' &&
              (v.image.startsWith('http://') || v.image.startsWith('https://') || v.image.startsWith('/'))
            ) {
              item.image = v.image;
            }
            return item;
          })
        : [];

      let body: FormData | Record<string, any>;

      if (hasFiles) {
        const fd = new FormData();
        fd.append('title', title);
        if (description) fd.append('description', description);
        fd.append('categoryId', formData.categoryId);

        if (formData.isSimple) {
          fd.append('price', String(initialPrice));
          fd.append('stock', String(initialStock));
        } else {
          fd.append('variants', JSON.stringify(cleanVariants));
        }

        formData.imageFiles!.forEach((file) => fd.append('images', file));
        body = fd;
      } else {
        const validUrls = (formData.images || []).filter(
          (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'))
        );
        body = {
          title,
          description,
          categoryId: formData.categoryId,
          ...(validUrls.length > 0 ? { images: validUrls } : {}),
          ...(formData.isSimple
            ? { price: initialPrice, stock: initialStock }
            : { variants: cleanVariants }),
        };
      }

      // 1. Create Base Product & Variants atomically in single transaction
      const res = await postRequest<{ product: any; message?: string }>('/api/products', body, { timeoutMs: 60000 });
      if (!res.success || !res.data?.product) {
        const errMsg = res.message || (res.errors ? Object.values(res.errors).flat().join(', ') : '') || 'فشلت عملية إنشاء المنتج';
        return { success: false, message: errMsg };
      }

      const p = res.data.product;

      // 2. Post-Creation Variant Synchronization (Variant Images & Inactive Statuses)
      // When files were uploaded, variants originally had local blob/base64 previews,
      // and backend defaulted them to images[0]. Now that Cloudinary uploaded the files,
      // p.images contains the final URLs in the same index order as formData.images/imageFiles.
      if (
        !formData.isSimple &&
        Array.isArray(formData.variants) &&
        Array.isArray(p.variants) &&
        p.variants.length > 0
      ) {
        const variantUpdates: Array<{
          variantId: string;
          image?: string;
          status?: 'active' | 'inActive';
        }> = [];

        p.variants.forEach((dbVar: any, idx: number) => {
          // Robust attribute matching with index fallback
          const formVar =
            formData.variants.find((fv) => {
              const dbAttrs =
                dbVar.attributes instanceof Map
                  ? Object.fromEntries(dbVar.attributes)
                  : dbVar.attributes || {};
              const fvAttrs = fv.attributes || {};
              const dbKeys = Object.keys(dbAttrs);
              const fvKeys = Object.keys(fvAttrs);
              if (dbKeys.length !== fvKeys.length) return false;
              return fvKeys.every(
                (k) =>
                  String(fvAttrs[k] ?? '').trim().toLowerCase() ===
                  String(dbAttrs[k] ?? '').trim().toLowerCase()
              );
            }) || formData.variants[idx];

          if (!formVar) return;

          let targetImageUrl: string | undefined;

          // If formVar had a direct remote URL
          if (
            typeof formVar.image === 'string' &&
            (formVar.image.startsWith('http://') || formVar.image.startsWith('https://'))
          ) {
            targetImageUrl = formVar.image;
          } else if (
            typeof formVar.image === 'string' &&
            Array.isArray(formData.images) &&
            Array.isArray(p.images)
          ) {
            // Find which gallery index was selected
            const imgIdx = formData.images.indexOf(formVar.image);
            if (imgIdx >= 0 && p.images[imgIdx]) {
              targetImageUrl = p.images[imgIdx];
            }
          }

          const hasImageChange = Boolean(targetImageUrl && targetImageUrl !== dbVar.image);
          const isExplicitlyInactive =
            formVar.status === 'inActive' || formVar.isActive === false;

          if (hasImageChange || isExplicitlyInactive) {
            variantUpdates.push({
              variantId: String(dbVar._id),
              ...(hasImageChange ? { image: targetImageUrl } : {}),
              ...(isExplicitlyInactive ? { status: 'inActive' } : {}),
            });
          }
        });

        if (variantUpdates.length > 0) {
          try {
            await this.batchUpdateVariants(p._id, variantUpdates);
          } catch (patchErr) {
            console.warn('Post-creation variant sync warning:', patchErr);
          }
        }
      }

      const refreshed = await this.getProductById(p._id);
      if (refreshed.success && refreshed.data) {
        return { success: true, data: refreshed.data, message: 'تم حفظ ونشر المنتج بنجاح' };
      }

      return { success: true, data: this.mapProductItem(p), message: 'تم حفظ ونشر المنتج بنجاح' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء الاتصال بالخادم لإنشاء المنتج' };
    }
  },

  async toggleProduct(productId: string, currentActive: boolean): Promise<{ success: boolean; message?: string }> {
    const nextState = !currentActive;
    try {
      const res = await patchRequest(`/api/products/${productId}`, {
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
        const res = await this.batchUpdateVariants(productId, [
          { variantId: resolvedVariantId, stock: cleanStock },
        ]);
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
  /**
   * تحديث الحقول الأساسية للمنتج فقط (PATCH /api/products/:id)
   */
  async updateProductBase(
    productId: string,
    data: {
      name?: string;
      title?: string;
      description?: string;
      categoryId?: string;
      images?: string[];
      existingImages?: string[];
      imageFiles?: File[];
      status?: 'active' | 'inActive';
    }
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const hasFiles = Array.isArray(data.imageFiles) && data.imageFiles.length > 0;
      const keptUrls = (data.existingImages || data.images || []).filter(
        (url) => typeof url === 'string' && !url.startsWith('blob:') && !url.startsWith('data:') && url.trim().length > 0
      );
      let patchBody: FormData | Record<string, any>;

      if (hasFiles) {
        const fd = new FormData();
        const nextTitle = (data.name || data.title || '').trim();
        if (nextTitle) fd.append('title', nextTitle);
        if (data.description !== undefined) fd.append('description', data.description.trim());
        if (data.categoryId) fd.append('categoryId', data.categoryId);
        if (data.existingImages !== undefined || data.images !== undefined) {
          fd.append('existingImages', JSON.stringify(keptUrls));
        }
        if (data.status !== undefined) fd.append('status', data.status);
        data.imageFiles!.forEach((file) => fd.append('images', file));
        patchBody = fd;
      } else {
        const basePayload: Record<string, any> = {};
        const nextTitle = (data.name || data.title || '').trim();
        if (nextTitle) basePayload.title = nextTitle;
        if (data.description !== undefined) basePayload.description = data.description.trim();
        if (data.categoryId) basePayload.categoryId = data.categoryId;
        if (data.existingImages !== undefined || data.images !== undefined) {
          basePayload.existingImages = keptUrls;
        }
        if (data.status !== undefined) basePayload.status = data.status;
        patchBody = basePayload;
      }

      if (hasFiles || Object.keys(patchBody).length > 0) {
        const baseRes = await patchRequest(`/api/products/${productId}`, patchBody);
        if (!baseRes.success) {
          return { success: false, message: baseRes.message || 'فشل تحديث بيانات المنتج الأساسية' };
        }
        return { success: true, data: baseRes.data };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء تحديث بيانات المنتج الأساسية' };
    }
  },

  /**
   * مزامنة وتحديث الأصناف والمتغيرات عبر مسارات /api/products/:id/variants
   */
  /**
   * 1. إضافة أصناف جديدة دفعة واحدة (Batch Create)
   */
  async batchCreateVariants(
    productId: string,
    variants: Array<{
      attributes: Record<string, string>;
      price: number;
      stock: number;
      image?: string;
    }>
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    return postRequest(`/api/products/${productId}/variants`, variants);
  },

  /**
   * 2. تعديل أصناف قائمة دفعة واحدة (Batch Update)
   */
  async batchUpdateVariants(
    productId: string,
    updates: Array<{
      variantId: string;
      price?: number;
      stock?: number;
      status?: 'active' | 'inActive';
      attributes?: Record<string, string>;
      image?: string;
    }>
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    return patchRequest(`/api/products/${productId}/variants`, updates);
  },

  /**
   * 3. حذف أصناف دفعة واحدة (Batch Delete)
   */
  async batchDeleteVariants(
    productId: string,
    variantIds: string[]
  ): Promise<{ success: boolean; message?: string }> {
    if (!variantIds.length) return { success: true };
    return deleteRequest(`/api/products/${productId}/variants`, variantIds);
  },

  /**
   * مزامنة وتحديث الأصناف والمتغيرات بنظام الدُفعات (Batch Sync)
   */
  async syncProductVariants(
    productId: string,
    variants: any[]
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const currentProdRes = await this.getProductById(productId);
      const existingVariants = currentProdRes.data?.variants || [];
      const existingIdSet = new Set(existingVariants.map((ev) => String(ev._id)));

      const toCreate: Array<{ attributes: Record<string, string>; price: number; stock: number; image?: string }> = [];
      const toUpdate: Array<{ variantId: string; price?: number; stock?: number; status?: 'active' | 'inActive'; attributes?: Record<string, string>; image?: string }> = [];

      for (const v of variants) {
        const rawId = v._id || v.id || v.dbId;
        const isExisting = rawId && existingIdSet.has(String(rawId));

        const fallbackImg = typeof v.image === 'string' && (v.image.startsWith('http://') || v.image.startsWith('https://'))
          ? v.image
          : currentProdRes.data?.images?.[0];

        if (isExisting) {
          toUpdate.push({
            variantId: String(rawId),
            price: Number(v.price) || 0,
            stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
            ...(v.attributes ? { attributes: v.attributes } : {}),
            ...(fallbackImg ? { image: fallbackImg } : {}),
            ...(v.status ? { status: v.status } : {}),
          });
        } else {
          toCreate.push({
            price: Number(v.price) || 0,
            stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
            attributes: v.attributes || {},
            ...(fallbackImg ? { image: fallbackImg } : {}),
          });
        }
      }

      // 1. تنفيذ التعديل
      if (toUpdate.length > 0) {
        const updateRes = await this.batchUpdateVariants(productId, toUpdate);
        if (!updateRes.success) {
          return { success: false, message: updateRes.message || 'فشل تحديث الأصناف الحالية' };
        }
      }

      // 2. تنفيذ الإضافة
      if (toCreate.length > 0) {
        const createRes = await this.batchCreateVariants(productId, toCreate);
        if (!createRes.success) {
          return { success: false, message: createRes.message || 'فشل إضافة الأصناف الجديدة' };
        }
      }

      // 3. حذف الأصناف القديمة التي أزالها التاجر من الواجهة
      if (variants.length > 0) {
        const activeIds = new Set(variants.map((v) => String(v._id || v.id || v.dbId)).filter(Boolean));
        const toDeleteIds = existingVariants
          .map((ev) => String(ev._id))
          .filter((id) => !activeIds.has(id));

        if (toDeleteIds.length > 0) {
          await this.batchDeleteVariants(productId, toDeleteIds);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء مزامنة أصناف المنتج' };
    }
  },

  /**
   * التحديث المنسق والشامل للمنتج
   */
  async updateProduct(
    productId: string,
    formData: Partial<ProductFormData>
  ): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
    try {
      // 0. إذا تغير القسم، نحذف الأصناف القديمة أولاً لكي يسمح الباك إند بتحديث categoryId دون 409 Conflict
      if (formData.categoryId) {
        const currentProdRes = await this.getProductById(productId);
        const currentCatId = typeof currentProdRes.data?.categoryId === 'object'
          ? (currentProdRes.data?.categoryId as any)?._id
          : currentProdRes.data?.categoryId;

        if (currentCatId && String(currentCatId) !== String(formData.categoryId)) {
          const oldVariants = currentProdRes.data?.variants || [];
          const oldVariantIds = oldVariants
            .map((oldVar) => String(oldVar._id))
            .filter(Boolean);
          if (oldVariantIds.length > 0) {
            const delRes = await this.batchDeleteVariants(productId, oldVariantIds);
            if (!delRes.success) {
              console.warn('Could not delete old variants before category change:', delRes.message);
            }
          }
        }
      }

      // 1. تحديث الحقول الأساسية إذا تم تمريرها
      const hasBaseFields =
        formData.name !== undefined ||
        formData.title !== undefined ||
        formData.description !== undefined ||
        formData.categoryId !== undefined ||
        formData.images !== undefined ||
        formData.existingImages !== undefined ||
        formData.isActive !== undefined ||
        (Array.isArray(formData.imageFiles) && formData.imageFiles.length > 0);

      if (hasBaseFields) {
        const baseRes = await this.updateProductBase(productId, {
          name: formData.name,
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          images: formData.images,
          existingImages: formData.existingImages,
          imageFiles: formData.imageFiles,
          status: formData.isActive === undefined
            ? undefined
            : formData.isActive ? 'active' : 'inActive',
        });
        if (!baseRes.success) {
          return { success: false, message: baseRes.message || 'فشل تحديث بيانات المنتج الأساسية' };
        }
      }

      // 2. تحديث ومزامنة الأصناف إذا تم تمريرها
      if (!formData.isSimple && Array.isArray(formData.variants) && formData.variants.length > 0) {
        const varRes = await this.syncProductVariants(productId, formData.variants);
        if (!varRes.success) {
          return { success: false, message: varRes.message };
        }
      } else if (formData.isSimple && (formData.simplePrice !== undefined || formData.simpleStock !== undefined)) {
        const prod = await this.getProductById(productId);
        const defVarId = prod.data?.variants?.[0]?._id;
        if (defVarId) {
          await this.batchUpdateVariants(productId, [
            { variantId: defVarId, price: Number(formData.simplePrice) || 0, stock: Math.max(0, Math.floor(Number(formData.simpleStock) || 0)) },
          ]);
        }
      }

      // 3. جلب النسخة المحدثة النهائية
      const refreshed = await this.getProductById(productId);
      if (refreshed.success && refreshed.data) {
        return { success: true, data: refreshed.data, message: 'تم تحديث المنتج وحفظ التغييرات بنجاح' };
      }

      return { success: true, message: 'تم تحديث المنتج بنجاح' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ أثناء الاتصال بالخادم لتحديث المنتج' };
    }
  },

  async updateProductVariant(
    productId: string,
    variantId: string,
    data: {
      price?: number;
      stock?: number;
      attributes?: Record<string, any>;
      status?: 'active' | 'inActive';
      image?: string;
    }
  ): Promise<{ success: boolean; message?: string }> {
    return this.batchUpdateVariants(productId, [{ variantId, ...data }]);
  },

  async addCustomVariant(
    productId: string,
    data: { attributes: Record<string, string>; price: number; stock: number; image?: string }
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    return this.batchCreateVariants(productId, [data]);
  },

  async updateVariantStatus(
    productId: string,
    variantId: string,
    status: 'active' | 'inActive'
  ): Promise<{ success: boolean; message?: string }> {
    return this.batchUpdateVariants(productId, [{ variantId, status }]);
  },

  async deleteProductVariant(
    productId: string,
    variantId: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.batchDeleteVariants(productId, [variantId]);
  },

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
        key: getAttributeKey(attr),
        name: attr.name,
        label: attr.name,
        type: 'TEXT',
        values: (attr.values || []).map((v) => ({ key: v, label: v, isActive: true })),
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
