'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * 로그아웃 버튼
 * - 세션 종료 후 로그인 페이지로 리다이렉트
 */
export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error.message)
      alert('로그아웃 중 오류가 발생했습니다.')
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
    >
      로그아웃
    </button>
  )
}
