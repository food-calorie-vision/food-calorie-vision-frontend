'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/utils/api';

type MostEatenFood = {
  food_id: string;
  food_name: string;
  eat_count: number;
};

const FrequentFoodsList = () => {
  const [mostEatenFoods, setMostEatenFoods] = useState<MostEatenFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMostEatenFoods = async () => {
      try {
        // 자주 먹은 음식 TOP 4 API 호출
        const response = await fetch(`${API_BASE_URL}/api/v1/meals/most-eaten?limit=4`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ 자주 먹은 음식:', result);
          
          if (result.success && result.data) {
            setMostEatenFoods(result.data);
          } else {
            setMostEatenFoods([]);
          }
        } else {
          console.error('❌ 자주 먹은 음식 조회 실패');
          setMostEatenFoods([]);
        }
      } catch (error) {
        console.error('❌ 자주 먹은 음식 데이터를 가져오는데 실패했습니다:', error);
        setMostEatenFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMostEatenFoods();
  }, []);

  // 횟수에 따른 이모지 생성
  const getEatEmoji = (count: number) => {
    if (count >= 10) return '🔥🔥🔥';
    if (count >= 7) return '🔥🔥';
    if (count >= 5) return '🔥';
    if (count >= 3) return '!!';
    return '!';
  };

  // 순위 이모지
  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '🏵️';  //🏵️🎖️🪙
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">🍽️</span>
          <h3 className="text-lg font-bold text-gray-900">자주 먹은 음식 TOP 4</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl shadow-md border border-green-100">
      <div className="flex items-center mb-5">
        <span className="text-2xl mr-2">🍽️</span>
        <h3 className="text-xl font-bold text-gray-900">자주 먹은 음식 TOP 4</h3>
      </div>
      
      {mostEatenFoods.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl">
          <p className="text-gray-500 text-lg mb-2">아직 식사 기록이 없습니다.</p>
          <p className="text-sm text-gray-400">음식을 추가하면 자주 먹는 음식을 확인할 수 있습니다!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mostEatenFoods.map((food, index) => (
            <div 
              key={`${food.food_id}-${index}`}
              className="p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-green-300 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{getRankEmoji(index)}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{food.food_name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">{food.eat_count}</span>
                  <span className="text-sm font-medium text-gray-600">번 먹음</span>
                  <span className="text-lg">{getEatEmoji(food.eat_count)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FrequentFoodsList;
