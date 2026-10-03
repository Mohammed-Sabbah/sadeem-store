'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  isWishlistPage?: boolean;
  onRemoveFromWishlist?: (productId: string) => void;
}

export function ProductCard({ product, isWishlistPage = false, onRemoveFromWishlist }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isWished, setIsWished] = useState(isWishlistPage);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlistPage && onRemoveFromWishlist) {
      onRemoveFromWishlist(product.id);
    } else {
      setIsWished((prev) => !prev);
    }
  };

  const activeWish = isWishlistPage ? true : isWished;

  return (
    <article className="group relative bg-white border border-brand-border-subtle hover:border-brand-primary/40 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col text-right">
      <Link href={`/product/${product.id}`} className="no-underline text-inherit flex flex-col flex-1">
        {/* Thumbnail Stage */}
        <div className="relative aspect-square w-full overflow-hidden bg-brand-surface flex items-center justify-center">
          {product.discountAmount && (
            <span className="absolute top-2.5 right-2.5 z-10 bg-brand-primary text-white text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-sm select-none">
              وفر {product.discountAmount} ₪
            </span>
          )}

          <button
            type="button"
            className="absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-brand-border/60 flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95"
            title={isWishlistPage ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
            onClick={handleToggleWish}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={activeWish ? 'var(--brand-primary)' : 'none'}
              stroke={activeWish ? 'var(--brand-primary)' : 'currentColor'}
              strokeWidth="2"
              className={activeWish ? 'text-brand-primary' : 'text-brand-muted'}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          <img
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={product.image}
            alt={product.title}
            loading="lazy"
          />
        </div>

        {/* Product Details */}
        <div className="p-3 flex flex-col flex-1 gap-1.5">
          {/* Vendor Row */}
          <div className="flex items-center gap-1.5 text-[11px] text-brand-muted font-medium">
            <span>{product.vendor.name}</span>
            <span>•</span>
            <span>{product.vendor.city}</span>
            {product.vendor.verified && (
              <span className="text-brand-trust inline-flex items-center" title="متجر معتمد وموثق">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3
            className="text-xs sm:text-sm font-bold text-brand-dark line-clamp-2 min-h-[2.8em] leading-snug group-hover:text-brand-primary transition-colors m-0"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Rating Row */}
          <div className="flex items-center gap-1 text-[11px] text-brand-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#B08D57" stroke="#B08D57" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span className="font-bold text-brand-dark">{product.rating}</span>
            <span>({product.reviewsCount || 38} طلب موثق)</span>
          </div>

          {/* Footer Row: Price & Add CTA */}
          <div className="mt-auto pt-2 flex items-center justify-between border-t border-brand-border-subtle/50">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-brand-primary">
                {product.price} <span className="text-xs font-bold mr-0.5">₪</span>
              </span>
              {product.originalPrice && (
                <span className="text-[11px] text-brand-subtle line-through">
                  {product.originalPrice} ₪
                </span>
              )}
            </div>

            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-brand-primary-soft text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-sm"
              onClick={handleAddToCart}
              title="إضافة للسلة"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
