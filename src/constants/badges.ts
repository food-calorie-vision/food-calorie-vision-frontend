import { Badge } from '@/types/report';

export const BADGE_ICON_MAP: Record<string, { icon: string; alt: string }> = {
  'badge1': { icon: '/balance-master.png', alt: '균형의 대가' },
  'badge2': { icon: '/calorie-hunter.png', alt: '칼로리 헌터' },
  'badge3': { icon: '/hydration-champion.png', alt: '수분 챔피언' },
  'badge4': { icon: '/sodium-guardian.png', alt: '소금 수호자' },
  'badge5': { icon: '/vegetable-explorer.png', alt: '채소 탐험가' },
};

export const orderBadges = (badges: Badge[]): Badge[] => {
  // Simple sorting logic for now: achieved first, then pending, then locked.
  // Within each status, sort by title.
  const statusOrder = { achieved: 1, pending: 2, locked: 3 };
  return [...badges].sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.title.localeCompare(b.title);
  });
};
