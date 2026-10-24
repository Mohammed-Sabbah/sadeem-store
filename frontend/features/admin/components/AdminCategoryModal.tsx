'use client';

import React, { useState, useEffect } from 'react';
import {
  type CategoryAttributeDraft,
  cleanAttributeKey,
  validateCategoryDraft,
} from '../utils/categoryAdminUtils';

interface AdminCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    variantAttributes: Array<{ name: string; key: string; type: string }>;
  }) => void;
  initialCategory?: any | null;
  isSubmitting?: boolean;
}

export const AdminCategoryModal: React.FC<AdminCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCategory,
  isSubmitting = false,
}) => {
  const [title, setTitle] = useState('');
  const [attributes, setAttributes] = useState<CategoryAttributeDraft[]>([]);
  const [error, setError] = useState('');

  const isEdit = Boolean(initialCategory);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setTitle(initialCategory.title || '');
        setAttributes(
          (initialCategory.variantAttributes || []).map((a: any) => ({
            name: a.name || '',
            key: a.key || '',
            type: a.type || 'String',
          }))
        );
      } else {
        setTitle('');
        setAttributes([]);
      }
      setError('');
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleAddAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      { name: '', key: '', type: 'String' },
    ]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (
    index: number,
    field: keyof CategoryAttributeDraft,
    val: string
  ) => {
    setAttributes((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };
      if (field === 'name' && !target.key) {
        target.key = cleanAttributeKey(val);
      }
      next[index] = target as CategoryAttributeDraft;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCategoryDraft(title, attributes);
    if (!validation.isValid) {
      setError(validation.error || 'يرجى مراجعة بيانات الفئة');
      return;
    }

    const cleanedAttributes = attributes.map((a) => ({
      name: a.name.trim(),
      key: cleanAttributeKey(a.key || a.name),
      type: a.type,
    }));

    onSubmit({
      title: title.trim(),
      variantAttributes: cleanedAttributes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in select-none font-almarai"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="bg-brand-card rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-brand-border text-right relative max-h-[90vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-primary-soft text-brand-primary flex items-center justify-center font-bold text-xs">
              📂
            </div>
            <h3 className="text-base font-black text-brand-dark">
              {isEdit ? 'تعديل بيانات الفئة' : 'إضافة فئة جديدة للكتالوج'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark block">
              اسم الفئة بالعربية <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: أجبان وألبان بلدية، تمور ومؤونة..."
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-brand-border bg-brand-surface text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>

          {/* Variant Attributes Builder */}
          <div className="space-y-2 pt-2 border-t border-brand-border/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand-dark block">
                  خصائص المتغيرات (Variant Attributes)
                </span>
                <span className="text-[10px] text-brand-muted block">
                  الخصائص المتاحة لتجار هذه الفئة عند إضافة منتجاتهم (مثل الحجم، الوزن، النوع)
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-2.5 py-1 rounded-lg border border-brand-border bg-brand-surface hover:bg-brand-card text-[11px] font-bold text-brand-dark transition-colors cursor-pointer active:scale-95"
              >
                + إضافة خاصية
              </button>
            </div>

            {attributes.length === 0 ? (
              <div className="p-4 rounded-xl bg-brand-surface/40 border border-brand-border/60 text-center text-[11px] text-brand-muted">
                لا توجد خصائص محددة بعد. يمكنك إضافة أبعاد كـ «الوزن» أو «الحجم» لمساعدة التجار.
              </div>
            ) : (
              <div className="space-y-2.5">
                {attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-brand-surface/60 border border-brand-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                      placeholder="اسم الخاصية (مثال: الحجم)"
                      className="flex-1 h-9 px-2.5 text-xs font-medium rounded-lg border border-brand-border bg-brand-card text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />

                    <input
                      type="text"
                      value={attr.key}
                      onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                      placeholder="المفتاح (size)"
                      dir="ltr"
                      className="w-full sm:w-28 h-9 px-2.5 text-xs font-mono font-medium rounded-lg border border-brand-border bg-brand-card text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />

                    <select
                      value={attr.type}
                      onChange={(e) => handleAttributeChange(idx, 'type', e.target.value)}
                      className="w-full sm:w-24 h-9 px-2 text-xs font-bold rounded-lg border border-brand-border bg-brand-card text-brand-dark cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="String">نص</option>
                      <option value="Number">رقم</option>
                      <option value="Boolean">شرطي</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(idx)}
                      className="w-9 h-9 rounded-lg border border-brand-border text-brand-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="حذف الخاصية"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs font-bold text-red-600 pt-1">{error}</p>}

          {/* Footer Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-brand-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-xl border border-brand-border text-xs font-bold text-brand-dark hover:bg-brand-surface active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : isEdit ? 'تحديث الفئة' : 'إضافة الفئة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
