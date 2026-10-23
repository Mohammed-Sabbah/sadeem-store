'use client';

import React, { useState } from 'react';
import type { CategoryVariantAttribute } from '@/features/store/services/taxonomy.service';
import type { VariantRowState } from '../../types/product-studio.types';
import { getAttributeKey, getAttributeDisplayName } from '@/shared/lib/attributeUtils';

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredKeys: string[];
  categoryAttributes: CategoryVariantAttribute[];
  selectedAttributeValues: Record<string, string[]>;
  existingRows: VariantRowState[];
  images: string[];
  defaultPrice: number | '';
  defaultStock: number | '';
  onAddVariant: (
    attributes: Record<string, string>,
    price: number | '',
    stock: number | '',
    image?: string
  ) => boolean;
}

export function ProductVariantModal({
  isOpen,
  onClose,
  requiredKeys,
  categoryAttributes,
  selectedAttributeValues,
  existingRows,
  images,
  defaultPrice,
  defaultStock,
  onAddVariant,
}: ProductVariantModalProps) {
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [price, setPrice] = useState<number | ''>(defaultPrice);
  const [stock, setStock] = useState<number | ''>(defaultStock || 10);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [customInputMode, setCustomInputMode] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Check if current combination is a duplicate
  const isDuplicate =
    requiredKeys.length > 0 &&
    requiredKeys.every((k) => attributes[k] && attributes[k].trim()) &&
    existingRows.some((row) =>
      requiredKeys.every(
        (k) =>
          String(row.attributes[k] || '').trim().toLowerCase() ===
          String(attributes[k] || '').trim().toLowerCase()
      )
    );

  const canSubmit =
    requiredKeys.length > 0 &&
    requiredKeys.every((k) => attributes[k] && attributes[k].trim()) &&
    price !== '' &&
    Number(price) > 0 &&
    stock !== '' &&
    Number(stock) >= 0 &&
    !isDuplicate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const success = onAddVariant(attributes, price, stock, image);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-brand-border text-right font-almarai max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <h3 className="text-xs font-black text-brand-dark">إضافة صنف / توليفة مفردة</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-muted hover:text-brand-dark text-xs p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Attributes Selectors */}
          <div className="space-y-3">
            {requiredKeys.map((key, keyIndex) => {
              const catDef = categoryAttributes.find((a) => getAttributeKey(a) === key);
              const allKnownValues = Array.from(
                new Set([
                  ...(catDef?.values || []),
                  ...(selectedAttributeValues[key] || []),
                  ...existingRows.map((r) => r.attributes[key]).filter(Boolean),
                ].map((v) => v.trim()))
              ).filter(Boolean);

              const currentVal = attributes[key] || '';
              const isCustom = customInputMode[key] || false;
              const isNumberType = catDef?.type === 'number';

              return (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black flex items-center justify-center">
                        {keyIndex + 1}
                      </span>
                      <span>{getAttributeDisplayName(key)}</span>
                    </span>
                  </label>

                  {/* Dropdown */}
                  <div className="relative">
                    <select
                      value={isCustom ? '__CUSTOM__' : currentVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setCustomInputMode((prev) => ({ ...prev, [key]: true }));
                          setAttributes((prev) => ({ ...prev, [key]: '' }));
                        } else {
                          setCustomInputMode((prev) => ({ ...prev, [key]: false }));
                          setAttributes((prev) => ({ ...prev, [key]: val }));
                        }
                      }}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer appearance-none"
                    >
                      <option value="">-- اختر {getAttributeDisplayName(key)} --</option>
                      {allKnownValues.map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                      <option value="__CUSTOM__">✍️ كتابة قيمة مخصصة أخرى...</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted text-xs">
                      ▼
                    </div>
                  </div>

                  {/* Custom Input */}
                  {isCustom && (
                    <div className="pt-1 animate-in fade-in">
                      <input
                        type={isNumberType ? 'number' : 'text'}
                        maxLength={isNumberType ? undefined : 80}
                        autoFocus
                        placeholder={
                          isNumberType
                            ? `أدخل رقماً لـ ${getAttributeDisplayName(key)}...`
                            : `اكتب قيمة جديدة لـ ${getAttributeDisplayName(key)}...`
                        }
                        value={currentVal}
                        onChange={(e) =>
                          setAttributes((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="w-full h-9 px-3 text-xs font-medium rounded-xl border border-brand-border/80 bg-brand-canvas/40 text-brand-dark focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark">السعر (₪) *</label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full h-9 px-3 pl-7 text-xs font-bold rounded-xl border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  required
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted">
                  ₪
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark">المخزون *</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>
          </div>

          {/* Optional Image Picker */}
          {images.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-brand-dark">صورة الصنف (اختياري)</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className={`w-10 h-10 rounded-lg border text-[10px] font-bold shrink-0 flex items-center justify-center cursor-pointer ${
                    !image
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-brand-border bg-brand-canvas text-brand-muted'
                  }`}
                >
                  تلقائي
                </button>
                {images.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImage(imgUrl)}
                    className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                      image === imgUrl
                        ? 'border-brand-primary ring-2 ring-brand-primary/20'
                        : 'border-brand-border hover:border-brand-primary/50'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate warning */}
          {isDuplicate && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>هذه التوليفة موجودة بالفعل في جدول الأصناف!</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-brand-border/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-canvas transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-9 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
            >
              إضافة الصنف للجدول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
