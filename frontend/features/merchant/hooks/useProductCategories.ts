'use client';

import { useState, useEffect, useMemo } from 'react';
import { taxonomyService, type CategoryItem } from '@/features/store/services/taxonomy.service';

export function useProductCategories(initialCategoryId?: string) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    taxonomyService
      .fetchCategories()
      .then((cats) => {
        if (!isMounted) return;
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0]._id);
        }
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
        if (isMounted) setErrorMessage('تعذر جلب الأقسام من قاعدة البيانات');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync if initialCategoryId is provided later (e.g. edit mode after fetch)
  useEffect(() => {
    if (initialCategoryId && initialCategoryId !== categoryId) {
      setCategoryId(initialCategoryId);
    }
  }, [initialCategoryId]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c._id === categoryId);
  }, [categories, categoryId]);

  const categoryAttributes = useMemo(() => {
    return activeCategory?.variantAttributes || [];
  }, [activeCategory]);

  const categorySupportsVariants = categoryAttributes.length > 0;

  return {
    categories,
    isLoadingCategories,
    categoryId,
    setCategoryId,
    activeCategory,
    categoryAttributes,
    categorySupportsVariants,
    errorMessage,
  };
}
