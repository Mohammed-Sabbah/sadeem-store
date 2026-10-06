import { getRequest } from '@/shared/lib/coreApi';

export interface CategoryItem {
  _id: string;
  title: string;
  slug: string;
  icon?: string;
  order?: number;
}

export interface CityItem {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
}

export interface RegionItem {
  code: string;
  name: string;
  isActive: boolean;
  center: {
    lat: number;
    lng: number;
  };
  cities: CityItem[];
  order?: number;
}

export interface RegionsResponse {
  regions: Record<
    string,
    {
      id: string;
      name: string;
      isActive: boolean;
      center: { lat: number; lng: number };
      cities: CityItem[];
    }
  >;
  list?: RegionItem[];
}

export const taxonomyService = {
  fetchCategories: async (): Promise<CategoryItem[]> => {
    const res = await getRequest<{ categories: CategoryItem[] }>('/api/categories');
    if (res.success && res.data?.categories) {
      return res.data.categories;
    }
    return [];
  },

  fetchRegions: async (): Promise<RegionItem[]> => {
    const res = await getRequest<RegionsResponse>('/api/delivery/regions');
    if (res.success && res.data) {
      if (res.data.list && res.data.list.length > 0) {
        return res.data.list;
      }
      if (res.data.regions) {
        return Object.values(res.data.regions).map((r) => ({
          code: r.id,
          name: r.name,
          isActive: r.isActive,
          center: r.center,
          cities: r.cities,
        }));
      }
    }
    return [];
  },
};
