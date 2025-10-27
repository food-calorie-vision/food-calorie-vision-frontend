'use client';

import { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { ChatMessage, MealRecommendation } from '@/types';

interface ChatInterfaceProps {
  selectedMeal: MealRecommendation | null;
}

export default function ChatInterface({ selectedMeal }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedMeal) {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: `${selectedMeal.name}을(를) 선택하셨군요! 이 음식에 대해 궁금한 점이 있으신가요?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }
  }, [selectedMeal]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      imageUrl: attachedFiles.length > 0 ? URL.createObjectURL(attachedFiles[0]) : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      // 실제 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          selectedMeal,
          imageData: attachedFiles.length > 0 ? await fileToBase64(attachedFiles[0]) : null
        }),
      });

      const result = await response.json();

      if (result.success) {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: result.data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error(result.error || 'API 호출 실패');
      }
    } catch (error) {
      console.error('Chat API error:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일을 Base64로 변환하는 헬퍼 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles([e.target.files[0]]);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg border border-gray-200">
      {/* 메시지 표시 영역 */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-4 ${
              msg.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                msg.type === 'user'
                  ? 'bg-green-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Attached" className="mt-2 max-w-full h-auto rounded-md" />
              )}
              <span className="block text-xs mt-1 opacity-75">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[70%] p-3 rounded-lg shadow-sm bg-gray-200 text-gray-800 rounded-bl-none">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 파일 미리보기 및 입력 영역 */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {attachedFiles.length > 0 && (
          <div className="flex items-center justify-between p-2 mb-2 bg-gray-100 rounded-md">
            <div className="flex items-center">
              <ImageIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">{attachedFiles[0].name}</span>
            </div>
            <button onClick={handleRemoveFile} className="text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileAttach}
            accept="image/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:text-green-600 transition-colors"
            title="파일 첨부"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            disabled={isLoading}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
