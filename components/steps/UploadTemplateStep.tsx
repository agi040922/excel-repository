'use client';

import { FileUploader, type FileUploadResult } from '@/components/FileUploader';
import { ExcelIcon } from '@/components/icons';

interface SavedTemplate {
  id: string;
  name: string;
  columnCount: number;
}

interface UploadTemplateStepProps {
  onTemplateUpload: (files: File[] | FileUploadResult[]) => void;
  onStartWithoutTemplate: () => void;
  savedTemplates?: SavedTemplate[];
  onSelectTemplate?: (templateId: string) => void;
}

export const UploadTemplateStep: React.FC<UploadTemplateStepProps> = ({
  onTemplateUpload,
  onStartWithoutTemplate,
  savedTemplates,
  onSelectTemplate,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Upload Excel Template</h1>
        <p className="text-slate-500 text-lg">
          Start by uploading the Excel file you want to fill. We&apos;ll use its headers to structure the data extracted from your images.
        </p>
      </div>

      <FileUploader
        onUpload={onTemplateUpload}
        accept=".xlsx,.xls"
        title="Drop your Excel file here"
        subtitle="Supports .xlsx and .xls"
        icon={<ExcelIcon />}
      />

      {/* 저장된 템플릿 선택 */}
      {savedTemplates && savedTemplates.length > 0 && onSelectTemplate && (
        <>
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">저장된 템플릿 선택</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template.id)}
                  className="p-4 border border-slate-200 rounded-lg hover:border-excel-500 hover:bg-excel-50 text-left transition-colors group"
                >
                  <div className="font-medium text-slate-800 group-hover:text-excel-700 transition-colors">
                    {template.name}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {template.columnCount}개 컬럼
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <button
        onClick={onStartWithoutTemplate}
        className="w-full bg-white border-2 border-slate-200 text-slate-600 hover:border-excel-500 hover:text-excel-600 hover:bg-excel-50 p-4 rounded-xl transition-all font-semibold flex items-center justify-center space-x-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
        <span>Start without Template (Auto-detect Fields)</span>
      </button>
    </div>
  );
};
