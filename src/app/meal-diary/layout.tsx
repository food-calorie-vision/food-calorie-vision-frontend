'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
          <button
            onClick={() => handleTabClick('meal')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'meal'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">🍽️</span>
            <span>식단 분석</span>
          </button>
          <button
            onClick={() => handleTabClick('ingredient')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ingredient'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">🥕</span>
            <span>식재료 입력</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {children}
      </div>
    </div>
  );
}
