'use client';

import { useState, useEffect } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ScoreData } from '@/types';

const MyScore = () => {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScoreData = async () => {
      try {
        // 실제로는 API에서 점수 데이터를 가져옴
        // const response = await fetch('/api/score-data');
        // const data = await response.json();
        
        // 임시 목업 데이터
        const mockData: ScoreData = {
          todayScore: 94,
          previousScore: 82,
          scoreChange: 12,
          feedback: "와! 오늘은 정말 균형있게 드셨군요! 곧 원하시는 목표를 이루실 수 있을거에요",
          improvement: "다만, 단백질 섭취량이 부족해요 다음 식사는 고기류 위주로 해보시는건 어떨까요?"
        };
        
        setScoreData(mockData);
      } catch (error) {
        console.error('점수 데이터를 가져오는데 실패했습니다:', error);
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
      
      {/* 오늘의 점수 카드 */}
      <div className="bg-green-50 p-6 rounded-lg mb-4">
        <div className="text-center mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">오늘의 점수</h4>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-green-600">{scoreData.todayScore}</span>
            <span className="text-2xl font-bold text-gray-400 ml-1">/100</span>
          </div>
        </div>
        
        {/* 점수 변화 */}
        <div className="flex items-center justify-center mb-4">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm text-gray-600">
            전날 대비 ({scoreData.scoreChange}점 향상)
          </span>
        </div>
        
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
