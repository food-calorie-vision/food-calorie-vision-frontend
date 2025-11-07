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
        // 백엔드에서 자주 먹는 음식 데이터 가져오기
        const response = await fetch('http://localhost:8000/api/v1/meal-records/frequent-foods?limit=4', {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });
        
        if (response.ok) {
          const foods = await response.json();
          console.log('자주 먹는 음식:', foods);
          setFrequentFoods(foods);
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
