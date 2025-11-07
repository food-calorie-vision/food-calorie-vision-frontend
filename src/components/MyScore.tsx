'use client';

import { useState, useEffect } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { translateHealthGoal } from '@/utils/healthGoalTranslator';
import { ScoreData } from '@/types';

interface MyScoreProps {
  userInfo?: any; // 사용자 정보
}

const MyScore = ({ userInfo }: MyScoreProps) => {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScoreData = async () => {
      try {
        // 백엔드에서 오늘의 점수 가져오기
        const response = await fetch('http://localhost:8000/api/v1/scores/today', {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('오늘의 점수:', data);
          
          setScoreData({
            todayScore: data.todayScore,
            previousScore: data.previousScore,
            scoreChange: data.scoreChange,
            feedback: data.feedback,
            improvement: data.improvement,
          });
        } else {
          console.error('점수 조회 실패');
          // 기본값
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

    fetchScoreData();
  }, []);

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
          <h4 className="text-sm font-medium text-gray-600 mb-2">오늘의 점수</h4>
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
        
        {/* 점수 변화 (점수가 있을 때만) */}
        {scoreData.todayScore > 0 && (
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-600">
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
