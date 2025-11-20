"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';

const typeOptions = [
  '회원가입/로그인', '오늘의 식사일기', '레시피 검색', '마이페이지', '기타 문의'
];

export default function ContactFormPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(typeOptions[0]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 로그인 상태 확인 (API 기반)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user_id) {
            setIsLoggedIn(true);
            setUserName(data.nickname || data.username);
            setNickname(data.nickname || data.username);
            setUserId(data.user_id);
          } else {
            alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            router.push('/');
          }
        } else if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname || !email || !subject || !content) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/customer-service/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          nickname,
          email,
          inquiry_type: type,
          subject,
          content,
        }),
      });
      
      if (res.ok) {
        setDone(true);
      } else {
        alert('문의 제출에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('문의 제출 실패:', error);
      alert('문의 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
        <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
        
        <div className="max-w-md mx-auto px-4 py-20 pb-24">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-green-200">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">문의가 제출되었습니다</h2>
              <p className="text-sm text-green-600">빠른 시일 내에 이메일로 답변드립니다.</p>
            </div>
            
            <Link 
              href="/contact"
              className="inline-block w-full py-3 bg-green-500 text-white rounded-lg font-bold text-base active:bg-green-600 transition shadow-md"
            >
              고객센터로 돌아가기
            </Link>
          </div>
        </div>

        {isLoggedIn && <MobileNav />}
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900 mb-1">문의하기</h1>
          <p className="text-sm text-slate-600">궁금하신 사항을 상세히 작성해주세요</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="닉네임을 입력해주세요"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="이메일을 입력해주세요"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* 문의 유형 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              문의 유형 <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              {typeOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 문의 제목 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              문의 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="문의 제목을 입력해주세요"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* 문의 내용 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              문의 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              placeholder="내용을 상세히 입력해 주세요 :)"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-lg font-bold text-base transition shadow-md flex items-center justify-center gap-2 ${
              submitting 
                ? 'bg-slate-400 text-white cursor-not-allowed' 
                : 'bg-green-500 text-white active:bg-green-600'
            }`}
          >
            <Send className="w-4 h-4" />
            {submitting ? '제출 중...' : '문의 제출하기'}
          </button>
        </form>

        {/* 안내 */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 leading-relaxed">
            • 문의 주신 내용은 영업일 기준 1~2일 내에 이메일로 답변드립니다.<br />
            • 운영시간: 09:00~18:00 (주말/공휴일 제외)
          </p>
        </div>
      </div>

      {isLoggedIn && <MobileNav />}
    </div>
  );
}
