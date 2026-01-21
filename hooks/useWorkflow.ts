import { useState } from 'react';
import { AppStep } from '@/types';

export const useWorkflow = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD_TEMPLATE);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const reset = () => {
    setStep(AppStep.UPLOAD_TEMPLATE);
    setTemplateName('');
    setTemplateFile(null);
  };

  return {
    step,
    setStep,
    templateName,
    setTemplateName,
    templateFile,
    setTemplateFile,
    reset,
  };
};
