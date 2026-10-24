'use client';

import { useState, useCallback } from 'react';
import type { VariantRowState } from '../types/product-studio.types';
import { getAttributeDisplayName } from '@/shared/lib/attributeUtils';
import { useToast } from '@/components/ui/toast';

interface UseVariantMatrixOptions {
  initialOptionKeys?: string[];
  initialSelectedValues?: Record<string, string[]>;
  initialRows?: VariantRowState[];
}

export function useVariantMatrix(options: UseVariantMatrixOptions = {}) {
  const toast = useToast();

  const [activeOptionKeys, setActiveOptionKeys] = useState<string[]>(options.initialOptionKeys || []);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string[]>>(
    options.initialSelectedValues || {}
  );
  const [variantsRows, setVariantsRows] = useState<VariantRowState[]>(options.initialRows || []);

  // Dropdown Popover & Custom value UI state
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [customPopoverAttrKey, setCustomPopoverAttrKey] = useState<string | null>(null);
  const [customPopoverVal, setCustomPopoverVal] = useState('');

  // Bulk Apply Tools
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  const handleAddOption = useCallback((attrKey: string) => {
    setActiveOptionKeys((prev) => (prev.includes(attrKey) ? prev : [...prev, attrKey]));
  }, []);

  const handleRemoveOption = useCallback((attrKey: string) => {
    setActiveOptionKeys((prev) => prev.filter((k) => k !== attrKey));
    setSelectedAttributeValues((prev) => {
      const copy = { ...prev };
      delete copy[attrKey];
      return copy;
    });
    setOpenDropdownKey((curr) => (curr === attrKey ? null : curr));
  }, []);

  const handleClearAllValues = useCallback((attrKey: string) => {
    setSelectedAttributeValues((prev) => ({
      ...prev,
      [attrKey]: [],
    }));
  }, []);

  const handleToggleValue = useCallback((attrKey: string, val: string) => {
    setSelectedAttributeValues((prev) => {
      const current = prev[attrKey] || [];
      const exists = current.includes(val);
      const next = exists ? current.filter((v) => v !== val) : [...current, val];
      return {
        ...prev,
        [attrKey]: next,
      };
    });
  }, []);

  const handleGenerateCartesian = useCallback(
    (defaultPrice: number | '' = '', defaultCompareAtPrice: number | '' = '', defaultStock: number | '' = 10) => {
      const activeKeysWithValues = activeOptionKeys.filter(
        (k) => selectedAttributeValues[k] && selectedAttributeValues[k].length > 0
      );

      if (activeKeysWithValues.length === 0) {
        toast.error('تنبيه', 'يرجى تحديد خيار واحد على الأقل مع قيمه لتوليد التوليفات');
        return;
      }

      const missingKeys = activeOptionKeys.filter(
        (k) => !selectedAttributeValues[k] || selectedAttributeValues[k].length === 0
      );
      if (missingKeys.length > 0) {
        const missingNames = missingKeys.map((k) => getAttributeDisplayName(k)).join('، ');
        toast.error('خيارات غير مكتملة', `يرجى اختيار قيم لـ (${missingNames}) قبل التوليد.`);
        return;
      }

      const cartesian = (keys: string[]): Record<string, string>[] => {
        if (keys.length === 0) return [{}];
        const [firstKey, ...restKeys] = keys;
        const restCombos = cartesian(restKeys);
        const values = selectedAttributeValues[firstKey] || [];
        const results: Record<string, string>[] = [];

        for (const val of values) {
          for (const rest of restCombos) {
            results.push({ [firstKey]: val, ...rest });
          }
        }
        return results;
      };

      const newCombinations = cartesian(activeOptionKeys);

      const resolvedPrice =
        defaultPrice !== ''
          ? defaultPrice
          : (variantsRows.find((r) => Number(r.price) > 0)?.price ?? '');

      const resolvedStock =
        defaultStock !== ''
          ? defaultStock
          : (variantsRows.find((r) => r.stock !== undefined)?.stock ?? 10);

      // Smart Reconciliation:
      // 1. Keep rows whose combination is in newCombinations (preserving price, stock, image, status, dbId)
      // 2. Add combinations that are not yet in the table
      // 3. Remove rows whose combination is no longer in newCombinations
      const nextRows: VariantRowState[] = [];

      newCombinations.forEach((combo) => {
        const existing = variantsRows.find((row) =>
          Object.entries(combo).every(
            ([ak, av]) => String(row.attributes[ak] || '').trim().toLowerCase() === av.trim().toLowerCase()
          ) && Object.keys(row.attributes).length === Object.keys(combo).length
        );

        if (existing) {
          nextRows.push(existing);
        } else {
          nextRows.push({
            id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            attributes: combo,
            price: resolvedPrice,
            compareAtPrice: defaultCompareAtPrice !== '' ? Number(defaultCompareAtPrice) : '',
            stock: resolvedStock,
            sku: '',
            status: 'active',
            isEnabled: true,
          });
        }
      });

      setVariantsRows(nextRows);
      toast.trust('تم التحديث', `تم تحديث جدول الأصناف (${nextRows.length} توليفة)`);
    },
    [activeOptionKeys, selectedAttributeValues, variantsRows, toast]
  );

  const handleApplyBulkPrice = useCallback(() => {
    const p = parseFloat(bulkPrice);
    if (isNaN(p) || p <= 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.status !== 'inActive' && r.isEnabled !== false ? { ...r, price: p } : r))
    );
    setBulkPrice('');
  }, [bulkPrice]);

  const handleApplyBulkStock = useCallback(() => {
    const s = parseInt(bulkStock, 10);
    if (isNaN(s) || s < 0) return;
    setVariantsRows((prev) =>
      prev.map((r) => (r.status !== 'inActive' && r.isEnabled !== false ? { ...r, stock: s } : r))
    );
    setBulkStock('');
  }, [bulkStock]);

  const handleToggleVariantStatus = useCallback((idx: number) => {
    setVariantsRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const currentActive = r.status ? r.status === 'active' : r.isEnabled !== false;
        const nextActive = !currentActive;
        return {
          ...r,
          status: nextActive ? 'active' : 'inActive',
          isEnabled: nextActive,
        };
      })
    );
  }, []);

  const handleEnableAllVariants = useCallback(() => {
    setVariantsRows((prev) =>
      prev.map((r) => ({
        ...r,
        status: 'active',
        isEnabled: true,
      }))
    );
  }, []);

  const handleRemoveVariantRow = useCallback((idx: number) => {
    setVariantsRows((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleUpdateVariantRow = useCallback((idx: number, patch: Partial<VariantRowState>) => {
    setVariantsRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  }, []);

  const handleUpdateRowField = useCallback((idx: number, field: keyof VariantRowState, val: any) => {
    setVariantsRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    );
  }, []);

  const handleAssignImageToRow = useCallback((idx: number, imgUrl: string) => {
    setVariantsRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, image: imgUrl } : r))
    );
  }, []);

  const handleAddSingleCustomVariant = useCallback(
    (attributes: Record<string, string>, price: number | '', stock: number | '', image?: string) => {
      // Check if duplicate exists
      const isDuplicate = variantsRows.some((row) =>
        Object.entries(attributes).every(
          ([k, v]) => String(row.attributes[k] || '').trim().toLowerCase() === String(v || '').trim().toLowerCase()
        ) && Object.keys(row.attributes).length === Object.keys(attributes).length
      );

      if (isDuplicate) {
        toast.error('توليفة مكررة', 'هذه التوليفة موجودة بالفعل في الجدول.');
        return false;
      }

      setVariantsRows((prev) => [
        ...prev,
        {
          id: `var_single_${Date.now()}`,
          attributes,
          price: price !== '' ? Number(price) : '',
          stock: stock !== '' ? Number(stock) : 10,
          sku: '',
          status: 'active',
          isEnabled: true,
          image,
        },
      ]);
      toast.trust('تمت الإضافة', 'تمت إضافة التوليفة بنجاح إلى الجدول');
      return true;
    },
    [variantsRows, toast]
  );

  const resetMatrix = useCallback(() => {
    setActiveOptionKeys([]);
    setSelectedAttributeValues({});
    setVariantsRows([]);
    setOpenDropdownKey(null);
    setDropdownSearch('');
  }, []);

  return {
    activeOptionKeys,
    setActiveOptionKeys,
    selectedAttributeValues,
    setSelectedAttributeValues,
    variantsRows,
    setVariantsRows,
    openDropdownKey,
    setOpenDropdownKey,
    dropdownSearch,
    setDropdownSearch,
    customPopoverAttrKey,
    setCustomPopoverAttrKey,
    customPopoverVal,
    setCustomPopoverVal,
    bulkPrice,
    setBulkPrice,
    bulkStock,
    setBulkStock,
    handleAddOption,
    handleRemoveOption,
    handleClearAllValues,
    handleToggleValue,
    handleGenerateCartesian,
    handleApplyBulkPrice,
    handleApplyBulkStock,
    handleToggleVariantStatus,
    handleEnableAllVariants,
    handleRemoveVariantRow,
    handleUpdateVariantRow,
    handleUpdateRowField,
    handleAssignImageToRow,
    handleAddSingleCustomVariant,
    resetMatrix,
  };
}
