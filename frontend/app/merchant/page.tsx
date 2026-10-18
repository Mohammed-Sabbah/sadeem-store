'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { merchantService } from '@/features/merchant/services/merchant.service';

export default function MerchantIndexPage() {
  const router = useRouter();

  useEffect(() => {
    merchantService.getStoreProfile().then((res) => {
      if (res.data) {
        if (res.data.approveStatus === 'approved') {
          router.replace('/merchant/dashboard');
        } else {
          router.replace('/merchant/pending-approval');
        }
      } else {
        router.replace('/merchant/join');
      }
    }).catch(() => {
      router.replace('/merchant/dashboard');
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center py-24 text-xs font-bold text-zinc-400">
      جارٍ توجيهك إلى وجهة متجرك المناسبة...
    </div>
  );
}
