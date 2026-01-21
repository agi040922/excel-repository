'use client';

interface UsageStatsProps {
  credits: number;
  maxCredits: number;
  storageUsed: number; // in bytes
  maxStorage: number; // in bytes
}

export function UsageStats({
  credits,
  maxCredits,
  storageUsed,
  maxStorage,
}: UsageStatsProps) {
  const creditsPercent = (credits / maxCredits) * 100;
  const storagePercent = (storageUsed / maxStorage) * 100;

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">사용량</h3>

      {/* Credits */}
      <div className="mb-6">
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

      {/* Storage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">저장 공간</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatBytes(storageUsed)} / {formatBytes(maxStorage)}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              storagePercent > 90
                ? 'bg-red-500'
                : storagePercent > 70
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storagePercent, 100)}%` }}
          />
        </div>
        {storagePercent > 80 && (
          <p className="text-xs text-yellow-600 mt-1">
            저장 공간이 {storagePercent.toFixed(0)}% 사용 중입니다
          </p>
        )}
      </div>
    </div>
  );
}
