/**
 * LemonSqueezy client configuration
 */

import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

/**
 * Configure LemonSqueezy with API key
 * Must be called before making any LemonSqueezy API calls
 */
export function configureLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY is not set');
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error('LemonSqueezy API Error:', error);
    },
  });
}

/**
 * Get the LemonSqueezy store ID from environment
 */
export function getStoreId(): string {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!storeId) {
    throw new Error('LEMONSQUEEZY_STORE_ID is not set');
  }

  return storeId;
}

/**
 * Get the LemonSqueezy webhook secret from environment
 */
export function getWebhookSecret(): string {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
  }

  return secret;
}
