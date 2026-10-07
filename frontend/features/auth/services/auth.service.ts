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
  store?: any;
}

export interface AuthMessageResponse {
  message: string;
}

export const authService = {
  /**
   * تسجيل دخول المستخدم (Customer / Merchant / Courier / Admin)
   */
  login: (data: LoginFormValues) => postRequest<UserResponse>('/api/auth/login', data),

  /**
   * تسجيل حساب زبون جديد مع إنشاء محفظة إلكترونية فورية
   */
  register: (data: RegisterFormValues | { name: string; email: string; password: string }) =>
    postRequest<UserResponse>('/api/auth/register', data),

  /**
   * تسجيل متجر تاجر جديد مع ربط الـ GPS ونقطة التوصيل وتصنيف المتجر
   */
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
        address: {
          governorate: data.governorate,
          city: data.city,
          detailedAddress: data.storeAddress,
          coordinates: {
            lat: data.lat,
            lng: data.lng,
          },
        },
        phoneNumber: data.phone,
        location: {
          lat: data.lat,
          lng: data.lng,
        },
      },
    };
    return postRequest<{ merchantId: string; status: string; storeName: string }>(
      '/api/auth/register/seller',
      payload
    );
  },

  /**
   * جلب بيانات الجلسة والمستخدم الحالي
   */
  getMe: () => getRequest<UserResponse>('/api/auth/me'),

  /**
   * طلب إرسال رمز التحقق (OTP) لاستعادة كلمة المرور
   */
  forgotPassword: (email: string) =>
    postRequest<AuthMessageResponse>('/api/auth/forgot-password', { email }),

  /**
   * التحقق من صحة كود الـ OTP
   */
  verifyOtp: (otp: string) =>
    postRequest<AuthMessageResponse>('/api/auth/verify-otp', { otp }),

  /**
   * إعادة تعيين كلمة المرور الجديدة
   */
  resetPassword: (password: string) =>
    postRequest<AuthMessageResponse>('/api/auth/reset-password', { password }),

  /**
   * تجديد التوكن الصامت
   */
  refreshToken: () =>
    postRequest<AuthMessageResponse>('/api/auth/refresh'),

  /**
   * تسجيل الخروج وإلغاء صلاحية التوكنات
   */
  logout: () => postRequest<AuthMessageResponse>('/api/auth/logout'),
} as const;
