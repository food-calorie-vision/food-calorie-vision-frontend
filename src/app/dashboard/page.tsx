'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import MyScore from '@/components/MyScore';
import DailyCalorieChart from '@/components/DailyCalorieChart';
import FrequentFoodsList from '@/components/FrequentFoodsList';
import FloatingActionButtons from '@/components/FloatingActionButtons';
import { useSession } from '@/contexts/SessionContext';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, userName, logout } = useSession();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // 백엔드에서 사용자 정보 가져오기 (페이지 로드 시 한 번만)
    const fetchUserInfo = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });

        if (response.ok) {
          const data = await response.json();
          console.log('사용자 정보:', data);
          setUserInfo(data);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    };

    fetchUserInfo();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-white mobile-content">
      <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
      
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 페이지 제목 - 모바일 최적화 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">MY PAGE</h1>
          <button
            onClick={() => router.push('/food-history')}
            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 active:scale-95 transition shadow-sm flex items-center gap-2"
          >
            <span>🍽️</span>
            <span>먹은 음식 확인</span>
          </button>
        </div>

        {/* 메인 콘텐츠 - 모바일 세로 레이아웃 */}
        <div className="space-y-6">
          {/* 좌측: MY SCORE */}
          <div className="lg:col-span-1">
            <MyScore userInfo={userInfo} />
          </div>
          
          {/* 중앙: 일일 칼로리 섭취량 */}
          <div className="lg:col-span-2">
            <DailyCalorieChart userInfo={userInfo} />
          </div>
        </div>
        
        {/* 하단: 자주 먹는 음식 리스트 */}
        <div className="mt-6 pb-4">
          <FrequentFoodsList />
        </div>
      </main>
      
      {/* 모바일 하단 네비게이션 */}
      <MobileNav />
    </div>
  );
}
