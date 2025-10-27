'use client';

import { useState } from 'react';
import { Plus, Utensils, ShoppingCart, ChefHat, Search, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const FloatingActionButtons = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttons = [
    {
      id: 'diet',
      icon: Utensils,
      label: '식단 관리',
      href: '/dashboard',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'shopping',
      icon: ShoppingCart,
      label: '장보기',
      href: '/shopping',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'recipe',
      icon: ChefHat,
      label: '레시피',
      href: '/recipe',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'search',
      icon: Search,
      label: '검색',
      href: '/search',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: '분석',
      href: '/analytics',
      color: 'bg-red-500 hover:bg-red-600'
    }
  ];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {/* 확장된 버튼들 - 위쪽으로 배치 */}
      <div className={`absolute right-0 bottom-16 transition-all duration-300 ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {buttons.map((button, index) => {
          const Icon = button.icon;
          return (
            <div
              key={button.id}
              className="mb-3 flex items-center justify-end"
              style={{
                transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
              }}
            >
              {/* 라벨 */}
              <div className={`mr-3 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}>
                {button.label}
              </div>
              
              {/* 버튼 */}
              <Link href={button.href}>
                <button
                  className={`w-12 h-12 ${button.color} text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110`}
                  onClick={() => setIsExpanded(false)}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 메인 플로팅 버튼 */}
      <button
        onClick={toggleExpanded}
        className={`w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isExpanded ? 'rotate-45' : ''
        }`}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 배경 오버레이 제거 - 대시보드가 보이도록 함 */}
    </div>
  );
};

export default FloatingActionButtons;
