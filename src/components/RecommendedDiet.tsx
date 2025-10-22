'use client';

import { useState, useEffect } from 'react';
import { RecommendedFood } from '@/types';

const RecommendedDiet = () => {
  const [recommendedFoods, setRecommendedFoods] = useState<RecommendedFood[]>([]);
  const [selectedFood, setSelectedFood] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/recommendations');
        const data = await response.json();
        setRecommendedFoods(data);
      } catch (error) {
        console.error('추천 음식을 가져오는데 실패했습니다:', error);
        // 에러 시 기본 데이터 사용
        setRecommendedFoods([
          {
            id: 1,
            name: '연어 덮밥',
            description: '사용자 건강 목표에 따른 추천 메뉴'
          },
          {
            id: 2,
            name: '제육볶음',
            description: '사용자 건강 목표에 따른 추천 메뉴'
          },
          {
            id: 3,
            name: '고등어 구이 정식',
            description: '사용자 건강 목표에 따른 추천 메뉴'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleFoodSelect = (foodId: number) => {
    setSelectedFood(foodId);
    // 여기서 선택된 음식에 대한 추가 정보를 보여주거나 다른 액션을 수행할 수 있습니다
    console.log(`선택된 음식: ${recommendedFoods.find(food => food.id === foodId)?.name}`);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">추천 식단</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
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
      <h3 className="text-lg font-semibold text-gray-900 mb-6">추천 식단</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendedFoods.map((food) => (
          <div
            key={food.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
              selectedFood === food.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => handleFoodSelect(food.id)}
          >
            <h4 className="font-medium text-gray-900 mb-2">{food.name}</h4>
            <p className="text-sm text-gray-600">{food.description}</p>
            
            {food.calories && (
              <p className="text-xs text-gray-500 mt-1">
                칼로리: {food.calories} kcal
              </p>
            )}
            
            {selectedFood === food.id && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors">
                  선택하기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedFood && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">
              {recommendedFoods.find(food => food.id === selectedFood)?.name}
            </span>
            을(를) 선택하셨습니다. 이 음식은 귀하의 건강 목표와 현재 섭취 현황을 고려하여 추천되었습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedDiet;
