'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { API_BASE_URL } from '@/utils/api';

type MealRecord = {
  history_id: number;
  user_id: number;
  food_id: string;
  food_name: string;
  consumed_at: string;
  portion_size_g: number;
  calories: number;
  health_score: number | null;
  food_grade: string | null;
  meal_type: string;
};

type ViewMode = 'calendar' | 'list';
type ListFilter = 'today' | 'week' | 'month' | 'all';

// 식사 유형 한글 변환
const getMealTypeKr = (mealType: string): string => {
  const mealTypeMap: { [key: string]: string } = {
    'breakfast': '아침',
    'lunch': '점심',
    'dinner': '저녁',
    'snack': '간식'
  };
  return mealTypeMap[mealType] || mealType;
};

// 식사 유형별 이모지
const getMealTypeEmoji = (mealType: string): string => {
  const emojiMap: { [key: string]: string } = {
    'breakfast': '🌅',
    'lunch': '☀️',
    'dinner': '🌙',
    'snack': '🍪'
  };
  return emojiMap[mealType] || '🍽️';
};

// 식사 유형별 색상
const getMealTypeColor = (mealType: string): string => {
  const colorMap: { [key: string]: string } = {
    'breakfast': 'from-orange-50 to-orange-100 border-orange-200',
    'lunch': 'from-yellow-50 to-yellow-100 border-yellow-200',
    'dinner': 'from-indigo-50 to-indigo-100 border-indigo-200',
    'snack': 'from-pink-50 to-pink-100 border-pink-200'
  };
  return colorMap[mealType] || 'from-slate-50 to-slate-100 border-slate-200';
};

// 등급별 색상
const getGradeColor = (grade: string | null): string => {
  if (!grade) return 'bg-slate-100 text-slate-600';
  
  const gradeColorMap: { [key: string]: string } = {
    'A': 'bg-green-100 text-green-700',
    'B': 'bg-blue-100 text-blue-700',
    'C': 'bg-yellow-100 text-yellow-700',
    'D': 'bg-orange-100 text-orange-700',
    'F': 'bg-red-100 text-red-700'
  };
  return gradeColorMap[grade] || 'bg-slate-100 text-slate-600';
};

// 시간 포맷팅
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 날짜 그룹 헤더 텍스트
const getDateGroupLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 14) return '지난 주';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// 날짜별로 그룹핑
const groupMealsByDate = (meals: MealRecord[]): { [key: string]: MealRecord[] } => {
  const grouped: { [key: string]: MealRecord[] } = {};
  
  meals.forEach(meal => {
    const date = new Date(meal.consumed_at);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(meal);
  });
  
  return grouped;
};

// 특정 날짜의 식사 기록 가져오기
const getMealsByDate = (meals: MealRecord[], dateString: string): MealRecord[] => {
  return meals.filter(meal => {
    const mealDate = new Date(meal.consumed_at);
    const mealDateString = `${mealDate.getFullYear()}-${String(mealDate.getMonth() + 1).padStart(2, '0')}-${String(mealDate.getDate()).padStart(2, '0')}`;
    return mealDateString === dateString;
  });
};

// 필터에 따라 식사 기록 가져오기
const getFilteredMeals = (meals: MealRecord[], filter: ListFilter): MealRecord[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return meals.filter(meal => {
    const mealDate = new Date(meal.consumed_at);
    const mealDay = new Date(mealDate.getFullYear(), mealDate.getMonth(), mealDate.getDate());
    const diffTime = today.getTime() - mealDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    switch (filter) {
      case 'today':
        return diffDays === 0;
      case 'week':
        return diffDays >= 0 && diffDays < 7;
      case 'month':
        return diffDays >= 0 && diffDays < 30;
      case 'all':
        return true;
      default:
        return true;
    }
  });
};

// 달력 날짜 생성
const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const days: (Date | null)[] = [];
  
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

// 연속 기록 일수 계산
const getStreakDays = (meals: MealRecord[]): number => {
  if (meals.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 날짜별로 그룹핑
  const dateSet = new Set<string>();
  meals.forEach(meal => {
    const date = new Date(meal.consumed_at);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];
    dateSet.add(dateKey);
  });
  
  // 오늘부터 역순으로 연속 일수 체크
  let streak = 0;
  const checkDate = new Date(today);
  
  while (true) {
    const dateKey = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dateKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

// 50가지 다양한 이모지 풀
const emojiPool = [
  '🔥', '💪', '✨', '🌟', '⭐', '🎉', '🎊', '🏆', '🥇', '👑',
  '💎', '🌈', '🦄', '🚀', '⚡', '💫', '🌺', '🌸', '🌼', '🌻',
  '🍀', '🌿', '🌱', '🎯', '🎪', '🎨', '🎭', '🎬', '🎮', '🎲',
  '🧩', '🎸', '🎺', '🎻', '🥁', '🎹', '🎤', '🎧', '📱', '💻',
  '⌚', '🔮', '💝', '🎁', '🎀', '🎈', '🧸', '🍭', '🍬', '🎂'
];

// 재치있는 칭찬 멘트 가져오기
const getEncouragementMessage = (meals: MealRecord[]): string | null => {
  if (meals.length === 0) return null;
  
  const totalMeals = meals.length;
  const healthyMeals = meals.filter(m => m.health_score && m.health_score >= 70).length;
  const healthyRatio = healthyMeals / totalMeals;
  const avgScore = meals.reduce((sum, m) => sum + (m.health_score || 0), 0) / totalMeals;
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const streakDays = getStreakDays(meals);
  
  const messages = {
    streak30Plus: [
      '🏆 30일 연속 기록! 전설이 되셨습니다! 이제 당신은 건강 마스터!',
      '👑 한 달 연속! 당신은 이미 건강 습관의 왕입니다!',
      '💎 30일 스트릭! 다이아몬드 등급 달성! 정말 대단해요!'
    ],
    streak21Plus: [
      '👑 21일 연속! 습관이 완전히 자리잡았어요! 당신은 챔피언!',
      '🌟 3주 연속 기록! 이제 습관이 몸에 배었어요!',
      '💫 21일 스트릭! 과학적으로 완벽한 습관 형성이에요!'
    ],
    streak14Plus: [
      '💎 2주 연속 기록! 정말 놀라워요! 이 기세를 계속 유지하세요!',
      '🚀 14일 연속! 멈출 수 없는 기세입니다!',
      '⭐ 2주 스트릭! 이제 돌아갈 수 없어요!'
    ],
    streak10Plus: [
      '🚀 10일 연속! 멈출 수 없는 기세! 계속 달려나가세요!',
      '🔥 10일 스트릭! 당신은 불타오르고 있어요!',
      '💪 열흘 연속! 이제 습관이 되어가고 있어요!'
    ],
    streak7Plus: [
      '🔥 일주일 연속 기록! 정말 대단해요! 이 습관 계속 유지하세요!',
      '✨ 7일 스트릭! 한 주를 완벽하게 채웠어요!',
      '🎉 일주일 달성! 이제 습관의 시작이에요!'
    ],
    streak5Plus: [
      '💪 5일 연속 기록 중! 거의 다 왔어요! 조금만 더 힘내세요!',
      '⚡ 5일 스트릭! 일주일까지 2일 남았어요!',
      '🌈 5일 연속! 정말 잘하고 있어요!'
    ],
    streak3Plus: [
      '✨ 3일 연속 기록! 좋은 습관이 만들어지고 있어요!',
      '🌱 3일 스트릭! 습관의 씨앗이 자라고 있어요!',
      '💚 3일 연속! 계속 이어가세요!'
    ],
    superHealthy: [
      '🎉 와! 건강 점수가 정말 높아요! 곧 세계에서 가장 건강한 사람이 될 거예요!',
      '💪 완벽해요! 이 정도면 영양사도 감탄할 식단이에요!',
      '🌟 참 잘했어요! 건강 점수가 이렇게 높다니 정말 대단해요!',
      '🏆 최고예요! 이런 식단이면 100세까지 거뜬하겠어요!'
    ],
    healthy: [
      '😊 좋아요! 건강한 식사를 꾸준히 하고 계시네요!',
      '👍 잘하고 있어요! 이대로만 유지하세요!',
      '💚 건강한 선택이 많네요! 계속 파이팅!',
      '✨ 멋져요! 건강 관리 잘하고 계시네요!'
    ],
    needsImprovement: [
      '🤔 조금만 더 신경 쓰면 완벽할 거예요!',
      '💡 건강한 음식도 조금씩 추가해보는 건 어떨까요?',
      '🌱 작은 변화가 큰 차이를 만들어요! 화이팅!',
      '📈 점점 나아지고 있어요! 계속 도전해봐요!'
    ],
    highCalorie: [
      '🔥 칼로리가 좀 높네요! 다음엔 조금 가볍게 먹어볼까요?',
      '⚡ 에너지가 넘치시겠어요! 운동도 함께 하면 완벽!',
      '🏃 이 정도 칼로리면 마라톤도 뛸 수 있겠어요!'
    ],
    consistent: [
      '📅 꾸준히 기록하고 계시네요! 정말 대단해요!',
      '⭐ 기록만 해도 반은 성공이에요! 잘하고 있어요!',
      '🎯 식단 관리의 달인이 되어가고 있어요!'
    ]
  };
  
  // 연속 기록이 최우선!
  if (streakDays >= 30) {
    return messages.streak30Plus[Math.floor(Math.random() * messages.streak30Plus.length)];
  } else if (streakDays >= 21) {
    return messages.streak21Plus[Math.floor(Math.random() * messages.streak21Plus.length)];
  } else if (streakDays >= 14) {
    return messages.streak14Plus[Math.floor(Math.random() * messages.streak14Plus.length)];
  } else if (streakDays >= 10) {
    return messages.streak10Plus[Math.floor(Math.random() * messages.streak10Plus.length)];
  } else if (streakDays >= 7) {
    return messages.streak7Plus[Math.floor(Math.random() * messages.streak7Plus.length)];
  } else if (streakDays >= 5) {
    return messages.streak5Plus[Math.floor(Math.random() * messages.streak5Plus.length)];
  } else if (streakDays >= 3) {
    return messages.streak3Plus[Math.floor(Math.random() * messages.streak3Plus.length)];
  }
  
  // 연속 기록이 없으면 건강 점수와 칼로리로 판단
  if (healthyRatio >= 0.8 && avgScore >= 75) {
    return messages.superHealthy[Math.floor(Math.random() * messages.superHealthy.length)];
  } else if (healthyRatio >= 0.6 && avgScore >= 65) {
    return messages.healthy[Math.floor(Math.random() * messages.healthy.length)];
  } else if (totalCalories > 3000) {
    return messages.highCalorie[Math.floor(Math.random() * messages.highCalorie.length)];
  } else if (totalMeals >= 10) {
    return messages.consistent[Math.floor(Math.random() * messages.consistent.length)];
  } else if (healthyRatio < 0.5) {
    return messages.needsImprovement[Math.floor(Math.random() * messages.needsImprovement.length)];
  }
  
  return null;
};

export default function FoodHistoryPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [listFilter, setListFilter] = useState<ListFilter>('today');

  const apiEndpoint = API_BASE_URL;

  // 로그인 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user_id) {
            setIsLoggedIn(true);
            setUserName(data.nickname || data.username);
          } else {
            alert('⚠️ 로그인이 필요합니다.');
            router.push('/');
          }
        } else {
          alert('⚠️ 로그인이 필요합니다.');
          router.push('/');
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        alert('⚠️ 로그인이 필요합니다.');
        router.push('/');
      }
    };

    checkAuth();
  }, [router, apiEndpoint]);

  // 음식 기록 조회
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/api/v1/meals/history?limit=100`, {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setMeals(result.data);
          }
        }
      } catch (error) {
        console.error('음식 기록 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchMeals();
    }
  }, [isLoggedIn, apiEndpoint]);

  // 로그아웃
  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setUserName('');
        sessionStorage.clear();
        alert('로그아웃되었습니다.');
        router.push('/');
      }
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  // 음식 기록 삭제
  const handleDelete = async (historyId: number, foodName: string) => {
    if (!confirm(`"${foodName}" 기록을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(historyId);

    try {
      const response = await fetch(`${apiEndpoint}/api/v1/meals/history/${historyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMeals(prev => prev.filter(meal => meal.history_id !== historyId));
          alert(`✅ ${result.message}`);
        }
      } else {
        alert('❌ 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('❌ 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />

      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* 페이지 제목 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2 transition"
          >
            <span className="text-xl">←</span>
            <span className="text-sm">뒤로가기</span>
          </button>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">🍽️ 먹은 음식 확인하기</h1>
              <p className="text-sm text-slate-600">최근 먹은 음식 기록을 확인하고 관리하세요</p>
            </div>
            {getStreakDays(meals) > 0 && (
              <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce-slow">🔥</span>
                  <div>
                    <div className="text-xs opacity-90">연속 기록</div>
                    <div className="text-xl font-bold">{getStreakDays(meals)}일</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 뷰 모드 전환 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('calendar');
                setSelectedDate(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">📅</span>
              <span>달력 보기</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">📋</span>
              <span>목록 보기</span>
            </button>
          </div>
        </div>

        {/* 달력 뷰 */}
        {viewMode === 'calendar' && !selectedDate && (
          <>
            {/* 월 네비게이션 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition active:scale-95"
                >
                  <span className="text-xl">←</span>
                </button>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    총 {meals.filter(m => {
                      const d = new Date(m.consumed_at);
                      return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
                    }).length}개 기록
                  </div>
                </div>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition active:scale-95"
                  disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                >
                  <span className="text-xl">→</span>
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                  <div key={day} className={`text-center text-xs font-bold py-2 ${
                    i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'
                  }`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* 달력 날짜들 */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth()).map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="h-16"></div>;
                  }

                  const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const dayMeals = getMealsByDate(meals, dateString);
                  const mealCount = dayMeals.length;
                  const isToday = new Date().toDateString() === day.toDateString();
                  const dayOfWeek = day.getDay();
                  
                  // 건강한 날 판단 (모든 식사의 평균 건강 점수가 70점 이상)
                  const avgHealthScore = dayMeals.length > 0 
                    ? dayMeals.reduce((sum, m) => sum + (m.health_score || 0), 0) / dayMeals.length 
                    : 0;
                  const isHealthyDay = avgHealthScore >= 70 && dayMeals.length >= 3;
                  
                  // 완벽한 날 판단 (3끼 이상 + 평균 80점 이상)
                  const isPerfectDay = avgHealthScore >= 80 && dayMeals.length >= 3;
                  
                  // 표시할 이모지 결정 (50가지 이모지 풀에서 랜덤 선택)
                  let displayEmoji = '';
                  
                  if (mealCount > 0) {
                    // 날짜 기반 시드로 50가지 이모지 중 하나 선택
                    const seed = (day.getDate() * 17 + day.getMonth() * 37 + day.getFullYear() * 7) % emojiPool.length;
                    displayEmoji = emojiPool[seed];
                  }

                  return (
                    <button
                      key={dateString}
                      onClick={() => {
                        if (mealCount > 0) {
                          setSelectedDate(dateString);
                        }
                      }}
                      disabled={mealCount === 0}
                      className={`h-16 rounded-lg transition-all duration-200 relative overflow-hidden ${
                        mealCount > 0
                          ? isPerfectDay
                            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 hover:border-yellow-400 hover:shadow-lg active:scale-95 cursor-pointer'
                            : isHealthyDay
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 hover:border-green-400 hover:shadow-md active:scale-95 cursor-pointer'
                            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 hover:shadow-md active:scale-95 cursor-pointer'
                          : 'bg-slate-50 border border-slate-100 cursor-not-allowed opacity-50'
                      } ${isToday ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                      style={{
                        animation: mealCount > 0 ? `fadeIn 0.3s ease-out ${index * 0.02}s both` : 'none'
                      }}
                    >
                      {/* 날짜와 식사 횟수 */}
                      <div className="flex flex-col items-center justify-center h-full gap-0.5 p-1.5">
                        {/* 상단: 이모지 (하나만) */}
                        {displayEmoji && (
                          <div className="text-sm" style={{ 
                            animation: displayEmoji === '🔥' ? 'bounce-slow 1s ease-in-out infinite' : 'none' 
                          }}>
                            {displayEmoji}
                          </div>
                        )}
                        
                        {/* 중앙: 날짜 */}
                        <span className={`text-sm font-bold leading-none ${
                          dayOfWeek === 0 ? 'text-red-500' : 
                          dayOfWeek === 6 ? 'text-blue-500' : 
                          mealCount > 0 ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {day.getDate()}
                        </span>
                        
                        {/* 하단: 식사 횟수 */}
                        {mealCount > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                            isPerfectDay 
                              ? 'text-yellow-700 bg-yellow-200' 
                              : isHealthyDay 
                              ? 'text-green-700 bg-green-200' 
                              : 'text-green-600 bg-green-100'
                          }`}>
                            {mealCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 재치있는 칭찬 멘트 */}
            {meals.length > 0 && getEncouragementMessage(meals) && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4 mb-4 animate-bounce-once">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎊</div>
                  <p className="text-sm text-green-800 font-medium leading-relaxed flex-1">
                    {getEncouragementMessage(meals)}
                  </p>
                </div>
              </div>
            )}

            {/* 통계 요약 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{meals.length}</div>
                  <div className="text-xs text-slate-600 mt-1">총 기록</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {meals.reduce((sum, meal) => sum + meal.calories, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">총 칼로리</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {meals.filter(m => m.health_score && m.health_score >= 70).length}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">건강한 식사</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 선택된 날짜의 음식 기록 */}
        {viewMode === 'calendar' && selectedDate && (
          <>
            <button
              onClick={() => setSelectedDate(null)}
              className="mb-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition flex items-center gap-2 active:scale-95"
            >
              <span>←</span>
              <span>달력으로 돌아가기</span>
            </button>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 mb-4 shadow-md">
              <div className="text-sm opacity-90">선택한 날짜</div>
              <div className="text-xl font-bold mt-1">
                {new Date(selectedDate).getMonth() + 1}월 {new Date(selectedDate).getDate()}일
              </div>
              <div className="text-sm opacity-90 mt-1">
                {getMealsByDate(meals, selectedDate).length}개 기록
              </div>
            </div>

            {/* 음식 기록 리스트 */}
            <div className="space-y-3">
              {getMealsByDate(meals, selectedDate).map((meal, index) => (
                <div
                  key={meal.history_id}
                  className={`bg-gradient-to-r ${getMealTypeColor(meal.meal_type)} rounded-xl border-2 p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                    deletingId === meal.history_id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  }`}
                  style={{
                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getMealTypeEmoji(meal.meal_type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 break-words line-clamp-2 text-sm leading-tight">
                            {meal.food_name}
                          </h3>
                          {meal.food_grade && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${getGradeColor(meal.food_grade)}`}>
                              {meal.food_grade}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{formatTime(meal.consumed_at)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
                      meal.meal_type === 'breakfast' ? 'bg-orange-200 text-orange-700' :
                      meal.meal_type === 'lunch' ? 'bg-yellow-200 text-yellow-700' :
                      meal.meal_type === 'dinner' ? 'bg-indigo-200 text-indigo-700' :
                      'bg-pink-200 text-pink-700'
                    }`}>
                      {getMealTypeKr(meal.meal_type)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600">🔥</span>
                        <span className="font-semibold text-slate-900">{meal.calories}kcal</span>
                      </div>
                      {meal.health_score !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600">💚</span>
                          <span className="font-semibold text-slate-900">{meal.health_score}점</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600">⚖️</span>
                        <span className="text-slate-700">{meal.portion_size_g}g</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(meal.history_id, meal.food_name)}
                      disabled={deletingId === meal.history_id}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === meal.history_id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 목록 뷰 */}
        {viewMode === 'list' && (
          <>
            {/* 기간 필터 탭 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => setListFilter('today')}
                  className={`py-2.5 px-2 rounded-lg font-medium text-xs transition ${
                    listFilter === 'today'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  오늘
                </button>
                <button
                  onClick={() => setListFilter('week')}
                  className={`py-2.5 px-2 rounded-lg font-medium text-xs transition ${
                    listFilter === 'week'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  최근 7일
                </button>
                <button
                  onClick={() => setListFilter('month')}
                  className={`py-2.5 px-2 rounded-lg font-medium text-xs transition ${
                    listFilter === 'month'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  최근 30일
                </button>
                <button
                  onClick={() => setListFilter('all')}
                  className={`py-2.5 px-2 rounded-lg font-medium text-xs transition ${
                    listFilter === 'all'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  전체
                </button>
              </div>
            </div>

            {/* 재치있는 칭찬 멘트 */}
            {getFilteredMeals(meals, listFilter).length > 0 && getEncouragementMessage(getFilteredMeals(meals, listFilter)) && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-4 mb-4 animate-bounce-once">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎊</div>
                  <p className="text-sm text-green-800 font-medium leading-relaxed flex-1">
                    {getEncouragementMessage(getFilteredMeals(meals, listFilter))}
                  </p>
                </div>
              </div>
            )}

            {/* 통계 요약 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{getFilteredMeals(meals, listFilter).length}</div>
                  <div className="text-xs text-slate-600 mt-1">총 기록</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {getFilteredMeals(meals, listFilter).reduce((sum, meal) => sum + meal.calories, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">총 칼로리</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {getFilteredMeals(meals, listFilter).filter(m => m.health_score && m.health_score >= 70).length}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">건강한 식사</div>
                </div>
              </div>
            </div>

            {/* 음식 기록 리스트 */}
            {getFilteredMeals(meals, listFilter).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <div className="text-5xl mb-4">🍽️</div>
                <p className="text-slate-600 mb-2">아직 기록된 음식이 없습니다</p>
                <p className="text-sm text-slate-500">식사 일기에서 음식을 기록해보세요!</p>
                <button
                  onClick={() => router.push('/meal-diary')}
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
                >
                  식사 기록하러 가기
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupMealsByDate(getFilteredMeals(meals, listFilter))).map(([dateKey, dateMeals], groupIndex) => (
                  <div key={dateKey} className="space-y-3">
                    {/* 날짜 헤더 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg shadow-sm">
                          <div className="text-sm font-bold">{getDateGroupLabel(dateMeals[0].consumed_at)}</div>
                          <div className="text-xs opacity-90">
                            {new Date(dateMeals[0].consumed_at).getMonth() + 1}월 {new Date(dateMeals[0].consumed_at).getDate()}일
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
                      <div className="text-xs text-slate-500 font-medium">
                        {dateMeals.length}개 기록
                      </div>
                    </div>

                    {/* 해당 날짜의 음식 기록들 */}
                    <div className="space-y-3">
                      {dateMeals.map((meal, index) => (
                        <div
                          key={meal.history_id}
                          className={`bg-gradient-to-r ${getMealTypeColor(meal.meal_type)} rounded-xl border-2 p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                            deletingId === meal.history_id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                          }`}
                          style={{
                            animation: `slideIn 0.3s ease-out ${(groupIndex * 0.1 + index * 0.05)}s both`
                          }}
                        >
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="text-2xl flex-shrink-0">{getMealTypeEmoji(meal.meal_type)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-slate-900 break-words line-clamp-2 text-sm leading-tight">
                                    {meal.food_name}
                                  </h3>
                                  {meal.food_grade && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${getGradeColor(meal.food_grade)}`}>
                                      {meal.food_grade}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{formatTime(meal.consumed_at)}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
                              meal.meal_type === 'breakfast' ? 'bg-orange-200 text-orange-700' :
                              meal.meal_type === 'lunch' ? 'bg-yellow-200 text-yellow-700' :
                              meal.meal_type === 'dinner' ? 'bg-indigo-200 text-indigo-700' :
                              'bg-pink-200 text-pink-700'
                            }`}>
                              {getMealTypeKr(meal.meal_type)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-600">🔥</span>
                                <span className="font-semibold text-slate-900">{meal.calories}kcal</span>
                              </div>
                              {meal.health_score !== null && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-600">💚</span>
                                  <span className="font-semibold text-slate-900">{meal.health_score}점</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="text-slate-600">⚖️</span>
                                <span className="text-slate-700">{meal.portion_size_g}g</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDelete(meal.history_id, meal.food_name)}
                              disabled={deletingId === meal.history_id}
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === meal.history_id ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <MobileNav />

      {/* 애니메이션 스타일 */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
