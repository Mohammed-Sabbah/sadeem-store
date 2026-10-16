import React from 'react';
import type { CategoryItem } from '@/features/store/services/taxonomy.service';
import type { ProductOption, OptionDefinition } from '@/features/merchant/types/merchant.types';
import type { VariantItemState } from '../../hooks/useProductStudio';
import {
  COLOR_SWATCHES,
  PRESET_CLOTHING_SIZES,
  PRESET_SHOE_SIZES,
} from './ProductStudioTypes';
import {
  IconPackage,
  IconChevronDown,
  IconPhoto,
  IconUploadCloud,
  IconShieldCheck,
  IconPlus,
  IconPalette,
  IconRuler,
  IconSliders,
  IconCheck,
  IconX,
  IconTrash,
  IconSpark,
  IconAlertTriangle,
} from './ProductStudioIcons';

interface ProductStudioEditorTabProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  categoryId: string;
  setCategoryId: (val: string) => void;
  handleCategoryChange?: (val: string) => void;
  errorMessage?: string | null;
  setErrorMessage?: (val: string | null) => void;
  categories: CategoryItem[];
  images: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDeviceFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessingFiles: boolean;
  uploadFeedback: string | null;
  showUrlInput: boolean;
  setShowUrlInput: (val: boolean) => void;
  newImageUrl: string;
  setNewImageUrl: (val: string) => void;
  handleAddImageUrl: () => void;
  handleSetPrimaryImage: (idx: number) => void;
  handleRemoveImage: (idx: number) => void;
  isSimple: boolean;
  setIsSimple: (val: boolean) => void;
  simplePrice: number | string;
  setSimplePrice: (val: number | string) => void;
  simpleCompareAtPrice: number | string;
  setSimpleCompareAtPrice: (val: number | string) => void;
  simpleStock: number | string;
  setSimpleStock: (val: number | string) => void;
  simpleSku: string;
  setSimpleSku: (val: string) => void;
  options: ProductOption[];
  isAddOptionOpen: boolean;
  setIsAddOptionOpen: (val: boolean) => void;
  activeValuePopoverIdx: number | null;
  setActiveValuePopoverIdx: (val: number | null) => void;
  activeColorPhotoPopover: string | null;
  setActiveColorPhotoPopover: (val: string | null) => void;
  customColorInput: string;
  setCustomColorInput: (val: string) => void;
  customSizeInput: string;
  setCustomSizeInput: (val: string) => void;
  colorImageMap: Record<string, string>;
  setColorImageMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  allowedDefinitions?: OptionDefinition[];
  handleAddPredefinedOption: (type: 'COLOR' | 'SIZE' | 'CUSTOM' | OptionDefinition) => void;
  handleRemoveOption: (idx: number) => void;
  handleAddOptionValue: (optIdx: number, val?: string) => void;
  handleRemoveOptionValue: (optIdx: number, val: string) => void;
  handleBindColorImage: (color: string, img: string) => void;
  variants: VariantItemState[];
  setVariants: React.Dispatch<React.SetStateAction<VariantItemState[]>>;
  setDeletedVariantKeys: React.Dispatch<React.SetStateAction<string[]>>;
  bulkPriceInput: string;
  setBulkPriceInput: (val: string) => void;
  handleApplyBulkPrice: () => void;
  bulkStockInput: string;
  setBulkStockInput: (val: string) => void;
  handleApplyBulkStock: () => void;
  primaryImage: string;
}

export function ProductStudioEditorTab({
  name,
  setName,
  description,
  setDescription,
  categoryId,
  setCategoryId,
  handleCategoryChange,
  errorMessage,
  setErrorMessage,
  categories,
  images,
  fileInputRef,
  handleDeviceFileUpload,
  isProcessingFiles,
  uploadFeedback,
  showUrlInput,
  setShowUrlInput,
  newImageUrl,
  setNewImageUrl,
  handleAddImageUrl,
  handleSetPrimaryImage,
  handleRemoveImage,
  isSimple,
  setIsSimple,
  simplePrice,
  setSimplePrice,
  simpleCompareAtPrice,
  setSimpleCompareAtPrice,
  simpleStock,
  setSimpleStock,
  simpleSku,
  setSimpleSku,
  options,
  isAddOptionOpen,
  setIsAddOptionOpen,
  activeValuePopoverIdx,
  setActiveValuePopoverIdx,
  activeColorPhotoPopover,
  setActiveColorPhotoPopover,
  customColorInput,
  setCustomColorInput,
  customSizeInput,
  setCustomSizeInput,
  colorImageMap,
  setColorImageMap,
  allowedDefinitions = [],
  handleAddPredefinedOption,
  handleRemoveOption,
  handleAddOptionValue,
  handleRemoveOptionValue,
  handleBindColorImage,
  variants,
  setVariants,
  setDeletedVariantKeys,
  bulkPriceInput,
  setBulkPriceInput,
  handleApplyBulkPrice,
  bulkStockInput,
  setBulkStockInput,
  handleApplyBulkStock,
  primaryImage,
}: ProductStudioEditorTabProps) {
  const hasActiveVariants =
    !isSimple && (options.some((o) => o.values && o.values.length > 0) || variants.length > 0);

  const onCategoryChange = (newCatId: string) => {
    if (hasActiveVariants && newCatId !== categoryId) {
      setErrorMessage?.(
        'لا يمكن تغيير قسم الصنف طالما توجد خيارات ومقاسات محددة. يرجى حذف الخيارات الحالية أولاً أو تحويل الصنف إلى (صنف موحد) لتتمكن من تغيير القسم.'
      );
      return;
    }
    if (handleCategoryChange) {
      handleCategoryChange(newCatId);
      return;
    }
    setErrorMessage?.(null);
    setCategoryId(newCatId);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-almarai text-right">
      {/* Step 1: Basic Identity & Classification */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
        <h2 className="text-sm font-black text-brand-dark mb-4 pb-3 border-b border-brand-border/40 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
            1
          </span>
          <span>البيانات الأساسية والتصنيف</span>
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1.5">
                اسم الصنف المعروض للزبائن <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: قميص كتان سديمي ناعم"
                className="w-full h-11 px-3.5 text-base sm:text-xs font-bold rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-brand-dark">
                  التصنيف المعتمد <span className="text-red-500">*</span>
                </label>
                {hasActiveVariants && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 flex items-center gap-1 shadow-2xs">
                    <span>🔒</span>
                    <span>مقفل لوجود خيارات ومخزون</span>
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <IconPackage className="w-4 h-4 text-brand-muted absolute right-3.5 pointer-events-none" />
                <select
                  value={categoryId}
                  disabled={hasActiveVariants}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className={`w-full h-11 pr-10 pl-9 text-base sm:text-xs font-bold rounded-xl border transition-all appearance-none ${
                    hasActiveVariants
                      ? 'border-dashed border-amber-300 bg-amber-50/40 text-brand-muted cursor-not-allowed select-none'
                      : 'border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 cursor-pointer'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="w-3.5 h-3.5 text-brand-muted absolute left-3.5 pointer-events-none" />
              </div>

              {hasActiveVariants && (
                <p className="mt-1.5 text-[11px] text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70 leading-relaxed font-normal">
                  لحماية مصفوفة المقاسات ورموز التتبع (SKU) من الحذف غير المقصود، يجب حذف خيارات الصنف الحالية بالأسفل أولاً (أو تحويل الصنف إلى مفرد) لتتمكن من تغيير القسم.
                </p>
              )}

              {errorMessage && errorMessage.includes('لا يمكن تغيير قسم الصنف') && (
                <div className="mt-2.5 p-3 rounded-xl bg-red-50 text-red-800 text-xs font-bold border border-red-200/80 animate-fadeIn flex items-start justify-between gap-2 shadow-xs">
                  <div className="flex items-start gap-2">
                    <IconAlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                  {setErrorMessage && (
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      className="text-red-500 hover:text-red-800 text-xs font-black cursor-pointer shrink-0 p-0.5"
                      title="إغلاق التنبيه"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1.5">الوصف والمواصفات</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً دقيقاً للمنتج وخاماته وطريقة العناية به..."
              className="w-full p-3.5 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary transition-all resize-y"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Gallery & Media */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-brand-border/40">
          <div>
            <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                2
              </span>
              <span>معرض صور الصنف ({images.length})</span>
            </h2>
            <p className="text-[11px] text-brand-muted mt-0.5">
              اختر صور الصنف من هاتفك أو جهازك. الصورة الأولى ستكون غلاف الصنف الرئيسي.
            </p>
          </div>

          {uploadFeedback && (
            <span className="text-[11px] font-bold text-brand-trust bg-brand-trust-soft px-3 py-1 rounded-lg border border-brand-trust/30 flex items-center gap-1 self-start sm:self-auto animate-fadeIn">
              <IconCheck className="w-3.5 h-3.5" />
              <span>{uploadFeedback}</span>
            </span>
          )}
        </div>

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleDeviceFileUpload}
        />

        {/* Upload Zone & Thumbnails */}
        <div className="space-y-4">
          {images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-brand-border/90 hover:border-brand-primary/70 bg-brand-surface/40 hover:bg-brand-surface/70 rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-primary-soft text-brand-primary mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-2xs">
                <IconPhoto className="w-6 h-6" />
              </div>
              <div className="text-xs sm:text-sm font-black text-brand-dark mb-1">
                اضغط لاختيار صور من هاتفك أو جهازك (أو اسحبها هنا)
              </div>
              <p className="text-[11px] text-brand-muted max-w-sm mx-auto leading-relaxed">
                يدعم صور JPG, PNG, WEBP بدقة عالية · يمكنك اختيار عدة صور معاً
              </p>
              <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-card border border-brand-border/70 text-[10px] font-bold text-brand-muted">
                <IconUploadCloud className="w-3.5 h-3.5 text-brand-primary" />
                <span>واجهة مهيأة للربط التلقائي بخدمة الرفع السحابي</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-2xl overflow-hidden border group bg-brand-surface shadow-2xs transition-all ${
                    idx === 0
                      ? 'border-brand-primary ring-2 ring-brand-primary/25'
                      : 'border-brand-border/80'
                  }`}
                >
                  <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />

                  {/* Primary Cover Badge */}
                  {idx === 0 ? (
                    <span className="absolute bottom-1.5 right-1.5 bg-brand-primary text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 select-none">
                      <span className="text-[9px]">★</span>
                      <span>الغلاف الرئيسي</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(idx)}
                      className="absolute bottom-1.5 right-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 bg-black/75 hover:bg-black sm:bg-white/95 sm:hover:bg-white text-white sm:text-brand-dark text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 backdrop-blur-xs select-none"
                      title="تعيين كغلاف رئيسي للمنتج"
                    >
                      <span className="text-[9px] text-amber-300 sm:text-amber-600">☆</span>
                      <span>تعيين كغلاف</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer shadow-xs active:scale-90"
                    title="حذف الصورة من المعرض"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add more button tile in the grid */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFiles}
                className="aspect-square rounded-2xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/30 hover:bg-brand-surface/60 flex flex-col items-center justify-center gap-1.5 text-brand-muted hover:text-brand-primary transition-all cursor-pointer active:scale-95 group"
              >
                <IconPhoto className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">+ صور أخرى</span>
              </button>
            </div>
          )}

          {/* Sub-bar: Upload Status & Secondary URL input toggle */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-brand-border/30">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-bold border border-brand-border/70 flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
              >
                <IconUploadCloud className="w-3.5 h-3.5 text-brand-primary" />
                <span>اختيار صور من الجهاز</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-brand-muted hover:text-brand-primary underline transition-colors cursor-pointer"
              >
                {showUrlInput ? 'إخفاء حقل الرابط' : 'أو إضافة رابط صورة من الإنترنت (URL)'}
              </button>
            </div>

            <div className="text-[10px] text-brand-muted flex items-center gap-1">
              <IconShieldCheck className="w-3.5 h-3.5 text-brand-trust" />
              <span>الصور تُحفظ وتُعرض بجودة محسّنة لشبكات غزة</span>
            </div>
          </div>

          {/* Secondary URL Field */}
          {showUrlInput && (
            <div className="p-3 bg-brand-surface/40 rounded-xl border border-brand-border/60 flex items-center gap-2 animate-fadeIn">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="الصق رابط صورة مباشر (https://...)"
                className="flex-1 h-9 px-3 text-base sm:text-xs rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={!newImageUrl.trim()}
                className="h-9 px-3.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                إضافة الرابط
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Product Structure Decision */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs">
        <h2 className="text-sm font-black text-brand-dark mb-4 pb-3 border-b border-brand-border/40 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
            3
          </span>
          <span>نوع الصنف وطبيعة خياراته</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div
            onClick={() => {
              setIsSimple(true);
              if (errorMessage?.includes('لا يمكن تغيير قسم الصنف')) {
                setErrorMessage?.(null);
              }
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
              isSimple
                ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
            }`}
          >
            <div className="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center border-brand-primary">
              {isSimple && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
            </div>
            <div>
              <div className="text-xs font-black text-brand-dark">بدون خيارات (سعر ومخزون موحد)</div>
              <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                الصنف يتوفر بنوع واحد فقط بدون مقاسات أو ألوان (مثل: عسل سدر، ساعة، حقيبة، شال مفرد).
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsSimple(false)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
              !isSimple
                ? 'border-brand-primary bg-brand-primary-soft/40 shadow-xs ring-2 ring-brand-primary/20'
                : 'border-brand-border/70 bg-brand-surface/30 hover:bg-brand-surface'
            }`}
          >
            <div className="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center border-brand-primary">
              {!isSimple && <div className="w-2 h-2 rounded-full bg-brand-primary" />}
            </div>
            <div>
              <div className="text-xs font-black text-brand-dark">خيارات متعددة (مقاسات أو ألوان)</div>
              <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                الصنف يتوفر بعدة ألوان أو مقاسات مختلفة (مثل: ملابس، عبايات، أحذية).
              </div>
            </div>
          </div>
        </div>

        {/* If Simple Product: Instant Clean Form */}
        {isSimple && (
          <div className="mt-4 p-4 rounded-xl bg-brand-surface/40 border border-brand-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fadeIn">
            <div>
              <label className="block text-[10px] font-bold text-brand-muted mb-1">
                سعر البيع (₪) *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={simplePrice}
                onChange={(e) => setSimplePrice(e.target.value)}
                className="w-full h-10 px-2.5 text-base sm:text-xs font-black rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-muted mb-1">
                السعر السابق (₪)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={simpleCompareAtPrice}
                onChange={(e) => setSimpleCompareAtPrice(e.target.value)}
                placeholder="اختياري"
                className="w-full h-10 px-2.5 text-base sm:text-xs rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-muted mb-1">
                الكمية المتوفرة (قطع) *
              </label>
              <input
                type="number"
                min="0"
                value={simpleStock}
                onChange={(e) => setSimpleStock(e.target.value)}
                className="w-full h-10 px-2.5 text-base sm:text-xs font-black rounded-xl border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-muted mb-1">
                رمز SKU (معرف التتبع المخزني)
              </label>
              <div
                className="w-full h-10 px-2.5 rounded-xl border border-brand-border/60 bg-brand-surface/60 flex items-center justify-between select-none"
                title="رمز تتبع المستودع والباركود يولّد تلقائياً من النظام لضمان دقة فرز الشحنة الموحدة"
              >
                <span className="font-mono text-xs font-bold text-brand-dark truncate">
                  {simpleSku || 'SDM-PROD-AUTO'}
                </span>
                <span className="text-[9px] font-bold text-brand-muted bg-brand-card px-1.5 py-0.5 rounded border border-brand-border/60 shrink-0">
                  توليد آلي
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* If Multi-Variant Product: Frictionless, Human-Friendly Flow */}
      {!isSimple && (
        <div className="space-y-6">
          {/* Step 4: Options Builder */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border/50">
              <div>
                <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                    4
                  </span>
                  <span>خيارات ومقاسات الصنف</span>
                </h2>
                <p className="text-[11px] text-brand-muted mt-0.5">
                  حدد المقاسات أو الألوان. يمكنك تخصيص صورة لكل لون مباشرة بالضغط على مصغرة صورته.
                </p>
              </div>

              {/* Bespoke Apple Add Option Popover */}
              <div className="relative inline-flex items-center self-start sm:self-auto" data-popover>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOptionOpen(!isAddOptionOpen);
                    setActiveValuePopoverIdx(null);
                    setActiveColorPhotoPopover(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                >
                  <IconPlus className="w-3.5 h-3.5 text-white" />
                  <span>إضافة خيار جديد</span>
                  <IconChevronDown
                    className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
                      isAddOptionOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isAddOptionOpen && (
                  <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-72 max-w-[calc(100vw-2.5rem)] bg-brand-card/95 backdrop-blur-2xl rounded-2xl border border-brand-border shadow-xl p-1.5 z-50 animate-fadeIn space-y-1 max-h-80 overflow-y-auto no-scrollbar">
                    {allowedDefinitions && allowedDefinitions.length > 0 ? (
                      allowedDefinitions.map((def) => {
                        const isColor = def.type === 'COLOR' || def.key === 'color';
                        const isAlreadyAdded = options.some(
                          (o) =>
                            o.key === def.key ||
                            o.name === def.label ||
                            o.label === def.label ||
                            (isColor && (o.type === 'COLOR' || o.name === 'اللون'))
                        );

                        if (isAlreadyAdded) return null;

                        return (
                          <button
                            key={def.key}
                            type="button"
                            onClick={() => {
                              handleAddPredefinedOption(def);
                              setIsAddOptionOpen(false);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-brand-surface flex items-start gap-2.5 text-right transition-colors cursor-pointer"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isColor
                                  ? 'bg-brand-primary/10 text-brand-primary'
                                  : def.key.includes('size')
                                  ? 'bg-brand-trust/10 text-brand-trust'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {isColor ? (
                                <IconPalette className="w-4 h-4" />
                              ) : def.key.includes('size') ? (
                                <IconRuler className="w-4 h-4" />
                              ) : (
                                <IconSliders className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-brand-dark flex items-center justify-between">
                                <span>{def.label}</span>
                                {def.unit && (
                                  <span className="text-[10px] text-brand-muted font-normal bg-brand-surface px-1.5 py-0.5 rounded">
                                    {def.unit}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-brand-muted truncate">
                                {def.values && def.values.length > 0
                                  ? def.values.slice(0, 4).map((v) => (typeof v === 'string' ? v : v.label || v.key)).join('، ')
                                  : 'إضافة خيارات وقيم مخصصة'}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <>
                        {!options.some((o) => o.type === 'COLOR' || o.name === 'اللون') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddPredefinedOption('COLOR');
                              setIsAddOptionOpen(false);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-brand-surface flex items-start gap-2.5 text-right transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                              <IconPalette className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-brand-dark">الألوان (Colors)</div>
                              <div className="text-[10px] text-brand-muted">إضافة ألوان مع ربط صور مخصصة لكل لون</div>
                            </div>
                          </button>
                        )}

                        {!options.some((o) => o.type === 'SIZE' || o.name === 'المقاس') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddPredefinedOption('SIZE');
                              setIsAddOptionOpen(false);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-brand-surface flex items-start gap-2.5 text-right transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-trust/10 text-brand-trust flex items-center justify-center shrink-0 mt-0.5">
                              <IconRuler className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-brand-dark">المقاسات (Sizes)</div>
                              <div className="text-[10px] text-brand-muted">مقاسات ملابس (S, M, L) أو أحذية (38-45)</div>
                            </div>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        handleAddPredefinedOption('CUSTOM');
                        setIsAddOptionOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-brand-surface flex items-start gap-2.5 text-right transition-colors cursor-pointer border-t border-brand-border/40 mt-1 pt-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <IconSliders className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-brand-dark">خيار مخصص آخر</div>
                        <div className="text-[10px] text-brand-muted">مثل الحجم، الخامة، أو نوع التغليف</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabular Options List */}
            {options.length === 0 ? (
              <div className="py-8 text-center bg-brand-surface/20 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                اختر «+ إضافة خيار جديد» أعلاه لتحديد المقاسات أو الألوان
              </div>
            ) : (
              <div className="divide-y divide-brand-border/50">
                {options.map((opt, optIdx) => {
                  const matchingDef = allowedDefinitions?.find(
                    (d) => d.key === opt.key || d.label === opt.name
                  );
                  const isColor =
                    opt.type === 'COLOR' ||
                    opt.name === 'اللون' ||
                    matchingDef?.type === 'COLOR' ||
                    matchingDef?.key === 'color';
                  const isShoeSize =
                    matchingDef?.key === 'size_shoes' ||
                    opt.name.includes('حذاء') ||
                    opt.name.includes('أحذية');
                  const isKidsSize =
                    matchingDef?.key === 'size_kids' || opt.name.includes('أطفال');
                  const isClothingSize =
                    matchingDef?.key === 'size_clothing' ||
                    (!isShoeSize &&
                      !isKidsSize &&
                      (opt.name.includes('ملابس') ||
                        (opt.name.includes('مقاس') && !matchingDef)));
                  const isSize =
                    opt.type === 'SIZE' ||
                    opt.name.includes('مقاس') ||
                    isShoeSize ||
                    isKidsSize ||
                    isClothingSize ||
                    matchingDef?.key?.includes('size');
                  const hasCustomPresets = Boolean(
                    matchingDef?.values && matchingDef.values.length > 0 && !isColor && !isSize
                  );

                  return (
                    <div
                      key={optIdx}
                      className="py-4 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3.5"
                    >
                      {/* 1. Fixed Anchor Section */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-brand-dark min-w-14">
                            {opt.name || opt.label}
                          </span>
                          <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border/60">
                            {opt.values.length} {isColor ? 'ألوان' : isSize ? 'مقاسات' : 'قيم'}
                          </span>
                        </div>

                        {/* Value Popover Button */}
                        <div className="relative inline-flex items-center" data-popover>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveValuePopoverIdx(
                                activeValuePopoverIdx === optIdx ? null : optIdx
                              );
                              setIsAddOptionOpen(false);
                              setActiveColorPhotoPopover(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl border border-brand-primary/40 bg-brand-primary-soft text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-2xs active:scale-[0.98] cursor-pointer group"
                          >
                            <IconPlus className="w-3 h-3 text-brand-primary group-hover:text-white transition-colors" />
                            <span>{isColor ? 'إضافة لون...' : isSize ? 'إضافة مقاس...' : 'إضافة قيمة...'}</span>
                            <IconChevronDown
                              className={`w-3 h-3 text-brand-primary group-hover:text-white transition-transform duration-200 ${
                                activeValuePopoverIdx === optIdx ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Popover Content */}
                          {activeValuePopoverIdx === optIdx && (
                            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-brand-card/95 backdrop-blur-2xl rounded-2xl border border-brand-border shadow-xl p-3 z-50 animate-fadeIn space-y-3">
                              {isColor && (
                                <>
                                  <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/40 text-[11px] font-bold text-brand-dark">
                                    <span className="flex items-center gap-1.5">
                                      <IconPalette className="w-3.5 h-3.5 text-brand-primary" />
                                      <span>لوحة الألوان الجاهزة</span>
                                    </span>
                                    <span className="text-[10px] text-brand-muted font-normal">اختر للتضمين فورياً</span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto no-scrollbar py-0.5">
                                    {Object.entries(COLOR_SWATCHES).map(([colName, swatch]) => {
                                      const isSelected = opt.values.includes(colName);
                                      return (
                                        <button
                                          key={colName}
                                          type="button"
                                          onClick={() => {
                                            if (isSelected) {
                                              handleRemoveOptionValue(optIdx, colName);
                                            } else {
                                              handleAddOptionValue(optIdx, colName);
                                            }
                                          }}
                                          className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-right transition-all cursor-pointer active:scale-95 ${
                                            isSelected
                                              ? 'border-brand-primary bg-brand-primary-soft/50 text-brand-dark font-black shadow-xs'
                                              : 'border-brand-border/60 hover:bg-brand-surface text-brand-muted hover:text-brand-dark'
                                          }`}
                                        >
                                          <span
                                            className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                                            style={{
                                              backgroundColor: swatch.hex,
                                              border: swatch.border ? '1px solid #D1D5DB' : 'none',
                                            }}
                                          />
                                          <span className="text-xs truncate flex-1">{colName}</span>
                                          {isSelected && <IconCheck className="w-3 h-3 text-brand-primary shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <div className="pt-2 border-t border-brand-border/40 flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={customColorInput}
                                      onChange={(e) => setCustomColorInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (customColorInput.trim()) {
                                            handleAddOptionValue(optIdx, customColorInput.trim());
                                            setCustomColorInput('');
                                          }
                                        }
                                      }}
                                      placeholder="أو اكتب لوناً مخصصاً (مثال: بترولي)..."
                                      className="flex-1 h-8 px-2.5 text-xs rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (customColorInput.trim()) {
                                          handleAddOptionValue(optIdx, customColorInput.trim());
                                          setCustomColorInput('');
                                        }
                                      }}
                                      disabled={!customColorInput.trim()}
                                      className="h-8 px-3 text-[11px] font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                                    >
                                      إضافة
                                    </button>
                                  </div>
                                </>
                              )}

                              {isSize && (
                                <>
                                  {(isClothingSize || (!isShoeSize && !isKidsSize)) && (
                                    <div className="space-y-2">
                                      <div className="text-[11px] font-bold text-brand-dark flex items-center justify-between pb-1 border-b border-brand-border/40">
                                        <span className="flex items-center gap-1">
                                          <IconRuler className="w-3.5 h-3.5 text-brand-primary" />
                                          <span>مقاسات الملابس</span>
                                        </span>
                                        <span className="text-[10px] text-brand-muted font-normal">S إلى 3XL</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {PRESET_CLOTHING_SIZES.map((sz) => {
                                          const isSelected = opt.values.includes(sz);
                                          return (
                                            <button
                                              key={sz}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  handleRemoveOptionValue(optIdx, sz);
                                                } else {
                                                  handleAddOptionValue(optIdx, sz);
                                                }
                                              }}
                                              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary-soft/60 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/70 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{sz}</span>
                                              {isSelected && <IconCheck className="w-2.5 h-2.5 text-brand-primary" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {(isShoeSize || (!isClothingSize && !isKidsSize)) && (
                                    <div className="space-y-2 pt-1">
                                      <div className="text-[11px] font-bold text-brand-dark flex items-center justify-between pb-1 border-b border-brand-border/40">
                                        <span>مقاسات الأحذية</span>
                                        <span className="text-[10px] text-brand-muted font-normal">38 إلى 45</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {['38', ...PRESET_SHOE_SIZES].map((sz) => {
                                          const isSelected = opt.values.includes(sz);
                                          return (
                                            <button
                                              key={sz}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  handleRemoveOptionValue(optIdx, sz);
                                                } else {
                                                  handleAddOptionValue(optIdx, sz);
                                                }
                                              }}
                                              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary-soft/60 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/70 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{sz}</span>
                                              {isSelected && <IconCheck className="w-2.5 h-2.5 text-brand-primary" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {isKidsSize && (
                                    <div className="space-y-2 pt-1">
                                      <div className="text-[11px] font-bold text-brand-dark flex items-center justify-between pb-1 border-b border-brand-border/40">
                                        <span>مقاسات الأطفال والشهور</span>
                                        <span className="text-[10px] text-brand-muted font-normal">أعمار وشهور</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {['0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y'].map((sz) => {
                                          const isSelected = opt.values.includes(sz);
                                          return (
                                            <button
                                              key={sz}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  handleRemoveOptionValue(optIdx, sz);
                                                } else {
                                                  handleAddOptionValue(optIdx, sz);
                                                }
                                              }}
                                              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary-soft/60 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/70 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{sz}</span>
                                              {isSelected && <IconCheck className="w-2.5 h-2.5 text-brand-primary" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-brand-border/40 flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={customSizeInput}
                                      onChange={(e) => setCustomSizeInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (customSizeInput.trim()) {
                                            handleAddOptionValue(optIdx, customSizeInput.trim());
                                            setCustomSizeInput('');
                                          }
                                        }
                                      }}
                                      placeholder="أو اكتب مقاساً مخصصاً (مثال: 4XL أو 100ml)..."
                                      className="flex-1 h-8 px-2.5 text-xs rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (customSizeInput.trim()) {
                                          handleAddOptionValue(optIdx, customSizeInput.trim());
                                          setCustomSizeInput('');
                                        }
                                      }}
                                      disabled={!customSizeInput.trim()}
                                      className="h-8 px-3 text-[11px] font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                                    >
                                      إضافة
                                    </button>
                                  </div>
                                </>
                              )}

                              {!isColor && !isSize && (
                                <div className="space-y-2.5">
                                  {hasCustomPresets && matchingDef?.values && (
                                    <div className="space-y-1.5">
                                      <div className="text-[11px] font-bold text-brand-dark flex items-center justify-between pb-1 border-b border-brand-border/40">
                                        <span>قيم «{matchingDef.label}» الشائعة</span>
                                        {matchingDef.unit && (
                                          <span className="text-[10px] text-brand-muted font-normal bg-brand-surface px-1.5 py-0.5 rounded">
                                            {matchingDef.unit}
                                          </span>
                                        )}
                                      </div>
                                       <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto py-0.5">
                                        {matchingDef.values.map((valItem) => {
                                          const val = typeof valItem === 'string' ? valItem : valItem.label || valItem.key;
                                          const isSelected = opt.values.includes(val);
                                          return (
                                            <button
                                              key={val}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  handleRemoveOptionValue(optIdx, val);
                                                } else {
                                                  handleAddOptionValue(optIdx, val);
                                                }
                                              }}
                                              className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                                isSelected
                                                  ? 'border-brand-primary bg-brand-primary-soft/60 text-brand-dark font-black shadow-xs'
                                                  : 'border-brand-border/70 hover:bg-brand-surface text-brand-dark'
                                              }`}
                                            >
                                              <span>{val}</span>
                                              {isSelected && <IconCheck className="w-2.5 h-2.5 text-brand-primary" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div className="text-[11px] font-bold text-brand-dark pb-1 border-b border-brand-border/40">
                                    {hasCustomPresets ? 'أو اكتب قيمة مخصصة' : 'إضافة قيمة لهذا الخيار'}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={customSizeInput}
                                      onChange={(e) => setCustomSizeInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (customSizeInput.trim()) {
                                            handleAddOptionValue(optIdx, customSizeInput.trim());
                                            setCustomSizeInput('');
                                          }
                                        }
                                      }}
                                      placeholder="اكتب القيمة..."
                                      className="flex-1 h-8 px-2.5 text-xs rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:border-brand-primary"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (customSizeInput.trim()) {
                                          handleAddOptionValue(optIdx, customSizeInput.trim());
                                          setCustomSizeInput('');
                                        }
                                      }}
                                      disabled={!customSizeInput.trim()}
                                      className="h-8 px-3 text-[11px] font-bold bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40 cursor-pointer"
                                    >
                                      إضافة
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Middle Section: Selected Values Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                        {opt.values.length === 0 ? (
                          <span className="text-[11px] text-brand-muted/70 italic">
                            لم يتم تحديد أي {isColor ? 'ألوان' : isSize ? 'مقاسات' : 'قيم'} بعد.
                          </span>
                        ) : (
                          opt.values.map((val) => {
                            const boundImg = isColor ? colorImageMap[val] || images[0] : null;

                            return (
                              <div
                                key={val}
                                className="inline-flex items-center gap-1.5 bg-brand-surface/70 hover:bg-brand-surface text-brand-dark pr-2 pl-2.5 py-1 rounded-xl border border-brand-border/70 text-xs font-bold transition-all shadow-2xs group"
                              >
                                {isColor && (
                                  <div className="relative inline-flex items-center" data-popover>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveColorPhotoPopover(
                                          activeColorPhotoPopover === val ? null : val
                                        );
                                        setIsAddOptionOpen(false);
                                        setActiveValuePopoverIdx(null);
                                      }}
                                      className="relative w-5 h-5 rounded-md overflow-hidden border border-brand-border/80 shrink-0 hover:scale-110 transition-transform cursor-pointer shadow-2xs group/thumb"
                                      title={`تغيير صورة هذا اللون: ${val}`}
                                    >
                                      <img
                                        src={boundImg || primaryImage}
                                        alt={val}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                        <IconPhoto className="w-3 h-3 text-white" />
                                      </div>
                                    </button>

                                    {activeColorPhotoPopover === val && (
                                      <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2.5rem)] bg-brand-card/95 backdrop-blur-2xl rounded-2xl border border-brand-border shadow-xl p-3 z-50 animate-fadeIn space-y-2.5">
                                        <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/40 text-[11px] font-bold text-brand-dark">
                                          <span className="flex items-center gap-1">
                                            <IconPhoto className="w-3.5 h-3.5 text-brand-primary" />
                                            <span>صورة لون «{val}»</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setActiveColorPhotoPopover(null)}
                                            className="text-brand-muted hover:text-brand-dark cursor-pointer"
                                          >
                                            <IconX className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {images.length === 0 ? (
                                          <div className="py-4 text-center text-[11px] text-brand-muted">
                                            لا توجد صور في المعرض بعد. أضف صوراً في الخطوة 2 أولاً.
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar py-1">
                                            {images.map((imgUrl, imgI) => {
                                              const isAssigned =
                                                colorImageMap[val] === imgUrl ||
                                                (!colorImageMap[val] && imgI === 0);
                                              return (
                                                <button
                                                  key={imgI}
                                                  type="button"
                                                  onClick={() => {
                                                    handleBindColorImage(val, imgUrl);
                                                    setActiveColorPhotoPopover(null);
                                                  }}
                                                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group/item ${
                                                    isAssigned
                                                      ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                                                      : 'border-brand-border/70 hover:border-brand-primary/50'
                                                  }`}
                                                >
                                                  <img
                                                    src={imgUrl}
                                                    alt={`صورة ${imgI + 1}`}
                                                    className="w-full h-full object-cover"
                                                  />
                                                  {isAssigned && (
                                                    <div className="absolute inset-0 bg-brand-primary/25 flex items-center justify-center">
                                                      <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-xs">
                                                        <IconCheck className="w-3 h-3" />
                                                      </span>
                                                    </div>
                                                  )}
                                                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded">
                                                    {imgI === 0 ? 'الغلاف' : `#${imgI + 1}`}
                                                  </span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {colorImageMap[val] && (
                                          <div className="pt-1.5 border-t border-brand-border/40">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const nextMap = { ...colorImageMap };
                                                delete nextMap[val];
                                                setColorImageMap(nextMap);
                                                setActiveColorPhotoPopover(null);
                                              }}
                                              className="w-full py-1 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-center"
                                            >
                                              إلغاء التخصيص (استخدام الغلاف)
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <span>{val}</span>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionValue(optIdx, val)}
                                  className="text-brand-muted hover:text-red-600 transition-colors cursor-pointer text-xs leading-none mr-0.5"
                                  title="إزالة هذه القيمة"
                                >
                                  <IconX className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* 3. Left side: Delete Option Action */}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optIdx)}
                        className="text-xs text-brand-muted hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0 self-end md:self-auto py-1"
                        title="إزالة هذا الخيار بالكامل"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">إزالة الخيار</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 5: Generated Combinations List (Matrix) */}
          <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4">
            <div className="pb-3 border-b border-brand-border/40">
              <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
                  5
                </span>
                <span>قائمة المقاسات والأصناف المتوفرة ({variants.length})</span>
              </h2>
              <p className="text-[11px] text-brand-muted mt-0.5">
                تتولد التوليفات تلقائياً من الخيارات المحددة. يمكنك توحيد الأسعار والكميات بنقرة واحدة، أو تعديل كل مقاس بشكل منفصل.
              </p>
            </div>

            {/* Prominent Fast Bulk Operations Banner */}
            {variants.length > 0 && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-brand-surface/70 border border-brand-primary/25 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 text-brand-dark">
                    <span className="w-6 h-6 rounded-lg bg-brand-primary/15 text-brand-primary flex items-center justify-center shrink-0">
                      <IconSpark className="w-3.5 h-3.5 text-brand-primary" />
                    </span>
                    <span className="text-xs font-black text-brand-dark">
                      لوحة الإجراءات السريعة (تطبيق موحد على جميع الأصناف الـ {variants.length})
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-muted font-medium">
                    وفر وقتك: حدد سعراً أو مخزوناً ليتم تطبيقه فورياً على كافة التوليفات
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Bulk Price Capsule */}
                  <div className="flex items-center gap-2 bg-brand-card p-1.5 pr-3 rounded-xl border border-brand-border/80 shadow-2xs">
                    <span className="text-xs font-black text-brand-muted shrink-0">السعر الموحد:</span>
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span className="text-xs font-bold text-brand-primary">₪</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="مثال: 45"
                        value={bulkPriceInput}
                        onChange={(e) => setBulkPriceInput(e.target.value)}
                        className="w-full h-8 text-xs font-black text-brand-dark bg-transparent focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyBulkPrice}
                      disabled={!bulkPriceInput}
                      className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary-hover active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-2xs"
                    >
                      تطبيق على الكل
                    </button>
                  </div>

                  {/* Bulk Stock Capsule */}
                  <div className="flex items-center gap-2 bg-brand-card p-1.5 pr-3 rounded-xl border border-brand-border/80 shadow-2xs">
                    <span className="text-xs font-black text-brand-muted shrink-0">المخزون الموحد:</span>
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <IconPackage className="w-3.5 h-3.5 text-brand-trust shrink-0" />
                      <input
                        type="number"
                        min="0"
                        placeholder="مثال: 12"
                        value={bulkStockInput}
                        onChange={(e) => setBulkStockInput(e.target.value)}
                        className="w-full h-8 text-xs font-black text-brand-dark bg-transparent focus:outline-none px-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyBulkStock}
                      disabled={!bulkStockInput}
                      className="px-3.5 py-1.5 bg-brand-trust text-white text-xs font-bold rounded-lg hover:bg-brand-trust/90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-2xs"
                    >
                      تطبيق على الكل
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Streamlined Variants Table / List */}
            {variants.length === 0 ? (
              <div className="text-center py-8 bg-brand-surface/30 rounded-xl border border-dashed border-brand-border/80 text-xs text-brand-muted">
                أضف قيم المقاسات أو الألوان في الخطوة 4 أعلاه لتوليد القائمة فورياً
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table Header (Desktop Only) */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-black text-brand-muted border-b border-brand-border/40">
                  <div className="col-span-4">الصنف والتوليفة</div>
                  <div className="col-span-3">رمز SKU</div>
                  <div className="col-span-2">سعر البيع</div>
                  <div className="col-span-2">المخزون بالمستودع</div>
                  <div className="col-span-1 text-center">الإجراء</div>
                </div>

                {/* Variants Rows */}
                <div className="divide-y divide-brand-border/40 space-y-2 md:space-y-0">
                  {variants.map((v, vIdx) => {
                    const attrEntries = Object.entries(v.attributes || {});
                    const attrSummary = attrEntries.map(([_, val]) => val).join(' · ') || 'افتراضي';
                    const variantPhoto = v.images && v.images.length > 0 ? v.images[0] : primaryImage;

                    return (
                      <div
                        key={v.attrKey || vIdx}
                        className={`p-3 md:py-2.5 md:px-3 rounded-xl md:rounded-none transition-all ${
                          v.isActive
                            ? 'bg-brand-surface/20 md:bg-transparent hover:bg-brand-surface/40'
                            : 'bg-zinc-50/70 md:bg-zinc-50/40 opacity-60'
                        }`}
                      >
                        {/* Desktop Grid Row */}
                        <div className="hidden md:grid grid-cols-12 items-center gap-3">
                          {/* Col 1-4: Thumbnail & Attributes */}
                          <div className="col-span-4 flex items-center gap-2.5">
                            <img
                              src={variantPhoto}
                              alt={attrSummary}
                              className="w-9 h-9 rounded-xl object-cover border border-brand-border/70 shrink-0 bg-brand-surface shadow-2xs"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-black text-brand-dark truncate">{attrSummary}</div>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {attrEntries.map(([key, val]) => (
                                  <span
                                    key={key}
                                    className="inline-flex items-center text-[10px] text-brand-muted bg-brand-surface px-1.5 py-0.2 rounded border border-brand-border/50"
                                  >
                                    {val}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Col 5-7: SKU */}
                          <div className="col-span-3">
                            <span className="font-mono text-[10px] text-brand-muted bg-brand-surface px-2 py-0.5 rounded-md border border-brand-border/60">
                              {v.sku}
                            </span>
                          </div>

                          {/* Col 8-9: Price */}
                          <div className="col-span-2">
                            <div className="relative inline-flex items-center">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, price: Number(e.target.value) || 0 };
                                  setVariants(updated);
                                }}
                                className="w-20 h-8 pr-2 pl-5 text-xs font-black rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                              />
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-muted pointer-events-none">
                                ₪
                              </span>
                            </div>
                          </div>

                          {/* Col 10-11: Stepper */}
                          <div className="col-span-2">
                            <div className="inline-flex items-center h-8 bg-brand-card rounded-lg border border-brand-border/70 px-1 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, stock: Math.max(0, v.stock - 1) };
                                  setVariants(updated);
                                }}
                                className="w-5 h-5 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx] = {
                                    ...v,
                                    stock: Math.max(0, parseInt(e.target.value) || 0),
                                  };
                                  setVariants(updated);
                                }}
                                className="w-9 text-center font-black text-xs bg-transparent focus:outline-none tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, stock: v.stock + 1 };
                                  setVariants(updated);
                                }}
                                className="w-5 h-5 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Col 12: Actions (Tactile Active Switch + Trash) */}
                          <div className="col-span-1 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={v.isActive}
                              onClick={() => {
                                const updated = [...variants];
                                updated[vIdx] = { ...v, isActive: !v.isActive };
                                setVariants(updated);
                              }}
                              className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                v.isActive ? 'bg-brand-trust' : 'bg-brand-border'
                              }`}
                              title={v.isActive ? 'نشط ومتاح للطلب - انقر للتعطيل' : 'معطل مؤقتاً - انقر للتفعيل'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  v.isActive ? '-translate-x-3.5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeletedVariantKeys((prev) => [...prev, v.attrKey]);
                                setVariants((prev) => prev.filter((_, idx) => idx !== vIdx));
                              }}
                              className="text-brand-muted hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="حذف هذا الصنف المحدد"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Responsive Layout */}
                        <div className="md:hidden space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={variantPhoto}
                                alt={attrSummary}
                                className="w-10 h-10 rounded-xl object-cover border border-brand-border/70 shrink-0 bg-brand-surface shadow-2xs"
                              />
                              <div>
                                <div className="text-xs font-black text-brand-dark">{attrSummary}</div>
                                <div className="text-[10px] text-brand-muted font-mono">{v.sku}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={v.isActive}
                                onClick={() => {
                                  const updated = [...variants];
                                  updated[vIdx] = { ...v, isActive: !v.isActive };
                                  setVariants(updated);
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  v.isActive ? 'bg-brand-trust' : 'bg-brand-border'
                                }`}
                                title={v.isActive ? 'نشط ومتاح للطلب - انقر للتعطيل' : 'معطل مؤقتاً - انقر للتفعيل'}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                    v.isActive ? '-translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeletedVariantKeys((prev) => [...prev, v.attrKey]);
                                  setVariants((prev) => prev.filter((_, idx) => idx !== vIdx));
                                }}
                                className="text-brand-muted hover:text-red-600 p-1 cursor-pointer"
                                title="حذف الصنف"
                              >
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-brand-border/30">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-brand-muted font-bold">السعر:</span>
                              <div className="relative inline-flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={v.price}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx] = { ...v, price: Number(e.target.value) || 0 };
                                    setVariants(updated);
                                  }}
                                  className="w-20 h-8 pr-2 pl-4 text-xs font-black rounded-lg border border-brand-border/70 bg-brand-card text-brand-dark focus:outline-none focus:border-brand-primary"
                                />
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted pointer-events-none">
                                  ₪
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-brand-muted font-bold">المخزون:</span>
                              <div className="inline-flex items-center h-8 bg-brand-card rounded-lg border border-brand-border/70 px-1 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...variants];
                                    updated[vIdx] = { ...v, stock: Math.max(0, v.stock - 1) };
                                    setVariants(updated);
                                  }}
                                  className="w-6 h-6 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stock}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx] = {
                                      ...v,
                                      stock: Math.max(0, parseInt(e.target.value) || 0),
                                    };
                                    setVariants(updated);
                                  }}
                                  className="w-10 text-center font-black text-xs bg-transparent focus:outline-none tabular-nums"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...variants];
                                    updated[vIdx] = { ...v, stock: v.stock + 1 };
                                    setVariants(updated);
                                  }}
                                  className="w-6 h-6 rounded bg-brand-surface hover:bg-brand-border/40 text-brand-dark font-black text-xs flex items-center justify-center cursor-pointer active:scale-90"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
