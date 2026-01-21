/**
 * Presigned URL 업로드 요청 타입
 */
export interface UploadRequest {
  /** 업로드할 파일명 */
  filename: string;
  /** 파일의 MIME 타입 (예: 'image/png', 'application/pdf') */
  contentType: string;
  /** 저장할 폴더 경로 (선택, 기본: 'uploads') */
  folder?: string;
}

/**
 * Presigned URL 응답 타입
 */
export interface PresignedUrlResponse {
  /** 파일 업로드에 사용할 presigned URL (PUT 요청) */
  uploadUrl: string;
  /** R2 버킷 내 파일의 고유 키 */
  key: string;
  /** 업로드 완료 후 접근 가능한 공개 URL */
  publicUrl: string;
}

/**
 * 다운로드용 Presigned URL 요청 타입
 */
export interface DownloadRequest {
  /** R2 버킷 내 파일 키 */
  key: string;
  /** URL 만료 시간(초), 선택 (기본: 3600) */
  expiresIn?: number;
}

/**
 * 다운로드용 Presigned URL 응답 타입
 */
export interface DownloadUrlResponse {
  /** 파일 다운로드에 사용할 presigned URL (GET 요청) */
  downloadUrl: string;
  /** R2 버킷 내 파일의 키 */
  key: string;
}

/**
 * R2 업로드 훅의 상태 타입
 */
export interface R2UploadState {
  /** 업로드 진행 중 여부 */
  isUploading: boolean;
  /** 업로드 진행률 (0-100) */
  progress: number;
  /** 에러 메시지 (에러 발생 시) */
  error: string | null;
}

/**
 * R2 업로드 결과 타입
 */
export interface R2UploadResult {
  /** 업로드된 파일의 R2 키 */
  key: string;
  /** 업로드된 파일의 공개 URL */
  publicUrl: string;
}
