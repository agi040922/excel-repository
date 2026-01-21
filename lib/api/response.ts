/**
 * 표준 API 응답 타입 및 헬퍼 함수
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(data: T): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>);
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400
): Response {
  return Response.json(
    { success: false, error: { code, message } } satisfies ApiResponse,
    { status }
  );
}

/**
 * 표준 에러 코드
 */
export const ErrorCodes = {
  // 클라이언트 에러 (400번대)
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  RATE_LIMIT: 'RATE_LIMIT',

  // AI 관련 에러
  AI_ERROR: 'AI_ERROR',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',

  // 스토리지 에러
  STORAGE_ERROR: 'STORAGE_ERROR',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',

  // 결제 에러
  BILLING_ERROR: 'BILLING_ERROR',
  CHECKOUT_FAILED: 'CHECKOUT_FAILED',
  WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED',

  // 서버 에러 (500번대)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

/**
 * 에러를 로그하고 표준 응답 반환
 */
export function handleApiError(error: unknown, context: string): Response {
  console.error(`[API Error - ${context}]`, error);

  if (error instanceof Error) {
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      `서버 오류가 발생했습니다: ${error.message}`,
      500
    );
  }

  return errorResponse(
    ErrorCodes.INTERNAL_ERROR,
    '알 수 없는 오류가 발생했습니다',
    500
  );
}
