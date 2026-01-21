'use client';

import React, { useState, useEffect } from 'react';
import { GridSkeleton } from '@/components/common/Skeleton';
import { NoDataEmptyState } from '@/components/common/EmptyState';

interface DashboardHomeProps {
  onNewExtraction: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, trendUp }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-excel-50 rounded-xl text-excel-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
          trendUp ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {trendUp && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          )}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isPrimary?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, description, onClick, isPrimary }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 group ${
      isPrimary
        ? 'bg-gradient-to-br from-excel-600 to-excel-700 border-excel-600 text-white shadow-lg shadow-excel-600/20 hover:shadow-xl hover:shadow-excel-600/30 hover:scale-[1.02]'
        : 'bg-white border-slate-200 hover:border-excel-300 hover:bg-excel-50/50 hover:shadow-md'
    }`}
  >
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-xl transition-all duration-300 ${
        isPrimary
          ? 'bg-white/20 text-white group-hover:bg-white/30 group-hover:scale-110'
          : 'bg-excel-100 text-excel-600 group-hover:bg-excel-200 group-hover:scale-110'
      }`}>
        {icon}
      </div>
      <div className="flex-grow">
        <h3 className={`font-bold mb-1 ${isPrimary ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`text-sm ${isPrimary ? 'text-white/90' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${isPrimary ? 'text-white' : 'text-slate-400'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </div>
  </button>
);

interface RecentActivityProps {
  template: string;
  images: number;
  date: string;
  status: 'completed' | 'pending';
}

const RecentActivity: React.FC<RecentActivityProps> = ({ template, images, date, status }) => (
  <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
      status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
    }`}>
      {status === 'completed' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
      )}
    </div>
    <div className="flex-grow">
      <p className="font-medium text-slate-900 group-hover:text-excel-600 transition-colors">{template}</p>
      <p className="text-sm text-slate-500">{images} images processed</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-slate-400">{date}</p>
    </div>
  </div>
);

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNewExtraction }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Dummy data - to be replaced with real data from Supabase
  const stats = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
        </svg>
      ),
      label: 'Total Templates',
      value: 5,
      trend: '+2 this month',
      trendUp: true
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
        </svg>
      ),
      label: 'Images Processed',
      value: 247,
      trend: '+18% vs last month',
      trendUp: true
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
          <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
          <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
        </svg>
      ),
      label: 'This Month',
      value: 42,
      trend: '12 extractions',
      trendUp: false
    }
  ];

  const recentActivities: RecentActivityProps[] = [
    { template: 'Inventory List.xlsx', images: 8, date: '2 hours ago', status: 'completed' },
    { template: 'Invoice Template.xlsx', images: 3, date: '1 day ago', status: 'completed' },
    { template: 'Customer Data.xlsx', images: 15, date: '2 days ago', status: 'completed' },
    { template: 'Product Catalog.xlsx', images: 22, date: '3 days ago', status: 'completed' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h1>
        <p className="text-slate-500">Ready to extract data from your documents?</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <GridSkeleton items={3} columns={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            }
            title="Start New Extraction"
            description="Upload images and extract data with AI"
            onClick={onNewExtraction}
            isPrimary={true}
          />
          <QuickAction
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
              </svg>
            }
            title="Use Recent Template"
            description="Continue with your last used template"
            onClick={() => alert('Template selection coming soon')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <button className="text-sm text-excel-600 hover:text-excel-700 font-medium">
            View all
          </button>
        </div>
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {recentActivities.map((activity, index) => (
              <RecentActivity key={index} {...activity} />
            ))}
          </div>
        ) : (
          <NoDataEmptyState message="아직 작업 기록이 없습니다" />
        )}
      </div>
    </div>
  );
};
