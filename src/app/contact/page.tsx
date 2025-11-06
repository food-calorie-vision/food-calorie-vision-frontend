"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import Link from 'next/link';
import { MessageCircle, Bell, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedFaq, setSelectedFaq] = useState(0);

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

  const notices = [
    { id: 1, date: '10.24', title: '업데이트 안내' },
    { id: 2, date: '10.15', title: '서비스 점검 안내' },
    { id: 3, date: '10.03', title: '이벤트 당첨자 발표' },
    { id: 4, date: '09.27', title: '앱 UI/UX 개편 안내' },
    { id: 5, date: '09.13', title: '추석 연휴 고객지원 안내' },
  ];

  const faqItems = [
    { 
      label: '서비스 이용', 
      emoji: '💡',
      question: 'KCalculator는 어떤 서비스인가요?',
      answer: '사용자가 섭취한 음식을 기록하고 칼로리와 영양소를 분석해주는 건강 관리 서비스입니다. AI 기반 음식 인식과 맞춤형 식단 추천을 제공합니다.'
    },
    { 
      label: '음식 기록', 
      emoji: '🍽️',
      question: '음식 기록은 어떻게 하나요?',
      answer: '식사일기 메뉴에서 사진을 촬영하거나 업로드하면 AI가 자동으로 음식을 분석합니다. 직접 검색하여 수동으로 추가할 수도 있습니다.'
    },
    { 
      label: '식단 추천', 
      emoji: '🥗',
      question: '식단 추천은 어떻게 받나요?',
      answer: '레시피 추천 메뉴에서 원하는 음식이나 식재료를 입력하면, 건강 정보를 기반으로 맞춤형 레시피와 식단을 추천해드립니다.'
    },
    { 
      label: '개인정보', 
      emoji: '🔒',
      question: '개인정보는 안전한가요?',
      answer: '모든 개인정보는 암호화되어 안전하게 보관되며, 사용자 동의 없이 제3자에게 제공되지 않습니다. 개인정보 처리방침을 참고해주세요.'
    },
    { 
      label: '기타 문의', 
      emoji: '❓',
      question: '서비스 이용 중 문제가 생겼어요',
      answer: '문의하기를 통해 상세한 내용을 전달해주시면 빠르게 확인 후 답변드리겠습니다. 운영시간은 평일 09:00~18:00입니다.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-5">
        {/* 고객센터 헤더 */}
        <div className="text-center mb-1">
          <div className="text-3xl mb-2">💬</div>
          <h1 className="text-xl font-bold text-slate-900 mb-0.5">고객센터</h1>
          <p className="text-xs text-slate-600">궁금하신 사항을 도와드립니다</p>
        </div>

        {/* 문의하기 버튼 - 더 동글동글하게 */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link 
            href="/contact/form"
            className="bg-gradient-to-br from-green-400 to-green-500 text-white rounded-2xl p-3 shadow active:shadow-md transition flex flex-col items-center gap-1.5"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-bold text-xs">문의하기</span>
          </Link>
          
          <Link 
            href="/contact/list"
            className="bg-white border-2 border-green-400 text-green-600 rounded-2xl p-3 shadow-sm active:shadow transition flex flex-col items-center gap-1.5"
          >
            <Bell className="w-5 h-5" />
            <span className="font-bold text-xs">내 문의 이력</span>
          </Link>
        </div>

        {/* 운영 시간 */}
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl px-3 py-2 text-center">
          <p className="text-xs text-blue-700">
            ⏰ 운영시간 <span className="font-bold">09:00~18:00</span> <span className="text-blue-500">(주말/공휴일 제외)</span>
          </p>
        </div>

        {/* 공지사항 - 작고 귀엽게 */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-3">
          <h2 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
            <div className="bg-green-100 rounded-full p-1">
              <Bell className="w-3.5 h-3.5 text-green-600" />
            </div>
            공지사항
          </h2>
          <div className="space-y-1.5">
            {notices.slice(0, 4).map((n) => (
              <Link 
                key={n.id}
                href="#"
                className="flex items-center justify-between py-1.5 px-2 bg-white rounded-xl border border-slate-100 active:border-green-300 active:bg-green-50 transition"
              >
                <span className="text-xs font-medium text-slate-700">{n.title}</span>
                <span className="text-xs font-bold text-green-500">{n.date}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ - 작고 귀엽게 */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-3">
          <h2 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
            <div className="bg-purple-100 rounded-full p-1">
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            </div>
            자주 묻는 질문
          </h2>
          
          {/* FAQ 카테고리 버튼 - 3개/2개 중앙 정렬 */}
          <div className="space-y-1.5 mb-3">
            {/* 첫 번째 줄 - 3개 */}
            <div className="flex justify-center gap-1.5">
              {faqItems.slice(0, 3).map((item, index) => (
                <button 
                  key={item.label}
                  onClick={() => setSelectedFaq(index)}
                  className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition shadow-sm ${
                    selectedFaq === index
                      ? 'bg-green-500 border-2 border-green-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 active:bg-green-50 active:border-green-400'
                  }`}
                >
                  <span className="mr-1">{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>
            {/* 두 번째 줄 - 2개 */}
            <div className="flex justify-center gap-1.5">
              {faqItems.slice(3, 5).map((item, index) => (
                <button 
                  key={item.label}
                  onClick={() => setSelectedFaq(index + 3)}
                  className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition shadow-sm ${
                    selectedFaq === index + 3
                      ? 'bg-green-500 border-2 border-green-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 active:bg-green-50 active:border-green-400'
                  }`}
                >
                  <span className="mr-1">{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ 내용 - 선택된 FAQ 표시 */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-2.5 border border-slate-200 transition-all">
            <div className="font-semibold text-xs text-slate-900 mb-0.5">
              Q. {faqItems[selectedFaq].question}
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              A. {faqItems[selectedFaq].answer}
            </div>
          </div>
        </div>
      </div>

      {isLoggedIn && <MobileNav />}
    </div>
  );
}
