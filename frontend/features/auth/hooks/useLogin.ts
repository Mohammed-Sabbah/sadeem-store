'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';
import { useAuth } from '@/context/AuthContext';

export function useLogin() {
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const res = await authService.login(data);

    if (!res.success) {
      setError('root', { message: res.message || 'بيانات الدخول غير صحيحة' });
      return;
    }

    if (res.data?.user) {
      const loggedUser = res.data.user;
      setSessionUser(loggedUser);

      // Role-based routing: Merchants must land on merchant dashboard, never customer storefront
      const isSeller = loggedUser.role === 'seller' || loggedUser.role === 'merchant';
      if (isSeller) {
        if (redirectUrl.startsWith('/merchant')) {
          router.push(redirectUrl);
        } else {
          router.push('/merchant/dashboard');
        }
      } else if (loggedUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirectUrl === '/' ? '/' : redirectUrl);
      }
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
