"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { ArrowLeft, MessageSquare, CheckCircle, Clock } from 'lucide-react';

const DUMMY = [
  { id: 1, subject: '로그인 오류 문의', date: '2024-10-25', type: '회원가입/로그인', status: '답변완료' },
  { id: 2, subject: '맞춤식단 추천 관련 건의', date: '2024-10-23', type: '마이페이지', status: '답변 처리중' },
  { id: 3, subject: '식단 등록이 안돼요', date: '2024-10-22', type: '오늘의 식사일기', status: '답변완료' },
  { id: 4, subject: '개인정보 변경 관련', date: '2024-10-18', type: '기타 문의', status: '답변완료' },
  { id: 5, subject: '레시피 검색 결과 문의', date: '2024-10-15', type: '레시피 검색', status: '답변 처리중' },
];

export default function ContactListPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expire = sessionStorage.getItem('login_expire');
      const user = sessionStorage.getItem('user_name');
      
      if (expire && Date.now() < Number(expire)) {
        setIsLoggedIn(true);
        setUserName(user || '');
      }
    }
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('login_expire');
      sessionStorage.removeItem('user_name');
      alert('로그아웃되었습니다.');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* 뒤로가기 */}
        <Link 
          href="/contact"
          className="inline-flex items-center text-slate-600 active:text-slate-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          고객센터로 돌아가기
        </Link>

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-6 h-6 text-green-500" />
            <h1 className="text-2xl font-bold text-slate-900">내 문의 이력</h1>
          </div>
          <p className="text-sm text-slate-600">총 {DUMMY.length}건의 문의가 있습니다</p>
        </div>

        {/* 문의 목록 */}
        <div className="space-y-3 mb-6">
          {DUMMY.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 active:shadow-md transition"
            >
              {/* 상단: 제목과 상태 */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 text-sm flex-1 pr-2">
                  {item.subject}
                </h3>
                {item.status === '답변완료' ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200 whitespace-nowrap">
                    <CheckCircle className="w-3 h-3" />
                    답변완료
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    처리중
                  </span>
                )}
              </div>

              {/* 하단: 정보 */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">{item.type}</span>
                </span>
                <span className="text-slate-400">•</span>
                <span>{item.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 문의하기 버튼 */}
        <Link 
          href="/contact/form"
          className="block w-full py-3 bg-green-500 text-white rounded-lg font-bold text-base text-center active:bg-green-600 transition shadow-md"
        >
          + 추가 문의하기
        </Link>

        {/* 안내 */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 leading-relaxed">
            • 문의 내역은 최근 6개월간 보관됩니다.<br />
            • 답변 완료 시 등록하신 이메일로 알림을 보내드립니다.
          </p>
        </div>
      </div>

      {isLoggedIn && <MobileNav />}
    </div>
  );
}
