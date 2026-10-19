export interface ServiceResult<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]> | Array<any> | null;
  statusCode?: number;
}
