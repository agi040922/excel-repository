'use client';

import { useCallback } from 'react';
import { HistoryList } from './HistoryList';
import { generateExcelFile, ExcelDataRow } from '@/services/excelService';
import { ExcelColumn } from '@/types';

interface ResultData {
  rows?: Array<Record<string, string | number>>;
  columns?: Array<{ key: string; header: string }>;
  metadata?: { total_images?: number; processed_images?: number; average_confidence?: number };
}

interface ExtractionData {
  id: string;
  result_data: ResultData | null;
  exported_file_url: string | null;
}

interface HistoryItem {
  id: string;
  templateName: string;
  imageCount: number;
  date: string;
  status: 'completed' | 'pending' | 'error';
  rowsExtracted: number;
}

interface HistoryPageClientProps {
  history: HistoryItem[];
  extractions: ExtractionData[];
}

export function HistoryPageClient({ history, extractions }: HistoryPageClientProps) {
  const handleDownload = useCallback(async (id: string) => {
    // Find the extraction data
    const extraction = extractions.find(e => e.id === id);
    if (!extraction) {
      alert('추출 데이터를 찾을 수 없습니다.');
      return;
    }

    // If exported_file_url exists, open it in new tab
    if (extraction.exported_file_url) {
      window.open(extraction.exported_file_url, '_blank');
      return;
    }

    // Otherwise, generate Excel from result_data
    const resultData = extraction.result_data;
    if (!resultData?.rows || !resultData?.columns) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      // Convert columns to ExcelColumn format
      const columns: ExcelColumn[] = resultData.columns.map(col => ({
        header: col.header,
        key: col.key,
      }));

      // Convert rows to use header as key
      const data: ExcelDataRow[] = resultData.rows.map(row => {
        const newRow: ExcelDataRow = {};
        columns.forEach(col => {
          newRow[col.header] = row[col.key] ?? '';
        });
        return newRow;
      });

      await generateExcelFile(columns, data);
    } catch (error) {
      console.error('Excel 생성 오류:', error);
      alert('Excel 파일 생성 중 오류가 발생했습니다.');
    }
  }, [extractions]);

  return <HistoryList history={history} onDownload={handleDownload} />;
}
