/**
 * Supabase Database Types
 * 데이터베이스 테이블에 대한 TypeScript 타입 정의
 */

// =====================================================
// Database Tables
// =====================================================

export interface Profile {
  id: string // UUID, auth.users.id 참조
  email: string | null
  name: string | null
  avatar_url: string | null
  credits: number
  subscription_tier: 'free' | 'pro' | 'enterprise'
  created_at: string // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
}

export interface Template {
  id: string // UUID
  user_id: string // UUID, profiles.id 참조
  name: string
  columns: TemplateColumn[] // JSONB
  original_file_url: string | null
  description: string | null
  created_at: string // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
}

export interface TemplateColumn {
  header: string
  key: string
}

export interface Extraction {
  id: string // UUID
  user_id: string // UUID, profiles.id 참조
  template_id: string | null // UUID, templates.id 참조
  status: 'pending' | 'processing' | 'completed' | 'failed'
  image_urls: string[] | null // 업로드된 이미지들의 URL 배열
  result_data: ExtractionResultData | null // JSONB
  credits_used: number
  error_message: string | null
  exported_file_url: string | null // Export된 Excel 파일의 R2 URL
  created_at: string // ISO 8601 timestamp
}

/**
 * 추출된 데이터 행의 타입 (string 또는 number 값을 가질 수 있음)
 */
export interface ExtractionDataRow {
  [key: string]: string | number;
}

export interface ExtractionResultData {
  rows: ExtractionDataRow[]
  metadata?: {
    total_images: number
    processed_images: number
    average_confidence?: number
  }
}

// =====================================================
// API Request/Response Types
// =====================================================

export interface CreateTemplateRequest {
  name: string
  columns: TemplateColumn[]
  original_file_url?: string
  description?: string
}

export interface UpdateTemplateRequest {
  name?: string
  columns?: TemplateColumn[]
  description?: string
}

export interface CreateExtractionRequest {
  template_id?: string
  image_urls: string[]
}

export interface UpdateExtractionRequest {
  status?: Extraction['status']
  result_data?: ExtractionResultData
  error_message?: string
}

// =====================================================
// Helper Types
// =====================================================

export type SubscriptionTier = Profile['subscription_tier']
export type ExtractionStatus = Extraction['status']

// Insert types (without auto-generated fields)
export type InsertProfile = Omit<Profile, 'created_at' | 'updated_at'>
export type InsertTemplate = Omit<Template, 'id' | 'created_at' | 'updated_at'>
export type InsertExtraction = Omit<Extraction, 'id' | 'created_at'>

// Update types (all fields optional)
export type UpdateProfile = Partial<
  Omit<Profile, 'id' | 'created_at' | 'updated_at'>
>
export type UpdateTemplate = Partial<
  Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>
export type UpdateExtraction = Partial<
  Omit<Extraction, 'id' | 'user_id' | 'created_at'>
>
