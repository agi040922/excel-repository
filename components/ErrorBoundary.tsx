'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary 컴포넌트
 *
 * React의 에러 경계를 구현하여 자식 컴포넌트에서 발생한 에러를 포착합니다.
 * 에러 발생 시 대체 UI를 표시하고 사용자에게 재시도 옵션을 제공합니다.
 *
 * 사용 예시:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * 커스텀 fallback UI 제공:
 * ```tsx
 * <ErrorBoundary fallback={<div>커스텀 에러 UI</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 에러 발생 시 state 업데이트하여 다음 렌더링에서 fallback UI 표시
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 (실제 프로덕션에서는 Sentry 등의 서비스로 전송)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공되면 사용, 아니면 기본 UI 표시
      return this.props.fallback || (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            {/* 에러 아이콘 */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-red-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* 에러 메시지 */}
            <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
              문제가 발생했습니다
            </h2>
            <p className="text-slate-600 mb-6 text-center">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
            </p>

            {/* 재시도 버튼 */}
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="w-full px-4 py-3 bg-excel-600 hover:bg-excel-700 text-white rounded-lg font-medium transition-colors"
            >
              다시 시도
            </button>

            {/* 홈으로 돌아가기 버튼 */}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full mt-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
