'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';

interface MealDiaryLayoutProps {
  children: ReactNode;
}

export default function MealDiaryLayout({ children }: MealDiaryLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expire = sessionStorage.getItem('login_expire');
      const user = sessionStorage.getItem('user_name');
      
      if (expire && Date.now() < Number(expire)) {
        setIsLoggedIn(true);
        setUserName(user || '');
      }
    }
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('login_expire');
      sessionStorage.removeItem('user_name');
      alert('로그아웃되었습니다.');
      router.push('/');
    }
  };

  // 현재 경로에 따라 activeTab 자동 설정
  const activeTab = useMemo(() => {
    if (pathname.includes('ingredient')) {
      return 'ingredient';
    }
    return 'meal';
  }, [pathname]);

  const handleTabClick = (tab: 'meal' | 'ingredient') => {
    const path = tab === 'meal' ? '/meal-diary/analysis' : '/meal-diary/ingredient';
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />

      {/* Tab Navigation - 모바일 최적화 */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
          <button
            onClick={() => handleTabClick('meal')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'meal'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-slate-600 active:bg-slate-50'
            }`}
          >
            <span className="text-xl">🍽️</span>
            <span className="text-sm">식단 분석</span>
          </button>
          <button
            onClick={() => handleTabClick('ingredient')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'ingredient'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-slate-600 active:bg-slate-50'
            }`}
          >
            <span className="text-xl">🥕</span>
            <span className="text-sm">식재료 입력</span>
          </button>
        </div>
      </div>

      {/* Tab Content - 모바일 최적화 */}
      <div className="max-w-md mx-auto px-4 pb-6">
        {children}
      </div>

      {/* 모바일 하단 네비게이션 */}
      <MobileNav />
    </div>
  );
}
