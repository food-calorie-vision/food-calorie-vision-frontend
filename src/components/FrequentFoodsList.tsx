'use client';

import { useState, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { FrequentFood } from '@/types';

const FrequentFoodsList = () => {
  const [frequentFoods, setFrequentFoods] = useState<FrequentFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFrequentFoods = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // 대시보드 통계에서 자주 먹는 음식 가져오기
        const response = await fetch(`${apiEndpoint}/api/v1/meals/dashboard-stats`, {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('자주 먹는 음식:', result);
          
          if (result.success && result.data && result.data.frequent_foods) {
            // frequent_foods 형식: [{food_name: "밥", count: 5}, ...]
            // FrequentFood 형식으로 변환 (임시 데이터)
            const foods = result.data.frequent_foods.map((item: any, index: number) => ({
              id: index + 1,
              name: item.food_name,
              calories: 300, // TODO: 실제 칼로리 데이터 조회
              nutrients: {
                carbs: 50, // TODO: 실제 영양소 데이터
                protein: 15,
                fat: 10,
              }
            }));
            setFrequentFoods(foods.slice(0, 4)); // 최대 4개만 표시
          } else {
            setFrequentFoods([]);
          }
        } else {
          console.error('자주 먹는 음식 조회 실패');
          setFrequentFoods([]);
        }
      } catch (error) {
        console.error('자주 먹는 음식 데이터를 가져오는데 실패했습니다:', error);
        setFrequentFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFrequentFoods();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <CheckSquare className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">자주 먹는 음식 리스트</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <CheckSquare className="w-5 h-5 text-green-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">자주 먹는 음식 리스트</h3>
      </div>
      
      {frequentFoods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">아직 식사 기록이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-2">음식을 추가하면 자주 먹는 음식을 확인할 수 있습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frequentFoods.map((food) => (
            <div key={food.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">{food.name} ({food.calories} kcal)</h4>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-20">탄수화물:</span>
                  <span className="text-sm font-medium text-gray-900">{food.nutrients.carbs}g</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-20">단백질:</span>
                  <span className="text-sm font-medium text-gray-900">{food.nutrients.protein}g</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 w-20">지방:</span>
                  <span className="text-sm font-medium text-gray-900">{food.nutrients.fat}g</span>
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
