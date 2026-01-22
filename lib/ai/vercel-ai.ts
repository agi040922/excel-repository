import { gateway } from '@ai-sdk/gateway';
import { generateObject } from 'ai';
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
          { type: 'image', image: imageBase64 }
        ]
      }
    ]
  });

  return result.object.headers;
}

// 데이터 추출
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
    1. Return a JSON array of objects. Each object represents one row of data.
    2. If the document contains a table with multiple items, extract EACH item as a separate object.
    3. If the document contains a single form, return an array with one object.
    4. Keys must match the headers EXACTLY.
    5. If a field is not found, use an empty string "".
    6. For date fields, use YYYY-MM-DD format.
    7. For numeric fields, return numbers (remove currency symbols like $ or ,).
  `;

  // Dynamic schema based on columns
  const rowSchema = z.record(z.string(), z.string());
  const schema = z.object({
    data: z.array(rowSchema).describe('Array of extracted data rows')
  });

  const result = await generateObject({
    model,
    schema,
    messages: [
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: imageBase64 }
        ]
      }
    ]
  });

  return result.object.data;
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
          { type: 'image', image: imageBase64 }
        ]
      }
    ]
  });

  return result.object;
}
