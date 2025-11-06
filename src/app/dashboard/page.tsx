'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import MyScore from '@/components/MyScore';
import DailyCalorieChart from '@/components/DailyCalorieChart';
import FrequentFoodsList from '@/components/FrequentFoodsList';
import FloatingActionButtons from '@/components/FloatingActionButtons';

export default function Dashboard() {
  const router = useRouter();
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
  return (
    <div className="min-h-screen bg-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      
      <main className="max-w-md mx-auto px-4 py-6">
        {/* 페이지 제목 - 모바일 최적화 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">MY PAGE</h1>
        </div>

        {/* 메인 콘텐츠 - 모바일 세로 레이아웃 */}
        <div className="space-y-6">
          {/* 좌측: MY SCORE */}
          <div className="lg:col-span-1">
            <MyScore />
          </div>
          
          {/* 중앙: 일일 칼로리 섭취량 */}
          <div className="lg:col-span-2">
            <DailyCalorieChart />
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
