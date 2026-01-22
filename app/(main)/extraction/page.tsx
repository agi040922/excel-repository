'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { parseExcelHeaders, generateExcelFile } from '@/services/excelService';
import { identifyColumnsFromImage, detectHeaderRow } from '@/services/geminiService';
import { AppStep } from '@/types';
import { StepIndicator } from '@/components/common/StepIndicator';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useColumns } from '@/hooks/useColumns';
import { useExtraction } from '@/hooks/useExtraction';

// Dynamic imports로 Step 컴포넌트 lazy loading
// 각 Step은 사용자가 해당 단계에 도달했을 때만 로드됨
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

export default function ExtractionPage() {
  const { step, setStep, templateName, setTemplateName, templateFile, setTemplateFile, reset: resetWorkflow } = useWorkflow();
  const { columns, setColumns, newColumnName, setNewColumnName, addColumn, updateColumnName, removeColumn } = useColumns();
  const { items, setItems, isProcessing, handleImageUpload, processImages, handleCellChange, retryFailed, getProgress } = useExtraction(columns, setStep);

  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [isAnalyzingSample, setIsAnalyzingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [headerDetection, setHeaderDetection] = useState<{
    headerRowIndex: number;
    confidence: number;
  } | null>(null);

  const handleTemplateUpload = async (files: File[] | import('@/components/FileUploader').FileUploadResult[]) => {
    // File[] 또는 FileUploadResult[]에서 첫 번째 파일 추출
    const file = files[0] instanceof File ? files[0] : (files[0] as import('@/components/FileUploader').FileUploadResult).file;

    if (file) {
      try {
        const cols = await parseExcelHeaders(file);
        setColumns(cols);
        setTemplateName(file.name);
        setTemplateFile(file);
        setStep(AppStep.DEFINE_COLUMNS);
      } catch {
        alert("Failed to parse Excel file. Please ensure it is a valid .xlsx file.");
      }
    }
  };

  const handleStartWithoutTemplate = () => {
    setTemplateName('Auto-generated Schema');
    setTemplateFile(null);
    setStep(AppStep.DEFINE_COLUMNS);
  };

  const handleSampleUpload = async (files: File[] | import('@/components/FileUploader').FileUploadResult[]) => {
    // File[] 또는 FileUploadResult[]에서 첫 번째 파일 추출
    const file = files[0] instanceof File ? files[0] : (files[0] as import('@/components/FileUploader').FileUploadResult).file;

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setSampleImage(base64);
        setIsAnalyzingSample(true);

        // PDF인지 확인 (헤더 행 감지는 Excel 이미지에만 필요)
        const isPdf = file.type === 'application/pdf' || base64.startsWith('data:application/pdf');

        setSampleError(null);

        try {
          let detectedHeaders: string[];

          if (isPdf) {
            // PDF는 컬럼 식별만 수행 (헤더 행 감지 불필요)
            detectedHeaders = await identifyColumnsFromImage(base64);
            setHeaderDetection(null);
          } else {
            // 이미지는 병렬로 헤더 감지 및 컬럼 식별 실행
            const [headerResult, headers] = await Promise.all([
              detectHeaderRow(base64),
              identifyColumnsFromImage(base64)
            ]);

            detectedHeaders = headers;

            // 헤더 감지 결과 저장
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
            data: [],
            status: 'pending'
          }]);
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

  const confirmColumns = () => {
    if (columns.length === 0) {
      alert("Please define at least one column.");
      return;
    }
    setStep(AppStep.UPLOAD_IMAGES);
  };

  const handleExport = async () => {
    const exportRows = items.flatMap(item => item.data);
    await generateExcelFile(columns, exportRows, templateFile || undefined);
    setStep(AppStep.EXPORT);
  };

  const reset = () => {
    resetWorkflow();
    setColumns([]);
    setItems([]);
    setSampleImage(null);
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} templateName={templateName} />

      {step === AppStep.UPLOAD_TEMPLATE && (
        <UploadTemplateStep
          onTemplateUpload={handleTemplateUpload}
          onStartWithoutTemplate={handleStartWithoutTemplate}
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
        />
      )}

      {step === AppStep.UPLOAD_IMAGES && (
        <UploadImagesStep
          items={items}
          isProcessing={isProcessing}
          onImageUpload={handleImageUpload}
          onProcessImages={processImages}
          progress={getProgress()}
          onRetryFailed={retryFailed}
        />
      )}

      {step === AppStep.REVIEW_DATA && (
        <ReviewDataStep
          columns={columns}
          items={items}
          templateName={templateName}
          onCellChange={handleCellChange}
          onExport={handleExport}
        />
      )}

      {step === AppStep.EXPORT && (
        <ExportStep
          templateFile={templateFile}
          onReset={reset}
        />
      )}
    </div>
  );
}
