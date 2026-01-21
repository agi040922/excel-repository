import { NextRequest } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { detectHeaderRequestSchema, safeValidateRequest } from '@/lib/security/validation';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rateLimit';

const MODEL_NAME = 'gemini-3-flash-preview';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }
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
    const validation = safeValidateRequest(detectHeaderRequestSchema, body);

    if (!validation.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        validation.error,
        400
      );
    }

    const { imageBase64 } = validation.data;

    const ai = getAiClient();
    const { mimeType, data } = parseBase64(imageBase64);

    const prompt = `
      Analyze this document and identify the distinct data fields that would make good spreadsheet headers.

      Rules:
      1. Look for labels like "Date", "Invoice #", "Vendor", "Total Amount", "Tax", "Items", etc.
      2. If the document contains a table, identify the column headers of that table.
      3. Return a JSON ARRAY of strings. e.g. ["Date", "Description", "Qty", "Unit Price", "Total"].
      4. Keep header names concise and clear.
    `;

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
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) {
      return successResponse({ columns: [] });
    }

    const columns = JSON.parse(text);
    return successResponse({ columns });

  } catch (error) {
    return handleApiError(error, 'AI/identify-columns');
  }
}
