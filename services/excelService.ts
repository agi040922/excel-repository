import * as XLSX from 'xlsx';
import { ExcelColumn } from '../types';

/**
 * Excel 행의 타입 (셀 값은 string 또는 number)
 */
type ExcelRow = (string | number | null | undefined)[];

/**
 * Excel 데이터 행의 타입 정의
 */
export interface ExcelDataRow {
  [key: string]: string | number;
}

export const parseExcelHeaders = async (file: File): Promise<ExcelColumn[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result || !(result instanceof ArrayBuffer)) {
          reject(new Error('Failed to read file'));
          return;
        }

        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          resolve([]);
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];

        // Get headers (first row)
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { header: 1 });
        if (jsonData.length === 0) {
          resolve([]);
          return;
        }

        const firstRow = jsonData[0];
        if (!Array.isArray(firstRow)) {
          resolve([]);
          return;
        }

        const headers = firstRow
          .map((cell, index) => {
            // 셀 값을 문자열로 변환 (null/undefined는 빈 문자열)
            const headerText = cell?.toString() ?? '';
            if (!headerText) return null;

            return {
              header: headerText,
              key: `col_${index}_${headerText.replace(/\s+/g, '_').toLowerCase()}`
            };
          })
          .filter((h): h is ExcelColumn => h !== null); // null 제거 및 타입 좁히기

        resolve(headers);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const generateExcelFile = async (
  columns: ExcelColumn[],
  data: ExcelDataRow[],
  templateFile?: File
): Promise<void> => {
  let workbook: XLSX.WorkBook;
  let worksheet: XLSX.WorkSheet;

  // 1. Map data to arrays based on column order
  const exportData = data.map(row => {
    const newRow: ExcelDataRow = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.header] ?? '';
    });
    return newRow;
  });

  if (templateFile) {
    // 2a. If template exists, load it and append
    const arrayBuffer = await templateFile.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error('Template file has no sheets');
    }

    worksheet = workbook.Sheets[sheetName];

    // Append data to the end of the sheet using origin: -1
    XLSX.utils.sheet_add_json(worksheet, exportData, {
      header: columns.map(c => c.header),
      skipHeader: true,
      origin: -1
    });
  } else {
    // 2b. If no template, create new workbook
    worksheet = XLSX.utils.json_to_sheet(exportData);
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Processed Data");
  }

  // 3. Write file
  // Use original filename if available so it feels like an update (browser will handle duplicates like 'file (1).xlsx')
  const fileName = templateFile ? templateFile.name : "VisionAI_Export.xlsx";
  XLSX.writeFile(workbook, fileName);
};