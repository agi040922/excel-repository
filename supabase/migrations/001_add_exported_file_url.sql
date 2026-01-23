-- Migration: Add exported_file_url column to extractions table
-- Date: 2026-01-22
-- Description: Export된 Excel 파일의 R2 URL을 저장하기 위한 컬럼 추가

-- Add exported_file_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extractions' AND column_name = 'exported_file_url'
  ) THEN
    ALTER TABLE extractions ADD COLUMN exported_file_url TEXT;
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'extractions' AND column_name = 'exported_file_url';
