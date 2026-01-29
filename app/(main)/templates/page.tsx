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

// 날짜 포맷 함수
function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
    columns: Array<{ header: string; key: string }>;
    originalFileUrl: string | null;
    extractions: Array<{
      id: string;
      date: string;
      imageCount: number;
      status: 'completed' | 'pending' | 'error';
      exportedFileUrl: string | null;
      imageUrls: string[];
    }>;
  }> = [];

  if (user) {
    // 템플릿 목록 조회
    const { data: templatesData } = await supabase
      .from('templates')
      .select('id, name, columns, original_file_url, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (templatesData) {
      const templateIds = templatesData.map(t => t.id);

      // 템플릿별 추출 이력 조회 (상세 정보 포함)
      const { data: extractionsData } = await supabase
        .from('extractions')
        .select('id, template_id, status, image_urls, exported_file_url, created_at')
        .in('template_id', templateIds)
        .order('created_at', { ascending: false });

      // 템플릿별 추출 이력 그룹화
      const extractionsByTemplate = new Map<string, typeof extractionsData>();
      extractionsData?.forEach(ext => {
        if (ext.template_id) {
          const existing = extractionsByTemplate.get(ext.template_id) || [];
          existing.push(ext);
          extractionsByTemplate.set(ext.template_id, existing);
        }
      });

      templates = templatesData.map(t => {
        const columns = t.columns as Array<{ header: string; key: string }> | null;
        const templateExtractions = extractionsByTemplate.get(t.id) || [];

        // 마지막 사용 시간
        const lastUsedDate = templateExtractions[0]?.created_at;

        // 추출 이력 변환
        const extractions = templateExtractions.map(ext => {
          let displayStatus: 'completed' | 'pending' | 'error' = 'pending';
          if (ext.status === 'completed') displayStatus = 'completed';
          else if (ext.status === 'failed') displayStatus = 'error';

          return {
            id: ext.id,
            date: formatDate(new Date(ext.created_at)),
            imageCount: ext.image_urls?.length || 0,
            status: displayStatus,
            exportedFileUrl: ext.exported_file_url,
            imageUrls: ext.image_urls || [],
          };
        });

        // 모든 이미지 URL 수집
        const allImageUrls = templateExtractions.flatMap(ext => ext.image_urls || []);

        return {
          id: t.id,
          name: t.name,
          columnCount: columns?.length || 0,
          columns: columns || [],
          originalFileUrl: t.original_file_url,
          lastUsed: lastUsedDate
            ? getRelativeTime(new Date(lastUsedDate))
            : '사용 기록 없음',
          createdAt: formatDate(new Date(t.created_at)),
          usageCount: templateExtractions.length,
          extractions,
          allImageUrls,
        };
      });
    }
  }

  return <TemplateList templates={templates} />;
}
