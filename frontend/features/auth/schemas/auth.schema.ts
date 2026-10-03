import { z } from 'zod';

const palestinianPhoneRegex = /^(\+?970|0)?5[96]\d{7}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'يرجى إدخال رقم الجوال أو البريد الإلكتروني')
    .refine(
      (val) => palestinianPhoneRegex.test(val.replace(/[\s-]/g, '')) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'يرجى إدخال رقم جوال فلسطيني صالح (059xxxxxxx) أو بريد إلكتروني صحيح'
    ),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب ألا تقل عن 6 خانات'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'الاسم الكامل يجب ألا يقل عن حرفين'),
  identifier: z
    .string()
    .trim()
    .min(1, 'يرجى إدخال رقم الجوال أو البريد الإلكتروني')
    .refine(
      (val) => palestinianPhoneRegex.test(val.replace(/[\s-]/g, '')) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'يرجى إدخال رقم جوال فلسطيني صالح (059xxxxxxx) أو بريد إلكتروني'
    ),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب ألا تقل عن 6 خانات'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const merchantJoinSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'يرجى إدخال اسم صاحب المتجر أو المسؤول'),
  phone: z
    .string()
    .trim()
    .refine((val) => palestinianPhoneRegex.test(val.replace(/[\s-]/g, '')), 'يرجى إدخال رقم جوال فلسطيني صالح للتواصل والتحقق'),
  email: z
    .string()
    .trim()
    .email('البريد الإلكتروني غير صحيح')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'كلمة المرور يجب ألا تقل عن 6 خانات'),
  storeName: z
    .string()
    .trim()
    .min(2, 'يرجى إدخال الاسم التجاري لمتجرك'),
  category: z
    .string()
    .min(1, 'يرجى تحديد التصنيف الرئيسي للمنتجات'),
  city: z
    .string()
    .min(1, 'يرجى تحديد المدينة في المحافظة الوسطى'),
  storeAddress: z
    .string()
    .optional(),
  notes: z
    .string()
    .optional(),
});

export type MerchantJoinFormValues = z.infer<typeof merchantJoinSchema>;
