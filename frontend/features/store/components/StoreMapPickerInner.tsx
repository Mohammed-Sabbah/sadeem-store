'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GAZA_BOUNDS,
  isInsideGaza,
  getCurrentGpsPosition,
  matchNearestGazaCity,
} from '@/shared/lib/geolocation';

interface StoreMapPickerInnerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (coords: { lat: number; lng: number; suggestedCityName?: string }) => void;
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
            suggestedCityName: m.cityName,
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
      suggestedCityName: matched.cityName,
    });

    return true;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Central Gaza (Deir al-Balah) by default
    const defaultLat = initialLat || 31.418;
    const defaultLng = initialLng || 34.351;
    const defaultZoom = initialLat && initialLng ? 15 : 13;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: false,
    });

    // Elegant Light Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Click handler to select location
    map.on('click', (e: L.LeafletMouseEvent) => {
      updateMarker(e.latlng.lat, e.latlng.lng, map);
    });

    mapInstanceRef.current = map;

    // Place initial marker if passed
    if (initialLat && initialLng) {
      updateMarker(initialLat, initialLng, map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker if initial props change
  useEffect(() => {
    if (initialLat && initialLng && mapInstanceRef.current) {
      updateMarker(initialLat, initialLng, mapInstanceRef.current);
    }
  }, [initialLat, initialLng]);

  // GPS Geolocation trigger
  const handleGetGps = async () => {
    setIsLocating(true);
    setGpsMessage(null);
    setBoundsError(null);

    try {
      const pos = await getCurrentGpsPosition();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([pos.coordinates.lat, pos.coordinates.lng], 16, {
          duration: 1.2,
        });
        updateMarker(pos.coordinates.lat, pos.coordinates.lng, mapInstanceRef.current);
        setGpsMessage(`تم التقاط موقعك بدقة (هامش ±${pos.accuracyMeters} متر)`);
      }
    } catch (err: any) {
      setGpsMessage(err?.message || 'تعذر جلب موقعك عبر الـ GPS، يرجى النقر يدوياً على الخريطة');
    } finally {
      setIsLocating(false);
    }
  };

  const matchedCity = currentCoords
    ? matchNearestGazaCity(currentCoords.lat, currentCoords.lng)
    : null;

  return (
    <div className="space-y-3 font-almarai">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-brand-dark">
            موقع المتجر الجغرافي على الخريطة (GPS) <span className="text-brand-primary">*</span>
          </label>
          <span className="text-[11px] text-brand-muted block">
            انقر على الخريطة أو اسحب العلامة لتحديد الموقع الدقيق لاستلام الطرود من محلك
          </span>
        </div>

        <button
          type="button"
          onClick={handleGetGps}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-primary/40 bg-brand-primary-soft text-brand-primary hover:bg-brand-primary hover:text-white transition-all text-xs font-bold cursor-pointer disabled:opacity-60 shadow-xs"
        >
          {isLocating ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
          )}
          <span>{isLocating ? 'جاري التقاط الإحداثيات...' : 'تحديد موقعي الحالي (GPS)'}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-brand-border shadow-xs bg-brand-surface">
        <div
          ref={mapContainerRef}
          style={{ height: '260px', width: '100%', zIndex: 1 }}
          className="cursor-crosshair"
        />

        {/* Floating helper hint */}
        <div className="absolute top-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-brand-border text-[11px] font-bold text-brand-dark shadow-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
          <span>انقر لتثبيت موقع المحل</span>
        </div>
      </div>

      {/* Coordinate & Match Badge */}
      {currentCoords ? (
        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              ✓
            </span>
            <div>
              <span className="font-bold text-emerald-950 block">
                تم اعتماد إحداثيات المتجر: {matchedCity?.cityName} ({matchedCity?.governorateName})
              </span>
              <span className="text-[11px] text-emerald-700 font-mono">
                {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
            جاهز للاستلام والتوصيل
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
            !
          </span>
          <span>
            تحديد موقع المتجر إلزامي لنتمكن من ربط محلك بمنظومة التوصيل والمناديب في سَدِيم.
          </span>
        </div>
      )}

      {/* Bounds Warning */}
      {boundsError && (
        <p className="text-[11px] text-red-600 font-bold m-0 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{boundsError}</span>
        </p>
      )}

      {/* GPS info/error message */}
      {gpsMessage && (
        <p className="text-[11px] text-brand-muted font-bold m-0 flex items-center gap-1.5">
          <span>📡</span>
          <span>{gpsMessage}</span>
        </p>
      )}

      {/* Schema / Validation Error */}
      {error && <p className="text-[11px] text-red-600 font-bold m-0">{error}</p>}
    </div>
  );
}
