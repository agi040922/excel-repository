import { useState, useCallback } from 'react';
import { AppStep } from '@/types';

/**
 * 워크플로우 단계 정보
 */
export const STEP_INFO = {
  [AppStep.UPLOAD_TEMPLATE]: { label: '템플릿', description: '템플릿 업로드' },
  [AppStep.UPLOAD_FILES]: { label: '파일 업로드', description: '파일 업로드 및 페이지 선택' },
  [AppStep.DEFINE_COLUMNS]: { label: '컬럼 정의', description: '컬럼 감지 및 편집' },
  [AppStep.SELECT_PAGES]: { label: '페이지 선택', description: '추출할 페이지 선택' },
  [AppStep.PROCESS_DATA]: { label: '데이터 추출', description: 'AI 데이터 추출' },
  [AppStep.REVIEW_DATA]: { label: '데이터 검수', description: '추출된 데이터 검수' },
  [AppStep.EXPORT]: { label: '내보내기', description: 'Excel 내보내기' },
};

export const useWorkflow = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD_TEMPLATE);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  /**
   * 다음 단계로 이동
   */
  const nextStep = useCallback(() => {
    setStep(prev => {
      const nextValue = prev + 1;
      if (nextValue <= AppStep.EXPORT) {
        return nextValue as AppStep;
      }
      return prev;
    });
  }, []);

  /**
   * 이전 단계로 이동
   */
  const prevStep = useCallback(() => {
    setStep(prev => {
      const prevValue = prev - 1;
      if (prevValue >= AppStep.UPLOAD_TEMPLATE) {
        return prevValue as AppStep;
      }
      return prev;
    });
  }, []);

  /**
   * 특정 단계로 이동 가능한지 확인
   */
  const canGoToStep = useCallback((targetStep: AppStep) => {
    // 현재 단계보다 이전 단계로는 항상 이동 가능
    if (targetStep < step) return true;

    // 현재 단계의 바로 다음 단계로만 이동 가능
    if (targetStep === step + 1) return true;

    return false;
  }, [step]);

  const reset = useCallback(() => {
    setStep(AppStep.UPLOAD_TEMPLATE);
    setTemplateName('');
    setTemplateFile(null);
  }, []);

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    canGoToStep,
    templateName,
    setTemplateName,
    templateFile,
    setTemplateFile,
    reset,
  };
};
