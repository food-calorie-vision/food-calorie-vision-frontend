'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DailyCalorieData } from '@/types';

interface DailyCalorieChartProps {
  userInfo?: any; // 사용자 정보
}

const DailyCalorieChart = ({ userInfo }: DailyCalorieChartProps) => {
  const [data, setData] = useState<DailyCalorieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetCalories, setTargetCalories] = useState(2000); // 목표 칼로리

  // userInfo에서 권장 칼로리 설정
  useEffect(() => {
    if (userInfo?.recommended_calories) {
      setTargetCalories(userInfo.recommended_calories);
    }
  }, [userInfo]);

  useEffect(() => {
    const fetchCalorieData = async () => {
      try {
        // 백엔드에서 7일간의 칼로리 데이터 가져오기
        const response = await fetch('http://localhost:8000/api/v1/meal-records/weekly-calories?days=7', {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });
        
        if (response.ok) {
          const weeklyData = await response.json();
          console.log('주간 칼로리 데이터:', weeklyData);
          
          // 데이터가 있으면 설정, 없으면 빈 배열
          setData(weeklyData.length > 0 ? weeklyData : [
            { date: '데이터', calories: 0 }
          ]);
        } else {
          console.error('칼로리 데이터 조회 실패');
          // 기본 빈 데이터
          setData([{ date: '데이터 없음', calories: 0 }]);
        }
      } catch (error) {
        console.error('칼로리 데이터를 가져오는데 실패했습니다:', error);
        // 에러 시 빈 데이터
        setData([{ date: '에러', calories: 0 }]);
      } finally {
        setLoading(false);
      }
    };

    fetchCalorieData();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-orange-600">
            칼로리: {payload[0].value.toLocaleString()} kcal
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <Activity className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">일일 칼로리 섭취량</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <Activity className="w-5 h-5 text-green-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">일일 칼로리 섭취량</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              domain={[1600, 2300]}
              ticks={[1700, 1800, 1900, 2000, 2100, 2200]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 목표 칼로리 참조선 */}
            <ReferenceLine 
              y={targetCalories} 
              stroke="#10b981" 
              strokeDasharray="5 5" 
              strokeWidth={2}
            />
            
            {/* 칼로리 라인 */}
            <Line 
              type="monotone" 
              dataKey="calories" 
              stroke="#f97316" 
              strokeWidth={3}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 범례 */}
      <div className="flex items-center justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-orange-500 mr-2"></div>
          <span className="text-sm text-gray-600">실제 섭취량</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-500 border-dashed border-t-2 mr-2"></div>
          <span className="text-sm text-gray-600">목표 칼로리 ({targetCalories} kcal)</span>
        </div>
      </div>
    </div>
  );
};

export default DailyCalorieChart;
