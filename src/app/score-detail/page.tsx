'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Target } from 'lucide-react';
import Link from 'next/link';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';

interface ScoreDetail {
  overallScore: number;
  previousScore: number;
  scoreChange: number;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    trend: 'up' | 'down' | 'same';
    feedback: string;
  }[];
  weeklyTrend: {
    date: string;
    score: number;
  }[];
}

export default function ScoreDetailPage() {
  const router = useRouter();
  const [scoreDetail, setScoreDetail] = useState<ScoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // 로그인 상태 확인 (API 기반)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user_id) {
            setIsLoggedIn(true);
            setUserName(data.nickname || data.username);
          } else {
            alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            router.push('/');
          }
        } else if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

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

  useEffect(() => {
    const fetchScoreDetail = async () => {
      try {
        // 실제로는 API에서 상세 점수 데이터를 가져옴
        // const response = await fetch('/api/score-detail');
        // const data = await response.json();
        
        // 임시 목업 데이터
        const mockData: ScoreDetail = {
          overallScore: 94,
          previousScore: 82,
          scoreChange: 12,
          categories: [
            {
              name: '칼로리 균형',
              score: 95,
              maxScore: 100,
              trend: 'up',
              feedback: '목표 칼로리 대비 적절한 섭취량을 유지하고 있습니다.'
            },
            {
              name: '영양소 균형',
              score: 88,
              maxScore: 100,
              trend: 'up',
              feedback: '탄수화물, 단백질, 지방의 비율이 양호합니다.'
            },
            {
              name: '식사 패턴',
              score: 92,
              maxScore: 100,
              trend: 'up',
              feedback: '규칙적인 식사 시간을 잘 지키고 있습니다.'
            },
            {
              name: '수분 섭취',
              score: 85,
              maxScore: 100,
              trend: 'down',
              feedback: '물 섭취량이 부족합니다. 하루 8잔 이상 마시세요.'
            },
            {
              name: '식이섬유',
              score: 78,
              maxScore: 100,
              trend: 'same',
              feedback: '채소와 과일 섭취를 늘려보세요.'
            }
          ],
          weeklyTrend: [
            { date: '10-15', score: 82 },
            { date: '10-16', score: 85 },
            { date: '10-17', score: 88 },
            { date: '10-18', score: 90 },
            { date: '10-19', score: 87 },
            { date: '10-20', score: 92 },
            { date: '10-21', score: 94 }
          ]
        };
        
        setScoreDetail(mockData);
      } catch (error) {
        console.error('상세 점수 데이터를 가져오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScoreDetail();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
        <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
        <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
        <div className="max-w-md mx-auto px-4 py-8">
          <p className="text-slate-500 text-center">점수 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* 뒤로가기 버튼 */}
        <Link href="/dashboard" className="inline-flex items-center text-slate-600 active:text-slate-900 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" />
          대시보드로 돌아가기
        </Link>

        {/* 페이지 제목 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">상세 점수 현황</h1>
          <p className="text-sm text-slate-600">각 영역별 점수와 개선사항을 확인하세요</p>
        </div>

        {/* 전체 점수 요약 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-2">전체 점수</h2>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-green-600">{scoreDetail.overallScore}</span>
                <span className="text-xl font-bold text-slate-400 ml-1">/100</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end text-green-600 mb-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-bold">+{scoreDetail.scoreChange}점</span>
              </div>
              <p className="text-xs text-slate-600">전날 대비</p>
            </div>
          </div>
        </div>

        {/* 카테고리별 점수 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3">영역별 점수</h3>
          <div className="space-y-3">
            {scoreDetail.categories.map((category, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 text-sm">{category.name}</h4>
                  <div className="flex items-center">
                    {category.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500 mr-1" />}
                    {category.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500 mr-1" />}
                    {category.trend === 'same' && <Target className="w-3 h-3 text-slate-500 mr-1" />}
                    <span className="text-base font-bold text-slate-900">
                      {category.score}<span className="text-slate-400">/{category.maxScore}</span>
                    </span>
                  </div>
                </div>
                
                {/* 진행률 바 */}
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">{category.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 주간 트렌드 */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">주간 점수 트렌드</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {scoreDetail.weeklyTrend.map((day, index) => (
                <div key={index} className="flex-1 min-w-[50px] text-center">
                  <p className="text-xs text-slate-600 mb-2">{day.date}</p>
                  <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                    <p className="text-base font-bold text-green-600">{day.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoggedIn && <MobileNav />}
    </div>
  );
}
