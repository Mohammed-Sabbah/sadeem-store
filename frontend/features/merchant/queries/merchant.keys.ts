export const merchantKeys = {
  all: ['merchant'] as const,
  profile: () => [...merchantKeys.all, 'profile'] as const,
  products: () => [...merchantKeys.all, 'products'] as const,
  productDetail: (id: string) => [...merchantKeys.all, 'product', id] as const,
};
