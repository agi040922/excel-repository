# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Excel Vision AI - A production-ready Next.js 15 SaaS application that automates data entry from blurry photos/documents directly into Excel templates using AI. Features multi-model AI support, user authentication, cloud storage, and subscription billing.

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start Next.js dev server (port 3000)
pnpm build            # Production build
pnpm start            # Start production server
```

## Environment Setup

Create `.env.local` with the following variables:

```bash
# AI (Required)
GEMINI_API_KEY=your_gemini_key

# Supabase (Required for auth/db)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 (Optional - for file storage)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=excel-vision-uploads
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Vercel AI SDK (Optional - for multi-model support)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

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
- **AI**: Gemini Flash (default) + Vercel AI SDK (multi-model)
- **Billing**: LemonSqueezy
- **Excel**: XLSX library

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
    │   ├── identify-columns/    # Column detection (Gemini)
    │   ├── extract-data/        # Data extraction (Gemini)
    │   ├── detect-header/       # Header row detection
    │   └── v2/                  # Vercel AI SDK (multi-model)
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
├── ai/                          # Vercel AI SDK
├── lemonsqueezy/                # LemonSqueezy client
└── billing/                     # Credit management

services/
├── geminiService.ts             # Gemini API (legacy)
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
- Multi-model support (Gemini, GPT-4o, Claude)
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
| `/api/ai/identify-columns` | POST | Detect columns from image |
| `/api/ai/extract-data` | POST | Extract data from image |
| `/api/ai/detect-header` | POST | Find header row position |
| `/api/ai/v2/*` | POST | Multi-model AI (provider param) |
| `/api/storage/presigned-upload` | POST | Get R2 upload URL |
| `/api/storage/presigned-download` | POST | Get R2 download URL |
| `/api/billing/checkout` | POST | Create checkout session |
| `/api/webhooks/lemonsqueezy` | POST | Handle billing webhooks |

## Path Aliases

`@/*` maps to project root (configured in tsconfig.json)
