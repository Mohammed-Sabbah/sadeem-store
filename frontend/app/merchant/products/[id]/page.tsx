'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useProductStudio } from '@/features/merchant/hooks/useProductStudio';
import {
  ProductStudioSkeleton,
  ProductStudioNotFound,
  ProductStudioHeader,
  ProductStudioOverviewTab,
  ProductStudioEditorTab,
  ProductStudioSettingsTab,
  ProductStudioFloatingBar,
} from '@/features/merchant/components/product-studio';

export default function MerchantProductStudioPage() {
  const params = useParams();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const studio = useProductStudio(productId);

  if (studio.isLoading) {
    return <ProductStudioSkeleton />;
  }

  if (!studio.product && !studio.isLoading) {
    return <ProductStudioNotFound onBackLink="/merchant/dashboard" />;
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 font-almarai text-right pb-28">
      {/* 1. Master Header with Breadcrumb, Badges & Tabs */}
      <ProductStudioHeader
        productId={studio.productId}
        name={studio.name}
        primaryImage={studio.primaryImage}
        categories={studio.categories}
        categoryId={studio.categoryId}
        isActive={studio.isActive}
        isAnonymousVendor={studio.isAnonymousVendor}
        minPrice={studio.minPrice}
        maxPrice={studio.maxPrice}
        totalStock={studio.totalStock}
        isSimple={studio.isSimple}
        variantsCount={studio.variantsCount}
        activeTab={studio.activeTab}
        setActiveTab={studio.setActiveTab}
        handleSaveProduct={studio.handleSaveProduct}
        isSaving={studio.isSaving}
        saveSuccessMessage={studio.saveSuccessMessage}
        errorMessage={studio.errorMessage}
      />

      {/* 2. Active Tab Content */}
      {studio.activeTab === 'overview' && (
        <ProductStudioOverviewTab
          productId={studio.productId}
          name={studio.name}
          totalStock={studio.totalStock}
          minPrice={studio.minPrice}
          maxPrice={studio.maxPrice}
          primaryImage={studio.primaryImage}
          isSimple={studio.isSimple}
          simplePrice={studio.simplePrice}
          simpleStock={studio.simpleStock}
          simpleSku={studio.simpleSku}
          setSimpleStock={studio.setSimpleStock}
          variants={studio.variants}
          handleQuickDeltaStock={studio.handleQuickDeltaStock}
          setActiveTab={studio.setActiveTab}
        />
      )}

      {studio.activeTab === 'editor' && (
        <ProductStudioEditorTab
          name={studio.name}
          setName={studio.setName}
          description={studio.description}
          setDescription={studio.setDescription}
          categoryId={studio.categoryId}
          setCategoryId={studio.setCategoryId}
          handleCategoryChange={studio.handleCategoryChange}
          errorMessage={studio.errorMessage}
          setErrorMessage={studio.setErrorMessage}
          categories={studio.categories}
          images={studio.images}
          fileInputRef={studio.fileInputRef}
          handleDeviceFileUpload={studio.handleDeviceFileUpload}
          isProcessingFiles={studio.isProcessingFiles}
          uploadFeedback={studio.uploadFeedback}
          showUrlInput={studio.showUrlInput}
          setShowUrlInput={studio.setShowUrlInput}
          newImageUrl={studio.newImageUrl}
          setNewImageUrl={studio.setNewImageUrl}
          handleAddImageUrl={studio.handleAddImageUrl}
          handleSetPrimaryImage={studio.handleSetPrimaryImage}
          handleRemoveImage={studio.handleRemoveImage}
          isSimple={studio.isSimple}
          setIsSimple={studio.setIsSimple}
          simplePrice={studio.simplePrice}
          setSimplePrice={studio.setSimplePrice}
          simpleCompareAtPrice={studio.simpleCompareAtPrice}
          setSimpleCompareAtPrice={studio.setSimpleCompareAtPrice}
          simpleStock={studio.simpleStock}
          setSimpleStock={studio.setSimpleStock}
          simpleSku={studio.simpleSku}
          setSimpleSku={studio.setSimpleSku}
          options={studio.options}
          isAddOptionOpen={studio.isAddOptionOpen}
          setIsAddOptionOpen={studio.setIsAddOptionOpen}
          activeValuePopoverIdx={studio.activeValuePopoverIdx}
          setActiveValuePopoverIdx={studio.setActiveValuePopoverIdx}
          activeColorPhotoPopover={studio.activeColorPhotoPopover}
          setActiveColorPhotoPopover={studio.setActiveColorPhotoPopover}
          customColorInput={studio.customColorInput}
          setCustomColorInput={studio.setCustomColorInput}
          customSizeInput={studio.customSizeInput}
          setCustomSizeInput={studio.setCustomSizeInput}
          colorImageMap={studio.colorImageMap}
          setColorImageMap={studio.setColorImageMap}
          handleAddPredefinedOption={studio.handleAddPredefinedOption}
          handleRemoveOption={studio.handleRemoveOption}
          handleAddOptionValue={studio.handleAddOptionValue}
          handleRemoveOptionValue={studio.handleRemoveOptionValue}
          handleBindColorImage={studio.handleBindColorImage}
          variants={studio.variants}
          setVariants={studio.setVariants}
          setDeletedVariantKeys={studio.setDeletedVariantKeys}
          bulkPriceInput={studio.bulkPriceInput}
          setBulkPriceInput={studio.setBulkPriceInput}
          handleApplyBulkPrice={studio.handleApplyBulkPrice}
          bulkStockInput={studio.bulkStockInput}
          setBulkStockInput={studio.setBulkStockInput}
          handleApplyBulkStock={studio.handleApplyBulkStock}
          primaryImage={studio.primaryImage}
        />
      )}

      {studio.activeTab === 'settings' && (
        <ProductStudioSettingsTab
          isActive={studio.isActive}
          setIsActive={studio.setIsActive}
          isAnonymousVendor={studio.isAnonymousVendor}
          setIsAnonymousVendor={studio.setIsAnonymousVendor}
          handleDeleteProduct={studio.handleDeleteProduct}
        />
      )}

      {/* 3. Sticky Bottom Save Dock */}
      {(studio.activeTab === 'editor' || studio.activeTab === 'settings') && (
        <ProductStudioFloatingBar
          name={studio.name}
          variantsCount={studio.variantsCount}
          totalStock={studio.totalStock}
          isAnonymousVendor={studio.isAnonymousVendor}
          isDirty={studio.isDirty}
          isSaving={studio.isSaving}
          handleSaveProduct={studio.handleSaveProduct}
          setActiveTab={studio.setActiveTab}
        />
      )}
    </div>
  );
}
