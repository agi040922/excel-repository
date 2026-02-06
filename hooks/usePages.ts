import { useState, useCallback, useRef } from 'react';
import { PageData } from '@/types';
import { filesToPageImages, isPdfFile, getPdfPageCount } from '@/lib/pdf';
import type { FileUploadResult } from '@/components/FileUploader';

/**
 * 변환 진행률 정보
 */
export interface ConversionProgress {
  currentPage: number;
  totalPages: number;
  fileName: string;
  percentage: number;
}

/**
 * 페이지 관리 훅
 *
 * PDF와 이미지 파일을 페이지 단위로 관리하고,
 * 컬럼 감지용/데이터 추출용 선택 상태를 추적합니다.
 */
export function usePages() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const pageCounterRef = useRef(0);
  const cancelRef = useRef(false); // 취소 플래그

  /**
   * 변환 취소
   */
  const cancelConversion = useCallback(() => {
    cancelRef.current = true;
    setIsConverting(false);
    setConversionProgress(null);
    console.log('[usePages] Conversion cancelled');
  }, []);

  /**
   * 파일 추가 (PDF는 페이지별로 분리, 스트리밍 방식)
   */
  const addFiles = useCallback(async (files: File[] | FileUploadResult[]) => {
    cancelRef.current = false; // 취소 플래그 리셋
    setIsConverting(true);
    setConversionProgress(null);

    try {
      // File[]과 FileUploadResult[] 구분
      const fileList: File[] = [];
      const uploadResultMap = new Map<string, FileUploadResult>();

      for (const f of files) {
        if (f instanceof File) {
          fileList.push(f);
        } else {
          fileList.push(f.file);
          uploadResultMap.set(f.file.name, f);
        }
      }

      // 첫 페이지 여부를 추적하기 위해 현재 페이지 수 저장
      const initialPageCount = pageCounterRef.current;
      let addedPageIndex = 0;

      // 스트리밍 방식으로 페이지 변환 (페이지별로 실시간 추가)
      await filesToPageImages(fileList, {
        shouldCancel: () => cancelRef.current,
        onProgress: (current, total) => {
          // 진행률 업데이트
        },
        onFilePageComplete: (pageImage, currentPage, totalPages, fileName) => {
          const uploadResult = uploadResultMap.get(pageImage.sourceFile.name);
          const isFirstPage = initialPageCount === 0 && addedPageIndex === 0;

          const newPage: PageData = {
            id: `page_${Date.now()}_${addedPageIndex}_${Math.random().toString(36).substr(2, 9)}`,
            pageNumber: pageImage.pageNumber,
            thumbnailBase64: pageImage.thumbnailBase64,
            imageBase64: pageImage.imageBase64,
            width: pageImage.width,
            height: pageImage.height,
            sourceFile: {
              name: pageImage.sourceFile.name,
              type: pageImage.sourceFile.type,
              r2Url: uploadResult?.uploadedUrl,
              r2Key: uploadResult?.key,
            },
            // 첫 번째 페이지는 기본으로 컬럼 감지용으로 선택
            isSelectedForColumns: isFirstPage,
            // 기본적으로 모든 페이지 데이터 추출용으로 선택
            isSelectedForExtract: true,
          };

          // 실시간으로 페이지 추가
          setPages(prev => [...prev, newPage]);
          pageCounterRef.current++;
          addedPageIndex++;

          // 진행률 업데이트
          setConversionProgress({
            currentPage,
            totalPages,
            fileName,
            percentage: Math.round((currentPage / totalPages) * 100),
          });
        },
      });
    } catch (error) {
      console.error('Failed to process files:', error);
      throw error;
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
    }
  }, []);

  /**
   * 컬럼 감지용 선택 토글
   */
  const toggleColumnSelection = useCallback((pageId: string) => {
    setPages(prev => prev.map(page =>
      page.id === pageId
        ? { ...page, isSelectedForColumns: !page.isSelectedForColumns }
        : page
    ));
  }, []);

  /**
   * 데이터 추출용 선택 토글
   */
  const toggleExtractSelection = useCallback((pageId: string) => {
    setPages(prev => prev.map(page =>
      page.id === pageId
        ? { ...page, isSelectedForExtract: !page.isSelectedForExtract }
        : page
    ));
  }, []);

  /**
   * 전체 선택 (데이터 추출용)
   */
  const selectAllForExtract = useCallback(() => {
    setPages(prev => prev.map(page => ({ ...page, isSelectedForExtract: true })));
  }, []);

  /**
   * 전체 해제 (데이터 추출용)
   */
  const deselectAllForExtract = useCallback(() => {
    setPages(prev => prev.map(page => ({ ...page, isSelectedForExtract: false })));
  }, []);

  /**
   * 범위 선택 (데이터 추출용)
   * @param fromPage 시작 페이지 번호 (1-based)
   * @param toPage 끝 페이지 번호 (1-based)
   */
  const selectRangeForExtract = useCallback((fromPage: number, toPage: number) => {
    setPages(prev => prev.map(page => ({
      ...page,
      isSelectedForExtract: page.pageNumber >= fromPage && page.pageNumber <= toPage
        ? true
        : page.isSelectedForExtract
    })));
  }, []);

  /**
   * 페이지 삭제
   */
  const removePage = useCallback((pageId: string) => {
    setPages(prev => prev.filter(page => page.id !== pageId));
  }, []);

  /**
   * 컬럼 감지용 선택된 페이지 반환
   */
  const getColumnPages = useCallback(() => {
    return pages.filter(p => p.isSelectedForColumns);
  }, [pages]);

  /**
   * 데이터 추출용 선택된 페이지 반환
   */
  const getExtractPages = useCallback(() => {
    return pages.filter(p => p.isSelectedForExtract);
  }, [pages]);

  /**
   * 모든 페이지 초기화
   */
  const resetPages = useCallback(() => {
    setPages([]);
    setIsConverting(false);
  }, []);

  /**
   * 페이지 상태 설정 (persistence에서 복원용)
   */
  const setPageState = useCallback((newPages: PageData[]) => {
    setPages(newPages);
  }, []);

  return {
    pages,
    isConverting,
    conversionProgress,
    addFiles,
    cancelConversion,
    toggleColumnSelection,
    toggleExtractSelection,
    selectAllForExtract,
    deselectAllForExtract,
    selectRangeForExtract,
    removePage,
    getColumnPages,
    getExtractPages,
    resetPages,
    setPages: setPageState,
  };
}
