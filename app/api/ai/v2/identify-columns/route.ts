import { NextRequest } from 'next/server';
import { identifyColumnsWithVercelAI } from '@/lib/ai/vercel-ai';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { identifyColumnsRequestSchema, safeValidateRequest } from '@/lib/security/validation';
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
    const validation = safeValidateRequest(identifyColumnsRequestSchema, body);

    if (!validation.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        validation.error,
        400
      );
    }

    const { imageBase64, provider } = validation.data;
    const selectedProvider = provider;

    const columns = await identifyColumnsWithVercelAI(imageBase64, selectedProvider);

    return successResponse({ columns });

  } catch (error) {
    return handleApiError(error, 'AI/v2/identify-columns');
  }
}
