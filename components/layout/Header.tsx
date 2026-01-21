'use client';

import React from 'react';
import { User } from '@supabase/supabase-js';
import UserMenu from '@/components/auth/UserMenu';

interface HeaderProps {
  templateName?: string;
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({ templateName, onMenuToggle, isSidebarOpen, user }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-excel-600 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-800">Excel Vision AI</span>
          </div>

          <div className="hidden md:flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
              <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM19.75 11.625a.375.375 0 0 0-.375.375v2.875c0 .621.504 1.125 1.125 1.125h.375a3.75 3.75 0 0 1 3.75 3.75v1.875a.375.375 0 0 0 .75 0v-1.875a4.5 4.5 0 0 0-4.5-4.5h-.375v-2.875a.375.375 0 0 0-.375-.375Z" clipRule="evenodd" />
            </svg>
            Powered by Gemini 3 Flash
          </div>
        </div>

        <div className="flex items-center gap-4">
          {templateName && (
            <div className="text-sm px-3 py-1 bg-slate-100 rounded-full text-slate-600 border border-slate-200 max-w-[200px] truncate">
              {templateName}
            </div>
          )}

          {/* User Menu or Login */}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <a
              href="/login"
              className="rounded-lg bg-excel-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-excel-700 focus:outline-none focus:ring-2 focus:ring-excel-500 focus:ring-offset-2"
            >
              로그인
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
