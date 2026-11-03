export interface OrderItem {
  id: string;
  title: string;
  storeName: string;
  storeCity: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface OrderDestination {
  town: string;
  area: string;
  detailedAddress: string;
  landmark: string;
  recipientName: string;
  phone: string;
}

export interface OrderCourier {
  name: string;
  phone: string;
  vehicle?: string;
}

export interface OrderTimelineStep {
  status: 'placed' | 'assembled' | 'out_for_delivery' | 'delivered';
  title: string;
  description: string;
  time?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface OrderDetail {
  id: string;
  date: string;
  status: 'active' | 'delivered' | 'cancelled';
  statusText: string;
  itemsCount: number;
  vendorNames: string[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  destination: OrderDestination;
  courier?: OrderCourier;
  items: OrderItem[];
  timeline: OrderTimelineStep[];
}
