/**
 * LemonSqueezy checkout creation API
 */

import { NextRequest } from 'next/server';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { configureLemonSqueezy, getStoreId } from '@/lib/lemonsqueezy/client';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';
import { checkoutRequestSchema, safeValidateRequest } from '@/lib/security/validation';
import { checkRateLimit, RateLimitPresets } from '@/lib/security/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, RateLimitPresets.STANDARD.limit, RateLimitPresets.STANDARD.windowMs)) {
      return errorResponse(
        ErrorCodes.RATE_LIMIT,
        'Too many requests. Please try again later.',
        429
      );
    }

    // Configure LemonSqueezy client
    configureLemonSqueezy();

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        '인증이 필요합니다',
        401
      );
    }

    // Validation
    const body = await request.json();
    const validation = safeValidateRequest(checkoutRequestSchema, body);

    if (!validation.success) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        validation.error,
        400
      );
    }

    const { variantId } = validation.data;

    // Convert variantId to number (LemonSqueezy SDK requires number)
    const variantIdNumber = parseInt(variantId, 10);
    if (isNaN(variantIdNumber)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid variant ID',
        400
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const email = profile?.email || user.email;

    // Create checkout session
    const storeId = getStoreId();
    const checkout = await createCheckout(storeId, variantIdNumber, {
      checkoutData: {
        email: email || undefined,
        custom: {
          user_id: user.id,
        },
      },
    });

    if (checkout.error) {
      console.error('LemonSqueezy checkout error:', checkout.error);
      return errorResponse(
        ErrorCodes.CHECKOUT_FAILED,
        '결제 페이지 생성에 실패했습니다',
        500
      );
    }

    // Return checkout URL
    return successResponse({
      checkoutUrl: checkout.data?.data.attributes.url,
    });
  } catch (error) {
    return handleApiError(error, 'billing/checkout');
  }
}
