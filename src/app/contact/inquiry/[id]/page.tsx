"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { ArrowLeft, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

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
  response?: string | null;
  responded_at?: string | null;
};

export default function InquiryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { isAuthenticated, userName, logout } = useSession();
  
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);

  // 문의 조회
  useEffect(() => {
    if (id && isAuthenticated) {
      fetchInquiry();
    }
  }, [id, isAuthenticated]);

  const fetchInquiry = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/customer-service/inquiries/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInquiry(data);
      } else {
        alert('문의를 불러올 수 없습니다.');
        router.push('/contact/list');
      }
    } catch (error) {
      console.error('문의 조회 실패:', error);
      alert('문의를 불러올 수 없습니다.');
      router.push('/contact/list');
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'completed') return '답변완료';
    if (status === 'in_progress') return '처리중';
    return '답변 대기';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
        <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <div className="mb-6 h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
          
          {/* 스켈레톤 UI */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse"></div>
              <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-4/6 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        {isAuthenticated && <MobileNav />}
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
        <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-slate-600">문의를 찾을 수 없습니다.</p>
        </div>
        {isAuthenticated && <MobileNav />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
      
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* 뒤로가기 */}
        <Link 
          href="/contact/list"
          className="inline-flex items-center text-slate-600 active:text-slate-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          목록으로 돌아가기
        </Link>

        {/* 문의 내용 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
          {/* 상태 배지 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {inquiry.inquiry_type}
            </span>
            {inquiry.status === 'completed' ? (
              <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle className="w-3 h-3" />
                답변완료
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <Clock className="w-3 h-3" />
                {getStatusDisplay(inquiry.status)}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-bold text-slate-900 mb-3">
            {inquiry.subject}
          </h1>
          
          {/* 메타 정보 */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
            <span>{formatDate(inquiry.created_at)}</span>
            <span className="text-slate-400">•</span>
            <span>{inquiry.email}</span>
          </div>
          
          {/* 본문 */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">문의 내용</span>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {inquiry.content}
            </div>
          </div>
        </div>

        {/* 답변 */}
        {inquiry.response ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-base font-bold text-green-900">답변</span>
              {inquiry.responded_at && (
                <span className="text-xs text-green-600 ml-auto">
                  {formatDate(inquiry.responded_at)}
                </span>
              )}
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {inquiry.response}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-800 mb-1">답변 대기 중입니다</p>
            <p className="text-xs text-blue-600">
              영업일 기준 1~2일 내에 이메일로 답변드립니다.
            </p>
          </div>
        )}

        {/* 목록으로 버튼 */}
        <Link 
          href="/contact/list"
          className="block w-full mt-4 py-3 bg-green-500 text-white rounded-lg font-bold text-base text-center active:bg-green-600 transition shadow-md"
        >
          목록으로 돌아가기
        </Link>
      </div>

      {isAuthenticated && <MobileNav />}
    </div>
  );
}

