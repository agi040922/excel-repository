import { useState, useCallback, useRef, useEffect } from 'react';
import { ExcelColumn, ExtractedData } from '@/types';
import { Extraction, ExtractionResultData } from '@/types/supabase';

export interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

interface UseExtractionPersistenceOptions {
  debounceMs?: number;
  autoSave?: boolean;
}

/**
 * Extraction 데이터를 Supabase에 저장하는 훅
 *
 * 사용법:
 * ```tsx
 * const {
 *   extractionId,
 *   saveState,
 *   createExtraction,
 *   updateExtraction,
 *   loadExtraction
 * } = useExtractionPersistence();
 * ```
 */
export function useExtractionPersistence(options: UseExtractionPersistenceOptions = {}) {
  const { debounceMs = 500, autoSave = true } = options;

  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({
    status: 'idle',
    lastSaved: null,
    error: null,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Partial<Extraction> | null>(null);

  // 저장 상태 업데이트 헬퍼
  const setSaving = useCallback(() => {
    setSaveState(prev => ({ ...prev, status: 'saving', error: null }));
  }, []);

  const setSaved = useCallback(() => {
    setSaveState({ status: 'saved', lastSaved: new Date(), error: null });
  }, []);

  const setError = useCallback((error: string) => {
    setSaveState(prev => ({ ...prev, status: 'error', error }));
  }, []);

  /**
   * 새 extraction 레코드 생성
   */
  const createExtraction = useCallback(async (data?: {
    template_id?: string;
    image_urls?: string[];
  }): Promise<string | null> => {
    setSaving();

    try {
      const response = await fetch('/api/extractions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: data?.template_id || null,
          image_urls: data?.image_urls || [],
          status: 'pending',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create extraction');
      }

      const extraction: Extraction = await response.json();
      setExtractionId(extraction.id);
      setSaved();

      return extraction.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create extraction';
      setError(message);
      console.error('Failed to create extraction:', error);
      return null;
    }
  }, [setSaving, setSaved, setError]);

  /**
   * extraction 레코드 업데이트 (즉시)
   */
  const updateExtractionImmediate = useCallback(async (
    id: string,
    data: Partial<Omit<Extraction, 'id' | 'user_id' | 'created_at'>>
  ): Promise<boolean> => {
    setSaving();

    try {
      const response = await fetch(`/api/extractions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update extraction');
      }

      setSaved();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update extraction';
      setError(message);
      console.error('Failed to update extraction:', error);
      return false;
    }
  }, [setSaving, setSaved, setError]);

  /**
   * extraction 레코드 업데이트 (debounce)
   */
  const updateExtraction = useCallback((
    data: Partial<Omit<Extraction, 'id' | 'user_id' | 'created_at'>>
  ) => {
    if (!extractionId) {
      console.warn('No extraction ID set, cannot update');
      return;
    }

    // Pending 업데이트 병합
    pendingUpdateRef.current = {
      ...pendingUpdateRef.current,
      ...data,
    };

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 새 타이머 설정
    debounceTimerRef.current = setTimeout(async () => {
      if (pendingUpdateRef.current && extractionId) {
        await updateExtractionImmediate(extractionId, pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
    }, debounceMs);
  }, [extractionId, debounceMs, updateExtractionImmediate]);

  /**
   * image_urls 배열에 URL 추가
   */
  const addImageUrl = useCallback(async (url: string, currentUrls: string[] = []) => {
    if (!extractionId) return;

    const newUrls = [...currentUrls, url];
    await updateExtractionImmediate(extractionId, { image_urls: newUrls });
    return newUrls;
  }, [extractionId, updateExtractionImmediate]);

  /**
   * 여러 이미지 URL 한번에 추가
   */
  const addImageUrls = useCallback(async (urls: string[], currentUrls: string[] = []) => {
    if (!extractionId) return;

    const newUrls = [...currentUrls, ...urls];
    await updateExtractionImmediate(extractionId, { image_urls: newUrls });
    return newUrls;
  }, [extractionId, updateExtractionImmediate]);

  /**
   * 처리 상태 업데이트
   */
  const updateStatus = useCallback(async (status: Extraction['status']) => {
    if (!extractionId) return;
    await updateExtractionImmediate(extractionId, { status });
  }, [extractionId, updateExtractionImmediate]);

  /**
   * result_data 저장 (AI 추출 결과)
   */
  const saveResultData = useCallback((
    items: ExtractedData[],
    columns: ExcelColumn[]
  ) => {
    if (!extractionId || !autoSave) return;

    const resultData: ExtractionResultData = {
      rows: items.flatMap(item => item.data),
      metadata: {
        total_images: items.length,
        processed_images: items.filter(i => i.status === 'completed').length,
        average_confidence: items.reduce((acc, item) => acc + (item.confidence || 0), 0) / items.length || 0,
      },
    };

    // columns 정보도 함께 저장
    updateExtraction({
      result_data: {
        ...resultData,
        columns,
      } as ExtractionResultData,
    });
  }, [extractionId, autoSave, updateExtraction]);

  /**
   * 크레딧 사용량 업데이트
   */
  const updateCreditsUsed = useCallback(async (credits: number) => {
    if (!extractionId) return;
    await updateExtractionImmediate(extractionId, { credits_used: credits });
  }, [extractionId, updateExtractionImmediate]);

  /**
   * 기존 extraction 로드
   */
  const loadExtraction = useCallback(async (id: string): Promise<Extraction | null> => {
    try {
      const response = await fetch(`/api/extractions/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load extraction');
      }

      const extraction: Extraction = await response.json();
      setExtractionId(extraction.id);
      return extraction;
    } catch (error) {
      console.error('Failed to load extraction:', error);
      return null;
    }
  }, []);

  /**
   * extraction ID 직접 설정 (외부에서 생성된 경우)
   */
  const setExtractionIdExternal = useCallback((id: string | null) => {
    setExtractionId(id);
  }, []);

  /**
   * 상태 리셋
   */
  const reset = useCallback(() => {
    setExtractionId(null);
    setSaveState({ status: 'idle', lastSaved: null, error: null });
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    pendingUpdateRef.current = null;
  }, []);

  // 컴포넌트 언마운트 시 pending 업데이트 플러시
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // pending 업데이트가 있으면 즉시 저장
      if (pendingUpdateRef.current && extractionId) {
        fetch(`/api/extractions/${extractionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingUpdateRef.current),
        }).catch(console.error);
      }
    };
  }, [extractionId]);

  return {
    extractionId,
    setExtractionId: setExtractionIdExternal,
    saveState,
    createExtraction,
    updateExtraction,
    updateExtractionImmediate,
    addImageUrl,
    addImageUrls,
    updateStatus,
    saveResultData,
    updateCreditsUsed,
    loadExtraction,
    reset,
  };
}
