import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-excel-green-600 text-white rounded-lg hover:bg-excel-green-700 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoTemplatesEmptyState({ onCreateTemplate }: { onCreateTemplate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title="템플릿이 없습니다"
      description="새로운 Excel 템플릿을 생성하여 데이터 추출을 시작하세요"
      action={{
        label: '템플릿 생성하기',
        onClick: onCreateTemplate
      }}
    />
  );
}

export function NoHistoryEmptyState() {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="작업 기록이 없습니다"
      description="아직 완료된 데이터 추출 작업이 없습니다"
    />
  );
}

export function NoDataEmptyState({ message }: { message?: string }) {
  return (
    <EmptyState
      icon={
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      }
      title="데이터가 없습니다"
      description={message || "표시할 데이터가 없습니다"}
    />
  );
}

export default EmptyState;
