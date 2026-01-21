/**
 * Environment Variable Type Safety with Zod
 * 환경 변수의 타입 안전성을 보장하고 런타임 검증을 수행합니다.
 */

import { z } from 'zod';

// 서버 전용 환경 변수 스키마
const serverEnvSchema = z.object({
  // Gemini AI API Key (필수)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  // Supabase 설정
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Cloudflare R2 설정
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required'),
  R2_PUBLIC_URL: z.string().url('R2_PUBLIC_URL must be a valid URL'),

  // LemonSqueezy 결제 설정
  LEMONSQUEEZY_API_KEY: z.string().min(1, 'LEMONSQUEEZY_API_KEY is required'),
  LEMONSQUEEZY_STORE_ID: z.string().min(1, 'LEMONSQUEEZY_STORE_ID is required'),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1, 'LEMONSQUEEZY_WEBHOOK_SECRET is required'),
});

// 클라이언트에서 접근 가능한 환경 변수 스키마
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

// 타입 추론
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * 서버 환경 변수 검증 및 반환
 * 서버 컴포넌트나 API 라우트에서만 사용 가능
 */
export function getServerEnv(): ServerEnv {
  // 서버 사이드에서만 실행되어야 함
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv can only be called on the server side');
  }

  const parsed = serverEnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
    LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables. Check server logs for details.');
  }

  return parsed.data;
}

/**
 * 클라이언트 환경 변수 검증 및 반환
 * 브라우저에서 안전하게 사용 가능
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid client environment variables');
  }

  return parsed.data;
}

/**
 * 특정 환경 변수만 가져오는 헬퍼 함수들
 */

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  return apiKey;
}

export function getLemonSqueezyConfig() {
  return {
    apiKey: process.env.LEMONSQUEEZY_API_KEY || '',
    storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
  };
}

export function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || '',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  };
}
