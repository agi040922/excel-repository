/**
 * Credit management functions
 */

import { createClient } from '@/lib/supabase/server';
import { SubscriptionTier } from '@/types/billing';

/**
 * Check if user has enough credits
 * @param userId - User ID
 * @param amount - Number of credits needed (default: 1)
 * @returns true if user has enough credits
 */
export async function checkCredits(
  userId: string,
  amount: number = 1
): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('Error checking credits:', error);
    return false;
  }

  return profile.credits >= amount;
}

/**
 * Deduct credits from user account
 * @param userId - User ID
 * @param amount - Number of credits to deduct (default: 1)
 * @throws Error if user doesn't have enough credits
 */
export async function deductCredits(
  userId: string,
  amount: number = 1
): Promise<void> {
  const supabase = await createClient();

  // First check if user has enough credits
  const hasEnough = await checkCredits(userId, amount);
  if (!hasEnough) {
    throw new Error('Insufficient credits');
  }

  // Deduct credits using SQL function to ensure atomicity
  const { error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error('Error deducting credits:', error);
    throw new Error('Failed to deduct credits');
  }
}

/**
 * Add credits to user account
 * @param userId - User ID
 * @param amount - Number of credits to add
 */
export async function addCredits(
  userId: string,
  amount: number
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    console.error('Error adding credits:', error);
    throw new Error('Failed to add credits');
  }
}

/**
 * Get user's current credit balance
 * @param userId - User ID
 * @returns Current credit balance
 */
export async function getCredits(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.error('Error getting credits:', error);
    return 0;
  }

  return profile.credits;
}

/**
 * Update user's subscription tier
 * @param userId - User ID
 * @param tier - New subscription tier
 * @param subscriptionId - LemonSqueezy subscription ID (optional)
 */
export async function updateSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
  subscriptionId?: string
): Promise<void> {
  const supabase = await createClient();

  // 타입 안전한 업데이트 데이터 구성
  const updateData: {
    subscription_tier: SubscriptionTier;
    subscription_id?: string;
  } = {
    subscription_tier: tier,
  };

  if (subscriptionId) {
    updateData.subscription_id = subscriptionId;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription tier:', error);
    throw new Error('Failed to update subscription tier');
  }
}

/**
 * Reset monthly credits based on user's subscription tier
 * This should be called when subscription renews
 * @param userId - User ID
 * @param tier - Subscription tier
 */
export async function resetMonthlyCredits(
  userId: string,
  tier: SubscriptionTier
): Promise<void> {
  const supabase = await createClient();

  // Define monthly credits for each tier
  const monthlyCredits: Record<SubscriptionTier, number> = {
    free: 10,
    basic: 200,
    pro: 1000,
  };

  const credits = monthlyCredits[tier];

  const { error } = await supabase
    .from('profiles')
    .update({ credits })
    .eq('id', userId);

  if (error) {
    console.error('Error resetting monthly credits:', error);
    throw new Error('Failed to reset monthly credits');
  }
}
