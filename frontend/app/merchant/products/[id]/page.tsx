'use client';

import React, { use } from 'react';
import { useParams } from 'next/navigation';
import { ProductEditor } from '@/features/merchant/components/product-editor';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params);
  const routeParams = useParams();
  const id = resolvedParams?.id || (routeParams?.id as string);

  return <ProductEditor mode="edit" productId={id} />;
}
