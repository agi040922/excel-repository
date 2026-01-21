'use client';

import { useEffect } from 'react';

/**
 * Next.js App Router의 전역 에러 페이지
 *
 * 루트 layout.tsx에서 발생한 에러를 처리합니다.
 * global-error.tsx는 반드시 html과 body 태그를 포함해야 합니다.
 *
 * 주의:
 * - 프로덕션 환경에서만 활성화됩니다
 * - 개발 환경에서는 에러 오버레이가 우선 표시됩니다
 *
 * @param error - 발생한 에러 객체
 * @param reset - 에러 경계를 초기화하고 재렌더링을 시도하는 함수
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 전역 에러 로깅 (실제 프로덕션에서는 Sentry 등의 서비스로 전송)
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>오류 발생 - Excel Vision AI</title>
      </head>
      <body>
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
              시스템 오류가 발생했습니다
            </h2>
            <p className="text-slate-600 mb-6 text-center">
              예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
            </p>

            {/* 에러 상세 정보 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 p-4 bg-slate-50 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium text-slate-700 mb-2">
                  개발자 정보
                </summary>
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    Error Message:
                  </p>
                  <p className="text-xs text-slate-600 mb-3">
                    {error.message}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    Stack Trace:
                  </p>
                  <pre className="text-xs text-slate-600 overflow-auto">
                    {error.stack}
                  </pre>
                  {error.digest && (
                    <p className="mt-2 text-xs text-slate-500">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              </details>
            )}

            {/* 액션 버튼들 */}
            <div className="space-y-2">
              <button
                onClick={reset}
                className="w-full px-4 py-3 bg-excel-600 hover:bg-excel-700 text-white rounded-lg font-medium transition-colors"
              >
                다시 시도
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                홈으로 돌아가기
              </button>

              {/* 새로고침 버튼 (전역 에러는 더 심각하므로 완전 새로고침 옵션 제공) */}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 text-slate-600 hover:text-slate-800 text-sm transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
              'Helvetica Neue', Arial, sans-serif;
          }
        `}</style>
      </body>
    </html>
  );
}
