/**
 * سَدِيم (Sadeem) — Native Geolocation & Zero-Cost Spatial Matcher
 * وحدة تحديد الموقع بالـ GPS والربط الذكي بمراكز مدن قطاع غزة
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MatchedLocation {
  governorateId: string;
  governorateName: string;
  cityId: string;
  cityName: string;
  coordinates: Coordinates;
  accuracyMeters: number;
  distanceToCenterKm: number;
  isInsideGaza: boolean;
}

// حدود قطاع غزة الجغرافية (Gaza Bounding Box) لمنع أخطاء التشويش والـ Spoofing
export const GAZA_BOUNDS = {
  latMin: 31.18,
  latMax: 31.62,
  lngMin: 34.15,
  lngMax: 34.60,
};

// خريطة محافظات ومدن قطاع غزة ومراكزها بالفرونت إند (Zero Cost)
export const GAZA_REGIONS_CLIENT = {
  central: {
    id: 'central',
    name: 'المحافظة الوسطى',
    status: 'hub' as const,
    center: { lat: 31.428, lng: 34.375 },
    cities: [
      { id: 'deir_albalah', name: 'دير البلح', center: { lat: 31.418, lng: 34.351 } },
      { id: 'nuseirat', name: 'مخيم النصيرات', center: { lat: 31.448, lng: 34.391 } },
      { id: 'zawayda', name: 'الزوايدة', center: { lat: 31.431, lng: 34.372 } },
      { id: 'bureij', name: 'مخيم البريج', center: { lat: 31.439, lng: 34.402 } },
      { id: 'maghazi', name: 'مخيم المغازي', center: { lat: 31.423, lng: 34.385 } },
    ],
  },
  khan_younis: {
    id: 'khan_younis',
    name: 'خان يونس',
    status: 'delivery_only' as const,
    center: { lat: 31.346, lng: 34.306 },
    cities: [
      { id: 'khan_younis_city', name: 'مدينة خان يونس والبلد', center: { lat: 31.346, lng: 34.306 } },
      { id: 'khan_younis_camp', name: 'مخيم خان يونس والأمل', center: { lat: 31.350, lng: 34.295 } },
      { id: 'qarara', name: 'القرارة', center: { lat: 31.375, lng: 34.335 } },
      { id: 'bani_suheila', name: 'بني سهيلا والشرقية', center: { lat: 31.342, lng: 34.335 } },
      { id: 'mawasi_ky', name: 'المواصي - خان يونس', center: { lat: 31.355, lng: 34.260 } },
    ],
  },
  gaza: {
    id: 'gaza',
    name: 'مدينة غزة',
    status: 'closed' as const,
    center: { lat: 31.505, lng: 34.463 },
    cities: [
      { id: 'riman', name: 'الرمال وتل الهوا', center: { lat: 31.512, lng: 34.445 } },
      { id: 'shujaeyya', name: 'الشجاعية والدرج والتفاح', center: { lat: 31.505, lng: 34.480 } },
      { id: 'zaytoun', name: 'الزيتون والصبرة', center: { lat: 31.495, lng: 34.460 } },
      { id: 'sheikh_radwan', name: 'الشيخ رضوان والنصر', center: { lat: 31.525, lng: 34.465 } },
    ],
  },
  north: {
    id: 'north',
    name: 'شمال غزة',
    status: 'closed' as const,
    center: { lat: 31.545, lng: 34.505 },
    cities: [
      { id: 'jabalia', name: 'جباليا ومخيمها', center: { lat: 31.528, lng: 34.485 } },
      { id: 'beit_lahia', name: 'بيت لاهيا', center: { lat: 31.545, lng: 34.505 } },
      { id: 'beit_hanoun', name: 'بيت حانون', center: { lat: 31.542, lng: 34.536 } },
    ],
  },
  rafah: {
    id: 'rafah',
    name: 'رفح',
    status: 'closed' as const,
    center: { lat: 31.282, lng: 34.250 },
    cities: [
      { id: 'rafah_city', name: 'مدينة رفح والبلد', center: { lat: 31.282, lng: 34.250 } },
      { id: 'tel_sultan', name: 'تل السلطان والمخيم', center: { lat: 31.295, lng: 34.235 } },
      { id: 'shaboura', name: 'الشابورة والبرازيل', center: { lat: 31.285, lng: 34.255 } },
      { id: 'mawasi_rafah', name: 'المواصي - رفح', center: { lat: 31.310, lng: 34.215 } },
    ],
  },
};

/**
 * حساب المسافة بالكيلومتر بمعادلة هافيرساين
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * التحقق من وجود الإحداثية داخل النطاق الجغرافي لقطاع غزة
 */
export function isInsideGaza(lat: number, lng: number): boolean {
  return (
    lat >= GAZA_BOUNDS.latMin &&
    lat <= GAZA_BOUNDS.latMax &&
    lng >= GAZA_BOUNDS.lngMin &&
    lng <= GAZA_BOUNDS.lngMax
  );
}

/**
 * مطابقة إحداثية الـ GPS مع أقرب مدينة ومحافظة في غزة
 */
export function matchNearestGazaCity(lat: number, lng: number): {
  governorateId: string;
  governorateName: string;
  cityId: string;
  cityName: string;
  distanceKm: number;
} {
  let minDistance = Infinity;
  let matchedGovId = 'central';
  let matchedGovName = 'المحافظة الوسطى';
  let matchedCityId = 'deir_albalah';
  let matchedCityName = 'دير البلح';

  Object.values(GAZA_REGIONS_CLIENT).forEach((gov) => {
    gov.cities.forEach((city) => {
      const dist = calculateHaversineDistance(lat, lng, city.center.lat, city.center.lng);
      if (dist < minDistance) {
        minDistance = dist;
        matchedGovId = gov.id;
        matchedGovName = gov.name;
        matchedCityId = city.id;
        matchedCityName = city.name;
      }
    });
  });

  return {
    governorateId: matchedGovId,
    governorateName: matchedGovName,
    cityId: matchedCityId,
    cityName: matchedCityName,
    distanceKm: minDistance,
  };
}

/**
 * استخراج موقع الجهاز عبر المتصفح وفحصه ضد حراس الأمان
 */
export function getCurrentGpsPosition(): Promise<MatchedLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي (GPS)'));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // 1. فحص حدود غزة
        if (!isInsideGaza(latitude, longitude)) {
          return reject(
            new Error(
              'الإحداثيات الملتقطة خارج نطاق قطاع غزة (قد يكون هناك تشويش على الإشارة). يرجى اختيار مدينتك يدوياً.'
            )
          );
        }

        // 2. مطابقة أقرب مدينة
        const matched = matchNearestGazaCity(latitude, longitude);

        resolve({
          governorateId: matched.governorateId,
          governorateName: matched.governorateName,
          cityId: matched.cityId,
          cityName: matched.cityName,
          coordinates: { lat: latitude, lng: longitude },
          accuracyMeters: Math.round(accuracy),
          distanceToCenterKm: matched.distanceKm,
          isInsideGaza: true,
        });
      },
      (err) => {
        let msg = 'تعذر الوصول إلى موقعك الحالي.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'تم رفض إذن الوصول للموقع. يرجى اختيار محافظتك ومدينتك من القوائم أدناه.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'إشارة الـ GPS غير متوفرة حالياً على جهازك.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'استغرق التقاط الموقع وقتاً طويلاً. يرجى الاختيار يدوياً من القوائم.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * رابط خرائط جوجل المجاني للمندوب
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
