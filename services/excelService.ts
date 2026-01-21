import * as XLSX from 'xlsx';
import { ExcelColumn } from '../types';

export const parseExcelHeaders = async (file: File): Promise<ExcelColumn[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get headers (first row)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length === 0) {
          resolve([]);
          return;
        }

        const headers = (jsonData[0] as string[]).map((header, index) => ({
          header: header,
          key: `col_${index}_${header.replace(/\s+/g, '_').toLowerCase()}`
        }));

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
  data: Record<string, any>[], 
  templateFile?: File
): Promise<void> => {
  let workbook: XLSX.WorkBook;
  let worksheet: XLSX.WorkSheet;

  // 1. Map data to arrays based on column order
  const exportData = data.map(row => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.header] || '';
    });
    return newRow;
  });

  if (templateFile) {
    // 2a. If template exists, load it and append
    const arrayBuffer = await templateFile.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
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