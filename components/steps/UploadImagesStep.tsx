'use client';

import { FileUploader, type FileUploadResult } from '@/components/FileUploader';
import { ImageIcon, PdfIcon } from '@/components/icons';
import { ExtractedData } from '@/types';

interface UploadImagesStepProps {
  items: ExtractedData[];
  isProcessing: boolean;
  onImageUpload: (files: File[] | FileUploadResult[]) => void;
  onProcessImages: () => void;
  progress?: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    pending: number;
    percentage: number;
  };
  onRetryFailed?: () => void;
}

const isPdf = (base64: string) => base64.startsWith('data:application/pdf');

export const UploadImagesStep: React.FC<UploadImagesStepProps> = ({
  items,
  isProcessing,
  onImageUpload,
  onProcessImages,
  progress,
  onRetryFailed,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Upload Data Sources</h2>
          <p className="text-slate-500">
            Upload images or PDFs. We will extract multiple rows per document if tables are detected.
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onProcessImages}
            disabled={isProcessing}
            className="bg-excel-600 hover:bg-excel-700 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all flex items-center"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {progress ? `Processing ${progress.completed}/${progress.total} (${progress.percentage}%)` : 'Processing...'}
              </>
            ) : (
              <>Analyze with Gemini Flash <span className="ml-2">→</span></>
            )}
          </button>
        )}
      </div>

      <FileUploader
        onUpload={onImageUpload}
        accept="image/*,application/pdf"
        multiple={true}
        title="Drop images or PDFs here"
        subtitle="Supports JPG, PNG, WEBP, PDF (Blurry images accepted)"
        icon={<ImageIcon />}
      />

      {progress && progress.total > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <span className="text-sm font-semibold text-slate-900">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-excel-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Completed: {progress.completed}</span>
            <span>Processing: {progress.processing}</span>
            <span>Failed: {progress.failed}</span>
            <span>Pending: {progress.pending}</span>
          </div>
          {progress.failed > 0 && onRetryFailed && !isProcessing && (
            <button
              onClick={onRetryFailed}
              className="mt-3 w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Retry {progress.failed} Failed Item{progress.failed > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
          {items.map((item) => (
            <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
              {isPdf(item.originalImage) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-4">
                  <PdfIcon />
                  <span className="text-xs font-medium text-slate-500 mt-2 text-center truncate w-full">Document</span>
                </div>
              ) : (
                <img src={item.originalImage} alt="upload" className="w-full h-full object-cover" />
              )}

              {/* Status Overlay */}
              {item.status === 'pending' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Ready</span>
                </div>
              )}
              {item.status === 'processing' && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-excel-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {item.status === 'completed' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {item.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
