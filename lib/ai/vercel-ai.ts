import { gateway } from '@ai-sdk/gateway';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';
import { ExcelColumn } from '@/types';

// 지원하는 모델 타입
export type AIModel =
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-pro'
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'anthropic/claude-sonnet-4-20250514'
  | 'anthropic/claude-3-5-sonnet-20241022';

// 기본 모델 (Gemini Flash - 가장 저렴)
export const DEFAULT_MODEL: AIModel = 'google/gemini-2.5-flash';

// 모델 선택 함수
export function getModel(modelId: AIModel = DEFAULT_MODEL) {
  return gateway(modelId);
}

// base64 data URI에서 MIME 타입과 데이터 추출
function parseDataUri(dataUri: string): { mimeType: string; data: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

// 파일 타입에 따라 적절한 content part 생성
function createContentPart(dataUri: string) {
  const parsed = parseDataUri(dataUri);

  // 디버깅 로그
  console.log('[createContentPart] parsed:', parsed ? { mimeType: parsed.mimeType, dataLength: parsed.data.length } : null);

  if (!parsed) {
    // fallback: 그냥 이미지로 처리
    console.log('[createContentPart] fallback to image type');
    return { type: 'image' as const, image: dataUri };
  }

  const { mimeType, data } = parsed;

  // PDF는 file 타입으로 처리 (mediaType 필수)
  if (mimeType === 'application/pdf') {
    console.log('[createContentPart] using file type for PDF');
    return {
      type: 'file' as const,
      data: Buffer.from(data, 'base64'),
      mediaType: mimeType
    };
  }

  // 이미지는 image 타입으로 처리
  console.log('[createContentPart] using image type for:', mimeType);
  return { type: 'image' as const, image: dataUri };
}

// 컬럼 감지
export async function identifyColumnsWithAI(
  imageBase64: string,
  modelId: AIModel = DEFAULT_MODEL
) {
  const model = getModel(modelId);

  const prompt = `
    Analyze this document and identify the distinct data fields that would make good spreadsheet headers.

    Rules:
    1. Look for labels like "Date", "Invoice #", "Vendor", "Total Amount", "Tax", "Items", etc.
    2. If the document contains a table, identify the column headers of that table.
    3. Return a JSON array of strings. e.g. ["Date", "Description", "Qty", "Unit Price", "Total"].
    4. Keep header names concise and clear.
    5. IMPORTANT: Preserve the original language of the headers. If the document is in Korean, return Korean headers. If in English, return English headers. Do NOT translate.
  `;

  const schema = z.object({
    headers: z.array(z.string()).describe('Array of column header names')
  });

  const result = await generateObject({
    model,
    schema,
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: prompt },
          createContentPart(imageBase64)
        ]
      }
    ]
  });

  return result.object.headers;
}

// 데이터 추출 (스트리밍 + no-schema 모드로 유연하게 처리)
export async function extractDataWithAI(
  imageBase64: string,
  columns: ExcelColumn[],
  modelId: AIModel = DEFAULT_MODEL
) {
  const model = getModel(modelId);
  const headers = columns.map(c => c.header);

  const prompt = `
    Extract ALL data rows from this document strictly matching these headers: ${JSON.stringify(headers)}.

    Rules:
    1. Return a JSON object with a "data" key containing an array of objects.
    2. Each object represents one row of data.
    3. If the document contains a table with multiple items, extract EACH item as a separate object.
    4. If the document contains a single form, return an array with one object.
    5. Keys must match the headers EXACTLY.
    6. If a field is not found, use an empty string "".
    7. For date fields, use YYYY-MM-DD format.
    8. For numeric fields, return as STRING (e.g., "12345" not 12345).
    9. IMPORTANT: Preserve the original language of the data. Do NOT translate any text values.

    Example output format:
    {
      "data": [
        {"Header1": "value1", "Header2": "value2"},
        {"Header1": "value3", "Header2": "value4"}
      ]
    }
  `;

  console.log('[extractDataWithAI] Starting streamObject with no-schema mode...');

  // no-schema 모드로 유연하게 JSON 수신
  const result = streamObject({
    model,
    output: 'no-schema',
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: prompt },
          createContentPart(imageBase64)
        ]
      }
    ]
  });

  // 스트림 소비 (backpressure 방지) + 마지막 객체 캡처
  let chunkCount = 0;
  let lastPartialObject: unknown = null;
  for await (const partialObject of result.partialObjectStream) {
    chunkCount++;
    lastPartialObject = partialObject;
    if (chunkCount % 10 === 0) {
      console.log(`[extractDataWithAI] Received ${chunkCount} chunks...`);
    }
  }
  console.log(`[extractDataWithAI] Stream complete. Total chunks: ${chunkCount}`);

  // 최종 객체 파싱 시도
  let finalData: Record<string, string>[] = [];

  try {
    const finalObject = await result.object;
    console.log('[extractDataWithAI] Final object type:', typeof finalObject);

    // data 배열 추출
    if (finalObject && typeof finalObject === 'object' && 'data' in finalObject) {
      const rawData = (finalObject as { data: unknown[] }).data;
      if (Array.isArray(rawData)) {
        // 모든 값을 문자열로 변환
        finalData = rawData.map(row => {
          const normalizedRow: Record<string, string> = {};
          if (row && typeof row === 'object') {
            for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
              normalizedRow[key] = value != null ? String(value) : '';
            }
          }
          return normalizedRow;
        });
      }
    }
  } catch (parseError) {
    console.warn('[extractDataWithAI] Failed to get final object, using last partial:', parseError);

    // fallback: 마지막 partial object 사용
    if (lastPartialObject && typeof lastPartialObject === 'object' && 'data' in lastPartialObject) {
      const rawData = (lastPartialObject as { data: unknown[] }).data;
      if (Array.isArray(rawData)) {
        finalData = rawData
          .filter(row => row != null)
          .map(row => {
            const normalizedRow: Record<string, string> = {};
            if (row && typeof row === 'object') {
              for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
                normalizedRow[key] = value != null ? String(value) : '';
              }
            }
            return normalizedRow;
          });
      }
    }
  }

  console.log('[extractDataWithAI] Final data rows:', finalData.length);
  if (finalData.length > 0) {
    console.log('[extractDataWithAI] First row sample:', JSON.stringify(finalData[0], null, 2));
  }

  return finalData;
}

// 헤더 행 감지
export async function detectHeaderRowWithAI(
  imageBase64: string,
  modelId: AIModel = DEFAULT_MODEL
) {
  const model = getModel(modelId);

  const prompt = `
    Analyze this Excel/spreadsheet image and determine which row contains the column headers.

    Rules:
    1. The header row usually contains labels like "Name", "Date", "Amount", "Description", etc.
    2. It's typically the first row with text, but sometimes there's a title row above it.
    3. Return the 1-based row number (1 means first row, 2 means second row, etc.)
    4. If you can't determine the header row, return 1 as the default.
  `;

  const schema = z.object({
    headerRow: z.number().min(1).describe('1-based row number of the header row'),
    confidence: z.number().min(0).max(1).describe('Confidence score 0-1')
  });

  const result = await generateObject({
    model,
    schema,
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: prompt },
          createContentPart(imageBase64)
        ]
      }
    ]
  });

  return result.object;
}
