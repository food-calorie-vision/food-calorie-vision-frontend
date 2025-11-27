'use client';

import Image from 'next/image';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Lock, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

// 'Badge' 타입을 food-calorie-vision-frontend/src/types/report.ts 또는 적절한 위치에서 가져옵니다.
// 임시로 타입을 정의합니다.
export interface Badge {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: 'achieved' | 'pending' | 'locked';
  achievedAt: string | null;
}

interface BadgeShowcaseProps {
  badges: Badge[];
  variant?: 'dashboard' | 'scoreDetail';
}

const badgeStatusConfig = {
  achieved: {
    Icon: CheckCircle,
    label: '달성',
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    glowColor: 'shadow-[0_0_20px_4px_rgba(5,150,105,0.3)]',
  },
  pending: {
    Icon: Clock,
    label: '검증 중',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    glowColor: '',
  },
  locked: {
    Icon: Lock,
    label: '잠김',
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-200',
    glowColor: '',
  },
};

// 뱃지 순서: 달성 > 검증 중 > 잠김
const orderBadges = (badges: Badge[]): Badge[] => {
  const statusOrder = { achieved: 0, pending: 1, locked: 2 };
  return [...badges].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
};

const BadgeShowcase = ({ badges = [], variant = 'dashboard' }: BadgeShowcaseProps) => {
  const orderedBadges = useMemo(() => orderBadges(badges), [badges]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const CARD_WIDTH = 140; // 카드 너비 (w-[140px])
  const CARD_GAP = 16;   // 뱃지 카드 간격 (gap-4)

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const canScrollLeft = el.scrollLeft > 5;
      const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 5;
      if (
        scrollState.canScrollLeft !== canScrollLeft ||
        scrollState.canScrollRight !== canScrollRight
      ) {
        setScrollState({ canScrollLeft, canScrollRight });
      }
    }
  }, [scrollState]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const check = () => setTimeout(checkScrollability, 100);
      check();
      el.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check);
      const mutationObserver = new MutationObserver(check);
      mutationObserver.observe(el, { childList: true });

      return () => {
        el.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
        mutationObserver.disconnect();
      };
    }
  }, [checkScrollability, badges]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = (CARD_WIDTH + CARD_GAP) * 2;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (variant !== 'scoreDetail') {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-500">
        뱃지를 표시할 수 없습니다. (scoreDetail 전용)
      </div>
    );
  }

  const hideScrollbarStyle = `
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `;

  return (
    <div className="w-full">
      <style>{hideScrollbarStyle}</style>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900">내 뱃지 컬렉션</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleScroll('left')}
            disabled={!scrollState.canScrollLeft}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 flex items-center justify-center transition-all"
            aria-label="스크롤 왼쪽"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!scrollState.canScrollRight}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 flex items-center justify-center transition-all"
            aria-label="스크롤 오른쪽"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div ref={scrollContainerRef} className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
          {orderedBadges.map((badge) => {
            const isLocked = badge.status === 'locked';
            const isAchieved = badge.status === 'achieved';
            const config = badgeStatusConfig[badge.status];

            return (
              <div
                key={badge.id}
                className={`snap-start flex-shrink-0 w-[140px] h-[180px] rounded-2xl border bg-white
                  p-4 flex flex-col justify-center items-center gap-4
                  ${isLocked ? 'border-dashed border-slate-300' : 'border-slate-200 shadow-md'}
                  ${isAchieved ? config.glowColor : ''}
                `}
              >
                <div className={`relative w-24 h-24 ${isLocked ? 'opacity-40 grayscale' : ''}`}>
                  <Image
                    src={badge.icon}
                    alt={badge.title}
                    fill
                    className={`object-contain`}
                    priority
                  />
                </div>
                <div
                  className={`w-full flex items-center justify-center gap-2 text-sm font-bold
                    px-3 py-1.5 rounded-full ${config.bgColor} ${config.iconColor}`}
                >
                  <config.Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BadgeShowcase;