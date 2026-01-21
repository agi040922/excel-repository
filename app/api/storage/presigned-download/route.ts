import { NextRequest } from 'next/server';
import { generatePresignedDownloadUrl } from '@/lib/r2/utils';
import type { DownloadRequest, DownloadUrlResponse } from '@/types/r2';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';

/**
 * POST /api/storage/presigned-download
 *
 * 비공개 파일에 대한 임시 다운로드 URL을 생성합니다.
 * 공개 버킷의 경우 이 엔드포인트가 필요하지 않을 수 있습니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body: DownloadRequest = await request.json();
    const { key, expiresIn = 3600 } = body;

    // 입력 검증
    if (!key) {
      return errorResponse(
        ErrorCodes.MISSING_PARAMETER,
        'key가 필요합니다',
        400
      );
    }

    // Presigned URL 생성
    const downloadUrl = await generatePresignedDownloadUrl(key, expiresIn);

    const response: DownloadUrlResponse = {
      downloadUrl,
      key,
    };

    return successResponse(response);
  } catch (error) {
    return handleApiError(error, 'storage/presigned-download');
  }
}
