'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';
import { useAuth } from '@/context/AuthContext';

export function useRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { setSessionUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    const res = await authService.register(data);

    if (!res.success) {
      setError('root', { message: res.message || 'تعذر إنشاء الحساب' });
      return;
    }

    if (res.data?.user) {
      setSessionUser(res.data.user);
      router.push(redirectUrl);
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
  };
}
