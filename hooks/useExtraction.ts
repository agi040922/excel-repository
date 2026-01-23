import { useState, useCallback } from 'react';
import { ExtractedData, ExcelColumn, AppStep } from '@/types';
import { extractDataFromImage } from '@/services/geminiService';
import type { FileUploadResult } from '@/components/FileUploader';
import pLimit from 'p-limit';

export const useExtraction = (columns: ExcelColumn[], setStep: (step: AppStep) => void) => {
  const [items, setItems] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (files: File[] | FileUploadResult[]) => {
    setError(null); // 에러 상태 초기화
    const newItems: ExtractedData[] = [];

    // File[] 타입인지 FileUploadResult[] 타입인지 확인
    const isFileArray = files.length > 0 && files[0] instanceof File;

    if (isFileArray) {
      // File[] 처리 (기존 로직)
      (files as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result !== 'string') return;

          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            originalImage: result,
            data: [],
            status: 'pending'
          });

          // When all read, update state
          if (newItems.length === files.length) {
            setItems(prev => [...prev, ...newItems]);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      // FileUploadResult[] 처리 (R2 업로드 결과)
      (files as FileUploadResult[]).forEach(result => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const readerResult = e.target?.result;
          if (typeof readerResult !== 'string') return;

          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            originalImage: readerResult,
            r2Url: result.uploadedUrl, // R2 URL 저장
            r2Key: result.key, // R2 키 저장
            data: [],
            status: 'pending'
          });

          // When all read, update state
          if (newItems.length === files.length) {
            setItems(prev => [...prev, ...newItems]);
          }
        };
        reader.readAsDataURL(result.file);
      });
    }
  };

  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 1000
  ): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
    throw new Error('Retry failed');
  };

  const processImages = useCallback(async () => {
    setIsProcessing(true);
    setError(null); // 에러 상태 초기화
    const pendingItems = items.filter(i => i.status === 'pending');

    // 동시 5개까지 처리
    const limit = pLimit(5);

    try {
      await Promise.all(
        pendingItems.map(item =>
          limit(async () => {
            // 상태를 processing으로 변경
            setItems(prev =>
              prev.map(i => i.id === item.id ? { ...i, status: 'processing' as const } : i)
            );

            try {
              // 재시도 로직 포함한 데이터 추출
              const dataRows = await retryWithBackoff(() =>
                extractDataFromImage(item.originalImage, columns)
              );

              setItems(prev =>
                prev.map(i =>
                  i.id === item.id
                    ? { ...i, status: 'completed' as const, data: dataRows }
                    : i
                )
              );
            } catch (error) {
              console.error(`Failed to process item ${item.id}:`, error);

              // 사용자 친화적 에러 메시지
              let errorMessage = 'AI 처리 중 오류가 발생했습니다';
              if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                  errorMessage = '네트워크 연결을 확인해주세요';
                } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
                  errorMessage = '로그인이 필요합니다';
                } else if (error.message.includes('quota') || error.message.includes('limit')) {
                  errorMessage = 'AI API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요';
                }
              }

              setItems(prev =>
                prev.map(i => i.id === item.id ? { ...i, status: 'error' as const } : i)
              );
            }
          })
        )
      );

      setIsProcessing(false);
      setStep(AppStep.REVIEW_DATA);
    } catch (error) {
      console.error('Failed to process images:', error);
      setIsProcessing(false);

      // 전체 프로세스 실패 시 에러 메시지 설정
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('이미지 처리 중 오류가 발생했습니다');
      }
    }
  }, [items, columns, setStep]);

  const retryFailed = useCallback(async () => {
    const failedItems = items.filter(i => i.status === 'error');
    if (failedItems.length === 0) return;

    setIsProcessing(true);
    setError(null); // 에러 상태 초기화

    // 실패한 항목들을 pending으로 다시 설정
    setItems(prev =>
      prev.map(i => i.status === 'error' ? { ...i, status: 'pending' as const } : i)
    );

    // processImages 재실행
    await processImages();
  }, [items, processImages]);

  // 에러 초기화 함수
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleCellChange = (itemId: string, rowIndex: number, key: string, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newData = [...item.data];
        newData[rowIndex] = {
          ...newData[rowIndex],
          [key]: value
        };
        return { ...item, data: newData };
      }
      return item;
    }));
  };

  const getProgress = useCallback(() => {
    const total = items.length;
    const completed = items.filter(i => i.status === 'completed').length;
    const processing = items.filter(i => i.status === 'processing').length;
    const failed = items.filter(i => i.status === 'error').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      processing,
      failed,
      pending,
      percentage,
    };
  }, [items]);

  return {
    items,
    setItems,
    isProcessing,
    error,
    clearError,
    handleImageUpload,
    processImages,
    handleCellChange,
    retryFailed,
    getProgress,
  };
};
