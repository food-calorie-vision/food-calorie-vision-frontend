'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CalorieData, UserIntakeData } from '@/types';

const CalorieIntakeChart = () => {
  const [data, setData] = useState<CalorieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntakeData = async () => {
      try {
        const response = await fetch('/api/intake-data');
        const intakeData: UserIntakeData = await response.json();
        
        // 섭취 데이터를 차트용 데이터로 변환
        const chartData: CalorieData[] = [
          { name: '섭취', value: intakeData.totalCalories },
          { name: '목표', value: intakeData.targetCalories },
        ];
        
        setData(chartData);
      } catch (_error) {
        console.error('섭취 데이터를 가져오는데 실패했습니다:', _error);
        // 에러 시 기본 데이터 사용
        setData([
          { name: '섭취', value: 1850 },
          { name: '목표', value: 2000 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchIntakeData();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            {payload[0].value.toLocaleString()} kcal
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
          <Zap className="w-5 h-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">칼로리 섭취 현황</h3>
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
        <Zap className="w-5 h-5 text-green-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">칼로리 섭취 현황</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 14, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 14, fill: '#6b7280' }}
              domain={[0, Math.max(...data.map(d => d.value)) + 200]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CalorieIntakeChart;
