'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { LocationSelectPayload } from './StoreMapPickerInner';

export type { LocationSelectPayload };

export interface StoreMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (payload: LocationSelectPayload | null) => void;
  allowedHubIds?: string[];
  error?: string;
}

const StoreMapPickerInner = dynamic(
  () => import('./StoreMapPickerInner'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2.5 font-almarai py-1 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-brand-border/60 rounded" />
            <div className="h-3 w-64 bg-brand-border/40 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-32 bg-brand-border/60 rounded-lg" />
            <div className="h-10 w-20 bg-brand-border/40 rounded-lg" />
          </div>
        </div>
      </div>
    ),
  }
);

export default function StoreMapPicker(props: StoreMapPickerProps) {
  return <StoreMapPickerInner {...props} />;
}
