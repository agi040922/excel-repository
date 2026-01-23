import { createClient } from '@/lib/supabase/server';
import { HistoryPageClient } from '@/components/dashboard/HistoryPageClient';

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

// result_data 타입 정의
interface ResultData {
  rows?: Array<Record<string, string | number>>;
  columns?: Array<{ key: string; header: string }>;
  metadata?: { total_images?: number; processed_images?: number; average_confidence?: number };
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let history: Array<{
    id: string;
    templateName: string;
    imageCount: number;
    date: string;
    status: 'completed' | 'pending' | 'error';
    rowsExtracted: number;
  }> = [];

  let extractionData: Array<{
    id: string;
    result_data: ResultData | null;
    exported_file_url: string | null;
  }> = [];

  if (user) {
    // 추출 이력 조회 (템플릿 정보 포함)
    const { data: extractions } = await supabase
      .from('extractions')
      .select(`
        id,
        status,
        image_urls,
        result_data,
        exported_file_url,
        created_at,
        template_id,
        templates (name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (extractions) {
      // 다운로드용 추출 데이터
      extractionData = extractions.map(ext => ({
        id: ext.id,
        result_data: ext.result_data as ResultData | null,
        exported_file_url: (ext.exported_file_url as string) || null,
      }));

      // UI 표시용 히스토리 데이터
      history = extractions.map(ext => {
        // 템플릿 데이터 처리
        const templateData = ext.templates as { name: string } | { name: string }[] | null;
        const templateName = Array.isArray(templateData)
          ? templateData[0]?.name
          : templateData?.name;

        // result_data 구조 파싱
        const resultData = ext.result_data as ResultData | null;

        // 추출된 행 수 계산 (result_data.rows 배열 길이)
        const rowsExtracted = resultData?.rows?.length || 0;

        // 이미지 수: image_urls 우선, 없으면 metadata.total_images 사용
        const imageCount = ext.image_urls?.length || resultData?.metadata?.total_images || 0;

        // status 변환 (failed -> error for UI consistency)
        let displayStatus: 'completed' | 'pending' | 'error' = 'pending';
        if (ext.status === 'completed') {
          displayStatus = 'completed';
        } else if (ext.status === 'failed') {
          displayStatus = 'error';
        } else if (ext.status === 'pending' || ext.status === 'processing') {
          displayStatus = 'pending';
        }

        return {
          id: ext.id,
          templateName: templateName || '템플릿 없음',
          imageCount,
          date: getRelativeTime(new Date(ext.created_at)),
          status: displayStatus,
          rowsExtracted,
        };
      });
    }
  }

  return <HistoryPageClient history={history} extractions={extractionData} />;
}
