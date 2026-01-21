'use client';

import { CREDIT_PACKS, CreditPack } from '@/types/billing';

interface CreditPacksGridProps {
  onSelectPack: (pack: CreditPack) => void;
}

export function CreditPacksGrid({ onSelectPack }: CreditPacksGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      {CREDIT_PACKS.map((pack) => (
        <div
          key={pack.id}
          className="rounded-lg border-2 border-gray-200 bg-white p-6 hover:border-green-500 transition-colors"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {pack.name}
            </h3>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">
                ${pack.price}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {pack.credits}개 크레딧
            </div>
            <div className="mt-1 text-xs text-gray-400">
              크레딧당 ${(pack.price / pack.credits).toFixed(2)}
            </div>
          </div>

          <button
            onClick={() => onSelectPack(pack)}
            className="mt-6 w-full py-2 px-4 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            구매하기
          </button>
        </div>
      ))}
    </div>
  );
}
