'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileUploader, type FileUploadResult } from '@/components/FileUploader';
import { ImageIcon, PdfIcon } from '@/components/icons';
import { PageData, ExcelColumn } from '@/types';
import type { ConversionProgress } from '@/hooks/usePages';

interface UploadFilesStepProps {
  pages: PageData[];
  isConverting: boolean;
  conversionProgress?: ConversionProgress | null;
  columns?: ExcelColumn[]; // 이미 정의된 컬럼 (엑셀에서 추출된 경우)
  onFilesUpload: (files: File[] | FileUploadResult[]) => Promise<void>;
  onToggleColumnSelection: (pageId: string) => void;
  onConfirmAndNext: () => void;
  onRemovePage: (pageId: string) => void;
  onCancelConversion?: () => void;
}

export const UploadFilesStep: React.FC<UploadFilesStepProps> = ({
  pages,
  isConverting,
  conversionProgress,
  columns,
  onFilesUpload,
  onToggleColumnSelection,
  onConfirmAndNext,
  onRemovePage,
  onCancelConversion,
}) => {
  // 컬럼이 이미 정의되어 있는지 확인 (엑셀 템플릿에서 추출된 경우)
  const hasExistingColumns = columns && columns.length > 0;
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [focusedPageId, setFocusedPageId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<PageData | null>(null);

  // 스페이스바로 미리보기 토글
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 미리보기 모달이 열려있을 때 ESC 또는 스페이스로 닫기
      if (previewPage) {
        if (e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          setPreviewPage(null);
        }
        // 좌우 화살표로 이전/다음 페이지
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const currentIndex = pages.findIndex(p => p.id === previewPage.id);
          if (e.key === 'ArrowLeft' && currentIndex > 0) {
            setPreviewPage(pages[currentIndex - 1]);
          } else if (e.key === 'ArrowRight' && currentIndex < pages.length - 1) {
            setPreviewPage(pages[currentIndex + 1]);
          }
        }
        return;
      }

      // 포커스된 페이지가 있고 스페이스 누르면 미리보기
      if (e.key === ' ' && focusedPageId) {
        e.preventDefault();
        const page = pages.find(p => p.id === focusedPageId);
        if (page) {
          setPreviewPage(page);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedPageId, previewPage, pages]);

  const handleUpload = useCallback(async (files: File[] | FileUploadResult[]) => {
    setUploadError(null);
    try {
      await onFilesUpload(files);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.');
    }
  }, [onFilesUpload]);

  // 컬럼 감지용으로 선택된 페이지들
  const selectedForColumns = pages.filter(p => p.isSelectedForColumns);

  // 그룹화된 페이지 (파일별)
  const groupedPages = pages.reduce((acc, page) => {
    const fileName = page.sourceFile.name;
    if (!acc[fileName]) {
      acc[fileName] = [];
    }
    acc[fileName].push(page);
    return acc;
  }, {} as Record<string, PageData[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">파일 업로드</h2>
          <p className="text-slate-500">
            {hasExistingColumns
              ? '이미지 또는 PDF를 업로드하세요. 데이터를 추출할 문서를 준비해주세요.'
              : '이미지 또는 PDF를 업로드하세요. 컬럼 감지에 사용할 페이지를 선택해주세요.'}
          </p>
        </div>
        {pages.length > 0 && (
          <button
            onClick={onConfirmAndNext}
            disabled={(!hasExistingColumns && selectedForColumns.length === 0) || isConverting}
            className="bg-excel-600 hover:bg-excel-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isConverting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                변환 중...
              </>
            ) : hasExistingColumns ? (
              <>다음: 페이지 선택 <span className="ml-2">→</span></>
            ) : (
              <>다음: 컬럼 정의 <span className="ml-2">→</span></>
            )}
          </button>
        )}
      </div>

      {/* 파일 업로드 영역 */}
      <FileUploader
        onUpload={handleUpload}
        accept="image/*,application/pdf"
        multiple={true}
        title="이미지 또는 PDF 파일을 여기에 드래그하세요"
        subtitle="JPG, PNG, WEBP, PDF 지원 (흐릿한 이미지도 가능)"
        icon={<ImageIcon />}
        enableR2Upload={false}
      />

      {/* 에러 메시지 */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* 변환 중 표시 (진행률 포함) */}
      {isConverting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-700">PDF를 페이지별 이미지로 변환하고 있습니다</p>
                {conversionProgress && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    {conversionProgress.fileName} - {conversionProgress.currentPage} / {conversionProgress.totalPages} 페이지
                  </p>
                )}
              </div>
            </div>
            {conversionProgress && (
              <span className="text-lg font-bold text-blue-600">{conversionProgress.percentage}%</span>
            )}
          </div>
          {conversionProgress && (
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress.percentage}%` }}
              />
            </div>
          )}
          {/* 취소 버튼 */}
          {onCancelConversion && (
            <button
              onClick={onCancelConversion}
              className="mt-3 w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              변환 중지
            </button>
          )}
        </div>
      )}

      {/* 컬럼 정보 표시 (엑셀에서 추출된 경우) */}
      {hasExistingColumns && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                엑셀 템플릿에서 {columns!.length}개 컬럼이 추출되었습니다
              </p>
              <p className="text-xs text-green-600 mt-1">
                {columns!.slice(0, 5).map(c => c.header).join(', ')}{columns!.length > 5 ? ` 외 ${columns!.length - 5}개` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 선택 안내 (컬럼이 없을 때만 컬럼 감지용 선택 필요) */}
      {pages.length > 0 && !hasExistingColumns && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                컬럼 감지용 페이지 선택: <span className="text-excel-600">{selectedForColumns.length}개</span> / 전체 {pages.length}개
              </p>
              <p className="text-xs text-slate-500 mt-1">
                클릭하여 컬럼 감지에 사용할 페이지를 선택하세요. (테이블 헤더가 보이는 페이지 권장)
              </p>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">Space</span> 미리보기
            </div>
          </div>
        </div>
      )}

      {/* 페이지 수 표시 (컬럼이 있을 때) */}
      {pages.length > 0 && hasExistingColumns && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                업로드된 페이지: <span className="text-excel-600">{pages.length}개</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                다음 단계에서 데이터를 추출할 페이지를 선택합니다.
              </p>
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">Space</span> 미리보기
            </div>
          </div>
        </div>
      )}

      {/* 페이지 그리드 (파일별 그룹화) */}
      {Object.keys(groupedPages).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedPages).map(([fileName, filePages]) => (
            <div key={fileName} className="border border-slate-200 rounded-lg p-4 bg-white">
              {/* 파일 헤더 */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                {filePages[0].sourceFile.type === 'pdf' ? (
                  <PdfIcon />
                ) : (
                  <ImageIcon />
                )}
                <span className="font-medium text-slate-700 truncate">{fileName}</span>
                <span className="text-sm text-slate-400">({filePages.length} 페이지)</span>
              </div>

              {/* 페이지 그리드 */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {filePages.map((page) => (
                  <div
                    key={page.id}
                    tabIndex={0}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all outline-none ${
                      !hasExistingColumns && page.isSelectedForColumns
                        ? 'border-excel-500 ring-2 ring-excel-200'
                        : focusedPageId === page.id
                        ? 'border-blue-400 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => !hasExistingColumns && onToggleColumnSelection(page.id)}
                    onFocus={() => setFocusedPageId(page.id)}
                    onBlur={() => setFocusedPageId(null)}
                    onDoubleClick={() => setPreviewPage(page)}
                  >
                    {/* 썸네일 */}
                    <div className="aspect-[3/4] bg-slate-100">
                      <img
                        src={page.thumbnailBase64}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 페이지 번호 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-xs text-white font-medium">
                        {page.pageNumber}
                      </span>
                    </div>

                    {/* 선택 체크마크 (컬럼이 없을 때만 표시) */}
                    {!hasExistingColumns && page.isSelectedForColumns && (
                      <div className="absolute top-2 right-2 bg-excel-500 text-white p-1 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* 호버 시 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePage(page.id);
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                      title="페이지 삭제"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    </button>

                    {/* 컬럼 감지용 라벨 (컬럼이 없을 때만 표시) */}
                    {!hasExistingColumns && page.isSelectedForColumns && (
                      <div className="absolute top-2 left-2 right-8 bg-excel-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium truncate">
                        컬럼 감지용
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {pages.length === 0 && !isConverting && (
        <div className="text-center py-12 text-slate-400">
          <ImageIcon />
          <p className="mt-4">아직 업로드된 파일이 없습니다.</p>
        </div>
      )}

      {/* Quick Look 스타일 미리보기 모달 */}
      {previewPage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewPage(null)}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setPreviewPage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* 이전 버튼 */}
          {pages.findIndex(p => p.id === previewPage.id) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = pages.findIndex(p => p.id === previewPage.id);
                setPreviewPage(pages[currentIndex - 1]);
              }}
              className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* 다음 버튼 */}
          {pages.findIndex(p => p.id === previewPage.id) < pages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = pages.findIndex(p => p.id === previewPage.id);
                setPreviewPage(pages[currentIndex + 1]);
              }}
              className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* 이미지 */}
          <div
            className="max-w-[90vw] max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewPage.imageBase64}
              alt={`Page ${previewPage.pageNumber}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {/* 페이지 정보 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="font-medium">{previewPage.sourceFile.name}</p>
                  <p className="text-sm text-white/70">
                    페이지 {previewPage.pageNumber} / {pages.filter(p => p.sourceFile.name === previewPage.sourceFile.name).length}
                  </p>
                </div>
                <div className="text-sm text-white/70">
                  <span className="bg-white/20 px-2 py-1 rounded">Space</span> 닫기 ·
                  <span className="bg-white/20 px-2 py-1 rounded ml-1">←→</span> 이동
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
