'use client';

import React from 'react';
import { CardSkeleton } from '@/components/common/Skeleton';
import { NoTemplatesEmptyState } from '@/components/common/EmptyState';

interface Template {
  id: string;
  name: string;
  columnCount: number;
  lastUsed: string;
  createdAt: string;
  usageCount: number;
}

interface TemplateListProps {
  onSelectTemplate?: (template: Template) => void;
}

interface TemplateCardProps extends Template {
  onClick: () => void;
}

const TemplateCard = React.memo<TemplateCardProps>(({
  name,
  columnCount,
  lastUsed,
  usageCount,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-excel-500 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-excel-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-12 h-12 bg-excel-100 rounded-xl flex items-center justify-center text-excel-600 mb-4 group-hover:bg-excel-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
          </svg>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-excel-700 transition-colors">
            {name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
              </svg>
              <span>{columnCount} columns</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
              </svg>
              <span>{usageCount}x used</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">Last used {lastUsed}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-300 group-hover:text-excel-600 group-hover:translate-x-1 transition-all">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </button>
  );
});

TemplateCard.displayName = 'TemplateCard';

export const TemplateList: React.FC<TemplateListProps> = ({ onSelectTemplate }) => {
  // TODO: Implement loading state with real data fetching from Supabase
  const isLoading = false;

  // Dummy data - to be replaced with real data from Supabase
  const templates: Template[] = [
    {
      id: '1',
      name: 'Inventory Management.xlsx',
      columnCount: 8,
      lastUsed: '2 hours ago',
      createdAt: '2025-01-15',
      usageCount: 24
    },
    {
      id: '2',
      name: 'Invoice Template.xlsx',
      columnCount: 6,
      lastUsed: '1 day ago',
      createdAt: '2025-01-10',
      usageCount: 18
    },
    {
      id: '3',
      name: 'Customer Database.xlsx',
      columnCount: 12,
      lastUsed: '2 days ago',
      createdAt: '2025-01-08',
      usageCount: 31
    },
    {
      id: '4',
      name: 'Product Catalog.xlsx',
      columnCount: 10,
      lastUsed: '3 days ago',
      createdAt: '2025-01-05',
      usageCount: 15
    },
    {
      id: '5',
      name: 'Sales Report.xlsx',
      columnCount: 7,
      lastUsed: '1 week ago',
      createdAt: '2024-12-20',
      usageCount: 42
    },
    {
      id: '6',
      name: 'Expense Tracker.xlsx',
      columnCount: 5,
      lastUsed: '2 weeks ago',
      createdAt: '2024-12-15',
      usageCount: 9
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Templates</h1>
          <p className="text-slate-500">Select a template to start a new extraction</p>
        </div>
        <button className="bg-excel-600 hover:bg-excel-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          <span>New Template</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-excel-500 focus:border-transparent"
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <select className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-excel-500 focus:border-transparent bg-white">
          <option>Sort by: Last Used</option>
          <option>Sort by: Name</option>
          <option>Sort by: Most Used</option>
          <option>Sort by: Recently Created</option>
        </select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              {...template}
              onClick={() => onSelectTemplate?.(template)}
            />
          ))}
        </div>
      ) : (
        <NoTemplatesEmptyState onCreateTemplate={() => alert('Create template coming soon')} />
      )}
    </div>
  );
};
