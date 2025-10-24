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
        // 실제로는 API에서 자주 먹는 음식 데이터를 가져옴
        // const response = await fetch('/api/frequent-foods');
        // const data = await response.json();
        
        // 임시 목업 데이터
        const mockData: FrequentFood[] = [
          {
            id: 1,
            name: "계란후라이",
            calories: 150,
            nutrients: {
              carbs: 1,
              protein: 13,
              fat: 11
            }
          },
          {
            id: 2,
            name: "김치찌개",
            calories: 200,
            nutrients: {
              carbs: 15,
              protein: 12,
              fat: 8
            }
          },
          {
            id: 3,
            name: "불고기",
            calories: 300,
            nutrients: {
              carbs: 8,
              protein: 25,
              fat: 18
            }
          },
          {
            id: 4,
            name: "비빔밥",
            calories: 400,
            nutrients: {
              carbs: 50,
              protein: 15,
              fat: 12
            }
          }
        ];
        
        setFrequentFoods(mockData);
      } catch (error) {
        console.error('자주 먹는 음식 데이터를 가져오는데 실패했습니다:', error);
        // 에러 시 기본 데이터 사용
        setFrequentFoods([
          {
            id: 1,
            name: "계란후라이",
            calories: 150,
            nutrients: {
              carbs: 1,
              protein: 13,
              fat: 11
            }
          },
          {
            id: 2,
            name: "김치찌개",
            calories: 200,
            nutrients: {
              carbs: 15,
              protein: 12,
              fat: 8
            }
          },
          {
            id: 3,
            name: "불고기",
            calories: 300,
            nutrients: {
              carbs: 8,
              protein: 25,
              fat: 18
            }
          },
          {
            id: 4,
            name: "비빔밥",
            calories: 400,
            nutrients: {
              carbs: 50,
              protein: 15,
              fat: 12
            }
          }
        ]);
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
    </div>
  );
};

export default FrequentFoodsList;
