'use client';

import React from 'react';
import { AppStep } from '@/types';

interface StepIndicatorProps {
  currentStep: AppStep;
  templateName: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, templateName }) => {
  // 새로운 워크플로우 단계
  const steps = [
    { step: AppStep.UPLOAD_TEMPLATE, label: '시작', shortLabel: '1' },
    { step: AppStep.UPLOAD_FILES, label: '파일 업로드', shortLabel: '2' },
    { step: AppStep.DEFINE_COLUMNS, label: '컬럼 정의', shortLabel: '3' },
    { step: AppStep.SELECT_PAGES, label: '페이지 선택', shortLabel: '4' },
    { step: AppStep.PROCESS_DATA, label: '데이터 추출', shortLabel: '5' },
    { step: AppStep.REVIEW_DATA, label: '검수', shortLabel: '6' },
    { step: AppStep.EXPORT, label: '완료', shortLabel: '7' }
  ];

  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto py-2 px-4">
      <div className="flex items-center space-x-1 sm:space-x-2">
        {steps.map((s, idx) => {
          const isActive = currentStep === s.step;
          const isCompleted = currentStep > s.step;
          const isPending = currentStep < s.step;

          return (
            <React.Fragment key={s.step}>
              <div className="flex items-center whitespace-nowrap">
                <div className={`
                  w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all
                  ${isActive ? 'bg-excel-600 text-white ring-2 ring-excel-200 ring-offset-1' : ''}
                  ${isCompleted ? 'bg-excel-600 text-white' : ''}
                  ${isPending ? 'bg-slate-200 text-slate-500' : ''}
                `}>
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`ml-1.5 text-xs sm:text-sm hidden md:block ${
                  isActive ? 'text-excel-900 font-semibold' :
                  isCompleted ? 'text-excel-700 font-medium' :
                  'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-4 sm:w-6 h-0.5 ${
                  isCompleted ? 'bg-excel-500' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
