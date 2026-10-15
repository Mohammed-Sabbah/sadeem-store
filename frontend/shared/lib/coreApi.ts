import type { ServiceResult } from '../types/api.types';

// في المتصفح، الطلبات تكون نسبية ('') لتمر عبر Next.js rewrites
const BASE_URL = typeof window !== 'undefined' ? '' : (process.env.BACKEND_URL || 'http://localhost:5000');
const DEFAULT_TIMEOUT_MS = 12000;

function fallbackMessage(status: number): string {
  if (status === 400) return 'البيانات المُرسلة غير صحيحة';
  if (status === 401) return 'بيانات الدخول غير صحيحة أو انتهت الجلسة';
  if (status === 403) return 'ليس لديك صلاحية لإتمام هذه العملية أو الحساب قيد المراجعة';
  if (status === 404) return 'المسار المطلوب غير موجود';
  if (status === 408) return 'انتهت مدة الانتظار، حاول مجدداً';
  if (status === 409) return 'هذا الحساب أو الهاتف مسجل بالفعل';
  if (status === 429) return 'محاولات كثيرة جداً، يرجى الانتظار بضع دقائق والمحاولة مجدداً';
  if (status >= 500) return 'حدث خطأ داخل الخادم، يرجى المحاولة لاحقاً';
  return 'حدث خطأ غير متوقع';
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  _retry?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function executeRefreshToken(): Promise<boolean> {
  try {
    const url = BASE_URL ? `${BASE_URL}/api/auth/refresh` : '/api/auth/refresh';
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!res.ok && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session_expired'));
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function handleSilentRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = executeRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * دالة مركزية لإرسال الطلبات للباك إند ومعالجة الاستجابة والتجديد الصامت للتوكن
 */
export async function sendRequest<T>(path: string, options: RequestOptions = {}): Promise<ServiceResult<T>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, _retry = false, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
    const defaultHeaders: Record<string, string> = isFormData
      ? { Accept: 'application/json' }
      : { 'Content-Type': 'application/json', Accept: 'application/json' };

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = BASE_URL ? `${BASE_URL}${cleanPath}` : cleanPath;

    const res = await fetch(url, {
      credentials: 'include',
      headers: { ...defaultHeaders, ...(fetchOptions.headers as Record<string, string> || {}) },
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Silent refresh on 401 (if not already retried and not the login/refresh itself)
    if (res.status === 401 && !_retry && !cleanPath.includes('/api/auth/login') && !cleanPath.includes('/api/auth/refresh')) {
      const refreshed = await handleSilentRefresh();
      if (refreshed) {
        return sendRequest<T>(path, { ...options, _retry: true });
      }
    }

    const text = await res.text();
    let body: any = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        // text is not JSON
      }
    }

    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        message: body?.message || fallbackMessage(res.status),
        errors: body?.errors || null,
      };
    }

    return {
      success: true,
      statusCode: res.status,
      message: body?.message,
      data: body?.data !== undefined ? body.data : body,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, statusCode: 408, message: 'انتهت مدة الانتظار، يرجى المحاولة ثانية' };
    }
    return { success: false, statusCode: 500, message: 'تعذر الاتصال بالخادم، يرجى التأكد من تشغيل السيرفر' };
  }
}

export function getRequest<T>(path: string, options?: RequestOptions) {
  return sendRequest<T>(path, { method: 'GET', ...options });
}

export function postRequest<T>(path: string, body?: any, options?: RequestOptions) {
  return sendRequest<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });
}

export function putRequest<T>(path: string, body?: any, options?: RequestOptions) {
  return sendRequest<T>(path, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });
}

export function patchRequest<T>(path: string, body?: any, options?: RequestOptions) {
  return sendRequest<T>(path, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });
}

export function deleteRequest<T>(path: string, options?: RequestOptions) {
  return sendRequest<T>(path, { method: 'DELETE', ...options });
}
