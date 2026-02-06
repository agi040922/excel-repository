'use client';

import { useMemo } from 'react';
import { ExtractedData, PageData } from '@/types';
import { PdfIcon } from '@/components/icons';

interface ProcessDataStepProps {
  pages: PageData[];
  items: ExtractedData[];
  isProcessing: boolean;
  progress: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    pending: number;
    percentage: number;
  };
  error: string | null;
  onRetryFailed: () => void;
  onBack: () => void;
  onBackToColumns?: () => void;
  onCancelProcessing?: () => void;
  onExportCompleted?: () => void; // 완료된 데이터만 엑셀로 내보내기
  onResume?: () => void; // 중단된 처리 계속하기
}

export const ProcessDataStep: React.FC<ProcessDataStepProps> = ({
  pages,
  items,
  isProcessing,
  progress,
  error,
  onRetryFailed,
  onBack,
  onBackToColumns,
  onCancelProcessing,
  onExportCompleted,
  onResume,
}) => {
  // 페이지 ID로 페이지 정보 조회
  const pageMap = useMemo(() => {
    const map = new Map<string, PageData>();
    pages.forEach(p => map.set(p.id, p));
    return map;
  }, [pages]);

  // 상태별 색상
  const getStatusColor = (status: ExtractedData['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">데이터 추출 중</h2>
          <p className="text-slate-500">
            AI가 선택한 페이지에서 데이터를 추출하고 있습니다.
          </p>
        </div>
        {!isProcessing && progress.failed > 0 && (
          <button
            onClick={onRetryFailed}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            실패 항목 재시도 ({progress.failed}개)
          </button>
        )}
      </div>

      {/* 전체 진행률 */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-semibold text-slate-800">전체 진행률</span>
          <span className="text-2xl font-bold text-excel-600">{progress.percentage}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
          <div
            className="bg-excel-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
            <p className="text-xs text-slate-500">완료</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{progress.processing}</p>
            <p className="text-xs text-slate-500">처리 중</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-400">{progress.pending}</p>
            <p className="text-xs text-slate-500">대기 중</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
            <p className="text-xs text-slate-500">실패</p>
          </div>
        </div>
        {/* 버튼들 */}
        <div className="mt-4 flex gap-3">
          {/* 처리 중일 때: 중지 버튼 */}
          {isProcessing && onCancelProcessing && (
            <button
              onClick={onCancelProcessing}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              처리 중지
            </button>
          )}
          {/* 중단된 상태에서 pending이 있을 때: 계속하기 버튼 */}
          {!isProcessing && progress.pending > 0 && onResume && (
            <button
              onClick={onResume}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              남은 {progress.pending}개 계속 처리
            </button>
          )}
          {/* 완료된 데이터가 있을 때: 엑셀 다운로드 버튼 */}
          {progress.completed > 0 && onExportCompleted && (
            <button
              onClick={onExportCompleted}
              className="flex-1 bg-excel-50 hover:bg-excel-100 text-excel-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              완료된 {progress.completed}개 엑셀로 받기
            </button>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-900">처리 중 오류 발생</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 아이템 목록 */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const page = item.pageId ? pageMap.get(item.pageId) : null;
          const sourceInfo = item.sourceInfo || (page ? {
            fileName: page.sourceFile.name,
            pageNumber: page.pageNumber,
            type: page.sourceFile.type
          } : null);

          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg border p-4 flex items-center gap-4 transition-all ${
                item.status === 'processing'
                  ? 'border-blue-300 ring-2 ring-blue-100'
                  : item.status === 'error'
                  ? 'border-red-300'
                  : item.status === 'completed'
                  ? 'border-green-200'
                  : 'border-slate-200'
              }`}
            >
              {/* 썸네일 */}
              <div className="w-16 h-20 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                {page?.thumbnailBase64 ? (
                  <img
                    src={page.thumbnailBase64}
                    alt={`Page ${page.pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : item.originalImage && !item.originalImage.startsWith('data:application/pdf') ? (
                  <img
                    src={item.originalImage}
                    alt={`Item ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PdfIcon />
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 truncate">
                    {sourceInfo ? `${sourceInfo.fileName} - 페이지 ${sourceInfo.pageNumber}` : `항목 ${index + 1}`}
                  </span>
                </div>
                {item.status === 'completed' && item.data.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-green-600">
                      {item.data.length}개 행 추출됨
                    </p>
                    {/* 첫 번째 행 미리보기 */}
                    <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                      {Object.entries(item.data[0]).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                    </p>
                  </div>
                )}
                {item.status === 'completed' && item.data.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    데이터 없음 - 컬럼이 문서와 맞지 않을 수 있음
                  </p>
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    추출 실패 - 재시도 필요
                  </p>
                )}
              </div>

              {/* 상태 표시 */}
              <div className="flex-shrink-0">
                {item.status === 'processing' ? (
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : item.status === 'completed' ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : item.status === 'error' ? (
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-xs text-slate-500">{index + 1}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 처리 완료 시 결과 요약 */}
      {!isProcessing && progress.pending === 0 && (
        <div className="space-y-4">
          {/* 데이터 없는 항목이 많으면 경고 */}
          {(() => {
            const emptyDataCount = items.filter(i => i.status === 'completed' && i.data.length === 0).length;
            const successWithData = items.filter(i => i.status === 'completed' && i.data.length > 0).length;

            if (emptyDataCount > successWithData && emptyDataCount > 0) {
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900">대부분의 항목에서 데이터가 추출되지 않았습니다</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        감지된 컬럼이 실제 문서 내용과 맞지 않을 수 있습니다.
                        컬럼 정의 단계로 돌아가 컬럼을 수정해보세요.
                      </p>
                      <p className="text-xs text-amber-600 mt-2">
                        데이터 추출 성공: {successWithData}개 / 데이터 없음: {emptyDataCount}개
                      </p>
                      {onBackToColumns && (
                        <button
                          onClick={onBackToColumns}
                          className="mt-3 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ← 컬럼 정의로 돌아가기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* 처리 중이 아닐 때 뒤로가기 버튼 */}
      {!isProcessing && progress.pending > 0 && (
        <div className="flex justify-start pt-4 border-t border-slate-200">
          <button
            onClick={onBack}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            ← 페이지 선택으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};
