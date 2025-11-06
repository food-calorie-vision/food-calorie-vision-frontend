'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MyScore from '@/components/MyScore';
import DailyCalorieChart from '@/components/DailyCalorieChart';
import FrequentFoodsList from '@/components/FrequentFoodsList';
import FloatingActionButtons from '@/components/FloatingActionButtons';

export default function Dashboard() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 백엔드에서 사용자 정보 가져오기
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });

        if (response.ok) {
          const data = await response.json();
          console.log('사용자 정보:', data);
          
          if (data.user_id) {
            setIsLoggedIn(true);
            setUserName(data.nickname || data.user_id);
            setUserInfo(data);
          } else {
            // 로그인되지 않음
            router.push('/');
          }
        } else {
          // 인증 실패
          console.error('인증 실패');
          router.push('/');
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include', // 세션 쿠키 포함
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setUserName('');
        setUserInfo(null);
        alert('로그아웃되었습니다.');
        router.push('/');
      } else {
        console.error('로그아웃 실패');
        alert('로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 에러:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };
  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">MY PAGE</h1>
        </div>

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
        <div className="mt-8">
          <FrequentFoodsList />
        </div>
      </main>
      
      {/* 우측 플로팅 액션 버튼 */}
      <FloatingActionButtons />
    </div>
  );
}
