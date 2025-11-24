'use client';

import Header from '@/components/Header';
import { useSession } from '@/contexts/SessionContext';

export default function MockPage() {
  const { isAuthenticated, userName, logout } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />

      {/* 메인 섹션 */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="flex justify-center">
          {/* 일러스트레이션만 표시 */}
          <div className="relative w-full max-w-4xl h-80 bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100">
            <div className="text-center">
              <div className="text-6xl mb-4">🏃‍♂️</div>
              <p className="text-slate-600 font-semibold text-lg">건강한 식단으로</p>
              <p className="text-slate-600 font-semibold text-lg">더 나은 내일을 만들어보세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">주요 기능</h2>
          <p className="text-slate-600 text-lg">5가지 핵심 기능으로 건강한 식생활을 관리하세요</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '📝', title: '음식 기록', color: 'from-blue-400 to-blue-600' },
            { icon: '🛒', title: '보유 식재료 입력', color: 'from-green-400 to-green-600' },
            { icon: '🍽️', title: '개인맞춤 식단 추천', color: 'from-orange-400 to-orange-600' },
            { icon: '🔍', title: '사용자 식단 레시피 검색', color: 'from-pink-400 to-pink-600' },
            { icon: '📊', title: '건강목표 & 리포트', color: 'from-purple-400 to-purple-600' },
          ].map((feature, index) => (
            <div key={index} className="group cursor-pointer">
              <div
                className={`h-64 bg-gradient-to-br ${feature.color} rounded-2xl p-8 text-white transform transition hover:scale-105 hover:shadow-2xl`}
              >
                <div className="h-full flex flex-col justify-between">
                  <div className="text-5xl">{feature.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">KCalculator - 건강한 식단 관리의 시작</p>
          <p className="text-slate-400 text-sm">© 2024 KCalculator. All rights reserved.</p>
          <p className="text-slate-500 text-xs mt-4">✨ 이 페이지는 이전 디자인 비교용 Mock 페이지입니다</p>
        </div>
      </footer>
    </div>
  );
}
