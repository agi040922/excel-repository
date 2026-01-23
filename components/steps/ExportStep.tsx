'use client';

interface ExportStepProps {
  templateFile: File | null;
  exportedFileUrl?: string | null;
  isUploadingToR2?: boolean;
  onReset: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({
  templateFile,
  exportedFileUrl,
  isUploadingToR2,
  onReset
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Export Complete!</h2>
      <p className="text-slate-500 mb-4">
        {templateFile ? <span>Successfully appended data to <strong>{templateFile.name}</strong></span> : "Your data has been exported to a new Excel file."}
      </p>

      {/* R2 업로드 상태 */}
      {isUploadingToR2 && (
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <div className="w-4 h-4 border-2 border-excel-500 border-t-transparent rounded-full animate-spin" />
          <span>클라우드에 저장 중...</span>
        </div>
      )}

      {/* R2 업로드 완료 */}
      {exportedFileUrl && !isUploadingToR2 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="font-medium">클라우드에 저장됨</span>
          </div>
          <a
            href={exportedFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-excel-600 hover:text-excel-700 underline break-all"
          >
            다운로드 링크
          </a>
        </div>
      )}

      <button
        onClick={onReset}
        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all"
      >
        Process More Files
      </button>
    </div>
  );
};
