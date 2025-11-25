'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SessionContextType {
  isAuthenticated: boolean;
  userName: string;
  sessionRemaining: number | null;
  checkSession: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [sessionRemaining, setSessionRemaining] = useState<number | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // 세션 체크
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        credentials: 'include',
      });
      const elapsed = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserName(data.nickname || data.username || '');
        setSessionRemaining(data.session_remaining || null);
        
        const minutes = data.session_remaining ? Math.floor(data.session_remaining / 60) : 0;
        const seconds = data.session_remaining ? data.session_remaining % 60 : 0;
        console.log(`✅ 세션 체크 성공 (${elapsed}ms) - User: ${data.nickname || data.username}, 남은시간: ${minutes}분 ${seconds}초`);
        return true;
      } else {
        setIsAuthenticated(false);
        setUserName('');
        setSessionRemaining(null);
        console.log(`❌ 세션 체크 실패 (${elapsed}ms) - Status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ 세션 체크 에러:', error);
      setIsAuthenticated(false);
      setUserName('');
      setSessionRemaining(null);
      return false;
    }
  }, [API_URL]);

  // 세션 갱신
  const refreshSession = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh-session`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // 갱신 후 즉시 남은 시간 업데이트
        setSessionRemaining(data.session_max_age);
        console.log(`🔄 세션 갱신 성공 - 새 유효시간: ${data.session_max_age}초 (즉시 반영)`);
      } else {
        console.error(`❌ 세션 갱신 실패 - Status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 세션 갱신 에러:', error);
    }
  }, [API_URL, isAuthenticated]);

  // 로그인
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log(`🔐 로그인 시도 - Email: ${email}`);
      
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ 로그인 성공 - User ID: ${data.user_id}`);
        setIsAuthenticated(true);
        
        // 사용자 정보 가져오기
        const userResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
          credentials: 'include',
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserName(userData.nickname || userData.username || '');
          console.log(`👤 사용자 정보 로드 완료 - ${userData.nickname || userData.username}`);
        } else {
          setUserName(data.username || email);
        }
        
        return true;
      } else {
        console.log(`❌ 로그인 실패 - ${data.message}`);
        alert(data.message || '이메일 또는 비밀번호가 올바르지 않습니다');
        return false;
      }
    } catch (error) {
      console.error('❌ 로그인 에러:', error);
      alert('로그인 중 오류가 발생했습니다.');
      return false;
    }
  }, [API_URL]);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      console.log('🚪 로그아웃 시도...');
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      console.log('✅ 로그아웃 성공');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
    } finally {
      setIsAuthenticated(false);
      setUserName('');
      setSessionRemaining(null);
      console.log('🔄 로그인 페이지로 이동');
      router.push('/');
    }
  }, [API_URL, router]);

  // 세션 만료 처리
  const handleSessionExpired = useCallback(() => {
    setIsAuthenticated(false);
    setShowExpiredModal(true);
  }, []);

  // 초기 세션 체크
  useEffect(() => {
    const initCheck = async () => {
      // 로그인/회원가입 페이지는 체크 안함
      if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
        setIsChecking(false);
        return;
      }

      const valid = await checkSession();
      if (!valid && pathname !== '/') {
        handleSessionExpired();
      }
      setIsChecking(false);
    };

    initCheck();
  }, [pathname, checkSession, handleSessionExpired]);

  // 10초마다 세션 체크 (테스트용 - 프로덕션에서는 60000으로 변경)
  useEffect(() => {
    if (pathname === '/' || pathname === '/login' || pathname === '/signup') return;

    console.log(`⏰ 세션 체크 타이머 시작 (10초마다)`);

    const interval = setInterval(async () => {
      console.log(`🔍 정기 세션 체크 실행...`);
      const valid = await checkSession();
      if (!valid && isAuthenticated) {
        console.log(`⚠️ 세션 만료 감지!`);
        handleSessionExpired();
      }
    }, 10000); // 10초 (테스트용)

    return () => {
      console.log(`⏰ 세션 체크 타이머 종료`);
      clearInterval(interval);
    };
  }, [pathname, checkSession, isAuthenticated, handleSessionExpired]);

  // 페이지 이동 시 세션 갱신
  useEffect(() => {
    if (pathname === '/' || pathname === '/login' || pathname === '/signup' || !isAuthenticated) return;
    
    console.log('🔀 페이지 이동 감지 - 세션 갱신:', pathname);
    const doRefresh = async () => {
      await refreshSession();
      // 갱신 후 세션 체크로 정확한 값 확인
      await checkSession();
    };
    doRefresh();
  }, [pathname, isAuthenticated, refreshSession, checkSession]);

  // 사용자 활동 시 세션 갱신
  useEffect(() => {
    if (pathname === '/' || pathname === '/login' || pathname === '/signup' || !isAuthenticated) return;

    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    let lastRefresh = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      // 10초마다 한 번만 갱신 (테스트용 - 프로덕션에서는 30000으로 변경)
      if (now - lastRefresh > 10000) {
        console.log('👆 사용자 활동 감지 - 세션 갱신 요청:', new Date().toLocaleTimeString());
        refreshSession();
        lastRefresh = now;
      }
    };

    console.log('🎯 활동 감지 리스너 등록:', events.join(', '));

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      console.log('🎯 활동 감지 리스너 해제');
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [pathname, isAuthenticated, refreshSession]);

  // 로딩 중
  if (isChecking && pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-medium">로그인 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ isAuthenticated, userName, sessionRemaining, checkSession, refreshSession, login, logout }}>
      {children}

      {/* 세션 만료 모달 */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">세션이 만료되었습니다</h3>
              <p className="text-slate-600 mb-6">다시 로그인해 주세요.</p>
              <button
                onClick={() => {
                  setShowExpiredModal(false);
                  router.push('/');
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
              >
                로그인 화면으로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

