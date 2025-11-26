"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { ArrowLeft, Eye } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { API_BASE_URL } from '@/utils/api';

type Announcement = {
  announcement_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  view_count: number;
};

export default function AnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { isAuthenticated, userName, logout } = useSession();
  
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherAnnouncements, setOtherAnnouncements] = useState<Announcement[]>([]);
  const fetchedIds = useRef<Set<number>>(new Set()); // 이미 조회수 증가된 ID 추적

  useEffect(() => {
    if (id) {
      // 즉시 이전 데이터 초기화
      setAnnouncement(null);
      setOtherAnnouncements([]);
      setLoading(true);
      
      // 데이터 로드
      fetchAnnouncement();
      
      // 페이지 이동 시 스크롤 맨 위로
      window.scrollTo({ top: 0, behavior: 'instant' }); // smooth -> instant로 변경
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const announcementId = Number(id);
      
      // 이미 조회수를 증가시킨 공지사항인지 체크 (세션 내에서만 유지)
      const alreadyViewed = fetchedIds.current.has(announcementId);
      
      if (!alreadyViewed) {
        // 조회수 증가 API 호출
        const res = await fetch(`${API_BASE_URL}/api/v1/customer-service/announcements/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAnnouncement(data);
          // 조회한 ID 추가
          fetchedIds.current.add(announcementId);
        } else {
          alert('공지사항을 불러올 수 없습니다.');
          router.push('/contact');
          return;
        }
      } else {
        // 이미 조회한 경우 조회수 증가 없이 목록에서 가져오기
        const res = await fetch(`${API_BASE_URL}/api/v1/customer-service/announcements?limit=20`);
        if (res.ok) {
          const data = await res.json();
          const found = data.announcements.find((a: Announcement) => a.announcement_id === announcementId);
          if (found) {
            setAnnouncement(found);
          } else {
            alert('공지사항을 찾을 수 없습니다.');
            router.push('/contact');
            return;
          }
        }
      }
      
      // 다른 공지사항도 가져오기
      fetchOtherAnnouncements();
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      alert('공지사항을 불러올 수 없습니다.');
      router.push('/contact');
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/customer-service/announcements?limit=5`);
      if (res.ok) {
        const data = await res.json();
        // 현재 공지사항 제외
        const filtered = data.announcements.filter((a: Announcement) => a.announcement_id !== Number(id));
        setOtherAnnouncements(filtered.slice(0, 4)); // 최대 4개만
      }
    } catch (error) {
      console.error('다른 공지사항 조회 실패:', error);
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
        <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <div className="mb-6 h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
          
          {/* 스켈레톤 UI */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse"></div>
            <div className="border-t border-slate-100 pt-4 space-y-2">
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

  if (!announcement) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
        <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-slate-600">공지사항을 찾을 수 없습니다.</p>
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
          href="/contact"
          className="inline-flex items-center text-slate-600 active:text-slate-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          고객센터로 돌아가기
        </Link>

        {/* 공지사항 내용 - 페이드인 애니메이션 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-fadeIn">
          {/* 공지사항 배지 */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              📢 공지사항
            </span>
          </div>
          
          {/* 제목 */}
          <h1 className="text-xl font-bold text-slate-900 mb-3">
            {announcement.title}
          </h1>
          
          {/* 메타 정보 */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
            <span>{formatDate(announcement.created_at)}</span>
            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              조회 {announcement.view_count}
            </span>
          </div>
          
          {/* 본문 */}
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {announcement.content}
          </div>
        </div>

        {/* 다른 공지사항 */}
        {otherAnnouncements.length > 0 && (
          <div className="mt-6 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>📌</span>
              다른 공지사항
            </h2>
            <div className="space-y-2">
              {otherAnnouncements.map((item, index) => (
                <Link
                  key={item.announcement_id}
                  href={`/contact/announcement/${item.announcement_id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-3 hover:border-green-300 hover:shadow-md transition-all duration-200 animate-fadeIn"
                  style={{ animationDelay: `${0.15 + index * 0.05}s`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-slate-900 flex-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <span className="text-xs text-green-600 font-semibold whitespace-nowrap">
                      {formatDate(item.created_at).substring(5)} {/* MM.DD만 표시 */}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 목록으로 버튼 */}
        <Link 
          href="/contact"
          className="block w-full mt-6 py-3 bg-green-500 text-white rounded-lg font-bold text-base text-center active:bg-green-600 transition shadow-md"
        >
          목록으로 돌아가기
        </Link>
      </div>

      {isAuthenticated && <MobileNav />}
      
      {/* 페이드인 애니메이션 CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
