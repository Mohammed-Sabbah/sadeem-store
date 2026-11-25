/**
 * أدوات تنسيق الأسماء الجغرافية لقطاع غزة - سَدِيم
 * تحويل رموز الـ Enums في الباك إند إلى مسميات عربية رصينة
 */

export const GAZA_GOVERNORATES_MAP: Record<string, string> = {
  central: 'المحافظة الوسطى',
  north: 'شمال غزة',
  gaza: 'مدينة غزة',
  khan_younis: 'خان يونس',
  rafah: 'رفح',
};

export const GAZA_CITIES_MAP: Record<string, string> = {
  deir_albalah: 'دير البلح',
  nuseirat: 'مخيم النصيرات',
  bureij: 'مخيم البريج',
  maghazi: 'مخيم المغازي',
  zawayda: 'الزوايدة',
};

export function formatGovernorate(code?: string): string {
  if (!code) return 'المحافظة الوسطى';
  return GAZA_GOVERNORATES_MAP[code] || code;
}

export function formatCity(code?: string): string {
  if (!code) return 'دير البلح';
  return GAZA_CITIES_MAP[code] || code;
}
