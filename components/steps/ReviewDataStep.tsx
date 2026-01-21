'use client';

import React, { useMemo, useCallback } from 'react';
import { ExcelColumn, ExtractedData } from '@/types';

interface ReviewDataStepProps {
  columns: ExcelColumn[];
  items: ExtractedData[];
  templateName: string;
  onCellChange: (itemId: string, rowIndex: number, key: string, value: string) => void;
  onExport: () => void;
}

const isPdf = (base64: string) => base64.startsWith('data:application/pdf');

// Memoized table row component to prevent unnecessary re-renders
interface TableRowProps {
  item: ExtractedData;
  rowIndex: number;
  columns: ExcelColumn[];
  onCellChange: (itemId: string, rowIndex: number, key: string, value: string) => void;
  showImage: boolean;
}

const TableRow = React.memo<TableRowProps>(({ item, rowIndex, columns, onCellChange, showImage }) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        {showImage && (
          <div className="relative group cursor-pointer w-12 h-12">
            {isPdf(item.originalImage) ? (
              <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                <span className="text-[10px] font-bold text-red-500">PDF</span>
              </div>
            ) : (
              <>
                <img
                  src={item.originalImage}
                  className="w-12 h-12 object-cover rounded border border-slate-200"
                  alt="source"
                />
                <div className="hidden group-hover:block absolute left-14 top-0 z-50 w-64 p-1 bg-white border border-slate-200 shadow-xl rounded-lg">
                  <img src={item.originalImage} className="w-full h-auto rounded" alt="preview" />
                </div>
              </>
            )}
          </div>
        )}
      </td>
      {columns.map(col => {
        const confidence = item.confidence ? parseFloat(item.confidence) : 100;
        const isLowConfidence = confidence < 70;

        return (
          <td key={col.key} className="px-2 py-2 whitespace-nowrap">
            <input
              type="text"
              className={`w-full px-3 py-1.5 text-sm border-transparent focus:border-excel-500 focus:ring-1 focus:ring-excel-500 rounded transition-all ${
                isLowConfidence
                  ? 'bg-yellow-50 hover:bg-yellow-100 focus:bg-white'
                  : 'bg-transparent hover:bg-slate-100 focus:bg-white'
              }`}
              value={item.data[rowIndex]?.[col.header] || ''}
              onChange={(e) => onCellChange(item.id, rowIndex, col.header, e.target.value)}
              title={isLowConfidence ? `Low confidence (${confidence}%) - Please verify` : ''}
            />
          </td>
        );
      })}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

export const ReviewDataStep: React.FC<ReviewDataStepProps> = ({
  columns,
  items,
  templateName,
  onCellChange,
  onExport,
}) => {
  // useMemo: Prevent re-computing rows when component re-renders
  const tableRows = useMemo(() => {
    return items.flatMap((item) =>
      item.data.length > 0
        ? item.data.map((row, rowIndex) => ({
            item,
            rowIndex,
            showImage: rowIndex === 0,
            key: `${item.id}-${rowIndex}`
          }))
        : [{
            item,
            rowIndex: -1, // Flag for empty state
            showImage: false,
            key: `${item.id}-empty`
          }]
    );
  }, [items]);

  // useCallback: Memoize cell change handler to prevent TableRow re-renders
  const handleCellChange = useCallback((itemId: string, rowIndex: number, key: string, value: string) => {
    onCellChange(itemId, rowIndex, key, value);
  }, [onCellChange]);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Review & Edit</h2>
          <p className="text-slate-500">
            {templateName
              ? <span>AI output based on your images. These will be appended to <span className="font-semibold text-slate-900">{templateName}</span>.</span>
              : "AI output based on your images. Please verify accuracy."}
          </p>
        </div>
        <button
          onClick={onExport}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-slate-900/10 font-medium transition-all flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          {templateName ? "Append & Export" : "Export to Excel"}
        </button>
      </div>

      <div className="flex-grow overflow-auto border border-slate-200 rounded-xl shadow-sm bg-white custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                Source
              </th>
              {columns.length === 0 ? (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  No Data Detected
                </th>
              ) : columns.map(col => (
                <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[150px]">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {tableRows.map((rowData) => (
              rowData.rowIndex === -1 ? (
                // Empty state if processing failed or no data
                <tr key={rowData.key} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-12 object-cover rounded border border-slate-200 bg-slate-100 flex items-center justify-center">
                      <span className="text-xs text-slate-400">?</span>
                    </div>
                  </td>
                  <td colSpan={columns.length} className="px-6 py-4 text-sm text-slate-400 italic">
                    No data extracted from this image.
                  </td>
                </tr>
              ) : (
                <TableRow
                  key={rowData.key}
                  item={rowData.item}
                  rowIndex={rowData.rowIndex}
                  columns={columns}
                  onCellChange={handleCellChange}
                  showImage={rowData.showImage}
                />
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
