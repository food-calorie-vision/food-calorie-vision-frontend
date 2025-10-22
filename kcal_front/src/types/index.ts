// 사용자 건강 정보 타입
export interface UserHealthInfo {
  goal: string;
  diseases: string[];
  recommendedCalories: number;
  activityLevel: string;
}

// 영양 성분 데이터 타입
export interface NutrientData {
  name: string;
  value: number;
  color: string;
}

// 칼로리 섭취 데이터 타입
export interface CalorieData {
  name: string;
  value: number;
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

