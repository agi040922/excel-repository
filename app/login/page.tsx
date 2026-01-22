import Link from 'next/link';
// import LoginButton from '@/components/auth/LoginButton'; // 임시 비활성화
import AuthForm from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Excel Vision AI',
  description: 'Sign in to manage your templates and extraction history.',
};

/**
 * 로그인 페이지
 * - 이메일/비밀번호 로그인
 * - Google OAuth 로그인
 * - 이미 로그인된 사용자는 홈으로 리다이렉트
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 이미 로그인된 경우 리다이렉트
  if (user) {
    const params = await searchParams;
    redirect(params.redirect || '/');
  }

  const params = await searchParams;

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

        {/* OAuth 에러 표시 */}
        {params.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            로그인에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        {/* 이메일/비밀번호 로그인 폼 */}
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>

        {/* Google 로그인 - 임시 비활성화 */}
        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">또는</span>
          </div>
        </div>
        <div>
          <LoginButton />
        </div> */}

        {/* 회원가입 링크 */}
        <div className="text-center text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-semibold text-excel-600 hover:text-excel-700">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
