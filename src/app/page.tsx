'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 처리
  const handleLogin = () => {
    if (id && password) {
      setIsLoggedIn(true);
      alert('로그인 성공!');
    } else {
      alert('아이디와 비밀번호를 입력해주세요.');
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsLoggedIn(false);
    setId('');
    setPassword('');
    alert('로그아웃되었습니다.');
  };

  const features = [
    {
      title: '음식 기록',
      description: '매일 섭취한 음식을 기록하고 관리하세요',
      icon: '📝',
      color: 'from-blue-400 to-blue-600',
    },
    {
      title: '보유 식재료 입력',
      description: '냉장고에 있는 식재료를 등록하세요',
      icon: '🛒',
      color: 'from-green-400 to-green-600',
    },
    {
      title: '개인맞춤 식단 추천',
      description: '당신의 건강에 맞는 식단을 추천해드립니다',
      icon: '🍽️',
      color: 'from-orange-400 to-orange-600',
    },
    {
      title: '사용자 식단 레시피 검색',
      description: '다양한 레시피를 검색하고 발견하세요',
      icon: '🔍',
      color: 'from-pink-400 to-pink-600',
    },
    {
      title: '건강목표 & 리포트',
      description: '건강 목표를 설정하고 진행 상황을 추적하세요',
      icon: '📊',
      color: 'from-purple-400 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* KCalculator 로고 - 클릭시 홈으로 이동 */}
            <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="text-xl font-bold text-slate-800">KCalculator</span>
            </Link>

            {/* 로그인 후에만 메뉴 표시 */}
            {isLoggedIn && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition font-medium">
                  대시보드
                </Link>
                <Link href="/customized-diet" className="text-slate-600 hover:text-slate-900 transition font-medium">
                  맞춤식단
                </Link>
                <Link href="/meal-diary/analysis" className="text-slate-600 hover:text-slate-900 transition font-medium">
                  오늘의 식사 일기
                </Link>
                <Link href="/recipe" className="text-slate-600 hover:text-slate-900 transition font-medium">
                  레시피 검색
                </Link>
                <Link href="/mypage" className="text-slate-600 hover:text-slate-900 transition font-medium">
                  마이페이지
                </Link>
                <Link href="/contact" className="text-slate-600 hover:text-slate-900 transition font-medium">
                  문의사항
                </Link>
              </div>
            )}
          </div>

          {/* 로그인 상태에 따른 버튼 표시 */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="text-slate-700 font-medium">환영합니다, {id}님!</span>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button className="px-6 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition font-medium">
                  로그인
                </button>
                <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium">
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 메인 섹션 */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* 로그인 폼 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 h-fit">
            <div className="space-y-6">
              <div>
                <label className="block text-slate-700 font-semibold mb-2">ID</label>
                <input
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
              >
                로그인
              </button>

              <div className="flex items-center justify-between text-sm">
                <Link href="#" className="text-green-600 hover:text-green-700 font-medium">
                  비밀번호 찾기
                </Link>
                <Link href="/signup" className="text-green-600 hover:text-green-700 font-medium">
                  회원가입하기 →
                </Link>
              </div>
            </div>
          </div>

          {/* 일러스트레이션 */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-full h-80 bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🏃‍♂️</div>
                <p className="text-slate-600 font-semibold">건강한 식단으로</p>
                <p className="text-slate-600 font-semibold">더 나은 내일을 만들어보세요</p>
              </div>
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
          {features.map((feature, index) => (
            <div
              key={index}
              className="group cursor-pointer"
              onClick={() => console.log(`${feature.title} 클릭됨`)}
            >
              <div
                className={`h-64 bg-gradient-to-br ${feature.color} rounded-2xl p-8 text-white transform transition hover:scale-105 hover:shadow-2xl`}
              >
                <div className="h-full flex flex-col justify-between">
                  <div className="text-5xl">{feature.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-white/90 text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 클라이언트 섹션 */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Our Clients</h2>
            <p className="text-slate-600">이런 분들에게 추천됩니다</p>
          </div>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-20 h-20 bg-white rounded-lg shadow-md flex items-center justify-center text-3xl hover:shadow-lg transition"
              >
                {i === 1 && '👨‍⚕️'}
                {i === 2 && '🏋️'}
                {i === 3 && '📱'}
                {i === 4 && '🥗'}
                {i === 5 && '💪'}
                {i === 6 && '🎯'}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">이것은 권장이 아닌 필수인 운동</h2>
          <p className="text-slate-600">헬시 라이프</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '👥', title: '커뮤니티', desc: '함께 건강을 추구하는 사람들과 연결되세요' },
            { icon: '🏢', title: '기업/기관', desc: '회사와 기관 단위의 건강 프로그램을 운영하세요' },
            { icon: '🔗', title: '연동', desc: '다른 건강 앱과 쉽게 연동하세요' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">KCalculator - 건강한 식단 관리의 시작</p>
          <p className="text-slate-400 text-sm">© 2024 KCalculator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
