'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Apple } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NutrientData, UserIntakeData } from '@/types';

const NutrientRatioChart = () => {
  const [data, setData] = useState<NutrientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntakeData = async () => {
      try {
        const response = await fetch('/api/intake-data');
        const intakeData: UserIntakeData = await response.json();
        
        // 섭취 데이터를 차트용 데이터로 변환
        const chartData: NutrientData[] = [
          { name: '나트륨', value: intakeData.nutrients.sodium, color: '#ef4444' },
          { name: '탄수화물', value: intakeData.nutrients.carbs, color: '#22c55e' },
          { name: '단백질', value: intakeData.nutrients.protein, color: '#3b82f6' },
          { name: '지방', value: intakeData.nutrients.fat, color: '#f97316' },
          { name: '당류', value: intakeData.nutrients.sugar, color: '#eab308' },
        ];
        
        setData(chartData);
      } catch (_error) {
        console.error('섭취 데이터를 가져오는데 실패했습니다:', _error);
        // 에러 시 기본 데이터 사용
        setData([
          { name: '나트륨', value: 1200, color: '#ef4444' },
          { name: '탄수화물', value: 180, color: '#22c55e' },
          { name: '단백질', value: 85, color: '#3b82f6' },
          { name: '지방', value: 45, color: '#f97316' },
          { name: '당류', value: 30, color: '#eab308' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchIntakeData();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <Apple className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">영양 성분 비율</h3>
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
        <Apple className="w-5 h-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">영양 성분 비율</h3>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center">
        <div className="w-full lg:w-2/3">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full lg:w-1/3 mt-4 lg:mt-0">
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutrientRatioChart;
