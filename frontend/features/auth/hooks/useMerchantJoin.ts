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

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MerchantJoinFormValues>({
    resolver: zodResolver(merchantJoinSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      storeName: '',
      category: 'أزياء وملابس',
      city: 'دير البلح',
      storeAddress: '',
      notes: '',
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
  };
}
