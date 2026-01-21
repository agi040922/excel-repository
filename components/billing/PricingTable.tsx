'use client';

import React, { useMemo, useCallback } from 'react';
import { PRICING_PLANS, PricingPlan, SubscriptionTier } from '@/types/billing';

interface PricingTableProps {
  currentTier?: SubscriptionTier;
  onSelectPlan: (plan: PricingPlan) => void;
}

// Memoized pricing card to prevent unnecessary re-renders
interface PricingCardProps {
  plan: PricingPlan;
  isCurrent: boolean;
  isUpgrade: boolean;
  onSelectPlan: (plan: PricingPlan) => void;
}

const PricingCard = React.memo<PricingCardProps>(({ plan, isCurrent, isUpgrade, onSelectPlan }) => {
  return (
    <div
      className={`rounded-lg border-2 p-6 ${
        isCurrent
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold text-gray-900">
            ${plan.price}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-500">/월</span>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          월 {plan.credits}개 이미지
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelectPlan(plan)}
        disabled={isCurrent}
        className={`mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isCurrent
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isUpgrade
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }`}
      >
        {isCurrent ? '현재 플랜' : isUpgrade ? '업그레이드' : '다운그레이드'}
      </button>
    </div>
  );
});

PricingCard.displayName = 'PricingCard';

export function PricingTable({ currentTier = 'free', onSelectPlan }: PricingTableProps) {
  // useMemo: Calculate current tier price only when currentTier changes
  const currentTierPrice = useMemo(() => {
    return PRICING_PLANS.find(p => p.id === currentTier)?.price || 0;
  }, [currentTier]);

  // useCallback: Memoize select handler to prevent PricingCard re-renders
  const handleSelectPlan = useCallback((plan: PricingPlan) => {
    onSelectPlan(plan);
  }, [onSelectPlan]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {PRICING_PLANS.map((plan) => {
        const isCurrent = plan.id === currentTier;
        const isUpgrade = plan.price > currentTierPrice;

        return (
          <PricingCard
            key={plan.id}
            plan={plan}
            isCurrent={isCurrent}
            isUpgrade={isUpgrade}
            onSelectPlan={handleSelectPlan}
          />
        );
      })}
    </div>
  );
}
