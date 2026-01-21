import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { ExcelColumn } from '@/types';

// 지원하는 모델 타입
export type AIProvider = 'gemini' | 'openai' | 'anthropic';

// 모델 선택 함수
export function getModel(provider: AIProvider) {
  switch (provider) {
    case 'gemini':
      return google('gemini-2.0-flash-exp');
    case 'openai':
      return openai('gpt-4o');
    case 'anthropic':
      return anthropic('claude-sonnet-4-20250514');
    default:
      return google('gemini-2.0-flash-exp');
  }
}

// 컬럼 감지 (Vercel AI SDK 버전)
export async function identifyColumnsWithVercelAI(
  imageBase64: string,
  provider: AIProvider = 'gemini'
) {
  const model = getModel(provider);

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

// 데이터 추출 (Vercel AI SDK 버전)
export async function extractDataWithVercelAI(
  imageBase64: string,
  columns: ExcelColumn[],
  provider: AIProvider = 'gemini'
) {
  const model = getModel(provider);
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
