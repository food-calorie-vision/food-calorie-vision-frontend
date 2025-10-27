export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
      <div className="text-center">
        {/* 로딩 애니메이션 */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
          <div className="absolute inset-4 flex items-center justify-center">
            <span className="text-3xl">🍽️</span>
          </div>
        </div>

        {/* 텍스트 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">로딩 중...</h2>
        <p className="text-gray-600 mb-8">잠시만 기다려주세요</p>

        {/* 진행바 */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>

        {/* 장식 요소 */}
        <div className="mt-8 flex justify-center gap-3 opacity-50">
          <div className="animate-bounce" style={{ animationDelay: '0s', animationDuration: '1.5s' }}>
            🥦
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}>
            🥕
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}>
            🥑
          </div>
        </div>
      </div>
    </div>
  );
}

