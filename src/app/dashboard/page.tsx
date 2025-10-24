import Header from '@/components/Header';
import MyScore from '@/components/MyScore';
import DailyCalorieChart from '@/components/DailyCalorieChart';
import FrequentFoodsList from '@/components/FrequentFoodsList';
import FloatingActionButtons from '@/components/FloatingActionButtons';

export const metadata = {
  title: 'KCalculator - MY PAGE',
  description: '개인 맞춤 건강 관리 대시보드',
};

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">MY PAGE</h1>
        </div>

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: MY SCORE */}
          <div className="lg:col-span-1">
            <MyScore />
          </div>
          
          {/* 중앙: 일일 칼로리 섭취량 */}
          <div className="lg:col-span-2">
            <DailyCalorieChart />
          </div>
        </div>
        
        {/* 하단: 자주 먹는 음식 리스트 */}
        <div className="mt-8">
          <FrequentFoodsList />
        </div>
      </main>
      
      {/* 우측 플로팅 액션 버튼 */}
      <FloatingActionButtons />
    </div>
  );
}
