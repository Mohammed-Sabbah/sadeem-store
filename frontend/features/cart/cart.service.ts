import { getRequest, patchRequest, postRequest } from '@/shared/lib/coreApi';
import type { CartMutation, ServerCart } from './cart.types';

export const cartService = {
  get: () => getRequest<{ cart: ServerCart }>('/api/cart'),
  mutate: (mutation: CartMutation) => patchRequest<{ cart: ServerCart }>('/api/cart', mutation),
  import: (ownerId: string, revision: number, items: Array<{ variantId: string; quantity: number; price?: number }>) =>
    postRequest<{ cart: ServerCart }>('/api/cart/import', { ownerId, revision, items }),
};
