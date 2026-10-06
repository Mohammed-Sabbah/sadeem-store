'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { merchantJoinSchema, type MerchantJoinFormValues } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';

export function useMerchantJoin() {
  const [submitted, setSubmitted] = useState(false);
  const [registeredStoreName, setRegisteredStoreName] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MerchantJoinFormValues>({
    resolver: zodResolver(merchantJoinSchema),
    defaultValues: {
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      password: '',
      confirmPassword: '',
      storeName: '',
      category: 'أزياء وملابس',
      governorate: 'central',
      city: 'deir_albalah',
      storeAddress: '',
    },
  });

  const onSubmit = async (data: MerchantJoinFormValues) => {
    const res = await authService.registerMerchant(data);

    if (!res.success) {
      setError('root', { message: res.message || 'تعذر إرسال طلب الانضمام' });
      return;
    }

    setRegisteredStoreName(data.storeName);
    setRegisteredPhone(data.phone);
    setSubmitted(true);
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    submitted,
    registeredStoreName,
    registeredPhone,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    watch,
  };
}
