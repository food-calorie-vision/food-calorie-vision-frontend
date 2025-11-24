'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SessionContextType {
  isAuthenticated: boolean;
  checkSession: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // 세션 체크
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('세션 체크 실패:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, [API_URL]);

  // 세션 갱신
  const refreshSession = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await fetch(`${API_URL}/api/v1/auth/refresh-session`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('세션 갱신 실패:', error);
    }
  }, [API_URL, isAuthenticated]);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      setIsAuthenticated(false);
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
      // 로그인 페이지는 체크 안함
      if (pathname === '/' || pathname === '/login') {
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

  // 1분마다 세션 체크
  useEffect(() => {
    if (pathname === '/' || pathname === '/login') return;

    const interval = setInterval(async () => {
      const valid = await checkSession();
      if (!valid && isAuthenticated) {
        handleSessionExpired();
      }
    }, 60000); // 1분

    return () => clearInterval(interval);
  }, [pathname, checkSession, isAuthenticated, handleSessionExpired]);

  // 사용자 활동 시 세션 갱신
  useEffect(() => {
    if (pathname === '/' || pathname === '/login' || !isAuthenticated) return;

    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    let lastRefresh = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      // 30초마다 한 번만 갱신 (너무 자주 호출 방지)
      if (now - lastRefresh > 30000) {
        refreshSession();
        lastRefresh = now;
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [pathname, isAuthenticated, refreshSession]);

  // 로딩 중
  if (isChecking && pathname !== '/' && pathname !== '/login') {
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
    <SessionContext.Provider value={{ isAuthenticated, checkSession, refreshSession, logout }}>
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

