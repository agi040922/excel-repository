import { NextRequest } from 'next/server';
import { extractDataWithVercelAI } from '@/lib/ai/vercel-ai';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { extractDataRequestSchema, safeValidateRequest } from '@/lib/security/validation';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rateLimit';

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

    const { imageBase64, columns, provider } = validation.data;
    const selectedProvider = provider;

    const data = await extractDataWithVercelAI(imageBase64, columns, selectedProvider);

    return successResponse({ data });

  } catch (error) {
    return handleApiError(error, 'AI/v2/extract-data');
  }
}
