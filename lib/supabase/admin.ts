import { createClient } from '@supabase/supabase-js'

/**
 * Admin 클라이언트 생성 (service_role 키 사용)
 * 웹훅, 서버 간 통신 등 RLS를 우회해야 하는 경우에 사용
 * 주의: 클라이언트 사이드에서 절대 사용하지 말 것!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
