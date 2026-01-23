import { createClient } from '@/lib/supabase/server';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

// 상대 시간 계산 함수
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 기본 데이터 (로그인 안 한 경우 또는 데이터 없는 경우)
  let dashboardData = {
    totalTemplates: 0,
    imagesProcessed: 0,
    thisMonthExtractions: 0,
    recentActivities: [] as Array<{
      id: string;
      template: string;
      images: number;
      date: string;
      status: 'completed' | 'pending' | 'processing' | 'failed' | 'error';
    }>,
  };

  if (user) {
    // 1. 총 템플릿 수
    const { count: templateCount } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 2. 총 처리된 이미지 수 (완료된 추출의 image_urls 배열 길이 합산)
    const { data: completedExtractions } = await supabase
      .from('extractions')
      .select('image_urls')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const imagesProcessed = completedExtractions?.reduce((sum, ext) => {
      return sum + (ext.image_urls?.length || 0);
    }, 0) || 0;

    // 3. 이번 달 추출 횟수
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonthCount } = await supabase
      .from('extractions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    // 4. 최근 활동 (최근 5개 추출)
    const { data: recentExtractions } = await supabase
      .from('extractions')
      .select(`
        id,
        status,
        image_urls,
        created_at,
        template_id,
        templates (name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentActivities = recentExtractions?.map((ext) => {
      // Supabase 조인은 단일 객체 또는 배열을 반환할 수 있음
      const templateData = ext.templates as { name: string } | { name: string }[] | null;
      const templateName = Array.isArray(templateData)
        ? templateData[0]?.name
        : templateData?.name;

      return {
        id: ext.id,
        template: templateName || '템플릿 없음',
        images: ext.image_urls?.length || 0,
        date: getRelativeTime(new Date(ext.created_at)),
        status: ext.status as 'completed' | 'pending' | 'processing' | 'failed' | 'error',
      };
    }) || [];

    dashboardData = {
      totalTemplates: templateCount || 0,
      imagesProcessed,
      thisMonthExtractions: thisMonthCount || 0,
      recentActivities,
    };
  }

  return <DashboardHome data={dashboardData} />;
}
