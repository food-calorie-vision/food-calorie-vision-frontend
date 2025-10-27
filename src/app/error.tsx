'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 에러 이미지 */}
        <div className="mb-8">
          <div className="text-8xl mb-4">⚠️</div>
          <div className="text-4xl font-bold text-red-600 mb-2">
            오류가 발생했습니다
          </div>
          <h1 className="text-xl font-semibold text-gray-700 mb-4">
            서비스 이용에 문제가 생겼어요
          </h1>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-red-200">
          <p className="text-gray-600 mb-6 leading-relaxed">
            죄송해요, 예상치 못한 오류가 발생했어요. 😢
            <br />
            <span className="text-gray-400 text-sm">
              문제가 계속되면 잠시 후 다시 시도해주세요.
            </span>
          </p>

          {/* 재시도 및 메인으로 버튼 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              🔄 다시 시도
            </button>
            <Link
              href="/"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              🏠 홈으로 돌아가기
            </Link>
          </div>

          {/* 건의사항 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              문제가 지속된다면 고객센터로 문의해주세요
            </p>
            <Link
              href="/contact"
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              💬 문의하기 →
            </Link>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p>
            💡 <strong>알아두세요:</strong> 이 페이지는 일시적인 오류이며,
            <br />
            서비스 개선을 위해 최선을 다하고 있어요!
          </p>
        </div>
      </div>
    </div>
  );
}

