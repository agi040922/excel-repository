'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseExcelHeaders, generateExcelFile } from '@/services/excelService';
import { identifyColumnsFromImage, detectHeaderRow } from '@/services/geminiService';
import { AppStep, ExcelColumn } from '@/types';
import { StepIndicator } from '@/components/common/StepIndicator';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useColumns } from '@/hooks/useColumns';
import { useExtraction } from '@/hooks/useExtraction';
import { usePages } from '@/hooks/usePages';
import { useExtractionPersistence } from '@/hooks/useExtractionPersistence';
import { sanitizeFilename } from '@/lib/utils/filename';
import type { FileUploadResult } from '@/components/FileUploader';

// Dynamic imports로 Step 컴포넌트 lazy loading
const UploadTemplateStep = dynamic(() => import('@/components/steps/UploadTemplateStep').then(mod => ({ default: mod.UploadTemplateStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const UploadFilesStep = dynamic(() => import('@/components/steps/UploadFilesStep').then(mod => ({ default: mod.UploadFilesStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const DefineColumnsStep = dynamic(() => import('@/components/steps/DefineColumnsStep').then(mod => ({ default: mod.DefineColumnsStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const SelectPagesStep = dynamic(() => import('@/components/steps/SelectPagesStep').then(mod => ({ default: mod.SelectPagesStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const ProcessDataStep = dynamic(() => import('@/components/steps/ProcessDataStep').then(mod => ({ default: mod.ProcessDataStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const ReviewDataStep = dynamic(() => import('@/components/steps/ReviewDataStep').then(mod => ({ default: mod.ReviewDataStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const ExportStep = dynamic(() => import('@/components/steps/ExportStep').then(mod => ({ default: mod.ExportStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

// 저장 상태 표시 컴포넌트
function SaveIndicator({ status, lastSaved }: { status: string; lastSaved: Date | null }) {
  if (status === 'idle') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 text-sm z-50">
      {status === 'saving' && (
        <>
          <div className="w-3 h-3 border-2 border-excel-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">저장 중...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-slate-600">
            저장됨 {lastSaved && `(${lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})`}
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600">저장 실패</span>
        </>
      )}
    </div>
  );
}

function ExtractionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const extractionIdParam = searchParams.get('id');
  const templateIdParam = searchParams.get('templateId');

  const { step, setStep, templateName, setTemplateName, templateFile, setTemplateFile, reset: resetWorkflow } = useWorkflow();
  const { columns, setColumns, newColumnName, setNewColumnName, addColumn, updateColumnName, removeColumn } = useColumns();
  const {
    items, setItems, isProcessing, error: extractionError,
    initializeFromPages, processImages, handleCellChange, retryFailed, getProgress, resetItems,
    cancelProcessing
  } = useExtraction(columns, setStep);

  // 페이지 관리 훅
  const {
    pages, isConverting, conversionProgress, addFiles, toggleColumnSelection, toggleExtractSelection,
    selectAllForExtract, deselectAllForExtract, selectRangeForExtract, removePage, getColumnPages, getExtractPages, resetPages,
    cancelConversion
  } = usePages();

  // 저장 관련 훅
  const {
    extractionId,
    saveState,
    createExtraction,
    updateExtractionImmediate,
    addImageUrls,
    updateStatus,
    saveResultData,
    updateCreditsUsed,
    loadExtraction,
    reset: resetPersistence,
  } = useExtractionPersistence({ debounceMs: 500 });

  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [isAnalyzingSample, setIsAnalyzingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [headerDetection, setHeaderDetection] = useState<{
    headerRowIndex: number;
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [templateFileUrl, setTemplateFileUrl] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Array<{ id: string; name: string; columnCount: number }>>([]);

  // 페이지 이탈 경고 (새로고침, 탭 닫기, 뒤로가기)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step > AppStep.UPLOAD_TEMPLATE) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  // 템플릿 목록 로드
  useEffect(() => {
    const loadTemplates = async () => {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const templates = await response.json();
        setSavedTemplates(templates.map((t: { id: string; name: string; columns?: ExcelColumn[] }) => ({
          id: t.id,
          name: t.name,
          columnCount: t.columns?.length || 0
        })));
      }
    };
    loadTemplates();
  }, []);

  // URL에서 extraction ID 로드 (이어하기)
  useEffect(() => {
    const loadExistingExtraction = async () => {
      if (extractionIdParam && !extractionId) {
        setIsLoading(true);
        try {
          const extraction = await loadExtraction(extractionIdParam);
          if (extraction) {
            // extraction 데이터로 상태 복원
            setImageUrls(extraction.image_urls || []);

            // result_data에서 columns 복원
            const resultData = extraction.result_data as { columns?: ExcelColumn[]; rows?: Record<string, string | number>[] } | null;
            if (resultData?.columns) {
              setColumns(resultData.columns);
            }

            // templates 관계에서 컬럼 복원 (fallback)
            const templateData = (extraction as { templates?: { columns?: ExcelColumn[] } }).templates;
            if (!resultData?.columns && templateData?.columns) {
              setColumns(templateData.columns);
            }

            // 기존 결과 데이터 복원 (result_data.rows가 있으면 items로 변환)
            if (resultData?.rows && resultData.rows.length > 0) {
              // 각 row를 하나의 item으로 복원 (이미지 URL이 없어도 데이터는 복원)
              const restoredItems = resultData.rows.map((row, index) => {
                const imageUrl = extraction.image_urls?.[index];
                return {
                  id: `restored_${index}`,
                  originalImage: imageUrl || '', // 이미지 URL이 없으면 빈 문자열
                  r2Url: imageUrl,
                  data: [row], // 각 row를 배열로 감싸서 저장
                  status: 'completed' as const,
                };
              });
              setItems(restoredItems);
            } else if (extraction.image_urls && extraction.image_urls.length > 0) {
              // rows가 없고 image_urls만 있는 경우
              const restoredItems = extraction.image_urls.map((url, index) => ({
                id: `restored_${index}`,
                originalImage: url,
                r2Url: url,
                data: [],
                status: 'pending' as const,
              }));
              setItems(restoredItems);
            }

            // 이어하기: 파일 업로드 단계부터 시작
            setStep(AppStep.UPLOAD_FILES);
          }
        } catch (error) {
          console.error('Failed to load extraction:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadExistingExtraction();
  }, [extractionIdParam, extractionId, loadExtraction, setColumns, setItems, setStep]);

  // URL에서 template ID 로드 (템플릿 선택)
  useEffect(() => {
    const loadTemplateFromParam = async () => {
      // extractionIdParam이 있으면 이어하기 모드이므로 템플릿 로드 스킵
      if (templateIdParam && !extractionIdParam && step === AppStep.UPLOAD_TEMPLATE) {
        setIsLoading(true);
        try {
          await handleSelectTemplate(templateIdParam);
          // URL에서 templateId 제거 (뒤로가기 시 다시 로드되지 않도록)
          router.replace('/extraction', { scroll: false });
        } catch (error) {
          console.error('Failed to load template:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTemplateFromParam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIdParam, extractionIdParam]);

  // 결과 데이터 자동 저장 (items 또는 columns 변경 시)
  useEffect(() => {
    if (extractionId && items.length > 0 && columns.length > 0) {
      const completedItems = items.filter(i => i.status === 'completed');
      if (completedItems.length > 0) {
        saveResultData(items, columns);
      }
    }
  }, [extractionId, items, columns, saveResultData]);

  // URL에 extraction ID 추가
  const updateUrlWithExtractionId = useCallback((id: string) => {
    const newUrl = `/extraction?id=${id}`;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  const handleTemplateUpload = async (files: File[] | FileUploadResult[]) => {
    const firstFile = files[0];
    const file = firstFile instanceof File ? firstFile : firstFile.file;
    const uploadedUrl = firstFile instanceof File ? undefined : firstFile.uploadedUrl;

    if (file) {
      try {
        const cols = await parseExcelHeaders(file);
        setColumns(cols);
        setTemplateName(file.name);
        setTemplateFile(file);
        if (uploadedUrl) {
          setTemplateFileUrl(uploadedUrl);
        }
        // 템플릿 업로드 후 파일 업로드 단계로 이동
        setStep(AppStep.UPLOAD_FILES);
      } catch {
        alert("Failed to parse Excel file. Please ensure it is a valid .xlsx file.");
      }
    }
  };

  const handleStartWithoutTemplate = () => {
    setTemplateName('Auto-generated Schema');
    setTemplateFile(null);
    setTemplateFileUrl(null);
    // 템플릿 없이 시작 시 파일 업로드 단계로 이동
    setStep(AppStep.UPLOAD_FILES);
  };

  // 템플릿 저장 핸들러
  const handleSaveAsTemplate = async (name: string) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          columns,
          original_file_url: templateFileUrl
        })
      });

      if (response.ok) {
        // 성공 피드백
        alert('템플릿이 성공적으로 저장되었습니다.');

        // 템플릿 목록 다시 로드
        const templatesResponse = await fetch('/api/templates');
        if (templatesResponse.ok) {
          const templates = await templatesResponse.json();
          setSavedTemplates(templates.map((t: { id: string; name: string; columns?: ExcelColumn[] }) => ({
            id: t.id,
            name: t.name,
            columnCount: t.columns?.length || 0
          })));
        }
      } else {
        alert('템플릿 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('템플릿 저장 중 오류가 발생했습니다.');
    }
  };

  // 템플릿 선택 핸들러
  const handleSelectTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const template = await response.json();
        setColumns(template.columns || []);
        setTemplateName(template.name);
        setTemplateFile(null);
        setTemplateFileUrl(template.original_file_url || null);
        // 템플릿 선택 후 파일 업로드 단계로 이동
        setStep(AppStep.UPLOAD_FILES);
      } else {
        alert('템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('템플릿 불러오기 중 오류가 발생했습니다.');
    }
  };

  // 파일 업로드 핸들러 (새로운 워크플로우)
  const handleFilesUpload = async (files: File[] | FileUploadResult[]) => {
    await addFiles(files);
  };

  // 파일 업로드 완료 후 다음 단계로 이동
  const handleUploadFilesNext = async () => {
    // 컬럼이 이미 있으면 (엑셀에서 추출된 경우) 바로 페이지 선택으로
    if (columns.length > 0) {
      // extraction 레코드 생성
      if (!extractionId) {
        const newId = await createExtraction({
          image_urls: pages.map(p => p.sourceFile.r2Url).filter(Boolean) as string[],
        });
        if (newId) {
          updateUrlWithExtractionId(newId);
        }
      }
      setStep(AppStep.SELECT_PAGES);
      return;
    }

    // 컬럼이 없으면 컬럼 감지 필요
    const columnPages = getColumnPages();
    if (columnPages.length === 0) {
      alert('컬럼 감지에 사용할 페이지를 최소 1개 선택해주세요.');
      return;
    }

    // 먼저 다음 단계로 이동 (UI 블로킹 방지)
    setStep(AppStep.DEFINE_COLUMNS);

    // 백그라운드에서 컬럼 감지 시작
    setIsAnalyzingSample(true);
    setSampleError(null);

    try {
      const firstPage = columnPages[0];
      const imageBase64 = firstPage.imageBase64;

      // 컬럼 감지 (백그라운드)
      const [headerResult, detectedHeaders] = await Promise.all([
        detectHeaderRow(imageBase64),
        identifyColumnsFromImage(imageBase64)
      ]);

      const cols = detectedHeaders.map(h => ({
        header: h,
        key: h.toLowerCase().replace(/\s/g, '_')
      }));
      setColumns(cols);

      if (headerResult.confidence > 0) {
        setHeaderDetection({
          headerRowIndex: headerResult.headerRowIndex,
          confidence: headerResult.confidence
        });
      }
    } catch (error) {
      console.error('Column detection error:', error);
      setSampleError(error instanceof Error ? error.message : '컬럼 감지에 실패했습니다.');
    } finally {
      setIsAnalyzingSample(false);
    }
  };

  // 컬럼 정의 완료 핸들러
  const handleConfirmColumns = async () => {
    if (columns.length === 0) {
      alert("최소 1개의 컬럼을 정의해주세요.");
      return;
    }

    // extraction 레코드가 없으면 생성
    if (!extractionId) {
      const newId = await createExtraction({
        image_urls: pages.map(p => p.sourceFile.r2Url).filter(Boolean) as string[],
      });

      if (newId) {
        updateUrlWithExtractionId(newId);
      }
    }

    setStep(AppStep.SELECT_PAGES);
  };

  // 페이지 선택 완료 후 처리 시작
  const handleConfirmAndProcess = async () => {
    const extractPages = getExtractPages();
    if (extractPages.length === 0) {
      alert('추출할 페이지를 최소 1개 선택해주세요.');
      return;
    }

    // 선택된 페이지로 ExtractedData 초기화 (생성된 items 반환)
    const initializedItems = initializeFromPages(extractPages);

    if (extractionId) {
      await updateStatus('processing');
    }

    setStep(AppStep.PROCESS_DATA);

    // 처리 시작 - 생성된 items를 직접 전달 (setState 비동기 문제 해결)
    await processImages(initializedItems);

    // 처리 완료 후 상태 업데이트
    if (extractionId) {
      const processedCount = extractPages.length;
      await updateCreditsUsed(creditsUsed + processedCount);
      await updateStatus('completed');
    }
  };

  // 샘플 업로드 핸들러 (컬럼 정의 단계에서 추가 업로드)
  const handleSampleUpload = async (files: File[] | FileUploadResult[]) => {
    const firstFile = files[0];
    const file = firstFile instanceof File ? firstFile : firstFile.file;
    let r2Url: string | undefined = !(firstFile instanceof File) ? firstFile.uploadedUrl : undefined;

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setSampleImage(base64);
        setIsAnalyzingSample(true);

        const isPdf = file.type === 'application/pdf' || base64.startsWith('data:application/pdf');
        setSampleError(null);

        try {
          // R2에 파일 업로드 (아직 업로드 안됐으면)
          if (!r2Url) {
            try {
              const presignedResponse = await fetch('/api/storage/presigned-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: sanitizeFilename(file.name),
                  contentType: file.type,
                  folder: 'extractions',
                }),
              });
              if (presignedResponse.ok) {
                const presignedData = await presignedResponse.json();
                const { uploadUrl, publicUrl } = presignedData.data;
                const uploadResponse = await fetch(uploadUrl, {
                  method: 'PUT',
                  headers: { 'Content-Type': file.type },
                  body: file,
                });
                if (uploadResponse.ok) {
                  r2Url = publicUrl;
                }
              }
            } catch (uploadError) {
              console.error('R2 upload failed:', uploadError);
            }
          }

          let detectedHeaders: string[];

          if (isPdf) {
            detectedHeaders = await identifyColumnsFromImage(base64);
            setHeaderDetection(null);
          } else {
            const [headerResult, headers] = await Promise.all([
              detectHeaderRow(base64),
              identifyColumnsFromImage(base64)
            ]);

            detectedHeaders = headers;

            if (headerResult.confidence > 0) {
              setHeaderDetection({
                headerRowIndex: headerResult.headerRowIndex,
                confidence: headerResult.confidence
              });
            }
          }

          const cols = detectedHeaders.map(h => ({
            header: h,
            key: h.toLowerCase().replace(/\s/g, '_')
          }));
          setColumns(cols);
        } catch (error) {
          console.error('Sample analysis error:', error);
          setSampleError(error instanceof Error ? error.message : 'Failed to analyze document');
        } finally {
          setIsAnalyzingSample(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderRowChange = (rowIndex: number) => {
    if (headerDetection) {
      setHeaderDetection({
        ...headerDetection,
        headerRowIndex: rowIndex
      });
    }
  };

  // 셀 변경 핸들러 (자동 저장)
  const handleCellChangeWithPersistence = (itemId: string, rowIndex: number, key: string, value: string) => {
    handleCellChange(itemId, rowIndex, key, value);
  };

  const [exportedFileUrl, setExportedFileUrl] = useState<string | null>(null);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);

  // 완료된 데이터만 엑셀로 내보내기 (처리 중에도 사용 가능)
  const handleExportCompleted = async () => {
    const completedItems = items.filter(item => item.status === 'completed' && item.data.length > 0);
    if (completedItems.length === 0) {
      alert('완료된 데이터가 없습니다.');
      return;
    }

    const exportRows = completedItems.flatMap(item => item.data);
    await generateExcelFile(columns, exportRows, templateFile || undefined);
  };

  const handleExport = async () => {
    const exportRows = items.flatMap(item => item.data);

    // 1. 로컬 다운로드 실행
    await generateExcelFile(columns, exportRows, templateFile || undefined);

    // 2. Export 단계로 이동
    setStep(AppStep.EXPORT);

    // 3. R2에 업로드 (비동기로 진행)
    try {
      setIsUploadingToR2(true);

      const { generateExcelBlob } = await import('@/services/excelService');
      const blob = await generateExcelBlob(columns, exportRows, templateFile || undefined);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      const filename = `extraction_${dateStr}_${timeStr}.xlsx`;

      const file = new File([blob], filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const presignedResponse = await fetch('/api/storage/presigned-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'exports',
        }),
      });

      if (presignedResponse.ok) {
        const presignedData = await presignedResponse.json();
        const { uploadUrl, publicUrl } = presignedData.data;

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (uploadResponse.ok) {
          setExportedFileUrl(publicUrl);

          if (extractionId) {
            await updateExtractionImmediate(extractionId, {
              exported_file_url: publicUrl,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to upload to R2:', error);
    } finally {
      setIsUploadingToR2(false);
    }
  };

  const reset = () => {
    resetWorkflow();
    resetPersistence();
    resetPages();
    resetItems();
    setColumns([]);
    setSampleImage(null);
    setImageUrls([]);
    setCreditsUsed(0);
    setTemplateFileUrl(null);
    setExportedFileUrl(null);
    setIsUploadingToR2(false);
    router.replace('/extraction', { scroll: false });
  };

  // 컬럼 감지용 페이지 이미지 목록
  const columnPageImages = getColumnPages().map(p => p.imageBase64);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-excel-600 mx-auto mb-4"></div>
          <p className="text-slate-600">작업을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} templateName={templateName} />

      {step === AppStep.UPLOAD_TEMPLATE && (
        <UploadTemplateStep
          onTemplateUpload={handleTemplateUpload}
          onStartWithoutTemplate={handleStartWithoutTemplate}
          savedTemplates={savedTemplates}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {step === AppStep.UPLOAD_FILES && (
        <UploadFilesStep
          pages={pages}
          isConverting={isConverting}
          conversionProgress={conversionProgress}
          columns={columns}
          onFilesUpload={handleFilesUpload}
          onToggleColumnSelection={toggleColumnSelection}
          onConfirmAndNext={handleUploadFilesNext}
          onRemovePage={removePage}
          onCancelConversion={cancelConversion}
        />
      )}

      {step === AppStep.DEFINE_COLUMNS && (
        <DefineColumnsStep
          columns={columns}
          columnPageImages={columnPageImages}
          sampleImage={sampleImage}
          isAnalyzingSample={isAnalyzingSample}
          sampleError={sampleError}
          newColumnName={newColumnName}
          templateFile={templateFile}
          onSampleUpload={handleSampleUpload}
          onUpdateColumnName={updateColumnName}
          onRemoveColumn={removeColumn}
          onAddColumn={addColumn}
          onConfirmColumns={handleConfirmColumns}
          onCloseSample={() => {
            setSampleImage(null);
            setHeaderDetection(null);
            setSampleError(null);
          }}
          onBack={() => setStep(AppStep.UPLOAD_FILES)}
          setNewColumnName={setNewColumnName}
          headerDetection={headerDetection || undefined}
          onHeaderRowChange={handleHeaderRowChange}
          onSaveAsTemplate={handleSaveAsTemplate}
        />
      )}

      {step === AppStep.SELECT_PAGES && (
        <SelectPagesStep
          pages={pages}
          onToggleExtractSelection={toggleExtractSelection}
          onSelectAll={selectAllForExtract}
          onDeselectAll={deselectAllForExtract}
          onSelectRange={selectRangeForExtract}
          onConfirmAndProcess={handleConfirmAndProcess}
          onBack={() => setStep(AppStep.DEFINE_COLUMNS)}
        />
      )}

      {step === AppStep.PROCESS_DATA && (
        <ProcessDataStep
          pages={pages}
          items={items}
          isProcessing={isProcessing}
          progress={getProgress()}
          error={extractionError}
          onRetryFailed={retryFailed}
          onBack={() => setStep(AppStep.SELECT_PAGES)}
          onBackToColumns={() => setStep(AppStep.DEFINE_COLUMNS)}
          onCancelProcessing={cancelProcessing}
          onExportCompleted={handleExportCompleted}
          onResume={processImages}
        />
      )}

      {step === AppStep.REVIEW_DATA && (
        <ReviewDataStep
          columns={columns}
          items={items}
          templateName={templateName}
          onCellChange={handleCellChangeWithPersistence}
          onExport={handleExport}
        />
      )}

      {step === AppStep.EXPORT && (
        <ExportStep
          templateFile={templateFile}
          exportedFileUrl={exportedFileUrl}
          isUploadingToR2={isUploadingToR2}
          onReset={reset}
        />
      )}

      {/* 저장 상태 표시 */}
      <SaveIndicator status={saveState.status} lastSaved={saveState.lastSaved} />
    </div>
  );
}

// Suspense 바운더리로 감싼 기본 export
export default function ExtractionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div>
        <p className="mt-4 text-slate-500">로딩 중...</p>
      </div>
    }>
      <ExtractionPageContent />
    </Suspense>
  );
}
