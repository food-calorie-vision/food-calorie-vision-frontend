import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 귀여운 404 이미지 */}
        <div className="mb-8">
          <div className="text-8xl mb-4">🍽️</div>
          <div className="text-6xl font-bold text-gray-900 mb-2">404</div>
          <h1 className="text-2xl font-semibold text-gray-700 mb-4">
            페이지를 찾을 수 없습니다
          </h1>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
          <p className="text-gray-600 mb-6 leading-relaxed">
            죄송해요, 요청하신 페이지가 없거나 이동되었을 수 있어요. 🙇‍♀️
            <br />
            <span className="text-green-600 font-medium">
              현재 페이지는 추후 업데이트 예정입니다.
            </span>
          </p>

          {/* 귀여운 아이콘들 */}
          <div className="flex justify-center gap-4 mb-6">
            <span className="text-4xl">🍎</span>
            <span className="text-4xl">🥗</span>
            <span className="text-4xl">🥕</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6">
            <p>
              💡 <strong>팁:</strong> 빠른 시일 내에 새로운 기능을 업데이트할
              예정이니 조금만 기다려주세요!
            </p>
          </div>
        </div>

        {/* 메인으로 돌아가기 버튼 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg hover:shadow-xl"
        >
          <span>🏠</span>
          <span>홈으로 돌아가기</span>
        </Link>

        {/* 유용한 링크들 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            대신 이런 페이지는 어떠세요?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              📊 대시보드
            </Link>
            <Link
              href="/recommend"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              🍳 레시피 추천
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              💬 문의하기
            </Link>
          </div>
        </div>

        {/* 드롭 애니메이션 효과를 위한 장식 */}
        <div className="mt-12 flex justify-center gap-2 opacity-50">
          <div className="animate-bounce" style={{ animationDelay: '0s' }}>
            🥑
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
            🥬
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
            🍊
          </div>
        </div>
      </div>
    </div>
  );
}

