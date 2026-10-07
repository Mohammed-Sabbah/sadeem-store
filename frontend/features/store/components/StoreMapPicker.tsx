'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { LocationSelectPayload } from './StoreMapPickerInner';

export type { LocationSelectPayload };

export interface StoreMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (payload: LocationSelectPayload) => void;
  error?: string;
}

const StoreMapPickerInner = dynamic(
  () => import('./StoreMapPickerInner'),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 rounded-xl border border-brand-border bg-brand-surface/60 space-y-3 font-almarai">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="h-4 w-44 bg-brand-border/60 animate-pulse rounded"></div>
            <div className="h-3 w-60 bg-brand-border/40 animate-pulse rounded mt-1.5"></div>
          </div>
          <div className="h-9 w-44 bg-brand-border/60 animate-pulse rounded-lg"></div>
        </div>
      </div>
    ),
  }
);

export default function StoreMapPicker(props: StoreMapPickerProps) {
  return <StoreMapPickerInner {...props} />;
}
