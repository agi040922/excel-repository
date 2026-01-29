'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PRICING_PLANS, SubscriptionTier } from '@/types/billing';
import type { User } from '@supabase/supabase-js';

/**
 * 현재 사용자 정보를 가져오는 훅
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 현재 사용자 가져오기
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

/**
 * 사용자 크레딧 정보를 가져오는 훅
 */
export function useUserCredits() {
  const { user } = useUser();
  const [credits, setCredits] = useState<{
    currentCredits: number;
    subscriptionTier: SubscriptionTier;
    monthlyCredits: number;
    planName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('credits, subscription_tier')
        .eq('id', user.id)
        .single();

      if (queryError) {
        throw queryError;
      }

      const tier = (data.subscription_tier || 'free') as SubscriptionTier;
      const plan = PRICING_PLANS.find((p) => p.id === tier) || PRICING_PLANS[0];

      setCredits({
        currentCredits: data.credits || 0,
        subscriptionTier: tier,
        monthlyCredits: plan.credits,
        planName: plan.name,
      });
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setError(err instanceof Error ? err.message : '크레딧 정보를 불러올 수 없습니다');
      // 에러 시 기본값 설정
      setCredits({
        currentCredits: 10,
        subscriptionTier: 'free',
        monthlyCredits: 10,
        planName: 'Free',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { credits, loading, error, refetch };
}
