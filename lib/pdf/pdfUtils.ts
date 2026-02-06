/**
 * PDF 유틸리티 함수
 * PDF 파일을 페이지별 이미지로 변환하는 기능을 제공합니다.
 *
 * 주의: 이 모듈은 클라이언트 사이드에서만 사용해야 합니다.
 */

// pdfjs-dist v4 타입
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

/**
 * pdfjs-dist를 동적으로 로드 (클라이언트 사이드에서만)
 */
async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF utilities can only be used on the client side');
  }

  if (!pdfjsLib) {
    try {
      // pdfjs-dist v4
      pdfjsLib = await import('pdfjs-dist');

      // Worker 설정 (CDN 사용)
      const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

      console.log(`[PDF] Initialized pdfjs-dist v${pdfjsLib.version} with worker: ${workerUrl}`);
    } catch (error) {
      console.error('[PDF] Failed to initialize pdfjs-dist:', error);
      throw new Error('PDF 라이브러리 초기화 실패');
    }
  }

  return pdfjsLib;
}

/**
 * 페이지 이미지 데이터 인터페이스
 */
export interface PageImage {
  pageNumber: number;
  imageBase64: string;
  thumbnailBase64: string;
  width: number;
  height: number;
}

/**
 * PDF 변환 옵션
 */
export interface PdfConvertOptions {
  /** 렌더링 스케일 (기본: 2.0) */
  scale?: number;
  /** 썸네일 스케일 (기본: 0.3) */
  thumbnailScale?: number;
  /** 최대 페이지 수 (기본: Infinity) */
  maxPages?: number;
  /** 진행률 콜백 (현재 페이지, 전체 페이지) */
  onProgress?: (current: number, total: number) => void;
  /** 페이지별 스트리밍 콜백 (한 페이지 변환 완료 시 호출) */
  onPageComplete?: (page: PageImage, pageNumber: number, total: number) => void;
  /** 취소 여부 체크 콜백 */
  shouldCancel?: () => boolean;
}

const DEFAULT_OPTIONS = {
  scale: 2.0,
  thumbnailScale: 0.3,
  maxPages: Infinity, // 페이지 제한 해제
} as const;

/**
 * File을 ArrayBuffer로 변환
 */
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Base64 데이터를 ArrayBuffer로 변환
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // data URL에서 base64 부분만 추출
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * PDF 페이지를 canvas에 렌더링하고 base64 이미지로 반환
 */
async function renderPdfPage(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale: number
): Promise<{ imageBase64: string; width: number; height: number }> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  // Canvas 생성
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // 배경을 흰색으로 채우기 (투명 영역 방지)
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 렌더링
  try {
    await page.render({
      canvasContext: context,
      viewport: viewport,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).promise;
  } catch (renderError) {
    console.error(`Failed to render PDF page ${pageNum}:`, renderError);
    throw new Error(`PDF 페이지 ${pageNum} 렌더링 실패`);
  }

  // Base64로 변환
  const imageBase64 = canvas.toDataURL('image/jpeg', 0.85);

  // 이미지 데이터 유효성 검증 (최소 데이터 크기 확인)
  if (imageBase64.length < 1000) {
    console.warn(`PDF page ${pageNum} rendered with suspiciously small image data`);
  }

  return {
    imageBase64,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * PDF 파일을 페이지별 이미지로 변환
 *
 * @param file PDF 파일
 * @param options 변환 옵션
 * @returns PageImage 배열
 */
export async function pdfToImages(
  file: File,
  options?: PdfConvertOptions
): Promise<PageImage[]> {
  const pdfjs = await getPdfJs();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // PDF 파일 로드
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const numPages = Math.min(pdf.numPages, opts.maxPages);
  const pages: PageImage[] = [];

  console.log(`[PDF] Starting conversion of ${numPages} pages from ${file.name}`);

  // 각 페이지 렌더링
  for (let i = 1; i <= numPages; i++) {
    // 취소 체크
    if (opts.shouldCancel?.()) {
      console.log(`[PDF] Conversion cancelled at page ${i}/${numPages}`);
      break;
    }

    // 진행률 콜백
    opts.onProgress?.(i, numPages);

    // 원본 이미지
    const fullImage = await renderPdfPage(pdf, i, opts.scale);

    // 썸네일 이미지
    const thumbnail = await renderPdfPage(pdf, i, opts.thumbnailScale);

    const pageImage: PageImage = {
      pageNumber: i,
      imageBase64: fullImage.imageBase64,
      thumbnailBase64: thumbnail.imageBase64,
      width: fullImage.width,
      height: fullImage.height,
    };

    pages.push(pageImage);

    // 페이지 완료 콜백 (스트리밍용)
    opts.onPageComplete?.(pageImage, i, numPages);

    // 매 10페이지마다 또는 처음 5페이지는 매번 로그
    if (i <= 5 || i % 10 === 0 || i === numPages) {
      console.log(`[PDF] Converted page ${i}/${numPages} (${Math.round(i / numPages * 100)}%)`);
    }
  }

  console.log(`[PDF] Completed conversion of ${numPages} pages`);

  return pages;
}

/**
 * Base64 PDF 데이터를 페이지별 이미지로 변환
 *
 * @param base64Pdf Base64 인코딩된 PDF 데이터
 * @param options 변환 옵션
 * @returns PageImage 배열
 */
export async function pdfBase64ToImages(
  base64Pdf: string,
  options?: PdfConvertOptions
): Promise<PageImage[]> {
  const pdfjs = await getPdfJs();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Base64를 ArrayBuffer로 변환
  const arrayBuffer = base64ToArrayBuffer(base64Pdf);
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const numPages = Math.min(pdf.numPages, opts.maxPages);
  const pages: PageImage[] = [];

  // 각 페이지 렌더링
  for (let i = 1; i <= numPages; i++) {
    // 원본 이미지
    const fullImage = await renderPdfPage(pdf, i, opts.scale);

    // 썸네일 이미지
    const thumbnail = await renderPdfPage(pdf, i, opts.thumbnailScale);

    pages.push({
      pageNumber: i,
      imageBase64: fullImage.imageBase64,
      thumbnailBase64: thumbnail.imageBase64,
      width: fullImage.width,
      height: fullImage.height,
    });
  }

  return pages;
}

/**
 * PDF 파일의 페이지 수 반환
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await fileToArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  return pdf.numPages;
}

/**
 * 파일이 PDF인지 확인
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Base64 문자열이 PDF인지 확인
 */
export function isPdfBase64(base64: string): boolean {
  return base64.startsWith('data:application/pdf') ||
         base64.startsWith('JVBERi'); // PDF magic number in base64
}

/**
 * 이미지 파일을 PageImage 형식으로 변환
 */
export async function imageFileToPageImage(file: File): Promise<PageImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const base64 = e.target?.result as string;

      // 이미지 크기를 알기 위해 Image 객체 생성
      const img = new Image();
      img.onload = () => {
        // 썸네일 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 썸네일 크기 계산 (최대 200px)
        const maxThumbSize = 200;
        const ratio = Math.min(maxThumbSize / img.width, maxThumbSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.7);

        resolve({
          pageNumber: 1,
          imageBase64: base64,
          thumbnailBase64: thumbnailBase64,
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64;
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * 스트리밍 변환용 확장 옵션
 */
export interface StreamingConvertOptions extends PdfConvertOptions {
  /** 파일별 페이지 완료 콜백 (스트리밍 업데이트용, false 반환 시 취소) */
  onFilePageComplete?: (
    page: PageImage & { sourceFile: { name: string; type: 'image' | 'pdf' } },
    currentPage: number,
    totalPages: number,
    fileName: string
  ) => boolean | void;

  /** 취소 여부 체크 콜백 */
  shouldCancel?: () => boolean;
}

/**
 * 여러 파일(이미지 + PDF)을 PageImage 배열로 변환
 *
 * @param files 파일 배열
 * @param options PDF 변환 옵션
 * @returns PageImage 배열 (소스 파일 정보 포함)
 */
export async function filesToPageImages(
  files: File[],
  options?: StreamingConvertOptions
): Promise<Array<PageImage & { sourceFile: { name: string; type: 'image' | 'pdf' } }>> {
  const allPages: Array<PageImage & { sourceFile: { name: string; type: 'image' | 'pdf' } }> = [];

  for (const file of files) {
    // 취소 체크
    if (options?.shouldCancel?.()) {
      console.log(`[PDF] File conversion cancelled`);
      break;
    }

    if (isPdfFile(file)) {
      // PDF 처리 (스트리밍 콜백 전달)
      const pages = await pdfToImages(file, {
        ...options,
        shouldCancel: options?.shouldCancel,
        onPageComplete: (page, currentPage, totalPages) => {
          const pageWithSource = {
            ...page,
            sourceFile: { name: file.name, type: 'pdf' as const },
          };
          allPages.push(pageWithSource);
          options?.onFilePageComplete?.(pageWithSource, currentPage, totalPages, file.name);
        },
      });
      // onPageComplete가 있으면 이미 추가됨, 없으면 여기서 추가
      if (!options?.onFilePageComplete) {
        pages.forEach(page => {
          allPages.push({
            ...page,
            sourceFile: { name: file.name, type: 'pdf' },
          });
        });
      }
    } else {
      // 이미지 처리
      const page = await imageFileToPageImage(file);
      const pageWithSource = {
        ...page,
        sourceFile: { name: file.name, type: 'image' as const },
      };
      allPages.push(pageWithSource);
      options?.onFilePageComplete?.(pageWithSource, 1, 1, file.name);
    }
  }

  return allPages;
}
