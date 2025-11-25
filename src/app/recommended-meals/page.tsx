'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import { MealRecommendation } from '@/types';
import { useSession } from '@/contexts/SessionContext';

export default function RecommendedMealsPage() {
  const router = useRouter();
  const { isAuthenticated, userName, logout } = useSession();
  const [selectedMeal, setSelectedMeal] = useState<MealRecommendation | null>(null);
  const [mealRecommendations] = useState<MealRecommendation[]>([
    {
      id: 1,
      name: '연어 덮밥',
      calories: 450,
      description: '사용자 건강 목표에 따른 추천 메뉴',
      isSelected: false,
      nutrients: {
        protein: 35,
        carbs: 45,
        fat: 12,
        sodium: 800
      }
    },
    {
      id: 2,
      name: '제육볶음',
      calories: 380,
      description: '사용자 건강 목표에 따른 추천 메뉴',
      isSelected: false,
      nutrients: {
        protein: 28,
        carbs: 35,
        fat: 15,
        sodium: 1200
      }
    },
    {
      id: 3,
      name: '고등어 구이 정식',
      calories: 420,
      description: '사용자 건강 목표에 따른 추천 메뉴',
      isSelected: false,
      nutrients: {
        protein: 32,
        carbs: 40,
        fat: 18,
        sodium: 900
      }
    }
  ]);

  const handleMealSelect = async (meal: MealRecommendation) => {
    setSelectedMeal(meal);
    
    try {
      // 백엔드에 식단 선택 정보 전송
      const response = await fetch('/api/meal-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealId: meal.id,
          userId: 'user'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('식단 선택 완료:', result.data);
      } else {
        console.error('식단 선택 실패:', result.error);
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">추천 식단</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mealRecommendations.map((meal) => (
            <div
              key={meal.id}
              className={`bg-white p-6 rounded-lg shadow-md cursor-pointer transition-all duration-200 ${
                selectedMeal?.id === meal.id ? 'border-2 border-green-500' : 'border border-gray-200 hover:shadow-lg'
              }`}
              onClick={() => handleMealSelect(meal)}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{meal.name}</h2>
              <p className="text-gray-600 text-sm mb-3">{meal.description}</p>
              <p className="text-gray-700 font-medium">{meal.calories} kcal</p>
              {selectedMeal?.id === meal.id && (
                <p className="mt-2 text-green-600 font-medium">선택되었습니다!</p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">음식 챗봇</h2>
          <ChatInterface selectedMeal={selectedMeal} />
        </div>
      </main>
    </div>
  );
}
