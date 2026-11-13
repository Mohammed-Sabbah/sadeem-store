'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { CartItem, Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { cartService } from '@/features/cart/cart.service';
import { cartItems, type CartMutation, type CartResult } from '@/features/cart/cart.types';
import { claimGuest, readGuest, sameItem, sanitizeItems, saveGuest } from '@/features/cart/cart.storage';

export const DEFAULT_CART_ITEMS: CartItem[] = [];
type Status = 'loading' | 'ready' | 'saving' | 'error';
interface CartState { owner: string | null; items: CartItem[]; revision: number | null; status: Status; error: string | null }
interface CartContextType {
  items: CartItem[];
  status: Status;
  error: string | null;
  revision: number | null;
  canCheckout: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, color?: string, size?: string, id?: string) => Promise<CartResult>;
  removeFromCart: (productId: string, id?: string, color?: string, size?: string) => Promise<CartResult>;
  updateQuantity: (productId: string, quantity: number, id?: string, color?: string, size?: string) => Promise<CartResult>;
  clearCart: () => Promise<CartResult>;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
const loadingState = (owner: string | null): CartState => ({ owner, items: [], revision: null, status: 'loading', error: null });
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'تعذر حفظ السلة، حاول مجددًا';
async function transferLock<T>(work: () => T): Promise<T> {
  if (!navigator.locks) throw new Error('نقل السلة يحتاج متصفحًا حديثًا واتصالًا آمنًا');
  return navigator.locks.request('sadeem-cart-transfer', work);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const owner = user?.id || null;
  const [state, setState] = useState<CartState>(() => loadingState(null));
  const identity = useRef({ owner, isLoading });
  identity.current = { owner, isLoading };
  const current = useRef(state);
  current.current = state;
  const generation = useRef(0);
  const busy = useRef(false);

  const refreshCart = useCallback(async (transferGuest = false) => {
    const { owner: account, isLoading: authLoading } = identity.current;
    if (authLoading || busy.current) return;
    const token = ++generation.current;
    const active = () => generation.current === token && identity.current.owner === account && !identity.current.isLoading;
    setState((previous) => ({ ...previous, owner: account, status: 'loading', error: null, items: previous.owner === account ? previous.items : [] }));
    try {
      if (!account) {
        const items = readGuest(localStorage);
        if (active()) setState({ owner: null, items, revision: null, status: 'ready', error: null });
        return;
      }
      const fetchAccount = async () => {
        const response = await cartService.get();
        if (!response.success || !response.data) throw new Error(response.message || 'تعذر تحميل السلة');
        if (response.data.cart.ownerId !== account) throw new Error('تغيّر الحساب، أعد تحميل السلة');
        return response.data.cart;
      };
      let cart = await fetchAccount();
      if (!active()) return;
      let warning: string | null = null;
      if (transferGuest) {
        let guest: CartItem[] = [];
        try {
          guest = await transferLock(() => active() ? claimGuest(localStorage) : []);
        } catch (error) {
          warning = messageOf(error);
        }
        if (!active()) return;
        if (guest.length) {
          try {
            const response = await cartService.import(account, cart.revision, guest.map((item) => ({
              variantId: (item.selectedVariantId || item.product.variantId)!.toLowerCase(), quantity: item.quantity, price: item.product.price,
            })));
            if (!active()) return;
            if (response.success && response.data?.cart.ownerId === account) cart = response.data.cart;
            else {
              warning = response.statusCode === 409
                ? 'تغيّرت سلة الحساب ولم تُنقل اختيارات الضيف. قد تحتاج إضافتها مجددًا'
                : 'لم نتأكد من نقل اختيارات الضيف. راجع سلة الحساب وأضف الناقص عند الحاجة';
              cart = await fetchAccount();
            }
          } catch {
            warning = 'لم نتأكد من نقل اختيارات الضيف. راجع سلة الحساب وأضف الناقص عند الحاجة';
            cart = await fetchAccount();
          }
        }
      }
      if (active()) setState({ owner: account, items: cartItems(cart), revision: cart.revision, status: 'ready', error: warning });
    } catch (error) {
      if (active()) setState((previous) => ({ ...previous, status: account ? 'error' : 'ready', error: messageOf(error) }));
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    busy.current = false;
    void refreshCart(true);
    return () => { generation.current += 1; };
  }, [owner, isLoading, refreshCart]);

  useEffect(() => {
    const refresh = () => { if (!document.hidden && identity.current.owner) void refreshCart(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [refreshCart]);

  const change = async (mutation: Omit<CartMutation, 'ownerId' | 'revision'>, guestChange: (items: CartItem[]) => CartItem[]): Promise<CartResult> => {
    const snapshot = current.current;
    const account = identity.current.owner;
    if (identity.current.isLoading || snapshot.owner !== account || snapshot.status !== 'ready' || busy.current) return { success: false, message: 'انتظر تحميل السلة أو أعد المحاولة' };
    busy.current = true;
    const token = ++generation.current;
    const active = () => generation.current === token && identity.current.owner === account;
    const commit = (next: CartState) => { current.current = next; setState(next); };
    commit({ ...snapshot, status: 'saving', error: null });
    try {
      if (!account) {
        const writeGuest = () => {
          if (!active()) return null;
          const stored = readGuest(localStorage);
          if (mutation.action === 'set' && JSON.stringify(stored) !== JSON.stringify(sanitizeItems(snapshot.items))) {
            return { items: stored, error: 'تغيّرت سلة الضيف من تبويب آخر، راجع الكمية وأعد التعديل' };
          }
          const items = guestChange(stored);
          if (items.length > 50 || items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000)) throw new Error('الحد الأقصى 50 صنفًا و1000 قطعة للصنف');
          try { saveGuest(localStorage, items); }
          catch { return { items, error: 'السلة متاحة بهذه الصفحة، لكن تعذر حفظها على هذا الجهاز' }; }
          return { items, error: null };
        };
        const result = await (navigator.locks ? navigator.locks.request('sadeem-cart-transfer', writeGuest) : writeGuest());
        if (!result || !active()) return { success: false, message: 'تغيّر الحساب، أعد المحاولة' };
        commit({ ...snapshot, items: result.items, status: 'ready', error: result.error });
        if (result.error) return { success: false, message: result.error };
      } else {
        if (snapshot.revision === null) throw new Error('أعد تحميل السلة');
        const response = await cartService.mutate({ ...mutation, ownerId: account, revision: snapshot.revision });
        if (!active()) return { success: false, message: 'تغيّر الحساب، أعد المحاولة' };
        if (!response.success || !response.data) {
          if (response.statusCode === 409) {
            const fresh = await cartService.get();
            if (active() && fresh.success && fresh.data && fresh.data.cart.ownerId === account) commit({ owner: account, items: cartItems(fresh.data.cart), revision: fresh.data.cart.revision, status: 'ready', error: 'السلة تغيّرت من جهاز آخر، راجعها وأعد التعديل' });
            else throw new Error('تعذر تحديث السلة، أعد تحميلها');
            return { success: false, message: 'السلة تغيّرت، راجعها وأعد التعديل' };
          }
          throw new Error(response.message || 'تعذر حفظ السلة');
        }
        if (response.data.cart.ownerId !== account) throw new Error('تغيّر الحساب، أعد تحميل السلة');
        if (active()) commit({ owner: account, items: cartItems(response.data.cart), revision: response.data.cart.revision, status: 'ready', error: null });
      }
      return { success: true };
    } catch (error) {
      if (active()) commit({ ...snapshot, status: account ? 'error' : 'ready', error: messageOf(error) });
      return { success: false, message: messageOf(error) };
    } finally { if (active()) busy.current = false; }
  };

  const addToCart: CartContextType['addToCart'] = async (product, quantity = 1, color, size, id = product.variantId) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) return { success: false, message: 'الكمية غير صالحة' };
    if (owner && (!id || !/^[a-f\d]{24}$/i.test(id))) return { success: false, message: 'اختر خيارات الصنف من صفحة المنتج أولًا' };
    return change({ action: 'add', variantId: id, quantity, price: product.price }, (items) => {
      const found = items.some((item) => sameItem(item, product.id, id, color, size));
      return found ? items.map((item) => sameItem(item, product.id, id, color, size) ? { ...item, quantity: item.quantity + quantity } : item) : [...items, { product, quantity, selectedColor: color, selectedSize: size, selectedVariantId: id }];
    });
  };
  const removeFromCart: CartContextType['removeFromCart'] = async (productId, id, color, size) => {
    if (owner && !id) return { success: false, message: 'أعد تحميل السلة قبل حذف الصنف' };
    return change({ action: 'remove', variantId: id }, (items) => items.filter((item) => !sameItem(item, productId, id, color, size)));
  };
  const updateQuantity: CartContextType['updateQuantity'] = async (productId, quantity, id, color, size) => {
    if (quantity <= 0) return removeFromCart(productId, id, color, size);
    if (!Number.isSafeInteger(quantity) || quantity > 1000) return { success: false, message: 'الكمية غير صالحة' };
    if (owner && !id) return { success: false, message: 'أعد اختيار الصنف من صفحة المنتج' };
    return change({ action: 'set', variantId: id, quantity }, (items) => items.map((item) => sameItem(item, productId, id, color, size) ? { ...item, quantity } : item));
  };
  const visible = !isLoading && state.owner === owner;
  const items = visible ? state.items : [];
  const status = visible ? state.status : 'loading';
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = items.length ? 10 : 0;
  return <CartContext.Provider value={{ items, status, error: visible ? state.error : null, revision: visible ? state.revision : null, canCheckout: status === 'ready' && items.length > 0 && items.every((item) => !item.unavailableReason && item.product.inStock), refreshCart, addToCart, removeFromCart, updateQuantity, clearCart: () => change({ action: 'clear' }, () => []), totalItems: items.reduce((sum, item) => sum + item.quantity, 0), subtotal, deliveryFee, grandTotal: subtotal + deliveryFee }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
