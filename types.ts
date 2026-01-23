export interface ExcelColumn {
  header: string;
  key: string;
}

export interface ExtractedData {
  id: string;
  originalImage: string; // Base64
  r2Url?: string; // R2 public URL
  r2Key?: string; // R2 storage key
  data: Record<string, string | number>[]; // Changed to Array to support multiple rows per image
  status: 'pending' | 'processing' | 'completed' | 'error';
  confidence?: string;
}

export enum AppStep {
  UPLOAD_TEMPLATE = 0,
  DEFINE_COLUMNS = 1,
  UPLOAD_IMAGES = 2,
  REVIEW_DATA = 3,
  EXPORT = 4,
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
}