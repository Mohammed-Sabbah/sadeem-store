'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  type FilterTab,
  type ProductFilterState,
  isValidFilterTab,
} from '../utils/productFilters';

export interface UseMerchantProductFiltersOptions {
  controlledTab?: FilterTab;
  onTabChange?: (tab: FilterTab) => void;
  syncWithUrl?: boolean;
}

export function useMerchantProductFilters({
  controlledTab,
  onTabChange,
  syncWithUrl = true,
}: UseMerchantProductFiltersOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlTab = searchParams?.get('tab');
  const urlQuery = searchParams?.get('q') || '';

  const initialTab: FilterTab = isValidFilterTab(urlTab) ? urlTab : 'all';

  const [internalTab, setInternalTab] = useState<FilterTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery);

  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;

  const updateUrl = useCallback(
    (newTab: FilterTab, newQuery: string) => {
      if (!syncWithUrl || !pathname) return;

      const params = new URLSearchParams(searchParams?.toString() || '');

      if (newTab && newTab !== 'all') {
        params.set('tab', newTab);
      } else {
        params.delete('tab');
      }

      const trimmedQuery = newQuery.trim();
      if (trimmedQuery) {
        params.set('q', trimmedQuery);
      } else {
        params.delete('q');
      }

      const queryStr = params.toString();
      const nextUrl = queryStr ? `${pathname}?${queryStr}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [syncWithUrl, pathname, searchParams, router]
  );

  const setTab = useCallback(
    (nextTab: FilterTab) => {
      if (onTabChange) {
        onTabChange(nextTab);
      } else {
        setInternalTab(nextTab);
      }
      updateUrl(nextTab, searchQuery);
    },
    [onTabChange, updateUrl, searchQuery]
  );

  useEffect(() => {
    if (!syncWithUrl) return;
    const timer = setTimeout(() => {
      const currentUrlQuery = searchParams?.get('q') || '';
      if (searchQuery.trim() !== currentUrlQuery.trim()) {
        updateUrl(activeTab, searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, syncWithUrl, updateUrl, searchParams]);

  useEffect(() => {
    if (!syncWithUrl) return;
    const currentUrlTab = searchParams?.get('tab');
    if (isValidFilterTab(currentUrlTab) && currentUrlTab !== internalTab) {
      setInternalTab(currentUrlTab);
    }
  }, [searchParams, internalTab, syncWithUrl]);

  const filterState: ProductFilterState = useMemo(
    () => ({
      query: searchQuery,
      tab: activeTab,
    }),
    [searchQuery, activeTab]
  );

  return {
    activeTab,
    setTab,
    searchQuery,
    setSearchQuery,
    filterState,
  };
}
