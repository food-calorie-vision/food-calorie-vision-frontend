"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { ArrowLeft, MessageSquare, CheckCircle, Clock } from 'lucide-react';

type Inquiry = {
  inquiry_id: number;
  subject: string;
  inquiry_type: string;
  status: string;
  created_at: string;
  user_id?: number;
  nickname: string;
  email: string;
  content: string;
  response?: string;
  responded_at?: string;
};

export default function ContactListPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expire = sessionStorage.getItem('login_expire');
      const user = sessionStorage.getItem('user_name');
      const userIdStr = sessionStorage.getItem('user_id');
      
      if (expire && Date.now() < Number(expire)) {
        setIsLoggedIn(true);
        setUserName(user || '');
        // user_id 우선순위: sessionStorage > 테스트용 1
        if (userIdStr) {
          setUserId(parseInt(userIdStr));
        } else {
          // 테스트용: sessionStorage에 없으면 user_id = 1 사용
          setUserId(1);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchInquiries();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchInquiries = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/customer-service/inquiries?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error('문의 이력 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // 세션 만료 체크
  useEffect(() => {
    const sessionCheckInterval = setInterval(() => {
      const expire = sessionStorage.getItem('login_expire');
      if (expire && Date.now() >= Number(expire)) {
        setIsLoggedIn(false);
        setUserName('');
        sessionStorage.removeItem('login_expire');
        sessionStorage.removeItem('user_name');
        sessionStorage.removeItem('user_id');
        alert('오래 활동하지 않아 자동 로그아웃되었습니다.\n다시 로그인해주세요.');
        router.push('/');
      }
    }, 10000);

    return () => clearInterval(sessionCheckInterval);
  }, [router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'completed') return '답변완료';
    if (status === 'in_progress') return '처리중';
    return '답변 대기';
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
          <p className="text-sm text-slate-600">
            {loading ? '로딩 중...' : `총 ${inquiries.length}건의 문의가 있습니다`}
          </p>
        </div>

        {/* 문의 목록 */}
        <div className="space-y-3 mb-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : inquiries.length > 0 ? (
            inquiries.map((item) => (
              <Link
                key={item.inquiry_id}
                href={`/contact/inquiry/${item.inquiry_id}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-200 p-4 active:shadow-md transition"
              >
                {/* 상단: 제목과 상태 */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm flex-1 pr-2">
                    {item.subject}
                  </h3>
                  {item.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200 whitespace-nowrap">
                      <CheckCircle className="w-3 h-3" />
                      답변완료
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {getStatusDisplay(item.status)}
                    </span>
                  )}
                </div>

                {/* 하단: 정보 */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-600">{item.inquiry_type}</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500">
              문의 이력이 없습니다.
            </div>
          )}
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
