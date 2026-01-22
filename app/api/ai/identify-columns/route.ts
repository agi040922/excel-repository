import { NextRequest } from 'next/server';
import { identifyColumnsWithAI } from '@/lib/ai/vercel-ai';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { identifyColumnsRequestSchema, safeValidateRequest } from '@/lib/security/validation';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductCredits } from '@/lib/billing/credits';

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

    // Authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    // Credit check
    const hasCredits = await checkCredits(user.id, 1);
    if (!hasCredits) {
      return errorResponse(
        ErrorCodes.INSUFFICIENT_CREDITS,
        'Insufficient credits. Please purchase more credits or upgrade your plan.',
        402
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

    const { imageBase64, model } = validation.data;

    // 디버깅: MIME 타입 확인
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    console.log('[identify-columns] MIME type:', mimeMatch ? mimeMatch[1] : 'unknown');
    console.log('[identify-columns] Data length:', imageBase64.length);

    // Use Vercel AI Gateway
    const columns = await identifyColumnsWithAI(imageBase64, model);
    console.log('[identify-columns] Result columns:', columns);

    // Deduct credit after successful identification
    await deductCredits(user.id, 1);

    return successResponse({ columns });

  } catch (error) {
    return handleApiError(error, 'AI/identify-columns');
  }
}
