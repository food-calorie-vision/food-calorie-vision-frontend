'use client';

import Link from 'next/link';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '../components/MobileHeader';
import MobileNav from '../components/MobileNav';

// 로그인 상태를 공유할 Context (이메일 기반)
const AuthContext = createContext<{
  isLoggedIn: boolean;
  userName: string;
  handleLogin: (email: string, password: string) => void;
  handleLogout: () => void;
}>({
  isLoggedIn: false,
  userName: '',
  handleLogin: () => {},
  handleLogout: () => {},
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // 페이지 로드 시 세션 확인
  useEffect(() => {
    const expire = sessionStorage.getItem('login_expire');
    const user = sessionStorage.getItem('user_name');
    
    if (expire && Date.now() < Number(expire)) {
      setIsLoggedIn(true);
      setUserName(user || '');
    }
  }, []);


  // 로그인 처리 (이메일 기반, 백엔드 API 연동)
  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 세션 쿠키 포함
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const expireTime = Date.now() + 10 * 60 * 1000; // 10분 (테스트용)
        sessionStorage.setItem('login_expire', expireTime.toString());
        sessionStorage.setItem('user_id', data.user_id); // BIGINT user_id 저장
        
        // 사용자 정보 가져오기 (닉네임 확인)
        try {
          const userResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
            method: 'GET',
            credentials: 'include',
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const displayName = userData.nickname || userData.username;
            sessionStorage.setItem('user_name', displayName);
            setUserName(displayName);
          } else {
            // 사용자 정보 가져오기 실패 시 username 사용
            sessionStorage.setItem('user_name', data.username || email);
            setUserName(data.username || email);
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          sessionStorage.setItem('user_name', data.username || email);
          setUserName(data.username || email);
        }
        
        setIsLoggedIn(true);
      } else {
        alert(data.message || '이메일 또는 비밀번호가 올바르지 않습니다');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    // sessionStorage 완전히 정리
    sessionStorage.removeItem('login_expire');
    sessionStorage.removeItem('user_name');
    sessionStorage.removeItem('user_id');
    alert('로그아웃되었습니다.');
    // 로그인 페이지로 이동
    window.location.href = '/';
  };

  const refreshSession = () => {
    const expire = sessionStorage.getItem('login_expire');
    if (expire && Date.now() < Number(expire)) {
      const newExpireTime = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem('login_expire', newExpireTime.toString());
    }
  };

  useEffect(() => {
    const handleRefreshSession = () => {
      refreshSession();
    };

    if (isLoggedIn) {
      window.addEventListener('mousemove', handleRefreshSession);
      window.addEventListener('keydown', handleRefreshSession);
      window.addEventListener('scroll', handleRefreshSession);
      window.addEventListener('click', handleRefreshSession);

      const sessionCheckInterval = setInterval(() => {
        const expire = sessionStorage.getItem('login_expire');
        if (expire && Date.now() >= Number(expire)) {
          setIsLoggedIn(false);
          setUserName('');
          sessionStorage.removeItem('login_expire');
          sessionStorage.removeItem('user_name');
          sessionStorage.removeItem('user_id');
          alert('오래 활동하지 않아 자동 로그아웃되었습니다.\n다시 로그인해주세요.');
          window.location.href = '/';
        }
      }, 10000);

      return () => {
        window.removeEventListener('mousemove', handleRefreshSession);
        window.removeEventListener('keydown', handleRefreshSession);
        window.removeEventListener('scroll', handleRefreshSession);
        window.removeEventListener('click', handleRefreshSession);
        clearInterval(sessionCheckInterval);
      };
    }

  }, [isLoggedIn]);



  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthProvider>
      <HomeContent email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
    </AuthProvider>
  );
}

function HomeContent({
  email,
  setEmail,
  password,
  setPassword,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  const { isLoggedIn, userName, handleLogin, handleLogout } = useContext(AuthContext);
  const router = useRouter();

  const onLoginClick = async () => {
    await handleLogin(email, password);
    // handleLogin이 성공하면 isLoggedIn이 true가 되므로
    // useEffect에서 리다이렉트 처리하거나 여기서 직접 처리
    const expire = sessionStorage.getItem('login_expire');
    if (expire && Date.now() < Number(expire)) {
      router.push('/dashboard');
    }
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} hideAuthButtons={true} />

      {/* 메인 섹션 - 모바일 최적화 */}
      <section className="max-w-md mx-auto px-4 py-8">
        <div className="space-y-8">
          {!isLoggedIn ? (
            <>
              {/* 로그인 폼 - 이메일 기반 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 h-fit">
                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">이메일</label>
                    <input
                      type="email"
                      placeholder="이메일을 입력하세요"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onLoginClick();
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">비밀번호</label>
                    <input
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onLoginClick();
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    />
                  </div>

                  <button
                    onClick={onLoginClick}
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
            </>
          ) : (
            // 로그인 후: 이미지 표시
            <div className="md:col-span-2 flex justify-center">
              <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                <img
                  src="/image1.png"
                  alt="건강한 식단"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 주요 기능 섹션 - 모바일 최적화 */}
      <section className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">주요 기능</h2>
          <p className="text-slate-600 text-sm">건강한 식생활을 위한 핵심 기능</p>
        </div>

        <div className="space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group cursor-pointer"
              onClick={() => console.log(`${feature.title} 클릭됨`)}
            >
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  {/* 아이콘 - 동그란 배경에 색상 */}
                  <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
                    {feature.icon}
                  </div>
                  
                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 mb-0.5">{feature.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
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

      {/* 특징 섹션 - 모바일 최적화 */}
      <section className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">함께 만들어가는 건강한 습관</h2>
          <p className="text-slate-600 text-sm">당신의 건강한 변화를 응원합니다</p>
        </div>
        <div className="space-y-3">
          {[
            { icon: '👥', title: '커뮤니티', desc: '함께 건강을 추구하는 사람들과 연결되세요' },
            { icon: '🏢', title: '기업/기관', desc: '회사와 기관 단위의 건강 프로그램을 운영하세요' },
            { icon: '🔗', title: '연동', desc: '다른 건강 앱과 쉽게 연동하세요' },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 mb-0.5">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      {/* 푸터 - 모바일 최적화 */}
      <footer className="bg-slate-900 text-white py-8 pb-20">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="mb-2 text-sm">KCalculator - 건강한 식단 관리의 시작</p>
          <p className="text-slate-400 text-xs">© 2024 KCalculator. All rights reserved.</p>
        </div>
      </footer>

      {/* 모바일 하단 네비게이션 */}
      {isLoggedIn && <MobileNav />}
    </div>
  );
}
