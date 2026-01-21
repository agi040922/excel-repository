import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from './client';

/**
 * 업로드용 presigned URL 생성
 * 클라이언트가 이 URL로 직접 PUT 요청하여 파일 업로드 가능
 *
 * @param key - R2 버킷 내 파일 경로 (예: 'uploads/image.png')
 * @param contentType - 파일의 MIME 타입
 * @param expiresIn - URL 만료 시간(초), 기본 3600초(1시간)
 * @returns presigned URL
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * 다운로드용 presigned URL 생성
 * 비공개 파일에 대한 임시 접근 URL 제공
 *
 * @param key - R2 버킷 내 파일 경로
 * @param expiresIn - URL 만료 시간(초), 기본 3600초(1시간)
 * @returns presigned URL
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * R2에서 파일 삭제
 *
 * @param key - 삭제할 파일의 R2 버킷 내 경로
 */
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * 공개 URL 반환
 * R2 버킷이 공개 설정되어 있는 경우 사용
 *
 * @param key - 파일의 R2 버킷 내 경로
 * @returns 공개 URL
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * 파일명과 폴더로부터 고유한 R2 키 생성
 * 파일명 충돌 방지를 위해 타임스탬프 추가
 *
 * @param filename - 원본 파일명
 * @param folder - 저장할 폴더 경로 (기본: 'uploads')
 * @returns 고유한 R2 키
 */
export function generateUniqueKey(filename: string, folder: string = 'uploads'): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${folder}/${timestamp}-${sanitizedFilename}`;
}
