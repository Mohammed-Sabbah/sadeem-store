'use client';

import React from 'react';
import dynamic from 'next/dynamic';

interface StoreMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (coords: { lat: number; lng: number; suggestedCityName?: string }) => void;
  error?: string;
}

const StoreMapPickerInner = dynamic(
  () => import('./StoreMapPickerInner'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 font-almarai">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="h-4 w-44 bg-brand-surface animate-pulse rounded"></div>
            <div className="h-3 w-60 bg-brand-surface animate-pulse rounded mt-1"></div>
          </div>
          <div className="h-7 w-32 bg-brand-surface animate-pulse rounded-lg"></div>
        </div>
        <div className="h-[260px] w-full rounded-xl bg-brand-surface/70 border border-brand-border flex items-center justify-center text-xs text-brand-muted">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
            <span>جاري تحميل خريطة قطاع غزة...</span>
          </div>
        </div>
      </div>
    ),
  }
);

export default function StoreMapPicker(props: StoreMapPickerProps) {
  return <StoreMapPickerInner {...props} />;
}
