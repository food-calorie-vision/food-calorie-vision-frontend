// 사용자 인증 타입
export interface User {
  id: string;
  username: string;
  nickname: string;
  email?: string;
}

// 사용자 건강 정보 타입
export interface UserHealthInfo {
  goal: string;
  diseases: string[];
  recommendedCalories: number;
  activityLevel: string;
  bodyType?: '감량' | '유지' | '증량';
  allergies?: string[];
  medicalConditions?: string[];
}

// 영양 성분 데이터 타입 (Recharts PieChart 호환)
export interface NutrientData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Recharts 호환성
}

// 칼로리 섭취 데이터 타입 (Recharts BarChart 호환)
export interface CalorieData {
  name: string;
  value: number;
  [key: string]: string | number; // Recharts 호환성
}

// 추천 음식 타입
export interface RecommendedFood {
  id: number;
  name: string;
  description: string;
  calories?: number;
  nutrients?: {
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
}

// 사용자 섭취 현황 타입
export interface UserIntakeData {
  totalCalories: number;
  targetCalories: number;
  nutrients: {
    sodium: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
  };
}

// 회원가입 폼 데이터 타입
export interface SignupFormData {
  userId: string;
  nickname: string;
  password: string;
  gender: '남자' | '여자';
  birthDate: string;
  hasAllergy: '예' | '아니오';
  allergyInfo?: string;
  bodyType: '감량' | '유지' | '증량';
  medicalCondition?: string;
  healthGoal: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Recharts Tooltip Props 타입
export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

// Recharts PieChart CustomizedLabel Props 타입
export interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  value: number;
  percent?: number;
  index?: number;
}

// 점수 데이터 타입
export interface ScoreData {
  todayScore: number;
  previousScore: number;
  scoreChange: number;
  feedback: string;
  improvement: string;
}

// 자주 먹는 음식 타입
export interface FrequentFood {
  id: number;
  name: string;
  calories: number;
  nutrients: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

// 일일 칼로리 데이터 타입
export interface DailyCalorieData {
  date: string;
  calories: number;
}

// 챗봇 메시지 타입
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

// 식단 추천 타입
export interface MealRecommendation {
  id: number;
  name: string;
  calories: number;
  description: string;
  isSelected: boolean;
  nutrients?: {
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
}

// 후보 음식 타입
export interface FoodCandidate {
  foodName: string;
  confidence: number; // 0.0 ~ 1.0
  description?: string;
  ingredients?: string[]; // 각 후보의 재료
}

// 음식 이미지 분석 결과 타입
export interface FoodAnalysisResult {
  foodName: string;
  description?: string; // 음식 설명
  ingredients?: string[]; // 주요 재료 3-4개
  calories: number;
  nutrients: {
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
    fiber?: number; // 식이섬유
  };
  portionSize?: string; // 1회 제공량
  healthScore?: number; // 건강 점수 (0-100)
  confidence: number;
  suggestions: string[];
  candidates?: FoodCandidate[]; // 여러 후보 음식 리스트
}