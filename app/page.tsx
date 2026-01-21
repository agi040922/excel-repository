'use client';

import { useRouter } from 'next/navigation';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

export default function HomePage() {
  const router = useRouter();

  const handleNewExtraction = () => {
    router.push('/extraction');
  };

  return <DashboardHome onNewExtraction={handleNewExtraction} />;
}
