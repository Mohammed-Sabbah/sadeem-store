'use client';

import React from 'react';
import { ProductEditor } from '@/features/merchant/components/product-editor';

export default function NewProductPage() {
  return <ProductEditor mode="create" />;
}
