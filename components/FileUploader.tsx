import React, { useCallback } from 'react';

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUpload, 
  accept, 
  multiple = false,
  title,
  subtitle,
  icon
}) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-excel-500 hover:bg-excel-50 transition-all cursor-pointer group bg-white shadow-sm"
    >
      <input 
        type="file" 
        accept={accept} 
        multiple={multiple}
        onChange={handleChange}
        className="hidden" 
        id={`file-upload-${title.replace(/\s/g, '')}`}
      />
      <label 
        htmlFor={`file-upload-${title.replace(/\s/g, '')}`} 
        className="cursor-pointer w-full flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-excel-100 group-hover:text-excel-600 transition-colors text-slate-400">
          {icon || (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </label>
    </div>
  );
};