'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useAdminProductQuery,
  useAdminProductMutations,
} from '@/features/admin/queries/useAdminQueries';
import { getProductTotalStock } from '@/features/admin/utils/productAdminFilters';
import { AdminProductRejectModal } from '@/features/admin/components/AdminProductRejectModal';

export default function AdminProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = String(params?.id || '');

  const { data: product, isLoading, isError, error } = useAdminProductQuery(productId);
  const { updateApproval, isUpdating } = useAdminProductMutations();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="py-20 text-center font-almarai">
        <div className="w-10 h-10 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-brand-muted">جارٍ جلب تفاصيل الصنف من قاعدة البيانات...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 font-almarai">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center text-xl mx-auto shadow-2xs">
          ⚠️
        </div>
        <h3 className="text-base font-black text-brand-dark">تعذر العثور على الصنف المطلوب</h3>
        <p className="text-xs text-brand-muted leading-relaxed">
          {(error as any)?.message || 'قد يكون الصنف تم حذفه نهائياً أو أن المعرف غير صالح.'}
        </p>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-4 py-2 rounded-xl bg-brand-dark text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
        >
          العودة لجدول الكتالوج
        </button>
      </div>
    );
  }

  const isRejected = product.approveStatus === 'rejected';
  const variants = product.variants || [];
  const totalStock = getProductTotalStock(product);
  const store = product.storeId && typeof product.storeId === 'object' ? product.storeId : null;
  const category = product.categoryId && typeof product.categoryId === 'object' ? product.categoryId : null;

  const images = (product.images && product.images.length > 0)
    ? product.images
    : ['/placeholder.png'];
  const activeImage = selectedImage || images[0];

  const handleActivate = () => {
    if (confirm('هل أنت متأكد من إعادة تنشيط وفك تجميد هذا الصنف وعرضه في المتجر العام؟')) {
      updateApproval({
        productId: product._id,
        approveStatus: 'approved',
      });
    }
  };

  const handleConfirmReject = (reason: string) => {
    updateApproval(
      {
        productId: product._id,
        approveStatus: 'rejected',
        rejectReason: reason,
      },
      {
        onSettled: () => setIsRejectModalOpen(false),
      }
    );
  };

  return (
    <div className="space-y-6 font-almarai text-right select-none pb-16">
      {/* 1. Header & Navigation Bar */}
      <div className="bg-brand-card p-5 sm:p-6 rounded-2xl border border-brand-border shadow-2xs space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-4 border-b border-brand-border/60 pb-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-muted">
            <Link href="/admin" className="hover:text-brand-dark transition-colors">
              لوحة الإدارة
            </Link>
            <span>/</span>
            <Link href="/admin/products" className="hover:text-brand-dark transition-colors">
              رقابة الكتالوج
            </Link>
            <span>/</span>
            <span className="text-brand-dark font-black truncate max-w-[200px] sm:max-w-xs">
              {product.title}
            </span>
          </div>

          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-brand-surface text-xs font-bold text-brand-dark hover:bg-brand-card transition-colors shrink-0 shadow-2xs"
          >
            <span>العودة للكتالوج</span>
            <span className="text-xs">←</span>
          </Link>
        </div>

        {/* Title, Badges, and Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isRejected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span>موقوف إدارياً عن العرض</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-brand-trust" />
                  <span>معتمد ومقبول بالمتجر</span>
                </span>
              )}

              {store && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-surface text-brand-primary border border-brand-border">
                  متجر: {store.name}
                </span>
              )}

              {category && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-surface text-brand-dark border border-brand-border">
                  قسم: {category.title}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight leading-snug">
              {product.title}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href={`/product/${product._id}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-card text-xs font-bold text-brand-dark transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
            >
              <span>معاينة كزبون في المتجر</span>
              <span className="text-xs">↗</span>
            </Link>

            {isRejected ? (
              <button
                type="button"
                onClick={handleActivate}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-brand-trust text-white text-xs font-black hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              >
                تنشيط وفك التجميد
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              >
                إيقاف الصنف إدارياً
              </button>
            )}
          </div>
        </div>

        {/* Rejection Alert Box */}
        {isRejected && product.rejectReason && (
          <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-xs space-y-1">
            <span className="font-black text-red-800 block">سبب الإيقاف الإداري:</span>
            <p className="text-red-700 font-medium leading-relaxed m-0">
              {product.rejectReason}
            </p>
          </div>
        )}
      </div>

      {/* 2. Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Gallery & Description Card */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-5 sm:p-6 space-y-5 shadow-2xs">
            <h3 className="text-sm font-black text-brand-dark border-b border-brand-border/60 pb-3">
              معرض الصور والمواصفات الأساسية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
              {/* Main Image */}
              <div className="sm:col-span-5 space-y-3">
                <div className="aspect-square rounded-2xl bg-brand-surface border border-brand-border overflow-hidden flex items-center justify-center shadow-2xs">
                  <img
                    src={activeImage}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={`w-14 h-14 rounded-xl border overflow-hidden shrink-0 transition-all cursor-pointer ${
                          activeImage === img
                            ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-95'
                            : 'border-brand-border hover:border-brand-dark/40'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description & Overview */}
              <div className="sm:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-brand-muted block">
                    الوصف المعروض للزبائن
                  </span>
                  <p className="text-xs sm:text-sm text-brand-dark/90 leading-relaxed font-medium bg-brand-surface/40 p-4 rounded-xl border border-brand-border/60 whitespace-pre-line m-0">
                    {product.description || 'لا يوجد وصف مدخل لهذا المنتج.'}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                    <span className="text-[10px] font-bold text-brand-muted block">إجمالي المخزون</span>
                    <span className="text-sm font-black text-brand-dark block mt-0.5">
                      {totalStock} قطعة
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-surface border border-brand-border">
                    <span className="text-[10px] font-bold text-brand-muted block">عدد المتغيرات</span>
                    <span className="text-sm font-black text-brand-dark block mt-0.5">
                      {variants.length} خيارات
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Table Card */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-brand-dark">
                  جدول المتغيرات والأسعار والمخزون
                </h3>
                <p className="text-[11px] text-brand-muted m-0 mt-0.5">
                  تفصيل كل مقاس ولون وسعره وكميته المسجلة لدى التاجر
                </p>
              </div>

              <span className="text-xs font-black text-brand-primary bg-brand-primary-soft px-2.5 py-1 rounded-lg">
                {variants.length} خيار مسجل
              </span>
            </div>

            {variants.length === 0 ? (
              <div className="py-8 text-center text-xs text-brand-muted bg-brand-surface/40 rounded-xl border border-brand-border/60">
                لا توجد متغيرات مسجلة لهذا الصنف.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-brand-surface border-b border-brand-border text-brand-muted font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-14">الصورة</th>
                      <th className="py-2.5 px-3">المواصفات والسمات</th>
                      <th className="py-2.5 px-3 w-32 font-mono">رمز SKU</th>
                      <th className="py-2.5 px-3 w-28">السعر</th>
                      <th className="py-2.5 px-3 w-28">المخزون</th>
                      <th className="py-2.5 px-3 w-24">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40 font-medium">
                    {variants.map((v: any) => {
                      const vStock = Number(v.stock || 0);
                      const hasStock = vStock > 0;
                      const attrEntries = Object.entries(v.attributes || {});

                      return (
                        <tr key={v._id} className="hover:bg-brand-surface/40 transition-colors">
                          {/* Image */}
                          <td className="py-3 px-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-surface border border-brand-border overflow-hidden shrink-0 flex items-center justify-center text-[9px] text-brand-muted">
                              {v.image ? (
                                <img src={v.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                'صنف'
                              )}
                            </div>
                          </td>

                          {/* Attributes */}
                          <td className="py-3 px-3">
                            {attrEntries.length > 0 ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {attrEntries.map(([k, val]: any, aIdx: number) => (
                                  <span
                                    key={aIdx}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-surface border border-brand-border text-brand-dark"
                                  >
                                    <span className="text-brand-muted">{k}:</span> {String(val)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-brand-muted font-bold">الخيار الأساسي الافتراضي</span>
                            )}
                          </td>

                          {/* SKU */}
                          <td className="py-3 px-3 font-mono text-[11px] text-brand-dark">
                            {v.sku || 'بدون SKU'}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-3 font-bold text-brand-dark">
                            <span>{v.price} ₪</span>
                            {v.compareAtPrice && v.compareAtPrice > v.price && (
                              <span className="text-[10px] text-brand-muted line-through block font-normal">
                                {v.compareAtPrice} ₪
                              </span>
                            )}
                          </td>

                          {/* Stock */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                hasStock
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-brand-trust' : 'bg-red-500'}`} />
                              <span>{vStock} ق</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            {v.status === 'inActive' || v.isDeleted ? (
                              <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-2 py-0.5 rounded">
                                معطل
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                نشط
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Area (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Partner Store Card */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-5 space-y-3.5 shadow-2xs">
            <h3 className="text-xs font-black text-brand-muted border-b border-brand-border/60 pb-2.5">
              بيانات المتجر الشريك
            </h3>

            {store ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border overflow-hidden flex items-center justify-center font-bold text-xs text-brand-muted shrink-0">
                    {store.logo ? (
                      <img src={store.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      'متجر'
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-sm font-black text-brand-dark truncate m-0">
                      {store.name}
                    </h4>
                    <span className="text-[11px] font-bold text-brand-muted block">
                      {store.address?.city || 'المحافظة الوسطى'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between text-xs">
                  <span className="text-brand-muted font-bold">حالة المتجر:</span>
                  <span className="font-bold text-brand-dark">
                    {store.status === 'active' ? 'نشط ومعتمد' : 'معطل'}
                  </span>
                </div>

                <Link
                  href={`/admin/stores?search=${encodeURIComponent(store.name || '')}`}
                  className="w-full py-2 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-card text-center text-xs font-bold text-brand-dark transition-colors block shadow-2xs"
                >
                  عرض ملف المتجر في شبكة المتاجر ←
                </Link>
              </div>
            ) : (
              <p className="text-xs text-brand-muted m-0">لا تتوفر بيانات المتجر المالك.</p>
            )}
          </div>

          {/* Category Architecture Card */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black text-brand-muted border-b border-brand-border/60 pb-2.5">
              التصنيف المعتمد
            </h3>

            {category ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-brand-dark">{category.title}</span>
                  <span className="text-xs font-mono text-brand-muted dir-ltr">/{category.slug}</span>
                </div>

                {category.variantAttributes && category.variantAttributes.length > 0 && (
                  <div className="pt-2 border-t border-brand-border/40 space-y-1">
                    <span className="text-[10px] font-bold text-brand-muted block">
                      السمات المصرحة للفئة:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {category.variantAttributes.map((attr: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-surface border border-brand-border text-brand-dark"
                        >
                          {attr.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-brand-muted m-0">صنف عام بدون فئة مرتبطة.</p>
            )}
          </div>

          {/* Future Scope Placeholders */}
          <div className="bg-brand-card rounded-2xl border border-brand-border p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5">
              <h3 className="text-xs font-black text-brand-dark">سجلات التتبع والمبيعات</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                المرحلة 2
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-brand-surface/50 border border-brand-border/60 space-y-1">
                <span className="text-xs font-bold text-brand-dark block">حركات الطلبات والتوصيل</span>
                <p className="text-[10px] text-brand-muted m-0">
                  سيتم ربط سجل الطلبات والمبيعات الفعلية بعد إطلاق موديول الطلبات الموحد.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-brand-surface/50 border border-brand-border/60 space-y-1">
                <span className="text-xs font-bold text-brand-dark block">سجل التدقيق الرقابي</span>
                <p className="text-[10px] text-brand-muted m-0">
                  سجل تاريخي يوضح من قام بتجميد أو تنشيط الصنف وتواريخ المراجعة الميدانية.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <AdminProductRejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        productTitle={product.title}
        isSubmitting={isUpdating}
      />
    </div>
  );
}
