'use client';

import { useCallback } from 'react';

/**
 * R2 업로드 결과를 포함한 콜백 타입
 */
export interface FileUploadResult {
  file: File;
  uploadedUrl?: string; // R2 업로드 후 공개 URL (선택)
  key?: string; // R2 버킷 내 파일 키 (선택)
}

interface FileUploaderProps {
  onUpload: (files: File[] | FileUploadResult[]) => void;
  accept: string;
  multiple?: boolean;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  /** R2 자동 업로드 활성화 (기본: false, File[]만 반환) */
  enableR2Upload?: boolean;
  /** R2 업로드 시 저장할 폴더 경로 (기본: 'uploads') */
  r2Folder?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  accept,
  multiple = false,
  title,
  subtitle,
  icon,
  enableR2Upload = false,
  r2Folder = 'uploads'
}) => {
  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // R2 업로드가 비활성화된 경우 File[]만 반환
    if (!enableR2Upload) {
      onUpload(files);
      return;
    }

    // R2 업로드 활성화된 경우: 각 파일을 R2에 업로드하고 결과 반환
    const uploadPromises = files.map(async (file): Promise<FileUploadResult> => {
      try {
        // Presigned URL 요청
        const presignedResponse = await fetch('/api/storage/presigned-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            folder: r2Folder,
          }),
        });

        if (!presignedResponse.ok) {
          throw new Error('Failed to get presigned URL');
        }

        const { uploadUrl, key, publicUrl } = await presignedResponse.json();

        // R2에 직접 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload to R2');
        }

        return { file, uploadedUrl: publicUrl, key };
      } catch (error) {
        console.error('Failed to upload file to R2:', error);
        return { file }; // 실패 시 File만 반환
      }
    });

    const results = await Promise.all(uploadPromises);
    onUpload(results);
  }, [onUpload, enableR2Upload, r2Folder]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
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