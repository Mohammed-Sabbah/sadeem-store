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
  onLocationSelect: (payload: LocationSelectPayload) => void;
  error?: string;
}

export default function StoreMapPickerInner({
  initialLat,
  initialLng,
  onLocationSelect,
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

  // Custom Luxury Pin Icon for Sadeem
  const createPinIcon = () => {
    return L.divIcon({
      className: 'sadeem-map-pin-container',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(184, 98, 27, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #B8621B; color: #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(28, 25, 23, 0.25); border: 2.5px solid #FFFFFF;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

  // Helper to place or move marker
  const updateMarker = (lat: number, lng: number, map: L.Map) => {
    if (!isInsideGaza(lat, lng)) {
      setBoundsError('الموقع المحدد يقع خارج حدود قطاع غزة المعتمدة. يرجى اختيار موقع محلك بدقة.');
      return false;
    }

    setBoundsError(null);
    setCurrentCoords({ lat, lng });

    const matched = matchNearestGazaCity(lat, lng);

    if (!markerRef.current) {
      const marker = L.marker([lat, lng], {
        icon: createPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const markerPos = (e.target as L.Marker).getLatLng();
        if (isInsideGaza(markerPos.lat, markerPos.lng)) {
          const m = matchNearestGazaCity(markerPos.lat, markerPos.lng);
          setCurrentCoords({ lat: markerPos.lat, lng: markerPos.lng });
          setBoundsError(null);
          onLocationSelect({
            lat: Number(markerPos.lat.toFixed(6)),
            lng: Number(markerPos.lng.toFixed(6)),
            suggestedCityId: m.cityId,
            suggestedCityName: m.cityName,
            suggestedGovernorateId: m.governorateId,
            suggestedGovernorateName: m.governorateName,
          });
        } else {
          setBoundsError('الموقع يقع خارج حدود قطاع غزة');
        }
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

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

  // Initialize or re-render map when container opens
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
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      map.on('click', (e: L.LeafletMouseEvent) => {
        updateMarker(e.latlng.lat, e.latlng.lng, map);
      });

      mapInstanceRef.current = map;

      if (defaultLat && defaultLng) {
        updateMarker(defaultLat, defaultLng, map);
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
        updateMarker(pos.coordinates.lat, pos.coordinates.lng, mapInstanceRef.current);
      }

      setGpsMessage(`تم التقاط موقع المتجر بنجاح (دقة ±${pos.accuracyMeters}م) وانعكاس المدينة تلقائياً`);
    } catch (err: any) {
      setGpsMessage(err?.message || 'تعذر جلب موقعك عبر الـ GPS، يرجى فتح الخريطة والنقر يدوياً');
      // If GPS fails, automatically offer to open the map
      setIsMapOpen(true);
    } finally {
      setIsLocating(false);
    }
  };

  const matchedCity = currentCoords
    ? matchNearestGazaCity(currentCoords.lat, currentCoords.lng)
    : null;

  return (
    <div className="space-y-3 font-almarai">
      {/* 1. Header & Primary GPS Trigger (Placed above address dropdowns) */}
      <div className="p-4 rounded-xl border border-brand-border bg-brand-surface/60 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <label className="text-xs sm:text-sm font-extrabold text-brand-dark m-0">
                موقع المتجر الجغرافي (GPS)
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary/30">
                إلزامي للتوصيل
              </span>
            </div>
            <p className="text-[11px] text-brand-muted m-0 leading-relaxed">
              انقر لتحديد موقع محلك بدقة؛ سيتم استخراج المحافظة والمدينة تلقائياً في القوائم أدناه مع إمكانية تعديلها.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGetGps}
            disabled={isLocating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-white hover:brightness-105 active:scale-[0.99] transition-all text-xs sm:text-sm font-extrabold cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {isLocating ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            )}
            <span>{isLocating ? 'جاري التقاط الإحداثيات...' : '📍 تحديد موقع المتجر بدقة بالـ GPS'}</span>
          </button>
        </div>

        {/* Status & Collapsible Map Toggle */}
        <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-xs">
          {currentCoords ? (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                ✓
              </span>
              <div>
                <span className="font-bold text-emerald-950 block">
                  تم تحديد الموقع: {matchedCity?.cityName} ({matchedCity?.governorateName})
                </span>
                <span className="text-[11px] text-emerald-700 font-mono">
                  {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-900 text-xs">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                !
              </span>
              <span>لم يتم التقاط الموقع بعد. انقر على زر الـ GPS أعلاه أو حدده من الخريطة.</span>
            </div>
          )}

          {/* Toggle Map Button (Opens/Closes the Map) */}
          <button
            type="button"
            onClick={() => setIsMapOpen((prev) => !prev)}
            className="text-xs font-bold text-brand-primary hover:text-brand-dark flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-white border border-transparent hover:border-brand-border transition-colors cursor-pointer"
          >
            <span>{isMapOpen ? '✕ إخفاء الخريطة' : '🗺️ تعديل الموقع يدوياً على الخريطة'}</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Map Accordion (Zero height when closed) */}
      {isMapOpen && (
        <div className="rounded-xl overflow-hidden border border-brand-border shadow-xs bg-brand-surface animate-in fade-in duration-200">
          <div className="bg-white px-3.5 py-2 border-b border-brand-border flex items-center justify-between text-xs font-bold text-brand-dark">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
              <span>انقر في أي مكان بالخريطة أو اسحب الدبوس لتثبيت مدخل المحل بدقة</span>
            </span>
            <button
              type="button"
              onClick={() => setIsMapOpen(false)}
              className="text-brand-muted hover:text-brand-dark text-[11px] font-bold cursor-pointer"
            >
              إغلاق الخريطة
            </button>
          </div>

          <div
            ref={mapContainerRef}
            style={{ height: '240px', width: '100%', zIndex: 1 }}
            className="cursor-crosshair"
          />
        </div>
      )}

      {/* Warnings & Feedback */}
      {boundsError && (
        <p className="text-[11px] text-red-600 font-bold m-0 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{boundsError}</span>
        </p>
      )}

      {gpsMessage && (
        <p className="text-[11px] text-brand-muted font-bold m-0 flex items-center gap-1.5">
          <span>📡</span>
          <span>{gpsMessage}</span>
        </p>
      )}

      {error && <p className="text-[11px] text-red-600 font-bold m-0">{error}</p>}
    </div>
  );
}
