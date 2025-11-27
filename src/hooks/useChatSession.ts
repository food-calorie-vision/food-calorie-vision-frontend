"use client";

import { useState, useEffect } from 'react';

const SESSION_STORAGE_KEY = 'chat_session_id';

/**
 * 브라우저 네이티브 crypto.randomUUID()를 사용하여 UUID 생성
 * uuid 패키지 대신 브라우저 네이티브 API 사용 (Next.js 15 + Turbopack 호환)
 * 
 * UUID v4 형식: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * - 4: 버전 (항상 4)
 * - y: variant (8, 9, a, b 중 하나)
 */
const generateUUID = (): string => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') {
    // SSR 환경에서는 더미 값 반환 (실제로는 사용되지 않음)
    return '00000000-0000-4000-8000-000000000000';
  }

  // crypto.randomUUID() 사용 (최신 브라우저)
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    try {
      return window.crypto.randomUUID();
    } catch (error) {
      console.warn('crypto.randomUUID() 실패, 폴백 사용:', error);
    }
  }

  // 폴백: UUID v4 형식 생성 (crypto.randomUUID가 없는 경우)
  // RFC 4122 준수: 버전 4, variant 10
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    // x: 랜덤 16진수, y: variant (8, 9, a, b 중 하나)
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useChatSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined') {
      const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = generateUUID();
        sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
        setSessionId(newSessionId);
      }
    }
  }, []);

  const resetSession = () => {
    if (typeof window !== 'undefined') {
      const newSessionId = generateUUID();
      sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
      setSessionId(newSessionId);
      // 새로운 세션이 시작되었음을 알리는 메시지나 로직을 추가할 수 있습니다.
      console.log("New chat session started:", newSessionId);
    }
  };

  return { sessionId, resetSession };
};