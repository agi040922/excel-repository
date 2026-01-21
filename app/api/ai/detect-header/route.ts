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

    // Parse and validate request body
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
      You are analyzing an Excel/spreadsheet image. Your task is to identify which row contains the table headers.

      Instructions:
      1. Carefully examine rows 1-5 of the spreadsheet
      2. Identify which row contains the column headers (typically bold, different formatting, or contains labels like "Name", "Date", "Amount", etc.)
      3. Extract all header names from that row
      4. Provide a confidence score (0-100) for your detection

      Return a JSON object with this structure:
      {
        "headerRowIndex": <number 1-5>,
        "headers": ["Header1", "Header2", ...],
        "confidence": <number 0-100>
      }

      If you cannot detect headers clearly, default to row 1 with low confidence.
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
          type: Type.OBJECT,
          properties: {
            headerRowIndex: { type: Type.INTEGER },
            headers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            confidence: { type: Type.INTEGER }
          },
          required: ["headerRowIndex", "headers", "confidence"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      return successResponse({
        headerRowIndex: 1,
        headers: [],
        confidence: 0
      });
    }

    const result = JSON.parse(text);
    return successResponse(result);

  } catch (error) {
    return handleApiError(error, 'AI/detect-header');
  }
}
