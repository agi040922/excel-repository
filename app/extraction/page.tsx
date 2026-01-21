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

        try {
          // 병렬로 헤더 감지 및 컬럼 식별 실행
          const [headerResult, detectedHeaders] = await Promise.all([
            detectHeaderRow(base64),
            identifyColumnsFromImage(base64)
          ]);

          // 헤더 감지 결과 저장
          if (headerResult.confidence > 0) {
            setHeaderDetection({
              headerRowIndex: headerResult.headerRowIndex,
              confidence: headerResult.confidence
            });
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
        } catch {
          // Error during sample analysis
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-excel-600 rounded-lg flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-slate-800">Excel Vision AI</span>
            </div>

            <div className="hidden md:flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM19.75 11.625a.375.375 0 0 0-.375.375v2.875c0 .621.504 1.125 1.125 1.125h.375a3.75 3.75 0 0 1 3.75 3.75v1.875a.375.375 0 0 0 .75 0v-1.875a4.5 4.5 0 0 0-4.5-4.5h-.375v-2.875a.375.375 0 0 0-.375-.375Z" clipRule="evenodd" />
              </svg>
              Powered by Gemini 3 Flash
            </div>
          </div>
          {templateName && (
            <div className="text-sm px-3 py-1 bg-slate-100 rounded-full text-slate-600 border border-slate-200 max-w-[200px] truncate">
              {templateName}
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
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
      </main>
    </div>
  );
}
