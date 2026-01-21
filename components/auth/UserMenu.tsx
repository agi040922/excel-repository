'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import LogoutButton from './LogoutButton'

interface UserMenuProps {
  user: User
}

/**
 * 사용자 메뉴 컴포넌트
 * - 사용자 아바타 및 이름 표시
 * - 드롭다운 메뉴 (프로필, 로그아웃)
 */
export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const userMetadata = user.user_metadata
  const displayName = userMetadata?.full_name || user.email?.split('@')[0] || 'User'
  const avatarUrl = userMetadata?.avatar_url

  return (
    <div ref={menuRef} className="relative">
      {/* 사용자 아바타 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-excel-100 px-3 py-2 text-sm font-medium text-excel-800 transition-colors hover:bg-excel-200 focus:outline-none focus:ring-2 focus:ring-excel-500 focus:ring-offset-2"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full border-2 border-white"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-excel-500 text-sm font-semibold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden md:block">{displayName}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {/* 사용자 정보 */}
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            {/* 메뉴 아이템 */}
            <div className="py-1">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
