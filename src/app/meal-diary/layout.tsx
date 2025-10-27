'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import Link from 'next/link';

interface MealDiaryLayoutProps {
  children: ReactNode;
}

export default function MealDiaryLayout({ children }: MealDiaryLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

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
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="text-xl font-bold text-slate-800">KCalculator</span>
            </Link>
            <span className="text-slate-400">|</span>
            <h1 className="text-lg font-semibold text-slate-700">오늘의 식사 일기</h1>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline"
          >
            홈으로
          </Link>
        </div>
      </header>

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
