import type { CartItem } from '@/types';

export const GUEST_KEY = 'sadeem_cart_guest';
const TRANSFER_KEY = 'sadeem_cart_transfers';
const variantPattern = /^[a-f\d]{24}$/i;
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null;
}

export function variantId(item: CartItem): string | undefined {
  const id = item.selectedVariantId || item.product.variantId;
  return id && variantPattern.test(id) ? id.toLowerCase() : undefined;
}

export function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): CartItem[] => {
    const row = record(entry);
    const product = record(row?.product);
    if (!row || !product || typeof product.id !== 'string' || typeof product.title !== 'string') return [];
    const numeric = (value: unknown) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
    if (!numeric(row.quantity) || !numeric(product.price)) return [];
    const quantity = Number(row.quantity);
    const price = Number(product.price);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000 || !Number.isFinite(price) || price <= 0) return [];
    const vendor = record(product.vendor);
    const item: CartItem = {
      quantity,
      product: {
        id: product.id, title: product.title, price, currency: '₪',
        image: typeof product.image === 'string' ? product.image : '/placeholder_product.svg',
        category: typeof product.category === 'string' ? product.category : '',
        inStock: product.inStock === true,
        vendor: {
          id: typeof vendor?.id === 'string' ? vendor.id : '',
          name: typeof vendor?.name === 'string' ? vendor.name : 'بيانات المتجر غير متاحة',
          city: typeof vendor?.city === 'string' ? vendor.city : '',
          verified: vendor?.verified === true,
        },
        variantId: typeof product.variantId === 'string' ? product.variantId : undefined,
        variantAttributes: Object.fromEntries(Object.entries(record(product.variantAttributes) || {}).flatMap(([name, value]) =>
          ['string', 'number', 'boolean'].includes(typeof value) ? [[name, String(value)]] : [])),
      },
      selectedVariantId: typeof row.selectedVariantId === 'string' ? row.selectedVariantId : undefined,
      selectedColor: typeof row.selectedColor === 'string' ? row.selectedColor : undefined,
      selectedSize: typeof row.selectedSize === 'string' ? row.selectedSize : undefined,
    };
    return [item];
  });
}

export function sameItem(item: CartItem, productId: string, id?: string, color?: string, size?: string): boolean {
  if (item.product.id !== productId) return false;
  const existing = variantId(item);
  if (existing || id) return existing === id?.toLowerCase();
  return (item.selectedColor || '').trim() === (color || '').trim() && (item.selectedSize || '').trim() === (size || '').trim();
}

function heldGuestSource(storage: Storage, raw: string): boolean {
  const metadata: unknown = JSON.parse(storage.getItem(TRANSFER_KEY) || '[]');
  if (!Array.isArray(metadata)) throw new Error('تعذر فحص اختيارات قديمة محفوظة على الجهاز');
  return metadata.some((entry) => {
    const transfer = record(entry);
    if (!transfer || !Array.isArray(transfer.sources)) throw new Error('تعذر فحص اختيارات قديمة محفوظة على الجهاز');
    return transfer.sources.some((entry) => {
      const source = record(entry);
      if (!source || typeof source.key !== 'string' || typeof source.raw !== 'string') throw new Error('مصدر قديم غير صالح');
      return source.key === GUEST_KEY && source.raw === raw;
    });
  });
}

function guestItems(raw: string): CartItem[] {
  const value: unknown = JSON.parse(raw);
  const items = sanitizeItems(value);
  if (!Array.isArray(value) || items.length !== value.length || items.length > 50) {
    throw new Error('تحتوي السلة المحلية على اختيارات غير مكتملة؛ احتفظنا بها دون نقل أو حذف');
  }
  return items;
}

export function readGuest(storage: Storage): CartItem[] {
  const raw = storage.getItem(GUEST_KEY);
  return raw && !heldGuestSource(storage, raw) ? guestItems(raw) : [];
}

export function saveGuest(storage: Storage, items: CartItem[]): void {
  const raw = storage.getItem(GUEST_KEY);
  if (raw) {
    if (heldGuestSource(storage, raw)) throw new Error('هناك اختيارات قديمة معلقة؛ لم نحذفها أو نستبدلها باختيارات جديدة');
    guestItems(raw);
  }
  storage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function claimGuest(storage: Storage): CartItem[] {
  const raw = storage.getItem(GUEST_KEY);
  if (!raw || heldGuestSource(storage, raw)) return [];
  const items = guestItems(raw);
  if (items.some((item) => !variantId(item))) throw new Error('أعد اختيار خيارات المنتجات قبل نقل سلة الضيف');
  storage.removeItem(GUEST_KEY);
  if (storage.getItem(GUEST_KEY) !== null) throw new Error('تعذر إزالة سلة الضيف، لم يتم نقلها');
  return items;
}
