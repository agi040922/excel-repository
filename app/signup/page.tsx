import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Excel Vision AI',
  description: 'Create an account to start extracting data from your documents.',
};

/**
 * 회원가입 페이지
 * - 이메일/비밀번호 회원가입
 * - 이미 로그인된 사용자는 홈으로 리다이렉트
 */
export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 이미 로그인된 경우 리다이렉트
  if (user) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        {/* 로고 및 제목 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-2 text-sm text-gray-600">
            Excel Vision AI에 가입하고 데이터 추출을 시작하세요
          </p>
        </div>

        {/* 회원가입 폼 */}
        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>

        {/* 로그인 링크 */}
        <div className="text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-excel-600 hover:text-excel-700">
            로그인
          </Link>
        </div>

        {/* 추가 정보 */}
        <div className="text-center text-xs text-gray-500">
          <p>회원가입 시 확인 이메일이 발송됩니다.</p>
          <p>이메일의 링크를 클릭하여 계정을 활성화하세요.</p>
        </div>
      </div>
    </div>
  );
}
