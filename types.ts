export interface ExcelColumn {
  header: string;
  key: string;
}

/**
 * 페이지 데이터 인터페이스
 * PDF 또는 이미지 파일에서 추출한 개별 페이지 정보
 */
export interface PageData {
  id: string;
  pageNumber: number;
  /** 썸네일 이미지 (미리보기용) */
  thumbnailBase64: string;
  /** AI 처리용 원본 이미지 */
  imageBase64: string;
  width: number;
  height: number;
  sourceFile: {
    name: string;
    type: 'image' | 'pdf';
    r2Url?: string;
    r2Key?: string;
  };
  /** 컬럼 감지용 선택 여부 */
  isSelectedForColumns: boolean;
  /** 데이터 추출용 선택 여부 */
  isSelectedForExtract: boolean;
}

/**
 * 페이지 소스 정보
 */
export interface PageSourceInfo {
  fileName: string;
  pageNumber: number;
  type: 'image' | 'pdf';
}

export interface ExtractedData {
  id: string;
  /** PageData.id 참조 */
  pageId?: string;
  originalImage: string; // Base64
  r2Url?: string; // R2 public URL
  r2Key?: string; // R2 storage key
  /** 소스 파일 정보 */
  sourceInfo?: PageSourceInfo;
  data: Record<string, string | number>[]; // Changed to Array to support multiple rows per image
  status: 'pending' | 'processing' | 'completed' | 'error';
  confidence?: string;
}

/**
 * 앱 워크플로우 단계
 *
 * 0. UPLOAD_TEMPLATE: 템플릿 업로드 (선택사항)
 * 1. UPLOAD_FILES: 파일 업로드 + 페이지 미리보기 + 컬럼감지용 선택
 * 2. DEFINE_COLUMNS: 선택한 페이지로 컬럼 감지
 * 3. SELECT_PAGES: 데이터 추출할 페이지 선택 (기본 전체선택)
 * 4. PROCESS_DATA: AI 처리
 * 5. REVIEW_DATA: 데이터 검수
 * 6. EXPORT: 내보내기
 */
export enum AppStep {
  UPLOAD_TEMPLATE = 0,
  UPLOAD_FILES = 1,
  DEFINE_COLUMNS = 2,
  SELECT_PAGES = 3,
  PROCESS_DATA = 4,
  REVIEW_DATA = 5,
  EXPORT = 6,
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
}