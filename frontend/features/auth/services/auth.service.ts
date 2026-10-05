import { postRequest, getRequest } from '@/shared/lib/coreApi';
import type {
  LoginFormValues,
  RegisterFormValues,
  MerchantJoinFormValues,
} from '../schemas/auth.schema';

export interface UserResponse {
  user: {
    id?: string;
    _id?: string;
    name: string;
    phone: string;
    email?: string;
    role?: 'customer' | 'merchant' | 'courier' | 'admin';
    status?: 'active' | 'pending_approval' | 'suspended';
    city?: string;
    address?: string;
    addresses?: Array<{
      _id?: string;
      label?: string;
      governorate?: string;
      city?: string;
      detailedAddress: string;
      phone?: string;
      isDefault?: boolean;
    }>;
    walletBalance?: number;
    ordersCount?: number;
    merchantId?: any;
  };
}

export const authService = {
  login: (data: LoginFormValues) => postRequest<UserResponse>('/api/auth/login', data),

  register: (data: RegisterFormValues | { name: string; email: string; password: string }) =>
    postRequest<UserResponse>('/api/auth/register', data),

  registerMerchant: (data: MerchantJoinFormValues) => {
    const payload = {
      user: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phone,
        password: data.password,
      },
      store: {
        name: data.storeName,
        categoryId: data.category,
        governorate: data.governorate,
        city: data.city,
        address: data.storeAddress,
        phoneNumber: data.phone,
      },
    };
    return postRequest<{ merchantId: string; status: string; storeName: string }>(
      '/api/auth/register/seller',
      payload
    );
  },

  logout: () => postRequest<void>('/api/auth/logout'),

  getMe: () => getRequest<UserResponse>('/api/user/me'),
} as const;
