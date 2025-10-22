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
