'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UserHealthInfo } from '@/types';

const HealthStatus = () => {
  const [healthInfo, setHealthInfo] = useState<UserHealthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealthInfo = async () => {
      try {
        const response = await fetch('/api/health-info');
        const data = await response.json();
        setHealthInfo(data);
      } catch (error) {
        console.error('건강 정보를 가져오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthInfo();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <Heart className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">건강 상태</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!healthInfo) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <Heart className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">건강 상태</h3>
        </div>
        <p className="text-gray-500">건강 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <Heart className="w-5 h-5 text-red-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">건강 상태</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start">
          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <span className="text-sm text-gray-600">건강 목표: </span>
            <span className="text-sm font-medium text-gray-900">{healthInfo.goal}</span>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <span className="text-sm text-gray-600">현재 질환: </span>
            <span className="text-sm font-medium text-gray-900">
              {healthInfo.diseases.join(', ')}
            </span>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <span className="text-sm text-gray-600">추천 섭취 열량: </span>
            <span className="text-sm font-medium text-gray-900">
              {healthInfo.recommendedCalories.toLocaleString()} kcal
            </span>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <span className="text-sm text-gray-600">활동 수준: </span>
            <span className="text-sm font-medium text-gray-900">{healthInfo.activityLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthStatus;
