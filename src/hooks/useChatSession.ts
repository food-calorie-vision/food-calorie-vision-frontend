"use client";

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SESSION_STORAGE_KEY = 'chat_session_id';

export const useChatSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined') {
      const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else {
        const newSessionId = uuidv4();
        sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
        setSessionId(newSessionId);
      }
    }
  }, []);

  const resetSession = () => {
    if (typeof window !== 'undefined') {
      const newSessionId = uuidv4();
      sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
      setSessionId(newSessionId);
      // 새로운 세션이 시작되었음을 알리는 메시지나 로직을 추가할 수 있습니다.
      console.log("New chat session started:", newSessionId);
    }
  };

  return { sessionId, resetSession };
};