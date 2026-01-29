import { NextRequest } from 'next/server';
import { extractDataWithAI } from '@/lib/ai/vercel-ai';

// Vercel serverless function 타임아웃 설정 (Pro: 최대 300초)
export const maxDuration = 300;
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { extractDataRequestSchema, safeValidateRequest } from '@/lib/security/validation';
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
    const validation = safeValidateRequest(extractDataRequestSchema, body);

    if (!validation.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        validation.error,
        400
      );
    }

    const { imageBase64, columns, model } = validation.data;

    // 디버깅: MIME 타입 확인
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    console.log('[extract-data] MIME type:', mimeMatch ? mimeMatch[1] : 'unknown');
    console.log('[extract-data] Columns:', columns.map(c => c.header));

    // Use Vercel AI Gateway
    const data = await extractDataWithAI(imageBase64, columns, model);
    console.log('[extract-data] Result rows:', data.length);
    console.log('[extract-data] First row sample:', JSON.stringify(data[0], null, 2));

    // Deduct credit after successful extraction
    await deductCredits(user.id, 1);

    return successResponse({ data });

  } catch (error) {
    return handleApiError(error, 'AI/extract-data');
  }
}
