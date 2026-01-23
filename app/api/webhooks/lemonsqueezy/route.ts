/**
 * LemonSqueezy webhook handler
 * Handles subscription and payment events
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getWebhookSecret } from '@/lib/lemonsqueezy/client';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  addCredits,
  updateSubscriptionTier,
  resetMonthlyCredits,
} from '@/lib/billing/credits';
import { WebhookEvent, SubscriptionTier, PRICING_PLANS, CREDIT_PACKS } from '@/types/billing';
import { successResponse, errorResponse, ErrorCodes, handleApiError } from '@/lib/api/response';

/**
 * Verify webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Get subscription tier from variant ID
 */
function getTierFromVariantId(variantId: number): SubscriptionTier | null {
  const plan = PRICING_PLANS.find((p) => p.variantId === variantId.toString());
  return plan?.id || null;
}

/**
 * Get credits from variant ID (for credit packs)
 */
function getCreditsFromVariantId(variantId: number): number | null {
  const pack = CREDIT_PACKS.find((p) => p.variantId === variantId.toString());
  return pack?.credits || null;
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    if (!signature) {
      return errorResponse(
        ErrorCodes.WEBHOOK_VERIFICATION_FAILED,
        'Missing signature',
        401
      );
    }

    // Verify signature
    const secret = getWebhookSecret();
    const isValid = verifySignature(body, signature, secret);

    if (!isValid) {
      return errorResponse(
        ErrorCodes.WEBHOOK_VERIFICATION_FAILED,
        'Invalid signature',
        401
      );
    }

    // Parse webhook event
    const event: WebhookEvent = JSON.parse(body);
    const eventName = event.meta.event_name;
    const userId = event.meta.custom_data?.user_id;

    if (!userId) {
      console.error('No user_id in webhook custom_data');
      return errorResponse(
        ErrorCodes.MISSING_PARAMETER,
        'No user_id in webhook data',
        400
      );
    }

    // Use admin client to bypass RLS (webhooks don't have user session)
    const supabase = createAdminClient();

    // Handle different event types
    switch (eventName) {
      case 'subscription_created': {
        // New subscription started
        const variantId = event.data.attributes.first_order_item?.variant_id;
        if (!variantId) break;

        const tier = getTierFromVariantId(variantId);
        if (!tier) break;

        await updateSubscriptionTier(userId, tier, event.data.id, supabase);
        await resetMonthlyCredits(userId, tier, supabase);

        console.log(`Subscription created: ${userId} -> ${tier}`);
        break;
      }

      case 'subscription_updated': {
        // Subscription status changed
        const status = event.data.attributes.status;
        const variantId = event.data.attributes.variant_id;

        if (status === 'cancelled' || status === 'expired') {
          // Downgrade to free tier
          await updateSubscriptionTier(userId, 'free', undefined, supabase);
          console.log(`Subscription ${status}: ${userId} -> free`);
        } else if (status === 'active' && variantId) {
          const tier = getTierFromVariantId(variantId);
          if (tier) {
            await updateSubscriptionTier(userId, tier, event.data.id, supabase);
            // 플랜 변경 시 크레딧도 갱신
            await resetMonthlyCredits(userId, tier, supabase);
            console.log(`Subscription updated: ${userId} -> ${tier}`);
          }
        }
        break;
      }

      case 'subscription_payment_success': {
        // Monthly payment succeeded - reset credits
        const variantId = event.data.attributes.variant_id;
        if (!variantId) break;

        const tier = getTierFromVariantId(variantId);
        if (!tier) break;

        await resetMonthlyCredits(userId, tier, supabase);
        console.log(`Credits reset: ${userId} (${tier})`);
        break;
      }

      case 'order_created': {
        // One-time purchase (credit pack)
        const variantId = event.data.attributes.first_order_item?.variant_id;
        if (!variantId) break;

        const credits = getCreditsFromVariantId(variantId);
        if (!credits) break;

        await addCredits(userId, credits, supabase);
        console.log(`Credits purchased: ${userId} +${credits}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    return successResponse({ received: true });
  } catch (error) {
    return handleApiError(error, 'webhooks/lemonsqueezy');
  }
}
