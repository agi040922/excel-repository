'use client';

import { useMemo, useState } from 'react';
import { ImageIcon, PdfIcon } from '@/components/icons';
import { PageData } from '@/types';

interface SelectPagesStepProps {
  pages: PageData[];
  onToggleExtractSelection: (pageId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectRange: (fromPage: number, toPage: number) => void;
  onConfirmAndProcess: () => void;
  onBack: () => void;
}

export const SelectPagesStep: React.FC<SelectPagesStepProps> = ({
  pages,
  onToggleExtractSelection,
  onSelectAll,
  onDeselectAll,
  onSelectRange,
  onConfirmAndProcess,
  onBack,
}) => {
  // 범위 선택 상태
  const [rangeFrom, setRangeFrom] = useState<string>('');
  const [rangeTo, setRangeTo] = useState<string>('');

  // 추출용으로 선택된 페이지들
  const selectedForExtract = useMemo(
    () => pages.filter(p => p.isSelectedForExtract),
    [pages]
  );

  // 범위 선택 핸들러
  const handleRangeSelect = () => {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);

    if (isNaN(from) || isNaN(to)) {
      alert('유효한 페이지 번호를 입력해주세요.');
      return;
    }

    if (from < 1 || to > pages.length || from > to) {
      alert(`1부터 ${pages.length} 사이의 유효한 범위를 입력해주세요.`);
      return;
    }

    onSelectRange(from, to);
    setRangeFrom('');
    setRangeTo('');
  };

  // 그룹화된 페이지 (파일별)
  const groupedPages = useMemo(() => {
    return pages.reduce((acc, page) => {
      const fileName = page.sourceFile.name;
      if (!acc[fileName]) {
        acc[fileName] = [];
      }
      acc[fileName].push(page);
      return acc;
    }, {} as Record<string, PageData[]>);
  }, [pages]);

  // 예상 크레딧
  const estimatedCredits = selectedForExtract.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">데이터 추출할 페이지 선택</h2>
          <p className="text-slate-500">
            AI로 데이터를 추출할 페이지를 선택하세요. 선택한 페이지 수만큼 크레딧이 소모됩니다.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            ← 이전
          </button>
          <button
            onClick={onConfirmAndProcess}
            disabled={selectedForExtract.length === 0}
            className="bg-excel-600 hover:bg-excel-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            데이터 추출 시작 <span className="ml-2">→</span>
          </button>
        </div>
      </div>

      {/* 선택 현황 및 액션 버튼 */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  선택됨: <span className="text-excel-600 font-bold">{selectedForExtract.length}</span> / {pages.length} 페이지
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  예상 크레딧: <span className="font-medium text-amber-600">{estimatedCredits}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                전체 선택
              </button>
              <button
                onClick={onDeselectAll}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                전체 해제
              </button>
            </div>
          </div>

          {/* 범위 선택 */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-sm text-slate-600">범위 선택:</span>
            <input
              type="number"
              min={1}
              max={pages.length}
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              placeholder="시작"
              className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-excel-500 focus:border-transparent"
            />
            <span className="text-slate-400">~</span>
            <input
              type="number"
              min={1}
              max={pages.length}
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              placeholder="끝"
              className="w-20 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-excel-500 focus:border-transparent"
            />
            <span className="text-xs text-slate-400">페이지</span>
            <button
              onClick={handleRangeSelect}
              disabled={!rangeFrom || !rangeTo}
              className="px-3 py-1.5 text-sm bg-excel-100 hover:bg-excel-200 text-excel-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              범위 선택
            </button>
            <button
              onClick={() => {
                const from = parseInt(rangeFrom, 10);
                const to = parseInt(rangeTo, 10);
                if (!isNaN(from) && !isNaN(to) && from >= 1 && to <= pages.length && from <= to) {
                  // 범위 내 페이지들 선택 해제
                  pages.forEach(page => {
                    if (page.pageNumber >= from && page.pageNumber <= to && page.isSelectedForExtract) {
                      onToggleExtractSelection(page.id);
                    }
                  });
                }
              }}
              disabled={!rangeFrom || !rangeTo}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              범위 해제
            </button>
          </div>
        </div>
      </div>

      {/* 페이지 그리드 (파일별 그룹화) */}
      <div className="space-y-6">
        {Object.entries(groupedPages).map(([fileName, filePages]) => {
          const selectedInFile = filePages.filter(p => p.isSelectedForExtract).length;
          const allSelectedInFile = selectedInFile === filePages.length;

          return (
            <div key={fileName} className="border border-slate-200 rounded-lg p-4 bg-white">
              {/* 파일 헤더 */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {filePages[0].sourceFile.type === 'pdf' ? (
                    <PdfIcon />
                  ) : (
                    <ImageIcon />
                  )}
                  <span className="font-medium text-slate-700 truncate">{fileName}</span>
                  <span className="text-sm text-slate-400">
                    ({selectedInFile}/{filePages.length} 선택됨)
                  </span>
                </div>
                <button
                  onClick={() => {
                    // 파일 내 전체 선택/해제
                    filePages.forEach(page => {
                      if (allSelectedInFile) {
                        // 모두 선택된 상태면 해제
                        if (page.isSelectedForExtract) {
                          onToggleExtractSelection(page.id);
                        }
                      } else {
                        // 아니면 모두 선택
                        if (!page.isSelectedForExtract) {
                          onToggleExtractSelection(page.id);
                        }
                      }
                    });
                  }}
                  className="text-sm text-excel-600 hover:text-excel-700 font-medium"
                >
                  {allSelectedInFile ? '이 파일 해제' : '이 파일 전체 선택'}
                </button>
              </div>

              {/* 페이지 그리드 */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {filePages.map((page) => (
                  <div
                    key={page.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      page.isSelectedForExtract
                        ? 'border-excel-500 ring-2 ring-excel-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => onToggleExtractSelection(page.id)}
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <span className="text-[10px] text-white font-medium">
                        {page.pageNumber}
                      </span>
                    </div>

                    {/* 선택 체크박스 */}
                    <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      page.isSelectedForExtract
                        ? 'bg-excel-500 border-excel-500'
                        : 'bg-white/80 border-slate-300'
                    }`}>
                      {page.isSelectedForExtract && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* 비선택 시 오버레이 */}
                    {!page.isSelectedForExtract && (
                      <div className="absolute inset-0 bg-white/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 액션 */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{selectedForExtract.length}개 페이지</span>에서 데이터를 추출합니다.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            ← 이전
          </button>
          <button
            onClick={onConfirmAndProcess}
            disabled={selectedForExtract.length === 0}
            className="bg-excel-600 hover:bg-excel-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedForExtract.length > 0
              ? `${selectedForExtract.length}개 페이지 추출 시작`
              : '페이지를 선택해주세요'
            }
          </button>
        </div>
      </div>
    </div>
  );
};
