'use client';

import Link from 'next/link';

interface MobileHeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  handleLogout?: () => void;
  showLogout?: boolean;
}

const MobileHeader = ({ isLoggedIn, userName, handleLogout, showLogout = true }: MobileHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-lg font-bold text-gray-900">KCalculator</span>
          </Link>

          {/* 로그인/사용자 정보 */}
          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                {userName && (
                  <span className="text-sm font-medium text-gray-700 hidden xs:inline">
                    {userName}님
                  </span>
                )}
                {showLogout && handleLogout && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg active:bg-red-600 transition-colors"
                  >
                    로그아웃
                  </button>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg active:bg-gray-50"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg active:bg-green-600"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;

