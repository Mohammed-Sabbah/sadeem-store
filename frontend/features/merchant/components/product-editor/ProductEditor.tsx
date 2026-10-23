'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProductEditorMode } from '../../types/product-studio.types';
import { useProductEditor } from '../../hooks/useProductEditor';
import { ProductBasicInfoSection } from './ProductBasicInfoSection';
import { ProductPricingStockSection } from './ProductPricingStockSection';
import { ProductMediaSection } from './ProductMediaSection';
import { ProductOptionsBuilder } from './ProductOptionsBuilder';
import { ProductVariantTable } from './ProductVariantTable';
import { ProductVariantModal } from './ProductVariantModal';
import { ProductGalleryPickerModal } from './ProductGalleryPickerModal';
import { ProductEditorBottomBar } from './ProductEditorBottomBar';

interface ProductEditorProps {
  mode: ProductEditorMode;
  productId?: string;
}

export function ProductEditor({ mode, productId }: ProductEditorProps) {
  const router = useRouter();
  const editor = useProductEditor({ mode, productId });

  if (editor.isLoadingProduct) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center font-almarai space-y-3">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-brand-muted">جارٍ تحميل بيانات الصنف والأصناف التابعة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-canvas/30 pb-28 font-almarai text-right">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Navigation & Action Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/merchant/dashboard"
              className="w-9 h-9 rounded-xl border border-brand-border/80 bg-white hover:bg-brand-canvas flex items-center justify-center text-brand-dark transition-colors shadow-2xs"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-brand-dark">
                  {mode === 'create' ? 'إضافة صنف جديد للكتالوج' : 'تعديل بيانات الصنف'}
                </h1>
                {mode === 'edit' && editor.product && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      editor.product.isActive !== false
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {editor.product.isActive !== false ? 'معروض للبيع' : 'معطل مؤقتاً'}
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-muted mt-0.5">
                شبكة سَدِيم المعتمدة · المحافظة الوسطى، قطاع غزة
              </p>
            </div>
          </div>

          {/* Delete Button (in Edit Mode) */}
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => editor.setShowDeleteModal(true)}
              className="h-9 px-3.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 text-red-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">حذف الصنف</span>
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {editor.errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{editor.errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => editor.setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Basic Info Section */}
        <ProductBasicInfoSection
          title={editor.title}
          onTitleChange={editor.setTitle}
          description={editor.description}
          onDescriptionChange={editor.setDescription}
          categories={editor.categories}
          categoryId={editor.categoryId}
          onCategoryChange={editor.handleCategoryChange}
          isLoadingCategories={editor.isLoadingCategories}
          hasOptions={editor.hasOptions}
        />

        {/* 2. Media Section */}
        <ProductMediaSection
          images={editor.images}
          isUploadingImages={editor.isUploadingImages}
          fileInputRef={editor.fileInputRef}
          onFilesSelected={editor.handleFilesSelected}
          onRemoveImage={editor.handleRemoveImage}
        />

        {/* 3. Base Pricing & Stock Section (Shown for Simple Products or as Variant Baseline) */}
        <ProductPricingStockSection
          basePrice={editor.basePrice}
          onBasePriceChange={editor.setBasePrice}
          baseCompareAtPrice={editor.baseCompareAtPrice}
          onBaseCompareAtPriceChange={editor.setBaseCompareAtPrice}
          baseStock={editor.baseStock}
          onBaseStockChange={editor.setBaseStock}
          hasVariants={editor.matrix.variantsRows.length > 0}
        />

        {/* 4. Options and Variant Attributes Builder */}
        <ProductOptionsBuilder
          categorySupportsVariants={editor.categorySupportsVariants}
          categoryAttributes={editor.categoryAttributes}
          activeOptionKeys={editor.matrix.activeOptionKeys}
          selectedAttributeValues={editor.matrix.selectedAttributeValues}
          availableUnusedAttributes={editor.availableUnusedAttributes}
          openDropdownKey={editor.matrix.openDropdownKey}
          setOpenDropdownKey={editor.matrix.setOpenDropdownKey}
          dropdownSearch={editor.matrix.dropdownSearch}
          setDropdownSearch={editor.matrix.setDropdownSearch}
          customPopoverAttrKey={editor.matrix.customPopoverAttrKey}
          setCustomPopoverAttrKey={editor.matrix.setCustomPopoverAttrKey}
          customPopoverVal={editor.matrix.customPopoverVal}
          setCustomPopoverVal={editor.matrix.setCustomPopoverVal}
          onAddOption={editor.matrix.handleAddOption}
          onRemoveOption={editor.matrix.handleRemoveOption}
          onToggleValue={editor.matrix.handleToggleValue}
          onClearAllValues={editor.matrix.handleClearAllValues}
          onGenerateCartesian={() =>
            editor.matrix.handleGenerateCartesian(
              editor.basePrice,
              editor.baseCompareAtPrice,
              editor.baseStock
            )
          }
          variantsCount={editor.matrix.variantsRows.length}
        />

        {/* 5. Variant Combinations Table */}
        {editor.categorySupportsVariants && (
          <ProductVariantTable
            variantsRows={editor.matrix.variantsRows}
            bulkPrice={editor.matrix.bulkPrice}
            setBulkPrice={editor.matrix.setBulkPrice}
            bulkStock={editor.matrix.bulkStock}
            setBulkStock={editor.matrix.setBulkStock}
            onApplyBulkPrice={editor.matrix.handleApplyBulkPrice}
            onApplyBulkStock={editor.matrix.handleApplyBulkStock}
            onToggleVariantStatus={editor.matrix.handleToggleVariantStatus}
            onRemoveVariantRow={editor.handleRemoveVariantRow}
            onUpdateRowField={editor.matrix.handleUpdateRowField}
            onOpenGalleryPicker={(idx) => editor.setGalleryPickerRowIdx(idx)}
            onOpenAddSingleModal={() => editor.setShowAddSingleModal(true)}
          />
        )}

        {/* Modals */}
        <ProductGalleryPickerModal
          isOpen={editor.galleryPickerRowIdx !== null}
          onClose={() => editor.setGalleryPickerRowIdx(null)}
          images={editor.images}
          currentImage={
            editor.galleryPickerRowIdx !== null
              ? editor.matrix.variantsRows[editor.galleryPickerRowIdx]?.image
              : undefined
          }
          onSelectImage={(imgUrl) => {
            if (editor.galleryPickerRowIdx !== null) {
              editor.matrix.handleAssignImageToRow(editor.galleryPickerRowIdx, imgUrl);
            }
          }}
          onClearImage={() => {
            if (editor.galleryPickerRowIdx !== null) {
              editor.matrix.handleUpdateRowField(editor.galleryPickerRowIdx, 'image', undefined);
            }
          }}
        />

        <ProductVariantModal
          isOpen={editor.showAddSingleModal}
          onClose={() => editor.setShowAddSingleModal(false)}
          requiredKeys={editor.singleVariantRequiredKeys}
          categoryAttributes={editor.categoryAttributes}
          selectedAttributeValues={editor.matrix.selectedAttributeValues}
          existingRows={editor.matrix.variantsRows}
          images={editor.images}
          defaultPrice={editor.basePrice}
          defaultStock={editor.baseStock}
          onAddVariant={editor.matrix.handleAddSingleCustomVariant}
        />

        {/* Delete Confirmation Modal (Edit Mode) */}
        {editor.showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right font-almarai">
              <h3 className="text-sm font-black text-red-600 flex items-center gap-2">
                <span>⚠️</span> تأكيد حذف الصنف
              </h3>
              <p className="text-xs text-brand-dark leading-relaxed">
                هل أنت متأكد من رغبتك في حذف الصنف «{editor.title}» وكافة أصنافه من المتجر نهائياً؟
                لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => editor.setShowDeleteModal(false)}
                  disabled={editor.isDeleting}
                  className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-canvas cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={editor.handleDeleteProduct}
                  disabled={editor.isDeleting}
                  className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {editor.isDeleting ? 'جارٍ الحذف...' : 'نعم، احذف الصنف'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Sticky Bottom Action Bar */}
        <ProductEditorBottomBar
          mode={mode}
          isDirty={editor.isDirty}
          isSubmitting={editor.isSubmitting}
          onCancel={() => router.push('/merchant/dashboard')}
          onSubmit={() => editor.handleSave()}
        />
      </div>
    </div>
  );
}
