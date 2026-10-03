import { z } from 'zod';

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
      .min(6, 'كلمة المرور يجب ألا تقل عن 6 خانات'),
    confirmPassword: z
      .string()
      .min(6, 'يرجى تأكيد كلمة المرور'),
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
    whatsapp: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .trim()
      .min(1, 'يرجى إدخال البريد الإلكتروني للدخول وإدارة المتجر')
      .email('البريد الإلكتروني غير صحيح (مثال: store@example.com)'),
    password: z
      .string()
      .min(6, 'كلمة المرور يجب ألا تقل عن 6 خانات'),
    confirmPassword: z
      .string()
      .min(6, 'يرجى تأكيد كلمة المرور'),
    storeName: z
      .string()
      .trim()
      .min(2, 'يرجى إدخال الاسم التجاري لمتجرك'),
    category: z
      .string()
      .min(1, 'يرجى تحديد التصنيف الرئيسي للمنتجات'),
    governorate: z
      .string()
      .min(1, 'يرجى تحديد المحافظة'),
    city: z
      .string()
      .min(1, 'يرجى تحديد المدينة أو المخيم في الوسطى'),
    storeAddress: z
      .string()
      .trim()
      .min(5, 'يرجى كتابة العنوان بالتفصيل (اسم الشارع، ومعلَم بارز بجوار المحل)'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين، يرجى التأكد',
    path: ['confirmPassword'],
  });

export type MerchantJoinFormValues = z.infer<typeof merchantJoinSchema>;
