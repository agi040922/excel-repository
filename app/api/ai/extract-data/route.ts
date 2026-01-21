import { NextRequest } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import { ExcelColumn } from '@/types';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { getGeminiApiKey } from '@/lib/env';
import { extractDataRequestSchema, safeValidateRequest } from '@/lib/security/validation';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rateLimit';

const MODEL_NAME = 'gemini-3-flash-preview';

const getAiClient = () => {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({ apiKey });
};

const parseBase64 = (base64Data: string) => {
  const match = base64Data.match(/^data:(.*);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid base64 data");
  }
  return {
    mimeType: match[1],
    data: match[2]
  };
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, RateLimitPresets.AI_ENDPOINT.limit, RateLimitPresets.AI_ENDPOINT.windowMs)) {
      return errorResponse(
        ErrorCodes.RATE_LIMIT,
        'Too many requests. Please try again later.',
        429
      );
    }

    // Validation
    const body = await request.json();
    const validation = safeValidateRequest(extractDataRequestSchema, body);

    if (!validation.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        validation.error,
        400
      );
    }

    const { imageBase64, columns } = validation.data;

    const ai = getAiClient();
    const { mimeType, data } = parseBase64(imageBase64);

    const headers = columns.map((c: ExcelColumn) => c.header);

    const prompt = `
      Extract ALL data rows from this document strictly matching these headers: ${JSON.stringify(headers)}.

      Rules:
      1. Return a JSON ARRAY of objects. Each object represents one row of data.
      2. If the document contains a table with multiple items, extract EACH item as a separate object.
      3. If the document contains a single form, return an array with one object.
      4. Keys must match the headers EXACTLY.
      5. If a field is not found, use an empty string "".
      6. For date fields, use YYYY-MM-DD format.
      7. For numeric fields, return numbers (remove currency symbols like $ or ,).
    `;

    // Dynamic strict schema: Array of Objects
    const properties: Record<string, { type: typeof Type.STRING }> = {};
    columns.forEach((col: ExcelColumn) => {
      properties[col.header] = { type: Type.STRING };
    });

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties,
        required: headers,
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) {
      return successResponse({ data: [] });
    }

    const extractedData = JSON.parse(text);
    return successResponse({ data: extractedData });

  } catch (error) {
    return handleApiError(error, 'AI/extract-data');
  }
}
