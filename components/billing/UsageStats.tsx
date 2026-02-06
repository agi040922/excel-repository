'use client';

interface UsageStatsProps {
  credits: number;
  maxCredits: number;
}

export function UsageStats({
  credits,
  maxCredits,
}: UsageStatsProps) {
  const creditsPercent = (credits / maxCredits) * 100;

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">사용량</h3>

      {/* Credits */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">크레딧</span>
          <span className="text-sm font-semibold text-gray-900">
            {credits} / {maxCredits}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              creditsPercent > 80
                ? 'bg-green-500'
                : creditsPercent > 50
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${creditsPercent}%` }}
          />
        </div>
        {credits < maxCredits * 0.2 && (
          <p className="text-xs text-red-600 mt-1">크레딧이 부족합니다</p>
        )}
      </div>
    </div>
  );
}
