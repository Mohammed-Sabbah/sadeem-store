export interface ServiceResult<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]> | null;
  statusCode?: number;
}
