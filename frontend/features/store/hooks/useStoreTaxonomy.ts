'use client';

import { useQuery } from '@tanstack/react-query';
import { taxonomyService, type CategoryItem, type RegionItem, type CityItem } from '../services/taxonomy.service';
import { calculateHaversineDistance } from '@/shared/lib/geolocation';

export function useStoreTaxonomy() {
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
  } = useQuery<CategoryItem[]>({
    queryKey: ['store-categories'],
    queryFn: taxonomyService.fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: regions = [],
    isLoading: isLoadingRegions,
    isError: isRegionsError,
  } = useQuery<RegionItem[]>({
    queryKey: ['store-regions-unified'],
    queryFn: () => taxonomyService.fetchRegions(),
    staleTime: 10 * 60 * 1000,
  });

  // 1. المحافظات ذات المركز النشط المتاحة لتسجيل المتاجر (status === 'hub')
  const hubGovernorates = regions.filter((r) => r.status === 'hub');

  // 2. المحافظات المتاحة لتوصيل واستقبال طلبات الزبائن (status !== 'closed')
  const deliveryGovernorates = regions.filter((r) => r.status !== 'closed');

  // 3. كامل المحافظات المسجلة
  const allGovernorates = regions;

  // للتوافق العكسي مع الكود القديم
  const availableGovernorates = hubGovernorates;

  const getCitiesForGovernorate = (govCodeOrName: string): CityItem[] => {
    const found = regions.find(
      (r) => r.code === govCodeOrName || r.name === govCodeOrName
    );
    return found ? found.cities : [];
  };

  const findNearestCity = (lat: number, lng: number) => {
    let bestCity: CityItem | null = null;
    let bestGov: RegionItem | null = null;
    let minDistance = Infinity;

    regions.forEach((reg) => {
      reg.cities.forEach((city) => {
        const d = calculateHaversineDistance(lat, lng, city.center.lat, city.center.lng);
        if (d < minDistance) {
          minDistance = d;
          bestCity = city;
          bestGov = reg;
        }
      });
    });

    return {
      governorate: bestGov,
      city: bestCity,
      distanceKm: minDistance,
    };
  };

  return {
    categories,
    regions,
    hubGovernorates,
    deliveryGovernorates,
    availableGovernorates,
    allGovernorates,
    getCitiesForGovernorate,
    findNearestCity,
    isLoading: isLoadingCategories || isLoadingRegions,
    isError: isCategoriesError || isRegionsError,
  };
}
