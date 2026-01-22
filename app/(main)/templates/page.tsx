import { createClient } from '@/lib/supabase/server';
import { TemplateList } from '@/components/dashboard/TemplateList';

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
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return date.toLocaleDateString('ko-KR');
}

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let templates: Array<{
    id: string;
    name: string;
    columnCount: number;
    lastUsed: string;
    createdAt: string;
    usageCount: number;
  }> = [];

  if (user) {
    // 템플릿 목록 조회
    const { data: templatesData } = await supabase
      .from('templates')
      .select('id, name, columns, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (templatesData) {
      // 각 템플릿의 사용 횟수와 마지막 사용 시간 조회
      const templateIds = templatesData.map(t => t.id);

      // 템플릿별 사용 횟수 조회
      const { data: usageCounts } = await supabase
        .from('extractions')
        .select('template_id')
        .in('template_id', templateIds);

      // 템플릿별 마지막 사용 시간 조회
      const { data: lastUsedData } = await supabase
        .from('extractions')
        .select('template_id, created_at')
        .in('template_id', templateIds)
        .order('created_at', { ascending: false });

      // 사용 횟수 집계
      const usageCountMap = new Map<string, number>();
      usageCounts?.forEach(e => {
        if (e.template_id) {
          usageCountMap.set(e.template_id, (usageCountMap.get(e.template_id) || 0) + 1);
        }
      });

      // 마지막 사용 시간 집계 (각 템플릿당 가장 최근 것만)
      const lastUsedMap = new Map<string, string>();
      lastUsedData?.forEach(e => {
        if (e.template_id && !lastUsedMap.has(e.template_id)) {
          lastUsedMap.set(e.template_id, e.created_at);
        }
      });

      templates = templatesData.map(t => {
        const columns = t.columns as Array<{ header: string; key: string }> | null;
        const lastUsedDate = lastUsedMap.get(t.id);

        return {
          id: t.id,
          name: t.name,
          columnCount: columns?.length || 0,
          lastUsed: lastUsedDate
            ? getRelativeTime(new Date(lastUsedDate))
            : '사용 기록 없음',
          createdAt: t.created_at,
          usageCount: usageCountMap.get(t.id) || 0,
        };
      });
    }
  }

  return <TemplateList templates={templates} />;
}
