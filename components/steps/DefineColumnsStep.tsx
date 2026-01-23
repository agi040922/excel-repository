'use client';

import { ExcelColumn } from '@/types';
import { PdfIcon } from '@/components/icons';
import type { FileUploadResult } from '@/components/FileUploader';
import { useState } from 'react';

interface DefineColumnsStepProps {
  columns: ExcelColumn[];
  sampleImage: string | null;
  isAnalyzingSample: boolean;
  sampleError?: string | null;
  newColumnName: string;
  templateFile: File | null;
  onSampleUpload: (files: File[] | FileUploadResult[]) => void;
  onUpdateColumnName: (index: number, newName: string) => void;
  onRemoveColumn: (index: number) => void;
  onAddColumn: (e?: React.FormEvent) => void;
  onConfirmColumns: () => void;
  onCloseSample: () => void;
  setNewColumnName: (value: string) => void;
  headerDetection?: {
    headerRowIndex: number;
    confidence: number;
  };
  onHeaderRowChange?: (rowIndex: number) => void;
  onSaveAsTemplate?: (name: string) => Promise<void>;
}

const isPdf = (base64: string) => base64.startsWith('data:application/pdf');

export const DefineColumnsStep: React.FC<DefineColumnsStepProps> = ({
  columns,
  sampleImage,
  isAnalyzingSample,
  sampleError,
  newColumnName,
  templateFile,
  onSampleUpload,
  onUpdateColumnName,
  onRemoveColumn,
  onAddColumn,
  onConfirmColumns,
  onCloseSample,
  setNewColumnName,
  headerDetection,
  onHeaderRowChange,
  onSaveAsTemplate,
}) => {
  const [templateSaveName, setTemplateSaveName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleSaveAsTemplate = async () => {
    if (!templateSaveName.trim() || !onSaveAsTemplate) return;

    setIsSavingTemplate(true);
    try {
      await onSaveAsTemplate(templateSaveName.trim());
      setTemplateSaveName('');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Identify Data Fields</h1>
        <p className="text-slate-500">
          {templateFile
            ? "We found these columns in your Excel file. Verify them before proceeding."
            : "Upload a sample image to detect fields, or add them manually."}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${sampleImage ? 'md:grid-cols-2' : ''} gap-8`}>
        {/* Left: Image/PDF Preview */}
        <div className={`border border-slate-200 rounded-xl p-4 bg-white h-fit sticky top-20 ${!sampleImage ? 'hidden' : 'block'}`}>
          <h3 className="font-semibold text-slate-700 mb-2">Sample Document</h3>
          {sampleImage && (
            isPdf(sampleImage) ? (
              <iframe
                src={sampleImage}
                className="w-full aspect-[3/4] rounded-lg border border-slate-200"
                title="PDF Preview"
              />
            ) : (
              <img src={sampleImage} alt="sample" className="w-full h-auto rounded-lg shadow-sm" />
            )
          )}
        </div>

        {/* Right: Field Editor */}
        <div className={`border border-slate-200 rounded-xl p-6 bg-white flex flex-col ${!sampleImage ? 'w-full md:w-2/3 mx-auto' : ''}`}>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-700 text-lg">Target Columns</h3>
              <p className="text-xs text-slate-400">Edit field names to match your needs.</p>
            </div>
            {!sampleImage && !templateFile && (
              <button
                onClick={() => document.getElementById('sample-upload')?.click()}
                className="text-sm text-excel-600 hover:text-excel-700 font-medium"
              >
                + Auto-detect from Image/PDF
              </button>
            )}
            <input
              type="file"
              id="sample-upload"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files && onSampleUpload([e.target.files[0]])}
            />
          </div>

          {isAnalyzingSample ? (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-slate-500">
              <svg className="animate-spin h-8 w-8 text-excel-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Analyzing document structure...</p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {sampleError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold text-red-900">Analysis Failed</h4>
                      <p className="text-xs text-red-700 mt-1">{sampleError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Header Row Detection UI */}
              {headerDetection && onHeaderRowChange && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        Header Row Detection
                      </h4>
                      <p className="text-xs text-blue-700 mb-2">
                        AI detected the header row at position {headerDetection.headerRowIndex} (Confidence: {headerDetection.confidence}%)
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-blue-800 font-medium">
                          Header Row:
                        </label>
                        <select
                          value={headerDetection.headerRowIndex}
                          onChange={(e) => onHeaderRowChange(parseInt(e.target.value))}
                          className="text-xs border border-blue-300 rounded px-2 py-1 bg-white"
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>Row {num}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-grow overflow-y-auto mb-4 space-y-2 max-h-[400px] custom-scrollbar">
                {columns.map((col, idx) => (
                  <div key={idx} className="flex items-center space-x-2 group">
                    <input
                      type="text"
                      value={col.header}
                      onChange={(e) => onUpdateColumnName(idx, e.target.value)}
                      className="flex-grow border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-excel-500 focus:ring-1 focus:ring-excel-500 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => onRemoveColumn(idx)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove field"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    </button>
                  </div>
                ))}

                {columns.length === 0 && (
                  <p className="text-sm text-slate-400 italic py-4 text-center">No fields detected. Add some manually or upload a sample.</p>
                )}
              </div>

              <form onSubmit={onAddColumn} className="flex gap-2 mb-6 pt-4 border-t border-slate-100">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Add new field (e.g. Tax)"
                  className="flex-grow border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-excel-500 focus:ring-1 focus:ring-excel-500"
                />
                <button type="submit" className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">
                  Add
                </button>
              </form>

              {/* 템플릿으로 저장 */}
              {onSaveAsTemplate && columns.length > 0 && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="템플릿 이름 (예: 영수증 양식)"
                    value={templateSaveName}
                    onChange={(e) => setTemplateSaveName(e.target.value)}
                    className="flex-grow px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-excel-500 focus:ring-1 focus:ring-excel-500"
                  />
                  <button
                    onClick={handleSaveAsTemplate}
                    disabled={!templateSaveName.trim() || isSavingTemplate}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {isSavingTemplate ? '저장 중...' : '템플릿 저장'}
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                {sampleImage ? (
                  <button
                    onClick={onCloseSample}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Close Sample
                  </button>
                ) : templateFile && (
                  <button
                    onClick={() => document.getElementById('sample-upload')?.click()}
                    className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Test with Image
                  </button>
                )}
                <button
                  onClick={onConfirmColumns}
                  className="flex-1 bg-excel-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-excel-700 transition-colors shadow-sm"
                >
                  Confirm & Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
