/**
 * Billing and subscription type definitions
 */

export type SubscriptionTier = 'free' | 'basic' | 'pro';

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  credits: number; // Monthly credits
  storage: string;
  variantId?: string; // LemonSqueezy variant ID
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 10,
    storage: '50MB',
    features: [
      '월 10개 이미지 무료',
      '50MB 저장 공간',
      '기본 AI 추출',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    credits: 200,
    storage: '500MB',
    variantId: '1241337',  // LemonSqueezy Test Mode
    features: [
      '월 200개 이미지',
      '500MB 저장 공간',
      '우선 처리',
      '이메일 지원',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    credits: 1000,
    storage: '2GB',
    variantId: '1241338',  // LemonSqueezy Test Mode
    features: [
      '월 1000개 이미지',
      '2GB 저장 공간',
      '최우선 처리',
      '전담 지원',
      'API 접근',
    ],
  },
];

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  variantId?: string; // LemonSqueezy variant ID
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack-50',
    name: '50 Credits',
    price: 5,
    credits: 50,
    variantId: '1241339',  // LemonSqueezy Test Mode
  },
  {
    id: 'pack-200',
    name: '200 Credits',
    price: 15,
    credits: 200,
    variantId: '1241340',  // LemonSqueezy Test Mode
  },
];

export interface UserBilling {
  userId: string;
  subscriptionTier: SubscriptionTier;
  credits: number;
  storageUsed: number; // in bytes
  subscriptionId?: string; // LemonSqueezy subscription ID
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodEnd?: Date;
}

export interface WebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_number?: number;
      user_email?: string;
      status?: string;
      variant_id?: number;
      product_id?: number;
      first_order_item?: {
        variant_id: number;
        product_id: number;
      };
      // For subscriptions
      product_name?: string;
      variant_name?: string;
      renews_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
    };
  };
}
