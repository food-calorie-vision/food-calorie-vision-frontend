'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DailyCalorieData } from '@/types';
import { API_BASE_URL } from '@/utils/api';
import { useSession } from '@/contexts/SessionContext';

interface DailyCalorieChartProps {
  userInfo?: any; // 사용자 정보
}

const DailyCalorieChart = ({ userInfo }: DailyCalorieChartProps) => {
  const [data, setData] = useState<DailyCalorieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetCalories, setTargetCalories] = useState(2000); // 목표 칼로리
  const [yAxisTicks, setYAxisTicks] = useState<number[]>([]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 2400]);
  const { isAuthenticated, isCheckingAuth } = useSession();

  // userInfo에서 권장 칼로리 설정
  useEffect(() => {
    if (userInfo?.recommended_calories) {
      setTargetCalories(userInfo.recommended_calories);
    }
  }, [userInfo]);

  // 데이터 변경 시 Y축 범위와 눈금 계산
  useEffect(() => {
    if (data.length === 0) return;

    const maxCalories = Math.max(...data.map(d => d.calories), targetCalories);
    const minCalories = Math.min(...data.map(d => d.calories));

    // 100kcal 단위로 올림/내림
    const yMax = Math.ceil(maxCalories / 100) * 100 + 200; // 여유 200kcal
    const yMin = Math.floor(minCalories / 100) * 100 - 100; // 여유 100kcal
    
    // 100kcal 단위로 ticks 생성
    const ticks = [];
    for (let i = Math.max(0, yMin); i <= yMax; i += 100) {
      ticks.push(i);
    }

    setYAxisDomain([Math.max(0, yMin), yMax]);
    setYAxisTicks(ticks);
  }, [data, targetCalories]);

  useEffect(() => {
    const fetchCalorieData = async () => {
      try {
        const apiEndpoint = API_BASE_URL;
        
        // 대시보드 통계에서 일일 칼로리 데이터 가져오기
        const response = await fetch(`${apiEndpoint}/api/v1/meals/dashboard-stats`, {
          method: 'GET',
          credentials: 'include', // 세션 쿠키 포함
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('칼로리 데이터:', result);
          
          if (result.success && result.data && result.data.daily_calories && result.data.daily_calories.length > 0) {
            // 실제 최근 7일 칼로리 데이터 사용
            setData(result.data.daily_calories);
          } else {
            // 데이터 없음 - 빈 차트 표시
            const today = new Date();
            const emptyData = [];
            
            for (let i = 6; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
              
              emptyData.push({
                date: dateStr,
                calories: 0
              });
            }
            
            setData(emptyData);
          }
        } else {
          console.error('칼로리 데이터 조회 실패');
          setData([{ date: '데이터 없음', calories: 0 }]);
        }
      } catch (error) {
        console.error('칼로리 데이터를 가져오는데 실패했습니다:', error);
        setData([{ date: '에러', calories: 0 }]);
      } finally {
        setLoading(false);
      }
    };

    if (isCheckingAuth) {
      return;
    }
    if (!isAuthenticated) {
      setLoading(false);
      setData([{ date: '로그인이 필요합니다', calories: 0 }]);
      return;
    }

    fetchCalorieData();
  }, [isAuthenticated, isCheckingAuth]);

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
              domain={yAxisDomain}
              ticks={yAxisTicks}
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
