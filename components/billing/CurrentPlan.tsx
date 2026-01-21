'use client';

import { PRICING_PLANS, SubscriptionTier } from '@/types/billing';

interface CurrentPlanProps {
  tier: SubscriptionTier;
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodEnd?: Date;
}

export function CurrentPlan({
  tier,
  subscriptionStatus,
  currentPeriodEnd,
}: CurrentPlanProps) {
  const plan = PRICING_PLANS.find((p) => p.id === tier);

  if (!plan) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-yellow-600 bg-yellow-100';
      case 'expired':
      case 'past_due':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'cancelled':
        return '취소됨';
      case 'expired':
        return '만료됨';
      case 'past_due':
        return '결제 실패';
      default:
        return '무료';
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">현재 플랜</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{plan.name}</p>
          {plan.price > 0 && (
            <p className="text-gray-500 mt-1">${plan.price}/월</p>
          )}
        </div>
        {subscriptionStatus && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              subscriptionStatus
            )}`}
          >
            {getStatusText(subscriptionStatus)}
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">월 크레딧</p>
          <p className="text-lg font-semibold text-gray-900">{plan.credits}개</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">저장 공간</p>
          <p className="text-lg font-semibold text-gray-900">{plan.storage}</p>
        </div>
      </div>

      {currentPeriodEnd && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            다음 갱신:{' '}
            <span className="font-medium text-gray-900">
              {currentPeriodEnd.toLocaleDateString('ko-KR')}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
