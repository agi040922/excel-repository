'use client';

interface ExportStepProps {
  templateFile: File | null;
  onReset: () => void;
}

export const ExportStep: React.FC<ExportStepProps> = ({ templateFile, onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Export Complete!</h2>
      <p className="text-slate-500 mb-8">
        {templateFile ? <span>Successfully appended data to <strong>{templateFile.name}</strong></span> : "Your data has been exported to a new Excel file."}
      </p>

      <button
        onClick={onReset}
        className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all"
      >
        Process More Files
      </button>
    </div>
  );
};
