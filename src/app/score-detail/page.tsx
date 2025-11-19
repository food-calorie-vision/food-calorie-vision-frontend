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
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // 실제 API에서 상세 점수 데이터를 가져옴
        const response = await fetch(`${apiEndpoint}/api/v1/meals/score-detail`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            const data = result.data;
            
            // API 응답을 프론트엔드 형식으로 변환
            const scoreDetailData: ScoreDetail = {
              overallScore: Math.round(data.overall_score),
              previousScore: data.previous_score ? Math.round(data.previous_score) : 0,
              scoreChange: data.score_change ? Math.round(data.score_change) : 0,
              categories: data.categories.map((cat: any) => ({
                name: cat.name,
                score: Math.round(cat.score),
                maxScore: cat.max_score,
                trend: cat.trend as 'up' | 'down' | 'same',
                feedback: cat.feedback
              })),
              weeklyTrend: data.weekly_trend.map((day: any) => ({
                date: day.date,
                score: Math.round(day.score)
              }))
            };
            
            setScoreDetail(scoreDetailData);
          } else {
            // 데이터 없음 - 기본값 설정
            setScoreDetail({
              overallScore: 0,
              previousScore: 0,
              scoreChange: 0,
              categories: [],
              weeklyTrend: []
            });
          }
        } else {
          // API 오류 시 기본값 설정
          setScoreDetail({
            overallScore: 0,
            previousScore: 0,
            scoreChange: 0,
            categories: [],
            weeklyTrend: []
          });
        }
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
            {scoreDetail.previousScore > 0 && (
              <div className="text-right">
                <div className={`flex items-center justify-end mb-1 ${
                  scoreDetail.scoreChange > 0 ? 'text-green-600' : 
                  scoreDetail.scoreChange < 0 ? 'text-red-600' : 
                  'text-slate-600'
                }`}>
                  {scoreDetail.scoreChange > 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : scoreDetail.scoreChange < 0 ? (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  ) : (
                    <Target className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm font-bold">
                    {scoreDetail.scoreChange > 0 ? '+' : ''}{scoreDetail.scoreChange}점
                  </span>
                </div>
                <p className="text-xs text-slate-600">전날 대비</p>
              </div>
            )}
          </div>
        </div>

        {/* 카테고리별 점수 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3">영역별 점수</h3>
          <div className="space-y-3">
            {scoreDetail.categories.map((category, index) => {
              // 점수에 따른 색상 및 상태 결정
              const scorePercentage = (category.score / category.maxScore) * 100;
              let barColor = "bg-green-500";
              let textColor = "text-green-600";
              let statusText = "";
              
              if (scorePercentage >= 80) {
                barColor = "bg-green-500";
                textColor = "text-green-600";
                statusText = "양호";
              } else if (scorePercentage >= 60) {
                barColor = "bg-yellow-500";
                textColor = "text-yellow-600";
                statusText = "보통";
              } else if (scorePercentage >= 40) {
                barColor = "bg-orange-500";
                textColor = "text-orange-600";
                statusText = "주의";
              } else {
                barColor = "bg-red-500";
                textColor = "text-red-600";
                statusText = "위험";
              }
              
              // 피드백 메시지에서 중요한 부분 강조
              const feedbackParts = category.feedback.split('.');
              const mainMessage = feedbackParts[0] || category.feedback;
              const subMessage = feedbackParts.slice(1).join('.').trim();
              
              // "초과입니다", "부족합니다", "불균형합니다" 같은 키워드 찾기
              const hasWarning = mainMessage.includes("초과") || mainMessage.includes("부족") || 
                                mainMessage.includes("불균형") || mainMessage.includes("위험");
              
              return (
                <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 text-sm">{category.name}</h4>
                    <div className="flex items-center gap-2">
                      {category.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {category.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                      {category.trend === 'same' && <Target className="w-3 h-3 text-slate-500" />}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${textColor} bg-opacity-10 ${textColor.replace('text-', 'bg-')}`}>
                        {statusText}
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        {category.score}<span className="text-slate-400">/{category.maxScore}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                    <div 
                      className={`${barColor} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(100, scorePercentage)}%` }}
                    ></div>
                  </div>
                  
                  {/* 피드백 메시지 */}
                  <div className="text-xs leading-relaxed">
                    {hasWarning ? (
                      <>
                        <span className={`font-bold ${textColor}`}>{mainMessage}</span>
                        {subMessage && <span className="text-slate-600">. {subMessage}</span>}
                      </>
                    ) : (
                      <span className="text-slate-600">{category.feedback}</span>
                    )}
                  </div>
                </div>
              );
            })}
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
