import Header from '@/components/Header';
import NutrientRatioChart from '@/components/NutrientRatioChart';
import HealthStatus from '@/components/HealthStatus';
import CalorieIntakeChart from '@/components/CalorieIntakeChart';
import RecommendedDiet from '@/components/RecommendedDiet';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 섹션: 영양 성분 비율과 건강 상태 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <NutrientRatioChart />
          <HealthStatus />
        </div>
        
        {/* 중간 섹션: 칼로리 섭취 현황 */}
        <div className="mb-8">
          <CalorieIntakeChart />
        </div>
        
        {/* 하단 섹션: 추천 식단 */}
        <div>
          <RecommendedDiet />
        </div>
      </main>
    </div>
  );
}
