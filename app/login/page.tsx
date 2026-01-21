import LoginButton from '@/components/auth/LoginButton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Excel Vision AI',
  description: 'Sign in to manage your templates and extraction history.',
};

/**
 * 로그인 페이지
 * - Google OAuth 로그인 제공
 * - 이미 로그인된 사용자는 홈으로 리다이렉트
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 이미 로그인된 경우 리다이렉트
  if (user) {
    const params = await searchParams
    redirect(params.redirect || '/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        {/* 로고 및 제목 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Excel Vision AI</h1>
          <p className="mt-2 text-sm text-gray-600">
            사진 속 데이터를 자동으로 엑셀로 변환
          </p>
        </div>

        {/* 로그인 섹션 */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">로그인</span>
            </div>
          </div>

          <div className="mt-6">
            <LoginButton />
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="text-center text-xs text-gray-500">
          <p>로그인하면 템플릿 저장 및 추출 이력을 관리할 수 있습니다.</p>
        </div>
      </div>
    </div>
  )
}
