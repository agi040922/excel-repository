/**
 * Filename utility functions
 * 파일명 처리를 위한 유틸리티 함수들
 */

/**
 * 파일명을 API에 안전하게 전송할 수 있도록 sanitize
 * - 한글, 특수문자, 공백 등을 언더스코어로 변환
 * - 파일 확장자는 보존
 *
 * @param filename - 원본 파일명
 * @returns sanitize된 파일명 (a-zA-Z0-9._- 만 포함)
 *
 * @example
 * sanitizeFilename("문서.pdf") // => "_.pdf"
 * sanitizeFilename("my file (1).pdf") // => "my_file__1_.pdf"
 * sanitizeFilename("report-2024.xlsx") // => "report-2024.xlsx"
 */
export function sanitizeFilename(filename: string): string {
  // 확장자 분리
  const lastDotIndex = filename.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0;

  const name = hasExtension ? filename.slice(0, lastDotIndex) : filename;
  const extension = hasExtension ? filename.slice(lastDotIndex) : '';

  // 이름 부분 sanitize (허용: a-zA-Z0-9_-)
  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');

  // 확장자 sanitize (허용: a-zA-Z0-9)
  const sanitizedExtension = extension.replace(/[^a-zA-Z0-9.]/g, '');

  // 빈 이름 방지
  const finalName = sanitizedName || 'file';

  return finalName + sanitizedExtension;
}
