import { z } from 'zod';
import { matchNearestGazaCity } from '@/shared/lib/geolocation';

const palestinianPhoneRegex = /^(\+?970|0)?5[96]\d{7}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'يرجى إدخال البريد الإلكتروني')
    .email('يرجى إدخال بريد إلكتروني صالح (مثال: name@example.com)'),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب ألا تقل عن 6 خانات'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'الاسم الكامل يجب ألا يقل عن حرفين'),
    email: z
      .string()
      .trim()
      .min(1, 'يرجى إدخال البريد الإلكتروني')
      .email('يرجى إدخال بريد إلكتروني صالح (مثال: name@example.com)'),
    password: z
      .string()
      .min(8, 'كلمة المرور يجب ألا تقل عن 8 خانات')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حرف واحد ورقم واحد على الأقل'),
    confirmPassword: z
      .string()
      .min(8, 'يرجى تأكيد كلمة المرور'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين، يرجى التأكد',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const merchantJoinSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'يرجى إدخال اسم صاحب المتجر أو المسؤول'),
    phone: z
      .string()
      .trim()
      .refine(
        (val) => palestinianPhoneRegex.test(val.replace(/[\s-]/g, '')),
        'يرجى إدخال رقم جوال فلسطيني صالح للتواصل (059xxxxxxx أو 056xxxxxxx)'
      ),
    email: z
      .string()
      .trim()
      .min(1, 'يرجى إدخال البريد الإلكتروني للدخول وإدارة المتجر')
      .email('البريد الإلكتروني غير صحيح (مثال: store@example.com)'),
    password: z
      .string()
      .min(8, 'كلمة المرور يجب ألا تقل عن 8 خانات')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حرف واحد ورقم واحد على الأقل'),
    confirmPassword: z
      .string()
      .min(8, 'يرجى تأكيد كلمة المرور'),
    storeName: z
      .string()
      .trim()
      .min(2, 'يرجى إدخال الاسم التجاري لمتجرك'),
    category: z
      .string()
      .min(1, 'يرجى اختيار تصنيف المتجر من القائمة المعتمدة'),
    governorate: z
      .string()
      .min(1, 'يرجى تحديد المحافظة'),
    city: z
      .string()
      .min(1, 'يرجى تحديد المدينة أو المخيم'),
    storeAddress: z
      .string()
      .trim()
      .min(5, 'يرجى كتابة العنوان بالتفصيل (اسم الشارع ومعلَم بارز)'),
    lat: z
      .number({ message: 'تحديد موقع المتجر على الخريطة إلزامي للتوصيل' })
      .min(31.18, 'موقع المتجر خارج حدود قطاع غزة')
      .max(31.62, 'موقع المتجر خارج حدود قطاع غزة'),
    lng: z
      .number({ message: 'تحديد موقع المتجر على الخريطة إلزامي للتوصيل' })
      .min(34.15, 'موقع المتجر خارج حدود قطاع غزة')
      .max(34.60, 'موقع المتجر خارج حدود قطاع غزة'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين، يرجى التأكد',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return false;
      const matched = matchNearestGazaCity(data.lat, data.lng);
      return matched.governorateId === data.governorate;
    },
    {
      message: 'الموقع المحدد على الخريطة لا يتطابق مع المحافظة المختارة',
      path: ['lat'],
    }
  );

export type MerchantJoinFormValues = z.infer<typeof merchantJoinSchema>;

// استعادة كلمة المرور: الخطوة 1 (طلب الرمز)
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'يرجى إدخال البريد الإلكتروني المسجل')
    .email('يرجى إدخال بريد إلكتروني صالح'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// استعادة كلمة المرور: الخطوة 2 (التحقق من OTP)
export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, 'رمز التحقق يتكون من 6 أرقام')
    .regex(/^\d{6}$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط'),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

// استعادة كلمة المرور: الخطوة 3 (إعادة تعيين كلمة المرور)
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'كلمة المرور يجب ألا تقل عن 8 خانات')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حرف واحد ورقم واحد على الأقل'),
    confirmPassword: z
      .string()
      .min(8, 'يرجى تأكيد كلمة المرور الجديدة'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
