import { ExcelColumn } from '../types';

/**
 * AI Service - Vercel AI Gateway 기반
 *
 * 지원 모델:
 * - google/gemini-2.5-flash (기본값, 가장 저렴)
 * - google/gemini-2.5-pro
 * - openai/gpt-4o
 * - openai/gpt-4o-mini
 * - anthropic/claude-sonnet-4-20250514
 * - anthropic/claude-3-5-sonnet-20241022
 *
 * 다른 모델 사용: 요청 시 model 파라미터 추가
 * { imageBase64, model: 'openai/gpt-4o' }
 */

/**
 * Step 1: Analyze a sample image/pdf to identify potential columns/headers.
 */
export const identifyColumnsFromImage = async (imageBase64: string): Promise<string[]> => {
  const response = await fetch('/api/ai/identify-columns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('identify-columns API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Failed to identify columns: ${response.status} - ${errorData.message || response.statusText}`);
  }

  const { data } = await response.json();
  return data?.columns || ["Date", "Description", "Amount"];
};

/**
 * Step 2: Extract data based on a strict set of columns, supporting multiple rows.
 */
export const extractDataFromImage = async (
  imageBase64: string,
  columns: ExcelColumn[]
): Promise<Record<string, string | number>[]> => {
  const response = await fetch('/api/ai/extract-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64, columns }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('extract-data API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Failed to extract data: ${response.status} - ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  return result.data?.data || [];
};

/**
 * Step 0: Analyze an Excel image to detect which row contains the header.
 * Returns the row index (1-based) and the detected headers.
 */
export const detectHeaderRow = async (
  imageBase64: string
): Promise<{
  headerRowIndex: number;
  headers: string[];
  confidence: number;
}> => {
  try {
    const response = await fetch('/api/ai/detect-header', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('detect-header API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to detect header row: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    const apiData = result.data || {};
    return {
      headerRowIndex: apiData.headerRow || 1,
      headers: apiData.headers || [],
      confidence: apiData.confidence || 0
    };
  } catch (error) {
    console.error("Header Detection Error:", error);
    return { headerRowIndex: 1, headers: [], confidence: 0 };
  }
};