'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { PricingPlan, CreditPack, SubscriptionTier } from '@/types/billing';

// Dynamic imports로 billing 컴포넌트 lazy loading
// 사용자가 settings 페이지를 열었을 때만 로드됨
const PricingTable = dynamic(() => import('@/components/billing/PricingTable').then(mod => ({ default: mod.PricingTable })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>,
});

const CreditPacksGrid = dynamic(() => import('@/components/billing/CreditPacksGrid').then(mod => ({ default: mod.CreditPacksGrid })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>,
});

const CurrentPlan = dynamic(() => import('@/components/billing/CurrentPlan').then(mod => ({ default: mod.CurrentPlan })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>,
});

const UsageStats = dynamic(() => import('@/components/billing/UsageStats').then(mod => ({ default: mod.UsageStats })), {
  loading: () => <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>,
});

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{
    tier: SubscriptionTier;
    credits: number;
    subscriptionStatus?: 'active' | 'cancelled' | 'expired' | 'past_due';
    currentPeriodEnd?: Date;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'credits'>('plans');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserData({
          tier: profile.subscription_tier || 'free',
          credits: profile.credits || 0,
          subscriptionStatus: profile.subscription_status,
          currentPeriodEnd: profile.current_period_end
            ? new Date(profile.current_period_end)
            : undefined,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!plan.variantId) {
      alert('이 플랜은 아직 설정되지 않았습니다.');
      return;
    }

    try {
      // Create checkout session
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: plan.variantId }),
      });

      const result = await response.json();

      if (result.success && result.data?.checkoutUrl) {
        // Redirect to LemonSqueezy checkout
        window.location.href = result.data.checkoutUrl;
      } else {
        alert(result.error?.message || '체크아웃 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSelectPack = async (pack: CreditPack) => {
    if (!pack.variantId) {
      alert('이 크레딧 팩은 아직 설정되지 않았습니다.');
      return;
    }

    try {
      // Create checkout session
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: pack.variantId }),
      });

      const result = await response.json();

      if (result.success && result.data?.checkoutUrl) {
        // Redirect to LemonSqueezy checkout
        window.location.href = result.data.checkoutUrl;
      } else {
        alert(result.error?.message || '체크아웃 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Get max credits and storage based on tier
  const getMaxCredits = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return 200;
      case 'pro':
        return 1000;
      default:
        return 10;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="mt-2 text-gray-600">
          플랜 관리 및 사용량 확인
        </p>
      </div>

      {/* Current Plan and Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {userData && (
          <>
            <CurrentPlan
              tier={userData.tier}
              subscriptionStatus={userData.subscriptionStatus}
              currentPeriodEnd={userData.currentPeriodEnd}
            />
            <UsageStats
              credits={userData.credits}
              maxCredits={getMaxCredits(userData.tier)}
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              플랜 변경
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'credits'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              크레딧 구매
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'plans' && userData && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              플랜 선택
            </h2>
            <PricingTable
              currentTier={userData.tier}
              onSelectPlan={handleSelectPlan}
            />
          </div>
        )}

        {activeTab === 'credits' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              추가 크레딧 구매
            </h2>
            <p className="text-center text-gray-600 mb-8">
              크레딧은 즉시 계정에 추가되며 만료되지 않습니다
            </p>
            <CreditPacksGrid onSelectPack={handleSelectPack} />
          </div>
        )}
      </div>
    </div>
  );
}
