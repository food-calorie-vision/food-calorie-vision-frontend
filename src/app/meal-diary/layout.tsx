'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { useSession } from '@/contexts/SessionContext';

interface MealDiaryLayoutProps {
  children: ReactNode;
}

export default function MealDiaryLayout({ children }: MealDiaryLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, userName, logout } = useSession();

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
      <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />

      {/* Tab Navigation - 모바일 최적화 */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
          <button
            onClick={() => handleTabClick('meal')}
            className={`flex-1 px-3 py-2.5 rounded-lg transition flex items-center justify-center ${
              activeTab === 'meal'
                ? 'bg-green-500 text-white font-bold shadow-md'
                : 'text-slate-600 font-medium hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
            <span className="text-sm">식단 분석</span>
          </button>
          <button
            onClick={() => handleTabClick('ingredient')}
            className={`flex-1 px-3 py-2.5 rounded-lg transition flex items-center justify-center ${
              activeTab === 'ingredient'
                ? 'bg-green-500 text-white font-bold shadow-md'
                : 'text-slate-600 font-medium hover:bg-slate-50 active:bg-slate-100'
            }`}
          >
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
