'use client';

import React from 'react';
import type { CategoryVariantAttribute } from '@/features/store/services/taxonomy.service';
import type { VariantRowState } from '../../types/product-studio.types';
import type { useVariantMatrix } from '../../hooks/useVariantMatrix';
import { COLOR_SWATCHES } from '../../types/product-studio.types';
import { getAttributeKey, getAttributeDisplayName, isColorAttribute } from '@/shared/lib/attributeUtils';

interface ProductPricingAndOptionsCardProps {
  hasVariantsUnderTheHood: boolean;
  basePrice: number | '';
  setBasePrice: (val: number | '') => void;
  baseStock: number | '';
  setBaseStock: (val: number | '') => void;
  categorySupportsVariants: boolean;
  availableUnusedAttributes: (string | CategoryVariantAttribute)[];
  categoryAttributes: CategoryVariantAttribute[];
  matrix: ReturnType<typeof useVariantMatrix>;
  onRemoveVariantRow: (index: number) => void;
  onOpenGalleryPicker: (rowIndex: number) => void;
  onOpenAddSingleModal: () => void;
}

export function ProductPricingAndOptionsCard({
  hasVariantsUnderTheHood,
  basePrice,
  setBasePrice,
  baseStock,
  setBaseStock,
  categorySupportsVariants,
  availableUnusedAttributes,
  categoryAttributes,
  matrix,
  onRemoveVariantRow,
  onOpenGalleryPicker,
  onOpenAddSingleModal,
}: ProductPricingAndOptionsCardProps) {
  const {
    activeOptionKeys,
    selectedAttributeValues,
    variantsRows,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    openDropdownKey,
    setOpenDropdownKey,
    dropdownSearch,
    setDropdownSearch,
    customPopoverAttrKey,
    setCustomPopoverAttrKey,
    customPopoverVal,
    setCustomPopoverVal,
    handleAddOption,
    handleRemoveOption,
    handleToggleValue,
    handleClearAllValues,
    handleGenerateCartesian,
    handleApplyBulkPrice,
    handleApplyBulkStock,
    handleToggleVariantStatus,
    handleEnableAllVariants,
    handleUpdateVariantRow,
  } = matrix;

  const enabledVariantsCount = variantsRows.filter(
    (r) => (r.status ? r.status === 'active' : r.isEnabled !== false)
  ).length;
  const disabledVariantsCount = variantsRows.length - enabledVariantsCount;

  return (
    <section className="bg-white rounded-2xl border border-brand-border/70 p-5 sm:p-7 shadow-xs space-y-5">
      <div className="border-b border-brand-border/40 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center">
            2
          </span>
          <h2 className="text-sm font-black text-brand-dark">التسعير والمخزون والخيارات</h2>
        </div>
        <span className="text-[10px] font-bold text-brand-muted">
          {hasVariantsUnderTheHood ? 'صنف متعدد الخيارات' : 'صنف موحد'}
        </span>
      </div>

      {/* Base Pricing & Stock Inputs (Simple Product) */}
      {!hasVariantsUnderTheHood && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
          <div>
            <label className="text-xs font-bold text-brand-dark block mb-1.5">
              سعر البيع (₪) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="مثال: 45"
              className="w-full h-11 px-3.5 text-xs font-black rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-dark block mb-1.5">
              الكمية المتوفرة في المخزن <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={baseStock}
              onChange={(e) => setBaseStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="مثال: 10"
              className="w-full h-11 px-3.5 text-xs font-black rounded-xl border border-brand-border/80 bg-brand-surface/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>
        </div>
      )}

      {/* Progressive Disclosure: Options Trigger Button */}
      {categorySupportsVariants && availableUnusedAttributes.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-brand-dark">هل يتوفر الصنف بعدة خيارات؟</span>
            {availableUnusedAttributes.map((attr) => {
              const attrKey = getAttributeKey(attr);
              const attrDisplay = getAttributeDisplayName(attr);
              return (
                <button
                  key={attrKey}
                  type="button"
                  onClick={() => handleAddOption(attrKey)}
                  className="h-8 px-3 rounded-lg border border-brand-primary/40 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                >
                  <span>+ إضافة {attrDisplay}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notice when Category has NO variant attributes in the DB */}
      {!categorySupportsVariants && (
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-600 font-medium">
          ℹ️ هذا القسم مخصص للمنتجات الموحدة فقط في قاعدة البيانات (سعر واحد ومخزون واحد).
        </div>
      )}

      {/* Active Options Customization Section */}
      {activeOptionKeys.length > 0 && (
        <div className="space-y-4 pt-2">
          {activeOptionKeys.map((attrKey) => {
            const attrDef = categoryAttributes.find((a) => getAttributeKey(a) === attrKey);
            const attrDisplay = attrDef?.name || getAttributeDisplayName(attrKey);
            const isColor = isColorAttribute(attrKey);

            const allowedValues: string[] = attrDef?.values || [];
            const selectedVals = selectedAttributeValues[attrKey] || [];
            const unselectedValues = allowedValues.filter((v) => !selectedVals.includes(v));

            const filteredUnselected = dropdownSearch
              ? unselectedValues.filter((v) => v.toLowerCase().includes(dropdownSearch.toLowerCase()))
              : unselectedValues;

            const isPopoverOpen = openDropdownKey === attrKey;

            return (
              <div
                key={attrKey}
                className="p-4 rounded-xl border border-brand-border/70 bg-white shadow-2xs space-y-3 relative"
              >
                {/* Header Row: Option Name & Actions */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-brand-dark text-sm">{attrDisplay}</span>
                    {selectedVals.length > 0 && (
                      <span className="text-[10px] font-bold text-brand-muted bg-brand-surface px-2 py-0.5 rounded-full border border-brand-border/60">
                        {selectedVals.length} محدد
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedVals.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearAllValues(attrKey)}
                        className="h-7 px-2.5 rounded-lg border border-brand-border/80 bg-white hover:bg-brand-surface text-brand-muted hover:text-brand-dark text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                        title={`مسح كافة خيارات ${attrDisplay} المحددة`}
                      >
                        <svg className="w-3 h-3 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>مسح المحدد</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(attrKey)}
                      className="h-7 px-2.5 rounded-lg border border-red-200/80 bg-red-50/60 hover:bg-red-100/70 text-red-700 hover:text-red-800 text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                      title={`إزالة خيار ${attrDisplay} بالكامل من الصنف`}
                    >
                      <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>إزالة الخيار</span>
                    </button>
                  </div>
                </div>

                {/* Fixed Position Trigger: Popover with search and custom value entry */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPopoverOpen) {
                        setOpenDropdownKey(null);
                        setDropdownSearch('');
                      } else {
                        setOpenDropdownKey(attrKey);
                        setDropdownSearch('');
                      }
                    }}
                    className="h-9 px-3.5 rounded-xl border border-brand-border/90 bg-brand-surface/60 hover:bg-brand-surface text-brand-dark text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                  >
                    <span>+ اختيار {attrDisplay} من القائمة ({unselectedValues.length} متبقي)</span>
                    <span className="text-[9px] text-brand-muted">▼</span>
                  </button>

                  {isPopoverOpen && (
                    <div className="absolute top-full mt-2 right-0 z-30 w-72 sm:w-84 p-3 rounded-2xl bg-white border border-brand-border/80 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-1.5 border-b border-brand-border/50 text-[11px] font-bold text-brand-dark">
                        <span>اختر {attrDisplay} لإضافته:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenDropdownKey(null);
                            setDropdownSearch('');
                            setCustomPopoverAttrKey(null);
                            setCustomPopoverVal('');
                          }}
                          className="text-brand-muted hover:text-brand-dark text-xs p-0.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Quick Search */}
                      <input
                        type="text"
                        placeholder={`بحث سريع في خيارات ${attrDisplay}...`}
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-surface/30 focus:bg-white focus:outline-none focus:border-brand-primary"
                        autoFocus
                      />

                      {/* Unselected Options List */}
                      <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5 no-scrollbar flex flex-wrap gap-1.5 pt-1">
                        {filteredUnselected.map((val) => {
                          const swatch = isColor ? COLOR_SWATCHES[val] || { hex: '#71717A' } : null;

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleToggleValue(attrKey, val)}
                              className="h-7 px-2.5 rounded-lg border border-brand-border/80 hover:border-brand-primary bg-white hover:bg-brand-surface text-brand-dark text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              {swatch && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: swatch.hex,
                                    border: swatch.border ? '1px solid #D1D5DB' : 'none',
                                  }}
                                />
                              )}
                              <span>{val}</span>
                              <span className="text-[10px] text-brand-primary font-black">+</span>
                            </button>
                          );
                        })}

                        {filteredUnselected.length === 0 && (
                          <div className="w-full py-2 text-center text-xs text-brand-muted">
                            {allowedValues.length === 0
                              ? 'أدخل الخيارات المتوفرة لديك عبر الزر بالأسفل'
                              : 'تم اختيار كافة الخيارات المقترحة'}
                          </div>
                        )}
                      </div>

                      {/* Dedicated Explicit Custom Value Section */}
                      {(() => {
                        const isNumberType = attrDef?.type === 'number';
                        const isBoxOpen = customPopoverAttrKey === attrKey;
                        const trimmedVal = customPopoverVal.trim();
                        const isValidNum = !isNaN(Number(trimmedVal)) && trimmedVal !== '';
                        const canAdd = isNumberType ? isValidNum : trimmedVal.length > 0;

                        const handleConfirmCustom = () => {
                          if (!canAdd) return;
                          const cleanVal = trimmedVal.slice(0, 80);
                          handleToggleValue(attrKey, cleanVal);
                          setCustomPopoverVal('');
                          setCustomPopoverAttrKey(null);
                        };

                        if (!isBoxOpen) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPopoverAttrKey(attrKey);
                                setCustomPopoverVal('');
                              }}
                              className="w-full h-8 px-3 rounded-lg border border-dashed border-brand-primary/60 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                            >
                              <span>✍️ + إضافة {attrDisplay} مخصص</span>
                            </button>
                          );
                        }

                        return (
                          <div className="p-2.5 rounded-xl border border-brand-primary/40 bg-brand-primary/5 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                              <span>✍️ كتابة {attrDisplay} مخصص:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomPopoverAttrKey(null);
                                  setCustomPopoverVal('');
                                }}
                                className="text-brand-muted hover:text-brand-dark text-xs p-0.5 cursor-pointer"
                              >
                                إلغاء ✕
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type={isNumberType ? 'number' : 'text'}
                                maxLength={isNumberType ? undefined : 80}
                                placeholder={isNumberType ? `أدخل رقماً لـ ${attrDisplay}...` : `اكتب ${attrDisplay} مخصص...`}
                                value={customPopoverVal}
                                onChange={(e) => setCustomPopoverVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleConfirmCustom();
                                  }
                                }}
                                className="flex-1 h-8 px-2.5 text-xs font-bold rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleConfirmCustom}
                                disabled={!canAdd}
                                className="h-8 px-3 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover disabled:opacity-40 cursor-pointer shadow-2xs shrink-0"
                              >
                                إضافة
                              </button>
                            </div>
                            {trimmedVal && isNumberType && !isValidNum && (
                              <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-md border border-amber-200">
                                ⚠️ خاصية «{attrDisplay}» تقبل أرقاماً فقط (مثال: 42 أو 10.5).
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between text-[10px]">
                        <span className="text-brand-muted">انقر لإضافة الخيار</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenDropdownKey(null);
                            setDropdownSearch('');
                            setCustomPopoverAttrKey(null);
                            setCustomPopoverVal('');
                          }}
                          className="text-brand-primary font-bold hover:underline cursor-pointer"
                        >
                          تم
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Values Tags */}
                {selectedVals.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {selectedVals.map((val) => {
                      const swatch = isColor ? COLOR_SWATCHES[val] || { hex: '#71717A' } : null;

                      return (
                        <span
                          key={val}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-brand-primary/40 bg-brand-primary/10 text-brand-dark text-xs font-bold shadow-2xs"
                        >
                          {swatch && (
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: swatch.hex,
                                border: swatch.border ? '1px solid #D1D5DB' : 'none',
                              }}
                            />
                          )}
                          <span>{val}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleValue(attrKey, val)}
                            className="text-brand-muted hover:text-red-600 text-xs font-black cursor-pointer p-0.5 leading-none"
                            title={`إزالة ${val}`}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-brand-muted pt-0.5">
                    لم يتم اختيار أي {attrDisplay} بعد. انقر على الزر أعلاه لاختيار المتوفر لديك.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action-Driven Cartesian Generator Button Bar */}
      {activeOptionKeys.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-brand-dark flex items-center gap-1.5">
              <span>تجهيز جدول الأصناف تلقائياً</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                ({Object.values(selectedAttributeValues).reduce((acc, curr) => acc * (curr.length || 1), 1)} صنف مقترح)
              </span>
            </h4>
            <p className="text-[11px] text-brand-muted">
              دمج المقاسات والألوان المحددة في جدول الأصناف دفعة واحدة، مع الحفاظ على أسعارك وصورك الحالية.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateCartesian(basePrice, '', baseStock)}
            className="h-8 px-4 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover active:scale-95 transition-all shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>توليد جدول الأصناف</span>
          </button>
        </div>
      )}

      {/* Generated Variants Table */}
      {variantsRows.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-brand-border bg-brand-surface/40 text-center space-y-3 mt-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-brand-dark">لا توجد أصناف في الجدول حالياً</h4>
            <p className="text-[11px] text-brand-muted max-w-md mx-auto">
              اختر المقاسات والألوان أعلاه واضغط على &quot;توليد جدول الأصناف&quot; لتجهيزها فوراً، أو أضف صنفاً يدوياً.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddSingleModal}
            className="h-9 px-4 rounded-xl border border-brand-border bg-white hover:border-brand-primary text-brand-dark hover:text-brand-primary text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ إضافة صنف / توليفة مفردة</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-4 border-t border-brand-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-brand-border/50">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-black text-brand-dark">
                قائمة الأصناف
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {enabledVariantsCount} معروضة للبيع
              </span>
              {disabledVariantsCount > 0 && (
                <button
                  type="button"
                  onClick={handleEnableAllVariants}
                  className="h-6 px-2 rounded-lg border border-brand-primary/30 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[10px] font-black transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                >
                  <span>✓ تفعيل المعطل ({disabledVariantsCount})</span>
                </button>
              )}
            </div>

            {/* Unified Bulk Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk Price Input Group */}
              <div className="inline-flex items-center h-8 rounded-lg border border-brand-border/80 bg-white shadow-2xs hover:border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all overflow-hidden divide-x divide-x-reverse divide-brand-border/60">
                <span className="px-2.5 text-[11px] font-bold text-brand-muted bg-brand-surface/60 h-full flex items-center select-none shrink-0">
                  سعر موحد
                </span>
                <div className="relative flex items-center h-full bg-white">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="السعر"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="w-18 h-full px-2 text-xs font-bold text-brand-dark bg-transparent focus:outline-none"
                  />
                  <span className="text-[11px] font-bold text-brand-muted/70 pl-2 select-none pointer-events-none">
                    ₪
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyBulkPrice}
                  disabled={!bulkPrice}
                  className={`h-full px-2.5 text-[11px] font-black transition-all cursor-pointer shrink-0 active:scale-95 ${
                    bulkPrice
                      ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                      : 'bg-brand-surface/50 text-brand-muted/50 cursor-not-allowed'
                  }`}
                >
                  تطبيق
                </button>
              </div>

              {/* Bulk Stock Input Group */}
              <div className="inline-flex items-center h-8 rounded-lg border border-brand-border/80 bg-white shadow-2xs hover:border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all overflow-hidden divide-x divide-x-reverse divide-brand-border/60">
                <span className="px-2.5 text-[11px] font-bold text-brand-muted bg-brand-surface/60 h-full flex items-center select-none shrink-0">
                  كمية موحدة
                </span>
                <div className="relative flex items-center h-full bg-white">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="الكمية"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="w-16 h-full px-2 text-xs font-bold text-brand-dark bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyBulkStock}
                  disabled={!bulkStock}
                  className={`h-full px-2.5 text-[11px] font-black transition-all cursor-pointer shrink-0 active:scale-95 ${
                    bulkStock
                      ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                      : 'bg-brand-surface/50 text-brand-muted/50 cursor-not-allowed'
                  }`}
                >
                  تطبيق
                </button>
              </div>

              {/* Add Single Variant Quick Button */}
              <button
                type="button"
                onClick={onOpenAddSingleModal}
                className="h-8 px-3 rounded-lg border border-brand-border/80 bg-white hover:bg-brand-surface text-brand-dark text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <span>+ إضافة صنف يدوياً</span>
              </button>
            </div>
          </div>

          {/* Independent Variants List (Decoupled State) */}
          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            {variantsRows.map((row, idx) => {
              const isActive = row.status ? row.status === 'active' : row.isEnabled !== false;
              const label = Object.entries(row.attributes)
                .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
                .join(' • ');

              return (
                <div
                  key={row.id || idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-brand-surface/25 border-brand-border/70 shadow-2xs'
                      : 'bg-brand-surface/10 border-brand-border/30 opacity-40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Status Toggle & Details */}
                    <div className="flex items-center gap-2.5">
                      {/* iOS Status Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        onClick={() => handleToggleVariantStatus(idx)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                          isActive ? 'bg-brand-primary' : 'bg-brand-border'
                        }`}
                        title={isActive ? 'إيقاف الصنف مؤقتاً (معطل)' : 'تفعيل الصنف للبيع (معروض)'}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                            isActive ? '-translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Variant Image from Gallery Picker */}
                      <div className="relative shrink-0">
                        {row.image ? (
                          <div
                            onClick={() => onOpenGalleryPicker(idx)}
                            title="تغيير صورة الصنف من المعرض"
                            className="relative group w-9 h-9 rounded-lg overflow-hidden border border-brand-border/80 shadow-2xs cursor-pointer"
                          >
                            <img src={row.image} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-bold">
                              تغيير
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenGalleryPicker(idx)}
                            title="اختيار صورة للصنف من المعرض"
                            className="w-9 h-9 rounded-lg border border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/50 hover:bg-brand-primary/5 text-brand-muted hover:text-brand-primary flex flex-col items-center justify-center cursor-pointer transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-[7px] font-bold">صورة</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-brand-dark">{label}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          }`}
                        >
                          {isActive ? 'معروض' : 'معطل'}
                        </span>
                      </div>
                    </div>

                    {/* Inline Inputs & Delete Button */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-brand-muted">السعر:</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={row.price}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                              handleUpdateVariantRow(idx, { price: val });
                            }}
                            className="w-20 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                          />
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted">
                            ₪
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-brand-muted">المخزون:</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.stock}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                            handleUpdateVariantRow(idx, { stock: val });
                          }}
                          className="w-18 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Delete Button (✕) */}
                      <button
                        type="button"
                        onClick={() => onRemoveVariantRow(idx)}
                        title="حذف هذا الصنف نهائياً"
                        className="w-8 h-8 rounded-lg border border-red-200/70 bg-red-50/50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Single Variant Bottom Button */}
          <button
            type="button"
            onClick={onOpenAddSingleModal}
            className="w-full h-10 rounded-xl border-2 border-dashed border-brand-border/80 hover:border-brand-primary bg-brand-surface/20 hover:bg-brand-primary/5 text-brand-dark hover:text-brand-primary text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>+ إضافة صنف / توليفة مفردة</span>
          </button>
        </div>
      )}
    </section>
  );
}
