# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Excel Vision AI - A production-ready Next.js 15 SaaS application that automates data entry from blurry photos/documents directly into Excel templates using AI. Features multi-model AI support via Vercel AI Gateway, user authentication, cloud storage, and subscription billing.

## Original Project Reference

이 프로젝트의 원본 출발점:
- **경로**: `/Users/jeong-gyeonghun/Downloads/excel-vision-ai`
- **용도**: 오류 발생 시 원본 코드와 비교 참고용

## Test Account

테스트용 계정 정보:
- **Email**: test@test.com
- **Password**: 12341234

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Next.js dev server (port 3000)
pnpm build            # Production build
pnpm start            # Start production server
```

## ⚠️ Build/Test Rules

**빌드 테스트 금지**: 사용자가 명시적으로 요청하기 전까지 `pnpm build`, `pnpm test` 등 빌드/테스트 명령을 실행하지 마세요.

- ❌ 코드 수정 후 자동으로 빌드 검증하지 않기
- ❌ "빌드 확인해볼게요" 하면서 임의로 실행하지 않기
- ✅ 사용자가 "빌드해줘", "테스트해줘" 라고 명시적으로 요청할 때만 실행

## Environment Setup

Create `.env.local` with the following variables:

```bash
# Vercel AI Gateway (Required)
# Get from: https://vercel.com/dashboard → AI Gateway
AI_GATEWAY_API_KEY=your_ai_gateway_key

# Supabase (Required for auth/db)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 (Optional - for file storage)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=excel-vision-uploads
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# LemonSqueezy (Optional - for billing)
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS 3.4
- **Auth/DB**: Supabase (PostgreSQL + Auth)
- **Storage**: Cloudflare R2 (S3 compatible)
- **AI**: Vercel AI Gateway (multi-model: Gemini, GPT-4o, Claude)
- **Billing**: LemonSqueezy
- **Excel**: XLSX library

### AI Models (via Vercel AI Gateway)
- `google/gemini-2.5-flash` (default, cheapest)
- `google/gemini-2.5-pro`
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `anthropic/claude-sonnet-4-20250514`
- `anthropic/claude-3-5-sonnet-20241022`

### Directory Structure

```
app/
├── page.tsx                     # Dashboard home
├── extraction/page.tsx          # Main 5-step workflow
├── templates/page.tsx           # Saved templates
├── history/page.tsx             # Extraction history
├── settings/page.tsx            # Billing & settings
├── login/page.tsx               # Google OAuth login
├── auth/callback/route.ts       # OAuth callback
└── api/
    ├── ai/
    │   ├── identify-columns/    # Column detection
    │   ├── extract-data/        # Data extraction
    │   └── detect-header/       # Header row detection
    ├── storage/
    │   ├── presigned-upload/    # R2 upload URL
    │   └── presigned-download/  # R2 download URL
    ├── billing/
    │   └── checkout/            # LemonSqueezy checkout
    └── webhooks/
        └── lemonsqueezy/        # Subscription webhooks

components/
├── steps/                       # 5-step workflow components
├── dashboard/                   # Dashboard components
├── layout/                      # Layout (Header, Sidebar)
├── auth/                        # Auth components
├── billing/                     # Billing components
├── icons/                       # SVG icons
└── common/                      # Shared components

hooks/
├── useWorkflow.ts               # Step navigation
├── useColumns.ts                # Column management
├── useExtraction.ts             # Image processing (parallel)
└── useR2Upload.ts               # R2 file upload

lib/
├── supabase/                    # Supabase clients
├── r2/                          # Cloudflare R2 client
├── ai/                          # Vercel AI Gateway
│   └── vercel-ai.ts             # AI functions (Gateway-based)
├── lemonsqueezy/                # LemonSqueezy client
└── billing/                     # Credit management

services/
├── geminiService.ts             # Client-side AI service (calls API)
└── excelService.ts              # Excel operations

types/
├── index.ts                     # Core types
├── supabase.ts                  # DB types
├── r2.ts                        # Storage types
├── ai.ts                        # AI model types
└── billing.ts                   # Billing types

supabase/
└── schema.sql                   # Database schema

middleware.ts                    # Auth middleware
```

### 5-Step Workflow

1. **UPLOAD_TEMPLATE**: Upload Excel template or skip
2. **DEFINE_COLUMNS**: AI auto-detects columns + header row position
3. **UPLOAD_IMAGES**: Batch upload with R2 storage
4. **REVIEW_DATA**: Interactive editing with confidence scores
5. **EXPORT**: Generate Excel file

### Key Features

**AI Processing:**
- Parallel image processing (5 concurrent)
- Retry with exponential backoff
- Multi-model support via Vercel AI Gateway
- Confidence score display
- Automatic header row detection

**Data Management:**
- Supabase for user data
- R2 for file storage (presigned URLs)
- Template & extraction history

**Billing:**
- Free tier (10 images/month)
- Basic ($9/month, 200 images)
- Pro ($29/month, 1000 images)
- Credit packs for additional usage

### Database Schema

```sql
-- profiles: User data with credits
-- templates: Saved Excel templates
-- extractions: Processing history
-- See supabase/schema.sql for full schema
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/identify-columns` | POST | Detect columns from image (optional: model param) |
| `/api/ai/extract-data` | POST | Extract data from image (optional: model param) |
| `/api/ai/detect-header` | POST | Find header row position (optional: model param) |
| `/api/storage/presigned-upload` | POST | Get R2 upload URL |
| `/api/storage/presigned-download` | POST | Get R2 download URL |
| `/api/billing/checkout` | POST | Create checkout session |
| `/api/webhooks/lemonsqueezy` | POST | Handle billing webhooks |

### AI API Usage Example

```typescript
// Default model (gemini-2.5-flash)
fetch('/api/ai/identify-columns', {
  method: 'POST',
  body: JSON.stringify({ imageBase64 })
});

// Specific model
fetch('/api/ai/extract-data', {
  method: 'POST',
  body: JSON.stringify({
    imageBase64,
    columns,
    model: 'openai/gpt-4o'  // optional
  })
});
```

## Path Aliases

`@/*` maps to project root (configured in tsconfig.json)
