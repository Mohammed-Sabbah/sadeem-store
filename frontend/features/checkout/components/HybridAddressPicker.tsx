'use client';

import React, { useState } from 'react';
import {
  GAZA_REGIONS_CLIENT,
  getCurrentGpsPosition,
  type MatchedLocation,
  type Coordinates,
} from '@/shared/lib/geolocation';

export interface AddressFormData {
  recipientName: string;
  phone: string;
  governorateId: string;
  governorateName: string;
  cityId: string;
  cityName: string;
  detailedAddress: string;
  coordinates?: Coordinates;
  isGpsVerified: boolean;
  tag: string;
}

interface HybridAddressPickerProps {
  initialData?: Partial<AddressFormData>;
  onAddressChange: (data: AddressFormData) => void;
  isSubmitting?: boolean;
}

export function HybridAddressPicker({
  initialData,
  onAddressChange,
  isSubmitting = false,
}: HybridAddressPickerProps) {
  const [recipientName, setRecipientName] = useState(initialData?.recipientName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [governorateId, setGovernorateId] = useState(initialData?.governorateId || 'central');
  const [cityId, setCityId] = useState(initialData?.cityId || 'deir_albalah');
  const [detailedAddress, setDetailedAddress] = useState(initialData?.detailedAddress || '');
  const [tag, setTag] = useState(initialData?.tag || 'المنزل');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(initialData?.coordinates);
  const [isGpsVerified, setIsGpsVerified] = useState<boolean>(initialData?.isGpsVerified || false);

  // GPS State
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [matchedInfo, setMatchedInfo] = useState<MatchedLocation | null>(null);

  const currentGov =
    GAZA_REGIONS_CLIENT[governorateId as keyof typeof GAZA_REGIONS_CLIENT] ||
    GAZA_REGIONS_CLIENT.central;

  const currentCity = currentGov.cities.find((c) => c.id === cityId) || currentGov.cities[0];

  // إشعار الأب بالتغيير
  const notifyChange = (updated: Partial<AddressFormData>) => {
    const finalGovId = updated.governorateId ?? governorateId;
    const finalGov =
      GAZA_REGIONS_CLIENT[finalGovId as keyof typeof GAZA_REGIONS_CLIENT] ||
      GAZA_REGIONS_CLIENT.central;
    const finalCityId = updated.cityId ?? cityId;
    const finalCity = finalGov.cities.find((c) => c.id === finalCityId) || finalGov.cities[0];

    onAddressChange({
      recipientName: updated.recipientName ?? recipientName,
      phone: updated.phone ?? phone,
      governorateId: finalGovId,
      governorateName: finalGov.name,
      cityId: finalCityId,
      cityName: finalCity.name,
      detailedAddress: updated.detailedAddress ?? detailedAddress,
      coordinates: updated.coordinates ?? coordinates ?? finalCity.center,
      isGpsVerified: updated.isGpsVerified ?? isGpsVerified,
      tag: updated.tag ?? tag,
    });
  };

  const handleGpsDetect = async () => {
    setIsLocating(true);
    setGpsError(null);

    try {
      const match = await getCurrentGpsPosition();
      const govConfig = GAZA_REGIONS_CLIENT[match.governorateId as keyof typeof GAZA_REGIONS_CLIENT];
      if (govConfig && govConfig.status === 'closed') {
        setGpsError(
          `موقعك الحالي يقع في «${match.governorateName}» (خارج نطاق التغطية حالياً). التوصيل متاح حالياً للمحافظة الوسطى وخان يونس.`
        );
        return;
      }

      setMatchedInfo(match);
      setGovernorateId(match.governorateId);
      setCityId(match.cityId);
      setCoordinates(match.coordinates);
      setIsGpsVerified(true);

      notifyChange({
        governorateId: match.governorateId,
        cityId: match.cityId,
        coordinates: match.coordinates,
        isGpsVerified: true,
      });
    } catch (err: any) {
      setGpsError(err.message || 'تعذر تحديد الموقع الجغرافي');
      setIsGpsVerified(false);
    } finally {
      setIsLocating(false);
    }
  };

  const clearGps = () => {
    setMatchedInfo(null);
    setIsGpsVerified(false);
    setCoordinates(undefined);
    setGpsError(null);
    notifyChange({ isGpsVerified: false, coordinates: undefined });
  };

  return (
    <div className="flex flex-col gap-4 font-almarai text-right">
      {/* 1. Recipient Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-brand-dark">
            الاسم الكامل للمستلم <span className="text-brand-primary">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary transition-colors"
            value={recipientName}
            onChange={(e) => {
              setRecipientName(e.target.value);
              notifyChange({ recipientName: e.target.value });
            }}
            placeholder="الاسم الثلاثي للمستلم"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-brand-dark">
            رقم جوال للتواصل عند الاستلام <span className="text-brand-primary">*</span>
          </label>
          <input
            type="tel"
            dir="ltr"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary text-right transition-colors"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              notifyChange({ phone: e.target.value });
            }}
            placeholder="059xxxxxxx أو 056xxxxxxx"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* 2. Hybrid GPS Action Bar */}
      <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border-subtle flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-xs font-extrabold text-brand-dark">
              تحديد العنوان وحساب التوصيل:
            </span>
          </div>

          <button
            type="button"
            onClick={handleGpsDetect}
            disabled={isLocating || isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all shadow-xs active:scale-95 border-0 cursor-pointer disabled:opacity-60"
          >
            {isLocating ? (
              <>
                <span className="animate-spin text-xs">⏳</span>
                <span>جاري التقاط الإحداثيات...</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>تحديد موقعي الحالي (GPS)</span>
              </>
            )}
          </button>
        </div>

        {/* GPS Success Feedback Banner */}
        {isGpsVerified && matchedInfo && (
          <div className="p-2.5 rounded-lg bg-brand-trust-soft border border-brand-trust/30 flex items-center justify-between text-xs text-brand-trust font-bold">
            <div className="flex items-center gap-1.5">
              <span>✓</span>
              <span>
                تم التقاط موقعك بدقة ({matchedInfo.cityName} · دقة الإشارة ~{matchedInfo.accuracyMeters}م)
              </span>
            </div>
            <button
              type="button"
              onClick={clearGps}
              className="text-[11px] text-brand-muted hover:text-brand-dark underline bg-transparent border-0 cursor-pointer p-0"
            >
              تعديل يدوياً
            </button>
          </div>
        )}

        {/* GPS Error Feedback Banner */}
        {gpsError && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
            {gpsError}
          </div>
        )}

        {/* Dropdowns (Governorate & City) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-brand-muted">
              المحافظة <span className="text-brand-primary">*</span>
            </label>
            <select
              className="w-full h-10 px-3 text-xs sm:text-sm rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
              value={governorateId}
              onChange={(e) => {
                const newGovId = e.target.value;
                setGovernorateId(newGovId);
                const gov =
                  GAZA_REGIONS_CLIENT[newGovId as keyof typeof GAZA_REGIONS_CLIENT] ||
                  GAZA_REGIONS_CLIENT.central;
                const newCityId = gov.cities[0].id;
                setCityId(newCityId);
                setIsGpsVerified(false);
                setCoordinates(gov.cities[0].center);
                notifyChange({
                  governorateId: newGovId,
                  cityId: newCityId,
                  coordinates: gov.cities[0].center,
                  isGpsVerified: false,
                });
              }}
              disabled={isSubmitting}
            >
              {Object.values(GAZA_REGIONS_CLIENT).map((gov) => {
                const isClosed = gov.status === 'closed';
                return (
                  <option
                    key={gov.id}
                    value={gov.id}
                    disabled={isClosed}
                    className={isClosed ? 'text-gray-400 bg-gray-50' : 'font-bold'}
                  >
                    {gov.name} {isClosed ? '(قريباً - خارج التغطية)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-brand-muted">
              المدينة أو المخيم <span className="text-brand-primary">*</span>
            </label>
            <select
              className="w-full h-10 px-3 text-xs sm:text-sm rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
              value={cityId}
              onChange={(e) => {
                const newCityId = e.target.value;
                setCityId(newCityId);
                const city = currentGov.cities.find((c) => c.id === newCityId) || currentGov.cities[0];
                setIsGpsVerified(false);
                setCoordinates(city.center);
                notifyChange({
                  cityId: newCityId,
                  coordinates: city.center,
                  isGpsVerified: false,
                });
              }}
              disabled={isSubmitting}
            >
              {currentGov.cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Detailed Address Input */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-brand-dark">
            العنوان بالتفصيل للمندوب <span className="text-brand-primary">*</span>
          </label>
          <span className="text-[10px] text-brand-muted">
            (الشارع، البناية، معلَم بارز بجوار المنزل)
          </span>
        </div>
        <textarea
          rows={2}
          className="w-full p-3 text-xs sm:text-sm rounded-lg border border-brand-border bg-white text-brand-dark focus:outline-none focus:border-brand-primary transition-colors resize-none leading-relaxed"
          value={detailedAddress}
          onChange={(e) => {
            setDetailedAddress(e.target.value);
            notifyChange({ detailedAddress: e.target.value });
          }}
          placeholder="مثال: دير البلح - شارع السلام، بجوار صيدلية الأمل، عمارة الهدى الطابق الأول"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* 4. Tag Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-brand-muted">حفظ باسم:</span>
        {['المنزل', 'العمل', 'بيت العائلة'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTag(t);
              notifyChange({ tag: t });
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
              tag === t
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
