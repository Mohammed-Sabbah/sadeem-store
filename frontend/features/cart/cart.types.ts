import type { CartItem, Product } from '@/types';

export interface ServerCartItem {
  variantId: string;
  quantity: number;
  product: Product;
  unavailableReason?: string;
  priceChanged?: boolean;
}

export interface ServerCart { ownerId: string; revision: number; items: ServerCartItem[] }
export interface CartResult { success: boolean; message?: string }
export interface CartMutation {
  ownerId: string;
  revision: number;
  action: 'add' | 'set' | 'remove' | 'clear';
  variantId?: string;
  quantity?: number;
  price?: number;
}

export function cartItems(cart: ServerCart): CartItem[] {
  return cart.items.map(({ variantId, ...item }) => ({ ...item, selectedVariantId: variantId }));
}

export function cartOptions(item: Pick<CartItem, 'product' | 'selectedColor' | 'selectedSize'>): Array<[string, string]> {
  const attributes = Object.entries(item.product.variantAttributes || {}).flatMap(([name, value]): Array<[string, string]> => {
    if (!['string', 'number', 'boolean'].includes(typeof value) || String(value).trim() === '') return [];
    return [[name, String(value)]];
  });
  if (attributes.length) return attributes;
  const options: Array<[string, string]> = [];
  if (item.selectedSize) options.push(['المقاس', item.selectedSize]);
  if (item.selectedColor) options.push(['اللون', item.selectedColor]);
  return options;
}
