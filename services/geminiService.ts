import { ExcelColumn } from '../types';

/**
 * 기존 Gemini 전용 서비스 - 계속 사용 가능
 *
 * 다른 모델(GPT-4o, Claude) 사용을 원하면:
 * - /api/ai/v2/identify-columns (Vercel AI SDK 버전)
 * - /api/ai/v2/extract-data (Vercel AI SDK 버전)
 *
 * 요청 시 provider 파라미터 추가: { imageBase64, provider: 'gemini' | 'openai' | 'anthropic' }
 */

/**
 * Step 1: Analyze a sample image/pdf to identify potential columns/headers.
 */
export const identifyColumnsFromImage = async (imageBase64: string): Promise<string[]> => {
  try {
    const response = await fetch('/api/ai/identify-columns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      throw new Error('Failed to identify columns');
    }

    const { columns } = await response.json();
    return columns || ["Date", "Description", "Amount"];
  } catch (error) {
    console.error("Column Identification Error:", error);
    return ["Date", "Description", "Amount"];
  }
};

/**
 * Step 2: Extract data based on a strict set of columns, supporting multiple rows.
 */
export const extractDataFromImage = async (
  imageBase64: string,
  columns: ExcelColumn[]
): Promise<Record<string, string | number>[]> => {
  try {
    const response = await fetch('/api/ai/extract-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64, columns }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract data');
    }

    const { data } = await response.json();
    return data || [];
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return [];
  }
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
      throw new Error('Failed to detect header row');
    }

    const result = await response.json();
    return result || { headerRowIndex: 1, headers: [], confidence: 0 };
  } catch (error) {
    console.error("Header Detection Error:", error);
    return { headerRowIndex: 1, headers: [], confidence: 0 };
  }
};