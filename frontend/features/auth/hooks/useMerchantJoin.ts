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
    setValue,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MerchantJoinFormValues>({
    resolver: zodResolver(merchantJoinSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      category: '',
      governorate: 'central',
      city: 'deir_albalah',
      storeAddress: '',
      lat: undefined as unknown as number,
      lng: undefined as unknown as number,
    },
  });

  const selectedLat = watch('lat');
  const selectedLng = watch('lng');
  const selectedGovernorate = watch('governorate');
  const selectedCity = watch('city');

  const setLocation = (
    lat: number,
    lng: number,
    suggestedCityId?: string,
    suggestedGovId?: string
  ) => {
    setValue('lat', lat, { shouldValidate: true });
    setValue('lng', lng, { shouldValidate: true });
    clearErrors(['lat', 'lng']);
    if (suggestedGovId) {
      setValue('governorate', suggestedGovId, { shouldValidate: true });
    }
    if (suggestedCityId) {
      setValue('city', suggestedCityId, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: MerchantJoinFormValues) => {
    const res = await authService.registerMerchant(data);

    if (!res.success) {
      setError('root', { message: res.message || 'تعذر إرسال طلب الانضمام، يرجى المحاولة لاحقاً' });
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
    setValue,
    selectedLat,
    selectedLng,
    selectedGovernorate,
    selectedCity,
    setLocation,
  };
}
