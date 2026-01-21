'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TableSkeleton } from '@/components/common/Skeleton';
import { NoHistoryEmptyState } from '@/components/common/EmptyState';

interface ExtractionHistory {
  id: string;
  templateName: string;
  imageCount: number;
  date: string;
  status: 'completed' | 'pending' | 'error';
  rowsExtracted: number;
}

interface HistoryListProps {
  onReopen?: (id: string) => void;
  onDownload?: (id: string) => void;
}

interface HistoryRowProps extends ExtractionHistory {
  onReopen: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const StatusBadge: React.FC<{ status: ExtractionHistory['status'] }> = ({ status }) => {
  const styles = {
    completed: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    error: 'bg-red-100 text-red-700 border-red-200'
  };

  const icons = {
    completed: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
    pending: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    )
  };

  const labels = {
    completed: 'Completed',
    pending: 'Pending',
    error: 'Error'
  };

  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {icons[status]}
      <span>{labels[status]}</span>
    </span>
  );
};

const HistoryRow = React.memo<HistoryRowProps>(({
  templateName,
  imageCount,
  date,
  status,
  rowsExtracted,
  onReopen,
  onDownload,
  onDelete
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-excel-100 rounded-lg flex items-center justify-center text-excel-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-900">{templateName}</p>
            <p className="text-sm text-slate-500">{rowsExtracted} rows extracted</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
            <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          <span>{imageCount} images</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {date}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
            </svg>
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    onReopen();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center space-x-2 text-sm text-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                    <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                  </svg>
                  <span>Reopen</span>
                </button>
                <button
                  onClick={() => {
                    onDownload();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center space-x-2 text-sm text-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  <span>Download Excel</span>
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center space-x-2 text-sm text-red-600 border-t border-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

HistoryRow.displayName = 'HistoryRow';

export const HistoryList: React.FC<HistoryListProps> = ({ onReopen, onDownload }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Dummy data - to be replaced with real data from Supabase
  const history: ExtractionHistory[] = [
    {
      id: '1',
      templateName: 'Inventory List.xlsx',
      imageCount: 8,
      date: '2 hours ago',
      status: 'completed',
      rowsExtracted: 45
    },
    {
      id: '2',
      templateName: 'Invoice Template.xlsx',
      imageCount: 3,
      date: '1 day ago',
      status: 'completed',
      rowsExtracted: 18
    },
    {
      id: '3',
      templateName: 'Customer Data.xlsx',
      imageCount: 15,
      date: '2 days ago',
      status: 'completed',
      rowsExtracted: 87
    },
    {
      id: '4',
      templateName: 'Product Catalog.xlsx',
      imageCount: 22,
      date: '3 days ago',
      status: 'completed',
      rowsExtracted: 132
    },
    {
      id: '5',
      templateName: 'Sales Report.xlsx',
      imageCount: 5,
      date: '5 days ago',
      status: 'error',
      rowsExtracted: 0
    },
    {
      id: '6',
      templateName: 'Expense Data.xlsx',
      imageCount: 12,
      date: '1 week ago',
      status: 'completed',
      rowsExtracted: 64
    }
  ];

  // useMemo: Calculate statistics only when history changes
  const stats = useMemo(() => {
    return {
      totalExtractions: history.length,
      completedCount: history.filter(h => h.status === 'completed').length,
      totalImages: history.reduce((acc, h) => acc + h.imageCount, 0),
      totalRows: history.reduce((acc, h) => acc + h.rowsExtracted, 0)
    };
  }, [history]);

  // useCallback: Memoize handlers to prevent HistoryRow re-renders
  const handleDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this extraction?')) {
      alert(`Delete extraction ${id} (implementation pending)`);
    }
  }, []);

  const handleReopen = useCallback((id: string) => {
    onReopen?.(id);
  }, [onReopen]);

  const handleDownload = useCallback((id: string) => {
    onDownload?.(id);
  }, [onDownload]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Extraction History</h1>
          <p className="text-slate-500">View and manage your past extractions</p>
        </div>
        <button className="px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          <span>Filter</span>
        </button>
      </div>

      {/* Stats Summary */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Total Extractions</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalExtractions}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.completedCount}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Total Images</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalImages}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Rows Extracted</p>
            <p className="text-2xl font-bold text-excel-600">
              {stats.totalRows}
            </p>
          </div>
        </div>
      )}

      {/* History Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : history.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {history.map((item) => (
                <HistoryRow
                  key={item.id}
                  {...item}
                  onReopen={() => handleReopen(item.id)}
                  onDownload={() => handleDownload(item.id)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <NoHistoryEmptyState />
      )}
    </div>
  );
};
