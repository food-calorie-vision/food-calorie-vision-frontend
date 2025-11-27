'use client';

import { useState, useEffect } from 'react';
import { Award, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { translateHealthGoal } from '@/utils/healthGoalTranslator';
import { ScoreData } from '@/types';
import { API_BASE_URL } from '@/utils/api';
import { useSession } from '@/contexts/SessionContext';

interface MyScoreProps {
  userInfo?: any; // 사용자 정보
}

const MyScore = ({ userInfo }: MyScoreProps) => {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isCheckingAuth } = useSession();

  useEffect(() => {
    const fetchScoreData = async () => {
      try {
        // 대시보드 통계에서 평균 건강 점수 가져오기
        const response = await fetch(`${API_BASE_URL}/api/v1/meals/dashboard-stats`, {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('대시보드 통계:', result);
          
          if (result.success && result.data) {
            const avgScore = Math.round(result.data.avg_health_score);
            const previousScore = result.data.previous_day_score ? Math.round(result.data.previous_day_score) : null;
            const scoreChange = result.data.score_change !== null && result.data.score_change !== undefined 
              ? Math.round(result.data.score_change) 
              : null;
            
            setScoreData({
              todayScore: avgScore,
              previousScore: previousScore || 0,
              scoreChange: scoreChange || 0,
              feedback: avgScore >= 75 ? "훌륭한 식습관을 유지하고 있어요!" : 
                       avgScore >= 50 ? "좋은 식습관이에요. 조금만 더 노력해봐요!" :
                       "식습관 개선이 필요해요. 건강한 음식을 선택해보세요!",
              improvement: avgScore >= 75 ? "현재 패턴을 유지하세요!" :
                          avgScore >= 50 ? "채소와 단백질을 더 섭취해보세요." :
                          "가공식품을 줄이고 신선한 재료를 사용해보세요.",
            });
          } else {
            // 데이터 없음
            setScoreData({
              todayScore: 0,
              previousScore: 0,
              scoreChange: 0,
              feedback: "아직 오늘 식사 기록이 없어요",
              improvement: "식사를 기록해보세요!",
            });
          }
        } else {
          console.error('점수 조회 실패');
          setScoreData({
            todayScore: 0,
            previousScore: 0,
            scoreChange: 0,
            feedback: "아직 오늘 식사 기록이 없어요",
            improvement: "식사를 기록해보세요!",
          });
        }
      } catch (error) {
        console.error('점수 데이터를 가져오는데 실패했습니다:', error);
        setScoreData({
          todayScore: 0,
          previousScore: 0,
          scoreChange: 0,
          feedback: "점수를 불러올 수 없어요",
          improvement: "나중에 다시 시도해주세요",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isCheckingAuth) {
      return;
    }
    if (!isAuthenticated) {
      setLoading(false);
      setScoreData({
        todayScore: 0,
        previousScore: 0,
        scoreChange: 0,
        feedback: "로그인이 필요합니다",
        improvement: "로그인 후 나의 점수를 확인해보세요",
      });
      return;
    }

    fetchScoreData();
  }, [isAuthenticated, isCheckingAuth]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <Award className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">MY SCORE</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <Award className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">MY SCORE</h3>
        </div>
        <p className="text-gray-500">점수 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <Award className="w-5 h-5 text-green-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">MY SCORE</h3>
        
        {/* 툴팁 아이콘 */}
        <div className="relative group ml-2">
          <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold cursor-help">
            ℹ
          </div>
          <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <p className="font-semibold mb-1">오늘의 종합 점수</p>
            <p className="text-gray-300">모든 식사의 칼로리, 영양소, 다양성 등을 종합적으로 평가한 점수입니다.</p>
          </div>
        </div>
      </div>
      
      {/* 사용자 건강 목표 표시 */}
      {userInfo?.health_goal && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-center">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">목표:</span> {translateHealthGoal(userInfo.health_goal)}
          </p>
        </div>
      )}
      
      {/* 오늘의 점수 카드 */}
      <div className="bg-green-50 p-6 rounded-lg mb-4">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <h4 className="text-sm font-medium text-gray-600">오늘의 점수</h4>
            <div className="relative group ml-1">
              <div className="w-3.5 h-3.5 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-[10px] font-bold cursor-help">
                ℹ
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-5 w-56 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <p className="leading-relaxed">모든 식사의 종합 평가 점수입니다</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-green-600">{scoreData.todayScore}</span>
            <span className="text-2xl font-bold text-gray-400 ml-1">/100</span>
          </div>
        </div>
        
        {/* 데이터 없음 안내 */}
        {scoreData.todayScore === 0 && (
          <div className="text-center mb-4">
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              ⚠️ 오늘 식사 기록이 없어 점수를 계산할 수 없습니다
            </p>
          </div>
        )}
        
        {/* 점수 변화 (점수가 있고 전날 데이터가 있을 때만) */}
        {scoreData.todayScore > 0 && scoreData.previousScore > 0 && (
          <div className="flex items-center justify-center mb-4">
            {scoreData.scoreChange > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : scoreData.scoreChange < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            ) : (
              <TrendingUp className="w-4 h-4 text-gray-400 mr-1" />
            )}
            <span className={`text-sm ${scoreData.scoreChange > 0 ? 'text-green-600' : scoreData.scoreChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              전날 대비 ({scoreData.scoreChange > 0 ? '+' : ''}{scoreData.scoreChange}점)
            </span>
          </div>
        )}
        
        {/* 피드백 메시지 */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {scoreData.feedback}
          </p>
        </div>
        
        {/* 개선점 피드백 */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {scoreData.improvement}
          </p>
        </div>
        
        {/* 상세 점수 현황 버튼 */}
        <div className="text-center">
          <Link href="/score-detail">
            <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium">
              상세 점수 현황
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyScore;
