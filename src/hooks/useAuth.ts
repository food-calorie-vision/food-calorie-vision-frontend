'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 인증 체크 훅
 * 페이지 로드 시 사용자 인증 상태를 확인하고,
 * 로그인되지 않은 경우 로그인 페이지로 리디렉션합니다.
 * 
 * @param enabled - 인증 체크를 활성화할지 여부 (기본값: true)
 */
export function useAuth(enabled: boolean = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const checkAuth = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
          credentials: 'include',
        });

        if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/login');
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        // 네트워크 에러 등의 경우 로그인 페이지로 이동하지 않음
      }
    };

    checkAuth();
  }, [enabled, router]);

  /**
   * API 응답의 인증 상태를 체크하는 함수
   * API 호출 후 401/403 응답이 온 경우 로그인 페이지로 리디렉션
   */
  const checkAuthAndRedirect = (response: Response): boolean => {
    if (response.status === 401 || response.status === 403) {
      alert('⚠️ 로그인이 만료되었습니다. 다시 로그인해주세요.');
      router.push('/login');
      return true;
    }
    return false;
  };

  return { checkAuthAndRedirect };
}

