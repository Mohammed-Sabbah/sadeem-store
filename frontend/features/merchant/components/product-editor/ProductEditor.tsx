'use client';

import React from 'react';
import type { ProductEditorMode } from '../../types/product-studio.types';
import { useProductEditor } from '../../hooks/useProductEditor';
import { ProductEditorialHeader } from './ProductEditorialHeader';
import { ProductInfoAndMediaCard } from './ProductInfoAndMediaCard';
import { ProductPricingAndOptionsCard } from './ProductPricingAndOptionsCard';
import { ProductStickyBottomBar } from './ProductStickyBottomBar';
import { ProductDeleteModal } from './ProductDeleteModal';
import { ProductGalleryPickerModal } from './ProductGalleryPickerModal';
import { ProductVariantModal } from './ProductVariantModal';

interface ProductEditorProps {
  mode: ProductEditorMode;
  productId?: string;
}

export function ProductEditor({ mode, productId }: ProductEditorProps) {
  const editor = useProductEditor({ mode, productId });

  if (editor.isLoadingProduct) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center font-almarai space-y-3">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-brand-muted">جارٍ تحميل بيانات الصنف والأصناف التابعة...</p>
      </div>
    );
  }

  const enabledVariantsCount = editor.matrix.variantsRows.filter(
    (r) => (r.status ? r.status === 'active' : r.isEnabled !== false)
  ).length;

  return (
    <div className="w-full space-y-6 pb-28 font-almarai text-right">
      {/* Click-outside backdrop for open option pickers */}
      {editor.matrix.openDropdownKey && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            editor.matrix.setOpenDropdownKey(null);
            editor.matrix.setDropdownSearch('');
            editor.matrix.setCustomPopoverAttrKey(null);
            editor.matrix.setCustomPopoverVal('');
          }}
        />
      )}

      {/* Top Editorial Header */}
      <ProductEditorialHeader
        mode={mode}
        product={editor.product}
        isProductActive={editor.isProductActive}
        onToggleActive={() => editor.setIsProductActive(!editor.isProductActive)}
        onDelete={mode === 'edit' ? () => editor.setShowDeleteModal(true) : undefined}
        onSave={() => editor.handleSave()}
        isSubmitting={editor.isSubmitting}
        errorMessage={editor.errorMessage}
        onClearError={() => editor.setErrorMessage(null)}
        successMessage={editor.successMessage}
        onClearSuccess={() => editor.setSuccessMessage(null)}
      />

      <form onSubmit={editor.handleSave} className="space-y-6">
        {/* Card 1: Information & Gallery */}
        <ProductInfoAndMediaCard
          mode={mode}
          product={editor.product}
          title={editor.title}
          setTitle={editor.setTitle}
          categoryId={editor.categoryId}
          onCategoryChange={editor.handleCategoryChange}
          categories={editor.categories}
          isLoadingCategories={editor.isLoadingCategories}
          hasOptions={editor.hasOptions}
          description={editor.description}
          setDescription={editor.setDescription}
          images={editor.images}
          isUploadingImages={editor.isUploadingImages}
          fileInputRef={editor.fileInputRef}
          onFilesSelected={editor.handleFilesSelected}
          onRemoveImage={editor.handleRemoveImage}
        />

        {/* Card 2: Pricing, Stock & Progressive Options */}
        <ProductPricingAndOptionsCard
          mode={mode}
          hasVariantsUnderTheHood={editor.hasVariantsUnderTheHood}
          basePrice={editor.basePrice}
          setBasePrice={editor.setBasePrice}
          baseStock={editor.baseStock}
          setBaseStock={editor.setBaseStock}
          categorySupportsVariants={editor.categorySupportsVariants}
          availableUnusedAttributes={editor.availableUnusedAttributes}
          categoryAttributes={editor.categoryAttributes}
          matrix={editor.matrix}
          onRemoveVariantRow={editor.handleRemoveVariantRow}
          onClearAllRows={editor.handleClearAllVariantRows}
          onOpenGalleryPicker={(idx) => editor.setGalleryPickerRowIdx(idx)}
          onOpenAddSingleModal={() => editor.setShowAddSingleModal(true)}
        />

        {/* Sticky Bottom Actions Bar */}
        <ProductStickyBottomBar
          mode={mode}
          hasVariantsUnderTheHood={editor.hasVariantsUnderTheHood}
          enabledVariantsCount={enabledVariantsCount}
          isDirty={editor.isDirty}
          isSubmitting={editor.isSubmitting}
          onSubmit={editor.handleSave}
        />
      </form>

      {/* Delete Confirmation Modal (Edit Mode) */}
      {mode === 'edit' && (
        <ProductDeleteModal
          isOpen={editor.showDeleteModal}
          onClose={() => editor.setShowDeleteModal(false)}
          onConfirm={editor.handleDeleteProduct}
          isDeleting={editor.isDeleting}
          productTitle={editor.title}
        />
      )}

      {/* Gallery Picker Modal */}
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

      {/* Add Single Variant Modal */}
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
    </div>
  );
}
