'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  isInsideGaza,
  getCurrentGpsPosition,
  matchNearestGazaCity,
} from '@/shared/lib/geolocation';

export interface LocationSelectPayload {
  lat: number;
  lng: number;
  suggestedCityId: string;
  suggestedCityName: string;
  suggestedGovernorateId: string;
  suggestedGovernorateName: string;
}

interface StoreMapPickerInnerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (payload: LocationSelectPayload | null) => void;
  allowedHubIds?: string[];
  error?: string;
}

export default function StoreMapPickerInner({
  initialLat,
  initialLng,
  onLocationSelect,
  allowedHubIds = ['central'],
  error,
}: StoreMapPickerInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Map is collapsed by default to save screen space
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [boundsError, setBoundsError] = useState<string | null>(null);

  // Custom Pin Icon for Sadeem
  const createPinIcon = () => {
    return L.divIcon({
      className: 'sadeem-map-pin-container',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(184, 98, 27, 0.22); animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #B8621B; color: #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(28, 25, 23, 0.25); border: 2px solid #FFFFFF;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  // Centralized location validator & updater
  const handleLocationUpdate = (lat: number, lng: number) => {
    // 1. Outside Gaza Strip bounds check
    if (!isInsideGaza(lat, lng)) {
      setBoundsError('الموقع المحدد يقع خارج نطاق قطاع غزة المعتمد.');
      setCurrentCoords(null);
      onLocationSelect(null);
      return false;
    }

    const matched = matchNearestGazaCity(lat, lng);

    // 2. Dynamic Scope Check: Check against active hub governorates from DB
    const isAllowedHub = allowedHubIds.includes(matched.governorateId);
    if (!isAllowedHub) {
      if (matched.governorateId === 'khan_younis') {
        setBoundsError(
          'الموقع يقع في خان يونس (متاحة لتوصيل الزبائن فقط حالياً، والتسجيل متاح للمحافظات المعتمدة).'
        );
      } else {
        setBoundsError(
          `الموقع يقع في «${matched.governorateName}». خدمة سَدِيم متاحة حالياً للمحافظات ذات المركز المعتمد فقط، سنصل لمدينتكم قريباً.`
        );
      }
      setCurrentCoords(null);
      onLocationSelect(null);
      return false;
    }

    // 3. Valid Central location
    setBoundsError(null);
    setCurrentCoords({ lat, lng });

    onLocationSelect({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      suggestedCityId: matched.cityId,
      suggestedCityName: matched.cityName,
      suggestedGovernorateId: matched.governorateId,
      suggestedGovernorateName: matched.governorateName,
    });

    return true;
  };

  // Initialize or re-render map when drawer opens
  useEffect(() => {
    if (!isMapOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultLat = currentCoords?.lat || initialLat || 31.418;
      const defaultLng = currentCoords?.lng || initialLng || 34.351;
      const defaultZoom = currentCoords ? 15 : 13;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Marker initialization
      const marker = L.marker([defaultLat, defaultLng], {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const markerPos = (e.target as L.Marker).getLatLng();
        handleLocationUpdate(markerPos.lat, markerPos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        handleLocationUpdate(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      if (initialLat && initialLng) {
        handleLocationUpdate(initialLat, initialLng);
      }
    } else {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [isMapOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 1-Tap GPS Trigger
  const handleGetGps = async () => {
    setIsLocating(true);
    setGpsMessage(null);
    setBoundsError(null);

    try {
      const pos = await getCurrentGpsPosition();

      // Dynamic Scope Check: Check if physically in an active hub governorate
      if (!allowedHubIds.includes(pos.governorateId)) {
        if (pos.governorateId === 'khan_younis') {
          setBoundsError(
            'موقعك الحالي يقع في خان يونس (متاحة لتوصيل الزبائن فقط حالياً، والتسجيل متاح للمحافظات المعتمدة).'
          );
        } else {
          setBoundsError(
            `موقعك الحالي يقع في «${pos.governorateName}». عذراً، التسجيل متاح حالياً للمحافظات ذات المركز المعتمد فقط.`
          );
        }
        return;
      }

      setCurrentCoords(pos.coordinates);

      onLocationSelect({
        lat: Number(pos.coordinates.lat.toFixed(6)),
        lng: Number(pos.coordinates.lng.toFixed(6)),
        suggestedCityId: pos.cityId,
        suggestedCityName: pos.cityName,
        suggestedGovernorateId: pos.governorateId,
        suggestedGovernorateName: pos.governorateName,
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([pos.coordinates.lat, pos.coordinates.lng], 16, {
          duration: 1.2,
        });
        if (markerRef.current) {
          markerRef.current.setLatLng([pos.coordinates.lat, pos.coordinates.lng]);
        }
      }
    } catch (err: any) {
      setGpsMessage(err?.message || 'تعذر تحديد الموقع تلقائياً، يمكنك التحديد يدوياً من الخريطة.');
      setIsMapOpen(true);
    } finally {
      setIsLocating(false);
    }
  };

  const matchedCity = currentCoords
    ? matchNearestGazaCity(currentCoords.lat, currentCoords.lng)
    : null;

  return (
    <div className="space-y-2 font-almarai">
      {/* 1. Header & Quick Actions (Concise & Lightweight) */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-bold text-brand-dark m-0">
            موقع المحل (GPS) <span className="text-brand-primary">*</span>
          </label>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-surface text-brand-muted border border-brand-border/70">
            إلزامي
          </span>
        </div>

        {/* Action Buttons: 1-Tap GPS + Map Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGetGps}
            disabled={isLocating}
            className="h-9 px-3 rounded-lg bg-brand-primary text-white hover:brightness-105 active:scale-[0.98] transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-2xs"
          >
            {isLocating ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            )}
            <span>{isLocating ? 'جاري الالتقاط...' : 'التقاط موقعي'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMapOpen((prev) => !prev)}
            className={`h-9 px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isMapOpen
                ? 'bg-brand-dark text-white border-brand-dark'
                : 'bg-white border-brand-border text-brand-dark hover:bg-brand-surface'
            }`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>{isMapOpen ? 'إغلاق الخريطة' : 'الخريطة'}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Status Feedback */}
      {currentCoords && !boundsError ? (
        <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[var(--brand-trust-soft)] border border-[var(--brand-trust-border)] text-brand-dark text-xs animate-in fade-in duration-200">
          <span className="w-3.5 h-3.5 rounded-full bg-brand-trust text-white flex items-center justify-center text-[8px] font-bold shrink-0">
            ✓
          </span>
          <span className="font-bold text-xs text-brand-dark">
            تم التحديد: {matchedCity?.cityName}
          </span>
          <span className="text-[10px] text-brand-muted font-mono mr-auto" dir="ltr">
            {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
          </span>
        </div>
      ) : !boundsError ? (
        <div className="text-[11px] text-brand-muted py-0.5">
          اضغط «التقاط موقعي» أو حدد بالخريطة لتسجيل نقطة استلام الطرود.
        </div>
      ) : null}

      {/* 3. Out-of-Scope Warning (e.g., Khan Younis or outside Central Gaza) */}
      {boundsError && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-900 text-xs animate-in fade-in duration-200">
          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
            !
          </span>
          <span className="leading-relaxed font-bold">{boundsError}</span>
        </div>
      )}

      {/* 4. Collapsible Map Drawer */}
      {isMapOpen && (
        <div className="rounded-xl overflow-hidden border border-brand-border bg-brand-surface shadow-xs transition-all animate-in fade-in duration-200 mt-1">
          <div className="bg-white px-3 py-1.5 border-b border-brand-border flex items-center justify-between text-xs">
            <span className="text-[11px] text-brand-muted">
              اسحب الدبوس لتحديد مدخل المحل بدقة
            </span>
            <button
              type="button"
              onClick={() => setIsMapOpen(false)}
              className="text-brand-muted hover:text-brand-dark text-xs font-bold cursor-pointer"
            >
              ✕ إغلاق
            </button>
          </div>

          <div
            ref={mapContainerRef}
            style={{ height: '240px', width: '100%', zIndex: 1 }}
            className="cursor-crosshair"
          />
        </div>
      )}

      {/* GPS Error Message (if locating fails) */}
      {gpsMessage && (
        <p className="text-[11px] text-brand-muted font-medium m-0 flex items-center gap-1.5 pt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/70 shrink-0" />
          <span>{gpsMessage}</span>
        </p>
      )}

      {error && (
        <p className="text-[11px] text-red-600 font-bold m-0 flex items-center gap-1.5 pt-0.5">
          <span className="w-3.5 h-3.5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] shrink-0">!</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
