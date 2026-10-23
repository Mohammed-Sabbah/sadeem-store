'use client';

import React from 'react';
import type { CategoryVariantAttribute } from '@/features/store/services/taxonomy.service';
import { COLOR_SWATCHES } from '../../types/product-studio.types';
import {
  getAttributeKey,
  getAttributeDisplayName,
  isColorAttribute,
} from '@/shared/lib/attributeUtils';

interface ProductOptionsBuilderProps {
  categorySupportsVariants: boolean;
  categoryAttributes: CategoryVariantAttribute[];
  activeOptionKeys: string[];
  selectedAttributeValues: Record<string, string[]>;
  availableUnusedAttributes: CategoryVariantAttribute[];
  openDropdownKey: string | null;
  setOpenDropdownKey: (key: string | null) => void;
  dropdownSearch: string;
  setDropdownSearch: (val: string) => void;
  customPopoverAttrKey: string | null;
  setCustomPopoverAttrKey: (key: string | null) => void;
  customPopoverVal: string;
  setCustomPopoverVal: (val: string) => void;
  onAddOption: (key: string) => void;
  onRemoveOption: (key: string) => void;
  onToggleValue: (key: string, val: string) => void;
  onClearAllValues: (key: string) => void;
  onGenerateCartesian: () => void;
  variantsCount: number;
}

export function ProductOptionsBuilder({
  categorySupportsVariants,
  categoryAttributes,
  activeOptionKeys,
  selectedAttributeValues,
  availableUnusedAttributes,
  openDropdownKey,
  setOpenDropdownKey,
  dropdownSearch,
  setDropdownSearch,
  customPopoverAttrKey,
  setCustomPopoverAttrKey,
  customPopoverVal,
  setCustomPopoverVal,
  onAddOption,
  onRemoveOption,
  onToggleValue,
  onClearAllValues,
  onGenerateCartesian,
  variantsCount,
}: ProductOptionsBuilderProps) {
  if (!categorySupportsVariants) {
    return (
      <div className="bg-white rounded-2xl border border-brand-border/60 p-5 shadow-sm">
        <p className="text-xs text-brand-muted font-bold flex items-center gap-2">
          <span>ℹ️</span> هذا القسم مخصص للمنتجات الموحدة فقط في قاعدة البيانات (سعر واحد ومخزون واحد بدون خيارات ألوان أو مقاسات).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
        <div>
          <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
            <span>🎨</span> خيارات وسمات الصنف (الألوان، المقاسات، والخيارات)
          </h2>
          <p className="text-[11px] text-brand-muted mt-0.5">
            حدد الخيارات المتوفرة ثم انقر لتجهيز جدول الأصناف التلقائي
          </p>
        </div>

        {activeOptionKeys.length > 0 && (
          <button
            type="button"
            onClick={onGenerateCartesian}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span>✨</span> تجهيز جدول الأصناف تلقائياً
          </button>
        )}
      </div>

      {/* Available options prompt buttons */}
      {availableUnusedAttributes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-brand-dark">إضافة خيار جديد للصنف:</span>
          {availableUnusedAttributes.map((attr) => {
            const attrKey = getAttributeKey(attr);
            const attrDisplay = getAttributeDisplayName(attr);
            return (
              <button
                key={attrKey}
                type="button"
                onClick={() => onAddOption(attrKey)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-primary/40 bg-brand-primary/5 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <span>+ إضافة {attrDisplay}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Options Cards */}
      {activeOptionKeys.length > 0 && (
        <div className="space-y-3.5 pt-1">
          {activeOptionKeys.map((attrKey) => {
            const attrDef = categoryAttributes.find((a) => getAttributeKey(a) === attrKey);
            if (!attrDef) return null;

            const attrDisplay = getAttributeDisplayName(attrDef);
            const isColor = isColorAttribute(attrKey);
            const selectedVals = selectedAttributeValues[attrKey] || [];
            const allowedValues = attrDef.values || [];
            const unselectedValues = allowedValues.filter((v) => !selectedVals.includes(v));

            const isPopoverOpen = openDropdownKey === attrKey;
            const filteredUnselected =
              isPopoverOpen && dropdownSearch.trim()
                ? unselectedValues.filter((v) =>
                    v.toLowerCase().includes(dropdownSearch.trim().toLowerCase())
                  )
                : unselectedValues;

            return (
              <div
                key={attrKey}
                className="p-4 rounded-xl border border-brand-border/70 bg-brand-canvas/30 shadow-2xs space-y-3 relative"
              >
                {/* Header: Title and Actions */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-brand-dark text-sm">{attrDisplay}</span>
                    {selectedVals.length > 0 && (
                      <span className="text-[10px] font-bold text-brand-muted bg-white px-2 py-0.5 rounded-full border border-brand-border/60">
                        {selectedVals.length} محدد
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedVals.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onClearAllValues(attrKey)}
                        className="h-7 px-2.5 rounded-lg border border-brand-border/80 bg-white hover:bg-brand-canvas text-brand-muted hover:text-brand-dark text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        ✕ مسح المحدد
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveOption(attrKey)}
                      className="h-7 px-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      🗑️ إزالة الخيار
                    </button>
                  </div>
                </div>

                {/* Dropdown Selector Popover Trigger */}
                {unselectedValues.length > 0 ? (
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
                      className="h-9 px-3.5 rounded-xl border border-brand-border/90 bg-white hover:bg-brand-canvas text-brand-dark text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
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

                        {/* Search in popover */}
                        <input
                          type="text"
                          placeholder={`بحث سريع في خيارات ${attrDisplay}...`}
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-brand-border bg-brand-canvas/30 focus:bg-white focus:outline-none focus:border-brand-primary"
                          autoFocus
                        />

                        {/* Options buttons */}
                        <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5 no-scrollbar flex flex-wrap gap-1.5 pt-1">
                          {filteredUnselected.map((val) => {
                            const swatch = isColor ? COLOR_SWATCHES[val] || { hex: '#71717A' } : null;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => onToggleValue(attrKey, val)}
                                className="h-7 px-2.5 rounded-lg border border-brand-border/80 hover:border-brand-primary bg-white hover:bg-brand-canvas text-brand-dark text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
                        </div>

                        {/* Custom Value Adder */}
                        {(() => {
                          const isNumberType = attrDef.type === 'number';
                          const isBoxOpen = customPopoverAttrKey === attrKey;
                          const trimmedVal = customPopoverVal.trim();
                          const isValidNum = !isNaN(Number(trimmedVal)) && trimmedVal !== '';
                          const canAdd = isNumberType ? isValidNum : trimmedVal.length > 0;

                          const handleConfirmCustom = () => {
                            if (!canAdd) return;
                            const cleanVal = trimmedVal.slice(0, 80);
                            onToggleValue(attrKey, cleanVal);
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
                ) : (
                  <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-200">
                    <span>✓</span> تم اختيار كافة خيارات {attrDisplay} المتاحة
                  </div>
                )}

                {/* Selected Values Chips */}
                {selectedVals.length > 0 && (
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
                            onClick={() => onToggleValue(attrKey, val)}
                            className="w-4 h-4 rounded-full hover:bg-brand-primary/20 flex items-center justify-center text-[10px] text-brand-muted hover:text-brand-dark transition-colors cursor-pointer mr-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
