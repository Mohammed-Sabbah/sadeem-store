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

export type RegionStatus = 'closed' | 'delivery_only' | 'hub';

export interface RegionItem {
  code: string;
  name: string;
  status: RegionStatus;
  isActive: boolean;
  isHub?: boolean;
  isDeliveryAllowed?: boolean;
  center: {
    lat: number;
    lng: number;
  };
  cities: CityItem[];
  order?: number;
}

export interface RegionsResponse {
  count?: number;
  regions: Record<
    string,
    {
      id: string;
      name: string;
      status: RegionStatus;
      isActive: boolean;
      isHub?: boolean;
      isDeliveryAllowed?: boolean;
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

  /**
   * المسار الموحد لجلب المحافظات من /api/regions
   * يدعم ?scope=hub لجلب مراكز المتاجر، أو ?scope=delivery لزبائن التوصيل
   */
  fetchRegions: async (scope?: 'hub' | 'delivery'): Promise<RegionItem[]> => {
    const query = scope ? `?scope=${scope}` : '';
    const res = await getRequest<RegionsResponse>(`/api/regions${query}`);
    if (res.success && res.data) {
      if (res.data.list && res.data.list.length > 0) {
        return res.data.list.map((r) => ({
          ...r,
          status: (r.status || (r.isActive ? 'hub' : 'closed')) as RegionStatus,
          isHub: r.status === 'hub',
          isDeliveryAllowed: r.status !== 'closed',
        }));
      }
      if (res.data.regions) {
        return Object.values(res.data.regions).map((r) => ({
          code: r.id,
          name: r.name,
          status: (r.status || (r.isActive ? 'hub' : 'closed')) as RegionStatus,
          isActive: r.status !== 'closed',
          isHub: r.status === 'hub',
          isDeliveryAllowed: r.status !== 'closed',
          center: r.center,
          cities: r.cities,
        }));
      }
    }
    return [];
  },
};
