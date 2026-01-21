'use client';

import React from 'react';
import { AppStep } from '@/types';

interface StepIndicatorProps {
  currentStep: AppStep;
  templateName: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, templateName }) => {
  const steps = [
    { step: AppStep.UPLOAD_TEMPLATE, label: 'Start' },
    { step: AppStep.DEFINE_COLUMNS, label: 'Fields' },
    { step: AppStep.UPLOAD_IMAGES, label: 'Upload' },
    { step: AppStep.REVIEW_DATA, label: 'Review' },
    { step: AppStep.EXPORT, label: 'Done' }
  ];

  return (
    <div className="flex items-center justify-center space-x-4 mb-8 overflow-x-auto py-2">
      {steps.map((s, idx) => (
        <div
          key={idx}
          className={`flex items-center whitespace-nowrap ${
            s.step === AppStep.DEFINE_COLUMNS &&
            templateName !== 'Auto-generated Schema' &&
            currentStep !== AppStep.DEFINE_COLUMNS
              ? 'hidden'
              : ''
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            currentStep >= s.step ? 'bg-excel-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {idx + 1}
          </div>
          <span className={`ml-2 text-sm hidden sm:block ${
            currentStep >= s.step ? 'text-excel-900 font-medium' : 'text-slate-400'
          }`}>
            {s.label}
          </span>
          {idx < 4 && <div className="w-8 h-0.5 bg-slate-200 mx-2 hidden sm:block" />}
        </div>
      ))}
    </div>
  );
};
