'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseExcelHeaders, generateExcelFile } from '@/services/excelService';
import { identifyColumnsFromImage, detectHeaderRow } from '@/services/geminiService';
import { AppStep, ExcelColumn } from '@/types';
import { StepIndicator } from '@/components/common/StepIndicator';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useColumns } from '@/hooks/useColumns';
import { useExtraction } from '@/hooks/useExtraction';
import { useExtractionPersistence } from '@/hooks/useExtractionPersistence';
import { sanitizeFilename } from '@/lib/utils/filename';
import type { FileUploadResult } from '@/components/FileUploader';

// Dynamic imports로 Step 컴포넌트 lazy loading
const UploadTemplateStep = dynamic(() => import('@/components/steps/UploadTemplateStep').then(mod => ({ default: mod.UploadTemplateStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const DefineColumnsStep = dynamic(() => import('@/components/steps/DefineColumnsStep').then(mod => ({ default: mod.DefineColumnsStep })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-excel-600"></div></div>,
});

const UploadImagesStep = dynamic(() => import('@/components/steps/UploadImagesStep').then(mod => ({ default: mod.UploadImagesStep })), {
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

export default function ExtractionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const extractionIdParam = searchParams.get('id');

  const { step, setStep, templateName, setTemplateName, templateFile, setTemplateFile, reset: resetWorkflow } = useWorkflow();
  const { columns, setColumns, newColumnName, setNewColumnName, addColumn, updateColumnName, removeColumn } = useColumns();
  const { items, setItems, isProcessing, handleImageUpload, processImages, handleCellChange, retryFailed, getProgress } = useExtraction(columns, setStep);

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

            // 이어하기: 항상 2단계(DEFINE_COLUMNS)부터 시작
            // columns가 있으면 사용자가 바로 확인하고 다음 단계로 진행 가능
            setStep(AppStep.DEFINE_COLUMNS);
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
        setStep(AppStep.DEFINE_COLUMNS);
      } catch {
        alert("Failed to parse Excel file. Please ensure it is a valid .xlsx file.");
      }
    }
  };

  const handleStartWithoutTemplate = () => {
    setTemplateName('Auto-generated Schema');
    setTemplateFile(null);
    setTemplateFileUrl(null);
    setStep(AppStep.DEFINE_COLUMNS);
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
        setStep(AppStep.DEFINE_COLUMNS);
      } else {
        alert('템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('템플릿 불러오기 중 오류가 발생했습니다.');
    }
  };

  const handleSampleUpload = async (files: File[] | FileUploadResult[]) => {
    const firstFile = files[0];
    const file = firstFile instanceof File ? firstFile : firstFile.file;
    // R2 URL (FileUploadResult에서 가져오거나 직접 업로드)
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
              // R2 업로드 실패해도 계속 진행 (base64로 처리)
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

          setItems([{
            id: Math.random().toString(36).substr(2, 9),
            originalImage: base64,
            r2Url: r2Url, // R2 URL 저장
            data: [],
            status: 'pending'
          }]);

          // R2 URL을 imageUrls에도 추가
          if (r2Url) {
            setImageUrls(prev => [...prev, r2Url!]);
          }

          // 크레딧 사용 추적
          setCreditsUsed(prev => prev + 1);
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

  // Step 2 완료: extraction 레코드 생성
  const confirmColumns = async () => {
    if (columns.length === 0) {
      alert("Please define at least one column.");
      return;
    }

    // extraction 레코드가 없으면 생성
    if (!extractionId) {
      const newId = await createExtraction({
        image_urls: [],
      });

      if (newId) {
        updateUrlWithExtractionId(newId);
      }
    }

    setStep(AppStep.UPLOAD_IMAGES);
  };

  // Step 3: 이미지 업로드 핸들러 (R2 URL 저장)
  const handleImageUploadWithPersistence = async (files: File[] | FileUploadResult[]) => {
    // 기존 핸들러 호출
    handleImageUpload(files);

    // R2 URL 수집
    const newUrls: string[] = [];
    for (const f of files) {
      if (!(f instanceof File) && f.uploadedUrl) {
        newUrls.push(f.uploadedUrl);
      }
    }

    if (newUrls.length > 0 && extractionId) {
      const updatedUrls = await addImageUrls(newUrls, imageUrls);
      if (updatedUrls) {
        setImageUrls(updatedUrls);
      }
    }
  };

  // Step 4: AI 처리 시작
  const handleProcessImages = async () => {
    if (extractionId) {
      await updateStatus('processing');
    }

    await processImages();

    // 처리 완료 후 상태 업데이트
    if (extractionId) {
      const processedCount = items.filter(i => i.status === 'completed' || i.status === 'error').length;
      await updateCreditsUsed(creditsUsed + processedCount);
      await updateStatus('completed');
    }
  };

  // Step 4: 셀 변경 핸들러 (자동 저장)
  const handleCellChangeWithPersistence = (itemId: string, rowIndex: number, key: string, value: string) => {
    handleCellChange(itemId, rowIndex, key, value);
    // saveResultData는 useEffect에서 자동 호출됨 (debounce)
  };

  const [exportedFileUrl, setExportedFileUrl] = useState<string | null>(null);
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);

  const handleExport = async () => {
    const exportRows = items.flatMap(item => item.data);

    // 1. 로컬 다운로드 실행
    await generateExcelFile(columns, exportRows, templateFile || undefined);

    // 2. Export 단계로 이동
    setStep(AppStep.EXPORT);

    // 3. R2에 업로드 (비동기로 진행)
    try {
      setIsUploadingToR2(true);

      // Blob 생성
      const { generateExcelBlob } = await import('@/services/excelService');
      const blob = await generateExcelBlob(columns, exportRows, templateFile || undefined);

      // 파일명 생성 (extraction_YYYY-MM-DD_HHmmss.xlsx)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      const filename = `extraction_${dateStr}_${timeStr}.xlsx`;

      // File 객체 생성
      const file = new File([blob], filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // R2 업로드
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

        // R2에 직접 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (uploadResponse.ok) {
          setExportedFileUrl(publicUrl);

          // extraction 레코드에 exported_file_url 저장
          if (extractionId) {
            await updateExtractionImmediate(extractionId, {
              exported_file_url: publicUrl,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to upload to R2:', error);
      // R2 업로드 실패는 무시 (로컬 다운로드는 이미 완료됨)
    } finally {
      setIsUploadingToR2(false);
    }
  };

  const reset = () => {
    resetWorkflow();
    resetPersistence();
    setColumns([]);
    setItems([]);
    setSampleImage(null);
    setImageUrls([]);
    setCreditsUsed(0);
    setTemplateFileUrl(null);
    setExportedFileUrl(null);
    setIsUploadingToR2(false);
    router.replace('/extraction', { scroll: false });
  };

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

      {step === AppStep.DEFINE_COLUMNS && (
        <DefineColumnsStep
          columns={columns}
          sampleImage={sampleImage}
          isAnalyzingSample={isAnalyzingSample}
          sampleError={sampleError}
          newColumnName={newColumnName}
          templateFile={templateFile}
          onSampleUpload={handleSampleUpload}
          onUpdateColumnName={updateColumnName}
          onRemoveColumn={removeColumn}
          onAddColumn={addColumn}
          onConfirmColumns={confirmColumns}
          onCloseSample={() => {
            setSampleImage(null);
            setHeaderDetection(null);
            setSampleError(null);
          }}
          setNewColumnName={setNewColumnName}
          headerDetection={headerDetection || undefined}
          onHeaderRowChange={handleHeaderRowChange}
          onSaveAsTemplate={handleSaveAsTemplate}
        />
      )}

      {step === AppStep.UPLOAD_IMAGES && (
        <UploadImagesStep
          items={items}
          isProcessing={isProcessing}
          onImageUpload={handleImageUploadWithPersistence}
          onProcessImages={handleProcessImages}
          progress={getProgress()}
          onRetryFailed={retryFailed}
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
