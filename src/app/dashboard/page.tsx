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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 백엔드에서 사용자 정보 가져오기 (페이지 로드 시 한 번만)
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
            // 닉네임이 있으면 닉네임, 없으면 username 사용
            setUserName(data.nickname || data.username);
            setUserInfo(data);
          } else {
            // 로그인되지 않음
            alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            router.push('/');
          }
        } else if (response.status === 401 || response.status === 403) {
          // 인증 실패
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
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
        // 상태 초기화
        setIsLoggedIn(false);
        setUserName('');
        setUserInfo(null);
        
        // sessionStorage 완전히 정리
        sessionStorage.removeItem('login_expire');
        sessionStorage.removeItem('user_name');
        sessionStorage.removeItem('user_id');
        
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
