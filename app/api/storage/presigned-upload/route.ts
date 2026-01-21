import { NextRequest } from 'next/server';
import { generatePresignedUploadUrl, generateUniqueKey, getPublicUrl } from '@/lib/r2/utils';
import type { PresignedUrlResponse } from '@/types/r2';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { uploadRequestSchema, safeValidateRequest } from '@/lib/security/validation';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rateLimit';

/**
 * POST /api/storage/presigned-upload
 *
 * 파일 업로드를 위한 presigned URL을 생성합니다.
 * 클라이언트는 이 URL로 직접 PUT 요청하여 R2에 파일을 업로드할 수 있습니다.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, RateLimitPresets.FILE_UPLOAD.limit, RateLimitPresets.FILE_UPLOAD.windowMs)) {
      return errorResponse(
        ErrorCodes.RATE_LIMIT,
        'Too many upload requests. Please try again later.',
        429
      );
    }

    // Validation
    const body = await request.json();
    const validation = safeValidateRequest(uploadRequestSchema, body);

    if (!validation.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        validation.error,
        400
      );
    }

    const { filename, contentType, folder } = validation.data;

    // 고유한 키 생성 (타임스탬프 포함으로 중복 방지)
    const key = generateUniqueKey(filename, folder);

    // Presigned URL 생성 (1시간 유효)
    const uploadUrl = await generatePresignedUploadUrl(key, contentType, 3600);

    // 공개 URL 생성
    const publicUrl = getPublicUrl(key);

    const response: PresignedUrlResponse = {
      uploadUrl,
      key,
      publicUrl,
    };

    return successResponse(response);
  } catch (error) {
    return handleApiError(error, 'storage/presigned-upload');
  }
}
