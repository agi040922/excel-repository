import { useState } from 'react';
import type { PresignedUrlResponse, R2UploadState, R2UploadResult } from '@/types/r2';

/**
 * R2 파일 업로드 커스텀 훅
 *
 * 사용 예시:
 * ```tsx
 * const { uploadFile, isUploading, progress, error } = useR2Upload();
 *
 * const handleUpload = async (file: File) => {
 *   const result = await uploadFile(file, 'uploads');
 *   // 업로드 완료: result.publicUrl
 * };
 * ```
 */
export function useR2Upload() {
  const [state, setState] = useState<R2UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  /**
   * 파일을 R2에 업로드
   *
   * 1. API Route에서 presigned URL 요청
   * 2. presigned URL로 R2에 직접 PUT 업로드
   * 3. 완료된 공개 URL 반환
   *
   * @param file - 업로드할 File 객체
   * @param folder - 저장할 폴더 경로 (기본: 'uploads')
   * @returns 업로드 결과 (key, publicUrl)
   */
  const uploadFile = async (
    file: File,
    folder: string = 'uploads'
  ): Promise<R2UploadResult> => {
    setState({ isUploading: true, progress: 0, error: null });

    try {
      // Step 1: API Route에서 presigned URL 요청
      const presignedResponse = await fetch('/api/storage/presigned-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder,
        }),
      });

      if (!presignedResponse.ok) {
        // 상태 코드별 에러 메시지
        if (presignedResponse.status === 401) {
          throw new Error('로그인이 필요합니다');
        } else if (presignedResponse.status === 403) {
          throw new Error('업로드 권한이 없습니다');
        } else if (presignedResponse.status === 429) {
          throw new Error('업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요');
        }
        throw new Error('업로드 URL을 가져오는데 실패했습니다');
      }

      const { uploadUrl, key, publicUrl }: PresignedUrlResponse =
        await presignedResponse.json();

      // Step 2: R2에 직접 파일 업로드 (XMLHttpRequest로 진행률 추적)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // 진행률 추적
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setState((prev) => ({ ...prev, progress: percentComplete }));
          }
        });

        // 완료 핸들러
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else if (xhr.status === 413) {
            reject(new Error('파일 크기가 너무 큽니다'));
          } else if (xhr.status === 503) {
            reject(new Error('서버가 일시적으로 사용 불가능합니다. 잠시 후 다시 시도해주세요'));
          } else {
            reject(new Error(`업로드 실패: HTTP ${xhr.status}`));
          }
        });

        // 에러 핸들러
        xhr.addEventListener('error', () => {
          reject(new Error('네트워크 연결을 확인해주세요'));
        });

        // 타임아웃 핸들러
        xhr.addEventListener('timeout', () => {
          reject(new Error('업로드 시간이 초과되었습니다. 다시 시도해주세요'));
        });

        // 중단 핸들러
        xhr.addEventListener('abort', () => {
          reject(new Error('업로드가 취소되었습니다'));
        });

        // 업로드 시작
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.timeout = 60000; // 60초 타임아웃
        xhr.send(file);
      });

      // Step 3: 업로드 완료
      setState({ isUploading: false, progress: 100, error: null });

      return { key, publicUrl };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      setState({ isUploading: false, progress: 0, error: errorMessage });
      throw error;
    }
  };

  /**
   * 업로드 상태 초기화
   */
  const reset = () => {
    setState({ isUploading: false, progress: 0, error: null });
  };

  return {
    uploadFile,
    isUploading: state.isUploading,
    progress: state.progress,
    error: state.error,
    reset,
  };
}
