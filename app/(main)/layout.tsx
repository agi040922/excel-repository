import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // 디버깅용 로그
  console.log('[MainLayout] User:', user?.email || 'null', 'Error:', error?.message || 'none');

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  );
}
