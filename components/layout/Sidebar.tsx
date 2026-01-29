'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useUserCredits } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

type DashboardPage = 'new-extraction' | 'templates' | 'history' | 'settings';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  page: DashboardPage;
  href: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// pathname을 DashboardPage로 변환
function getPageFromPathname(pathname: string): DashboardPage {
  if (pathname === '/' || pathname.startsWith('/extraction')) return 'new-extraction';
  if (pathname.startsWith('/templates')) return 'templates';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'new-extraction';
}

/**
 * 개별 네비게이션 아이템 컴포넌트
 */
const NavLink = memo(function NavLink({
  item,
  isActive,
  sidebarOpen,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  sidebarOpen: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
        isActive
          ? 'bg-excel-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
      } ${!sidebarOpen ? 'justify-center' : ''}`}
    >
      <span className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
        {item.icon}
      </span>
      {sidebarOpen && <span className="font-medium">{item.label}</span>}
    </Link>
  );
});

/**
 * 크레딧 표시 컴포넌트
 */
const CreditDisplay = memo(function CreditDisplay({
  sidebarOpen,
}: {
  sidebarOpen: boolean;
}) {
  const { credits, loading } = useUserCredits();

  if (loading) {
    return (
      <div className="p-3">
        {sidebarOpen ? (
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            <div className="h-2 w-full bg-slate-200 rounded animate-pulse" />
          </div>
        ) : (
          <div className="h-9 w-9 mx-auto bg-slate-200 rounded-full animate-pulse" />
        )}
      </div>
    );
  }

  if (!credits) return null;

  // 남은 크레딧 비율
  const remainingPercent =
    credits.monthlyCredits > 0
      ? Math.round((credits.currentCredits / credits.monthlyCredits) * 100)
      : 0;

  // 크레딧이 적을 때 경고 색상
  const isLow = remainingPercent <= 20;

  if (!sidebarOpen) {
    return (
      <div className="flex justify-center p-2">
        <Link
          href="/settings"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            isLow
              ? 'bg-red-100 text-red-600'
              : 'bg-excel-100 text-excel-600 hover:bg-excel-200'
          }`}
          title={`${credits.currentCredits} 크레딧 남음`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/settings"
      className="block p-3 space-y-2 hover:bg-white/40 rounded-lg mx-3 transition-colors"
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
          </svg>
          <span>크레딧</span>
        </div>
        <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
          {credits.currentCredits}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-excel-500'}`}
          style={{ width: `${Math.min(remainingPercent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{credits.planName}</span>
        <span>{Math.min(remainingPercent, 100)}% 남음</span>
      </div>
    </Link>
  );
});

/**
 * 프로필 표시 컴포넌트
 */
const ProfileDisplay = memo(function ProfileDisplay({
  sidebarOpen,
}: {
  sidebarOpen: boolean;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="h-9 w-9 mx-auto rounded-full bg-slate-200 animate-pulse" />
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`p-3 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
        <Link
          href="/login"
          className={`flex items-center justify-center gap-2 rounded-lg bg-excel-600 text-white font-medium transition-colors hover:bg-excel-700 ${
            sidebarOpen ? 'px-4 py-2 text-sm' : 'h-9 w-9'
          }`}
        >
          {sidebarOpen ? (
            '로그인'
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          )}
        </Link>
      </div>
    );
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url;

  if (!sidebarOpen) {
    return (
      <div className="p-2 flex justify-center">
        <div className="relative group">
          <button
            className="h-9 w-9 rounded-full overflow-hidden border-2 border-white shadow-sm hover:shadow-md transition-shadow"
            title={displayName}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-excel-500 flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
            )}
          </button>
          {/* Dropdown */}
          <div className="absolute left-full bottom-0 ml-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-3 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <div className="p-1">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                </svg>
                설정
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="relative group">
        <button className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-white/40 transition-colors text-left">
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-excel-500 flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400">
            <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
          </svg>
        </button>
        {/* Dropdown */}
        <div className="absolute left-0 bottom-full mb-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="p-1">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>
              설정
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * 사이드바 컴포넌트 - 글래스모피즘 스타일
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();
  const currentPage = getPageFromPathname(pathname);
  const sidebarOpen = !isCollapsed;

  const navItems: NavItem[] = useMemo(
    () => [
      {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Extraction',
        page: 'new-extraction',
        href: '/extraction',
      },
      {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
          </svg>
        ),
        label: 'Templates',
        page: 'templates',
        href: '/templates',
      },
      {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
          </svg>
        ),
        label: 'History',
        page: 'history',
        href: '/history',
      },
      {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Settings',
        page: 'settings',
        href: '/settings',
      },
    ],
    []
  );

  // 활성 상태 계산 메모이제이션
  const activeStates = useMemo(() => {
    return navItems.map((item) => currentPage === item.page);
  }, [navItems, currentPage]);

  return (
    <>
      {/* Desktop Sidebar - 글래스모피즘 스타일 */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 z-40 h-screen flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(226,232,240,0.6)',
          boxShadow: '2px 0 20px -5px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo & Toggle */}
        <div
          className={`flex h-16 items-center justify-between px-4 shrink-0 ${
            sidebarOpen ? '' : 'justify-center'
          }`}
          style={{
            background: 'linear-gradient(90deg, rgba(34,197,94,0.03) 0%, transparent 100%)',
          }}
        >
          {sidebarOpen && (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-8 h-8 bg-excel-600 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-excel-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-800">Excel Vision AI</span>
            </Link>
          )}
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-lg hover:bg-white/60 text-slate-500 hover:text-slate-700 transition-colors ${
              !sidebarOpen ? 'mx-auto' : ''
            }`}
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${sidebarOpen ? 'p-4 space-y-1' : 'p-2 space-y-1'}`}>
          {navItems.map((item, index) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={activeStates[index]}
              sidebarOpen={sidebarOpen}
            />
          ))}
        </nav>

        {/* Bottom Section: Credits & Profile */}
        <div
          className="relative shrink-0"
          style={{
            borderTop: '1px solid rgba(226,232,240,0.5)',
            background: 'linear-gradient(0deg, rgba(248,250,252,0.5) 0%, transparent 100%)',
          }}
        >
          {/* 상단 악센트 라인 */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.2), transparent)',
            }}
          />

          {/* Credits */}
          <CreditDisplay sidebarOpen={sidebarOpen} />

          {/* Separator */}
          <div className="relative">
            <div style={{ borderTop: '1px solid rgba(226,232,240,0.3)' }} />
            <div
              className="absolute inset-x-4 top-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.1), transparent)',
              }}
            />
          </div>

          {/* Profile */}
          <ProfileDisplay sidebarOpen={sidebarOpen} />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(226,232,240,0.6)',
          boxShadow: '2px 0 30px -5px rgba(0,0,0,0.15)',
        }}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between px-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 bg-excel-600 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">Excel Vision AI</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item, index) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={activeStates[index]}
              sidebarOpen={true}
              onClick={onClose}
            />
          ))}
        </nav>

        {/* Mobile Bottom Section */}
        <div
          className="shrink-0"
          style={{
            borderTop: '1px solid rgba(226,232,240,0.5)',
            background: 'linear-gradient(0deg, rgba(248,250,252,0.5) 0%, transparent 100%)',
          }}
        >
          <CreditDisplay sidebarOpen={true} />
          <div style={{ borderTop: '1px solid rgba(226,232,240,0.3)' }} />
          <ProfileDisplay sidebarOpen={true} />
        </div>
      </aside>
    </>
  );
};
