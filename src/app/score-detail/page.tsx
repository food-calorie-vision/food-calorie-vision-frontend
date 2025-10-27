'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, TrendingUp, TrendingDown, Target } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';

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
      <div className="min-h-screen bg-white">
        <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreDetail) {
    return (
      <div className="min-h-screen bg-white">
        <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-500">점수 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 뒤로가기 버튼 */}
        <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          대시보드로 돌아가기
        </Link>

        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">상세 점수 현황</h1>
          <p className="text-gray-600">각 영역별 점수와 개선사항을 확인하세요</p>
        </div>

        {/* 전체 점수 요약 */}
        <div className="bg-green-50 p-6 rounded-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">전체 점수</h2>
              <div className="flex items-center">
                <span className="text-4xl font-bold text-green-600">{scoreDetail.overallScore}</span>
                <span className="text-2xl font-bold text-gray-400 ml-1">/100</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600 mb-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+{scoreDetail.scoreChange}점</span>
              </div>
              <p className="text-sm text-gray-600">전날 대비</p>
            </div>
          </div>
        </div>

        {/* 카테고리별 점수 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">영역별 점수</h3>
          <div className="space-y-4">
            {scoreDetail.categories.map((category, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <div className="flex items-center">
                    {category.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
                    {category.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                    {category.trend === 'same' && <Target className="w-4 h-4 text-gray-500 mr-1" />}
                    <span className="text-lg font-bold text-gray-900">
                      {category.score}/{category.maxScore}
                    </span>
                  </div>
                </div>
                
                {/* 진행률 바 */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-600">{category.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 주간 트렌드 */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">주간 점수 트렌드</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-7 gap-4">
              {scoreDetail.weeklyTrend.map((day, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{day.date}</p>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-green-600">{day.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
