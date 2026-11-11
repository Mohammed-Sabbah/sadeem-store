export interface BackendOrderItem {
  _id?: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantDetails?: string;
  image?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  status: 'active' | 'inActive';
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
}

export interface BackendStoreRef {
  _id: string;
  name: string;
  logo?: string | null;
}

export interface BackendUserRef {
  _id: string;
  name: string;
  phoneNumber?: string;
}

export interface BackendOrder {
  _id: string;
  orderGroupId: string;
  storeId: BackendStoreRef;
  userId: BackendUserRef;
  items: BackendOrderItem[];
  deliveryAddress: string;
  deliveryPhone: string;
  subtotal: number;
  paymentStatus: 'paid' | 'refunded';
  status: 'pending' | 'delivered' | 'cancelled';
  regionId?: string;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOrderGroup {
  _id: string;
  userId: string;
  orders: string[] | BackendOrder[];
  deliveryAddress: string;
  deliveryPhone: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: 'wallet' | 'jawwalpay';
  paymentStatus: 'paid' | 'refunded';
  status: 'pending' | 'delivered' | 'cancelled';
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPagination {
  page: number;
  limit: number;
  totalOrders: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrderItem {
  id: string;
  title: string;
  storeName: string;
  storeCity?: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  variantId?: string;
  status?: 'active' | 'inActive';
}

export interface OrderDestination {
  town: string;
  area: string;
  detailedAddress: string;
  landmark?: string;
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
  orderGroupId?: string;
  date: string;
  status: 'pending' | 'delivered' | 'cancelled';
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
  subOrders?: BackendOrder[];
}
