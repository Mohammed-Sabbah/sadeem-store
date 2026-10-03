'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/types';

export const DEFAULT_CART_ITEMS: CartItem[] = [
  {
    product: {
      id: 'canaan-wool-hoodie',
      title: 'كنزة سَدِيم الصوفية بغطاء رأس من القطن الممشط الفاخر',
      price: 135,
      originalPrice: 175,
      currency: '₪',
      image: '/canaan_product_hoodie_olive.jpg',
      vendor: {
        id: 'canaan-threads',
        name: 'خيوط سَدِيم للأزياء',
        city: 'دير البلح',
        verified: true,
      },
      category: 'ملابس وأزياء',
      rating: 4.9,
      reviewsCount: 142,
      inStock: true,
      description: 'كنزة صوفية فاخرة مصنوعة من القطن الفلسطيني الممشط فائق النعومة بوزن 380 GSM.',
    },
    quantity: 1,
    selectedColor: 'أخضر زيتي ملكي',
    selectedSize: 'L',
  },
  {
    product: {
      id: 'olive-oil-amphora',
      title: 'خابية زيت زيتون بكر رومي ممتاز (عصرة أولى على البارد، سعة 1 لتر)',
      price: 45,
      originalPrice: 55,
      currency: '₪',
      image: '/canaan_olive_amphora_1788773956733.jpg',
      vendor: {
        id: 'nuseirat-press',
        name: 'معاصر النصيرات الحديثة',
        city: 'مخيم النصيرات',
        verified: true,
      },
      category: 'مؤونة وزيت زيتون',
      rating: 5.0,
      reviewsCount: 312,
      inStock: true,
      description: 'زيت زيتون فلسطيني بلدي رومي معصور على البارد من حقول المحافظة الوسطى.',
    },
    quantity: 1,
    selectedColor: 'بلدي عصرة أولى 2026',
    selectedSize: '1 لتر',
  },
];

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(DEFAULT_CART_ITEMS);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('sadeem_cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('sadeem_cart', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addToCart = (product: Product, quantity = 1, selectedColor?: string, selectedSize?: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedColor, selectedSize }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  // Fixed delivery fee in Gaza Central Governorate: 8 NIS for the unified package
  const deliveryFee = items.length > 0 ? 8 : 0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
