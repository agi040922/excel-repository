import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Base skeleton with pulse animation
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
}

// Text skeleton - single line
export function TextSkeleton({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

// Card skeleton - for template/history cards
export function CardSkeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2">
        <TextSkeleton className="w-full" />
        <TextSkeleton className="w-4/5" />
        <TextSkeleton className="w-3/5" />
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

// Table skeleton - for history table
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 5, className = '' }: TableSkeletonProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Table header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-5 w-24" />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-4 py-3">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-4"
                  style={{ width: `${60 + Math.random() * 40}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Grid skeleton - for dashboard cards/stats
interface GridSkeletonProps {
  items?: number;
  columns?: number;
  className?: string;
}

export function GridSkeleton({ items = 3, columns = 3, className = '' }: GridSkeletonProps) {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={`grid-item-${i}`} className="bg-white rounded-lg border border-gray-200 p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <TextSkeleton className="w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
