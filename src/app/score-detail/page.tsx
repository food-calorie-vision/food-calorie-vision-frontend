'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Info } from 'lucide-react';
import Link from 'next/link';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import BadgeShowcase from '@/components/BadgeShowcase'; // Added import
import { useSession } from '@/contexts/SessionContext';
import { API_BASE_URL } from '@/utils/api';

// Dummy badge data
const dummyBadges = [
  {
    id: 'badge1',
    title: '균형의 대가',
    subtitle: '영양소 균형을 잘 맞췄어요!',
    icon: '/balance-master.png',
    status: 'achieved',
    achievedAt: new Date().toISOString(),
  },
  {
    id: 'badge2',
    title: '칼로리 헌터',
    subtitle: '목표 칼로리를 잘 지켰어요!',
    icon: '/calorie-hunter.png',
    status: 'pending',
    achievedAt: null,
  },
  {
    id: 'badge3',
    title: '수분 챔피언',
    subtitle: '충분한 수분을 섭취했어요!',
    icon: '/hydration-champion.png',
    status: 'locked',
    achievedAt: null,
  },
  {
    id: 'badge4',
    title: '소금 수호자',
    subtitle: '나트륨 섭취를 잘 관리했어요!',
    icon: '/sodium-guardian.png',
    status: 'achieved',
    achievedAt: new Date().toISOString(),
  },
  {
    id: 'badge5',
    title: '채소 탐험가',
    subtitle: '다양한 채소를 섭취했어요!',
    icon: '/vegetable-explorer.png',
    status: 'pending',
    achievedAt: null,
  },
];

interface ScoreDetail {
  overallScore: number;
  qualityScore?: number; // 식단 품질 점수
  quantityScore?: number; // 양적 달성도 점수
  calorieRatio?: number; // 칼로리 달성률
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
  const { isAuthenticated, userName, logout } = useSession();
  const [scoreDetail, setScoreDetail] = useState<ScoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuantityTooltip, setShowQuantityTooltip] = useState(false);

  useEffect(() => {
    const fetchScoreDetail = async () => {
      try {
        // 실제 API에서 상세 점수 데이터를 가져옴
        const response = await fetch(`${API_BASE_URL}/api/v1/meals/score-detail`, {
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
              qualityScore: data.quality_score !== undefined ? Math.round(data.quality_score) : undefined,
              quantityScore: data.quantity_score !== undefined ? Math.round(data.quantity_score) : undefined,
              calorieRatio: data.calorie_ratio !== undefined ? data.calorie_ratio : undefined,
              previousScore: data.previous_score ? Math.round(data.previous_score) : 0,
              scoreChange: data.score_change ? Math.round(data.score_change) : 0,
              categories: data.categories.map((cat: { name: string; score: number; max_score: number; trend: string; feedback: string }) => ({
                name: cat.name,
                score: Math.round(cat.score),
                maxScore: cat.max_score,
                trend: cat.trend as 'up' | 'down' | 'same',
                feedback: cat.feedback
              })),
              weeklyTrend: data.weekly_trend.map((day: { date: string; score: number }) => ({
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
        <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
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
        <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
        <div className="max-w-md mx-auto px-4 py-8">
          <p className="text-slate-500 text-center">점수 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
      
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
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-7 rounded-xl mb-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center mb-2">
                <h2 className="text-sm font-semibold text-slate-700">오늘의 종합 점수</h2>
                <div className="relative group ml-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-[10px] font-bold cursor-help">
                    ℹ
                  </div>
                  <div className="absolute left-0 top-5 w-56 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <p className="leading-relaxed">영역별 점수를 종합한 전체 평가 점수입니다</p>
                  </div>
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-green-600">{scoreDetail.overallScore}</span>
                <span className="text-xl font-bold text-slate-400 ml-1">/100</span>
              </div>
            </div>
            
            {/* 그래프 이미지 및 증감 표시 */}
            <div className="flex flex-col items-end gap-1">
              {/* 그래프 이미지 (크기 확대) */}
              <img 
                src="/score_image.png" 
                alt="Score Trend" 
                className="w-35 h-auto object-contain mb-1 opacity-90"
              />
              
              {scoreDetail.previousScore > 0 && (
                <div className={`flex items-center justify-end ${
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
                  <span className="text-xs text-slate-500 ml-1 font-normal">전날 대비</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 점수 상세 분석 (종합 점수 계산 원리) */}
        {scoreDetail.qualityScore !== undefined && scoreDetail.quantityScore !== undefined && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              💡 점수 상세 분석
              <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">질(Quality) × 양(Quantity)</span>
            </h3>
            
            <div className="space-y-4">
              {/* 식단 품질 */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">🥗 식단 품질</span>
                  <span className="text-slate-900 font-bold">{scoreDetail.qualityScore}점</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, scoreDetail.qualityScore)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500">음식 자체의 영양 균형과 건강함</p>
              </div>

              {/* 섭취 달성도 */}
              <div className="relative">
                <div className="flex justify-between text-xs mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">🍽️ 섭취 달성도</span>
                    <button 
                      onClick={() => setShowQuantityTooltip(!showQuantityTooltip)}
                      onMouseEnter={() => setShowQuantityTooltip(true)}
                      onMouseLeave={() => setShowQuantityTooltip(false)}
                      className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-help focus:outline-none hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                    
                    {/* 툴팁 */}
                    {showQuantityTooltip && (
                      <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border border-slate-200 text-slate-600 text-xs rounded-lg p-3 shadow-xl z-20">
                        <p className="font-bold mb-1 text-slate-800">💡 점수 계산법</p>
                        <p className="mb-2 text-slate-600">목표 칼로리의 <span className="text-emerald-600 font-bold">80% ~ 120%</span>를 섭취하면 만점(1.0)을 받습니다.</p>
                        <ul className="space-y-1 text-slate-500 list-disc pl-3 bg-slate-50 rounded p-2 mb-2">
                          <li>현재 섭취율: <span className="text-slate-700 font-bold">{scoreDetail.calorieRatio ?? 0}%</span></li>
                          <li>현재 점수: <span className="text-slate-700 font-bold">{scoreDetail.quantityScore}점</span></li>
                        </ul>
                        <p className="text-[10px] text-slate-400">* 너무 적게 먹거나 과식하면 점수가 낮아집니다.</p>
                        {/* 화살표 (흰색 배경에 맞게 수정) */}
                        <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white drop-shadow-sm"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-slate-900 font-bold">{scoreDetail.quantityScore}점</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                  <div 
                    className={`${scoreDetail.quantityScore >= 80 ? 'bg-green-500' : 'bg-amber-500'} h-2 rounded-full`} 
                    style={{ width: `${Math.min(100, scoreDetail.quantityScore)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500">
                  목표 칼로리 대비 섭취량 ({scoreDetail.calorieRatio ?? 0}%)
                  {scoreDetail.quantityScore < 50 && " - 부족해요!"}
                  {scoreDetail.quantityScore >= 100 && scoreDetail.calorieRatio && scoreDetail.calorieRatio > 120 && " - 과식 주의!"}
                </p>
              </div>
              
              {/* 계산식 설명 */}
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-600">
                  <span className="font-bold text-blue-600">{scoreDetail.qualityScore}</span> (품질) 
                  × <span className="font-bold text-green-600">{((scoreDetail.quantityScore || 0) / 100).toFixed(2)}</span> (양) 
                  = <span className="font-bold text-slate-900">{scoreDetail.overallScore}점</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 뱃지 섹션 추가 */}
        <div className="mb-6">
          <BadgeShowcase badges={dummyBadges} variant="scoreDetail" />
        </div>

        {/* 카테고리별 점수 */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <h3 className="text-lg font-bold text-slate-900">영역별 점수</h3>
            <div className="relative group ml-2">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold cursor-help">
                ℹ
              </div>
              <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <p className="font-semibold mb-1">세부 평가 항목</p>
                <p className="text-gray-300">칼로리, 영양소, 다양성 등 개별 항목별 점수입니다. 이 점수들을 종합하여 오늘의 점수가 계산됩니다.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3 bg-blue-50 px-3 py-2 rounded-lg">
            💡 각 영역의 점수를 종합하여 <span className="font-semibold text-blue-700">오늘의 점수</span>가 계산됩니다
          </p>
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

      {isAuthenticated && <MobileNav />}
    </div>
  );
}
