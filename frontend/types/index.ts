export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountAmount?: number;
  currency: string;
  image: string;
  vendor: {
    name: string;
    city: string;
    verified: boolean;
    id: string;
  };
  category: string;
  rating: number;
  reviewsCount?: number;
  inStock: boolean;
  description?: string;
  gallery?: string[];
  specs?: Record<string, string>;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  verified: boolean;
  image: string;
  description: string;
  rating: number;
  ordersCount: number;
  deliveryBadge: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}
