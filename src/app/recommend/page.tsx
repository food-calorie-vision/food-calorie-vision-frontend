"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";

type FlowStep = "chat" | "select" | "cooking" | "complete";
type ChatMessage = { 
  role: "bot" | "user"; 
  text: string;
  recipeCards?: Recipe[];
  dietCards?: DietPlan[];
  healthWarning?: string;
};

type Recipe = {
  name: string;
  description: string;
};

type CookingStep = {
  stepNumber: number;
  instruction: string;
};

type DietPlan = {
  name: string;
  description: string;
  totalCalories: string;
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snack?: string;
  };
  nutrients?: string;
};

// 챗봇 초기 안내 메시지
const INITIAL_BOT_MESSAGE: ChatMessage = {
  role: "bot",
  text:
    "안녕하세요! KCalculator 레시피 도우미입니다.\n" +
    "먹고 싶은 음식을 말씀해주시면 건강 상태를 고려한 레시피를 추천해드릴게요 🍳\n" +
    "예) '나 오늘 대창 먹을건데 레시피 추천해줘', '삼겹살 요리하고 싶어'\n\n" +
    "⚠️ 본 추천은 참고용 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다.",
};

// 더미 식단 카드 데이터
const DUMMY_MEAL_PLANS = [
  {
    title: "단백질 위주",
    desc: "근력운동 후 회복을 위한 저지방 단백질 식단",
    kcal: "약 450 kcal",
    badge: "추천 1순위",
  },
  {
    title: "저염 식단",
    desc: "혈압 관리를 위한 저염 메뉴 구성",
    kcal: "약 400 kcal",
    badge: "저염",
  },
  {
    title: "균형형 3대 영양소",
    desc: "탄수화물 / 단백질 / 지방을 고르게 맞춘 일반 식단",
    kcal: "약 500 kcal",
    badge: "균형",
  },
];

export default function RecommendPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // URL params에서 tab 읽기 (기본값: recipe)
  const currentTab = (searchParams?.get("tab") || "recipe") as "recipe" | "diet";

  // 흐름 관리
  const [flowStep, setFlowStep] = useState<FlowStep>("chat");
  
  // 챗봇 상태
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_BOT_MESSAGE]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 레시피 선택 상태
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [healthWarning, setHealthWarning] = useState<string>("");

  // 조리 상태
  const [cookingSteps, setCookingSteps] = useState<CookingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [recipeIntro, setRecipeIntro] = useState("");

  // 식단 추천 상태 (diet 탭용)
  const [dietFlowStep, setDietFlowStep] = useState<"chat" | "select" | "cooking" | "complete">("chat");
  const [dietMessages, setDietMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "안녕하세요! 식단 추천 도우미입니다.\n식단 추천을 원하시면 말씀해주세요 🥗\n예) '요즘 고기류를 먹고 싶은데 식단 추천해줘', '내가 가진 식재료 기반으로 식단 짜줘'\n\n⚠️ 본 추천은 참고용 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다." }
  ]);
  const [dietChatInput, setDietChatInput] = useState("");
  const [dietLoading, setDietLoading] = useState(false);
  const [recommendedDietPlans, setRecommendedDietPlans] = useState<DietPlan[]>([]);
  const [selectedDietPlan, setSelectedDietPlan] = useState<DietPlan | null>(null);
  
  // 식단 추천 메타데이터 (저장용)
  const [dietMetadata, setDietMetadata] = useState<{
    bmr?: number;
    tdee?: number;
    targetCalories?: number;
    healthGoal?: string;
    healthGoalKr?: string;
  } | null>(null);
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 로그인 상태 확인 (페이지 로드 시 한 번만)
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
            setIsCheckingAuth(false);
          } else {
            alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            router.push('/login');
          }
        } else if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/login');
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        // 네트워크 에러는 무시
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // 탭 변경
  const handleTabChange = (tab: "recipe" | "diet") => {
    router.push(`/recommend?tab=${tab}`);
    // 탭 전환 시 상태 초기화
    if (flowStep !== "chat") {
      setFlowStep("chat");
      setMessages([INITIAL_BOT_MESSAGE]);
    }
    if (dietFlowStep !== "chat") {
      setDietFlowStep("chat");
      setDietMessages([
        { role: "bot", text: "안녕하세요! 식단 추천 도우미입니다.\n식단 추천을 원하시면 말씀해주세요 🥗\n예) '요즘 고기류를 먹고 싶은데 식단 추천해줘', '내가 가진 식재료 기반으로 식단 짜줘'\n\n⚠️ 본 추천은 참고용 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다." }
      ]);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("login_expire");
      sessionStorage.removeItem("user_name");
      alert("로그아웃되었습니다.");
      router.push("/");
    }
  };

  // 채팅 보내기
  const sendChat = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userText = chatInput.trim();
    setChatInput("");

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `사용자가 "${userText}"라고 했습니다. 건강 경고가 필요하면 표시하고, 대체 레시피 3개를 추천해주세요.` 
        }),
      });

      const data = await res.json();

      if (data.reply) {
        // 더미 데이터로 레시피 추천 생성
        const recipes: Recipe[] = [
          { name: "연어 덮밥", description: "신선한 연어를 활용한 고단백, 오메가-3 풍부한 건강식" },
          { name: "제육볶음", description: "돼지고기와 채소를 함께 볶아 영양 밸런스를 잡은 요리" },
          { name: "고등어 구이 정식", description: "등푸른 생선의 좋은 지방과 단백질이 풍부한 정식" },
        ];
        const warning = "⚠️ 건강 경고\n고지혈증이 있으신데 대창은 포화지방이 높아 권장하지 않습니다.";
        
        setHealthWarning(warning);
        setRecommendedRecipes(recipes);
        
        // 메시지에 레시피 카드 포함
        setMessages((prev) => [...prev, { 
          role: "bot", 
          text: data.reply,
          recipeCards: recipes,
          healthWarning: warning
        }]);
        
        // flowStep은 'chat' 상태 유지 (대화 중 선택 가능)
      }
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "서버와 통신 중 문제가 발생했습니다." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 레시피 선택
  const selectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    
    setRecipeIntro(`${recipe.name} 괜찮죠! 단백질도 풍부하고 입맛도 살려줘요. 간을 약하게 하면 더 좋아요.`);
    setCookingSteps([
      { stepNumber: 1, instruction: `${recipe.name}의 재료를 준비합니다: 연어 1토막, 밥 1공기, 간장 2스푼, 참기름 1스푼` },
      { stepNumber: 2, instruction: "연어를 중불에서 앞뒤로 3분씩 구워줍니다. 겉은 바삭하고 속은 촉촉하게!" },
      { stepNumber: 3, instruction: "밥 위에 구운 연어를 올리고, 간장과 참기름을 섞어 뿌려주면 완성입니다." },
    ]);
    setCurrentStepIndex(0);
    setFlowStep("cooking");
  };

  // 다음 조리 단계
  const nextStep = () => {
    if (currentStepIndex < cookingSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setFlowStep("complete");
    }
  };

  // 조리 종료
  const exitCooking = () => {
    if (confirm("조리를 종료하고 메인으로 돌아가시겠습니까?")) {
      resetFlow();
    }
  };

  // 음식 기록하기
  const recordFood = async () => {
    if (!selectedRecipe) return;

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 추천 음식 저장 API 호출
      const response = await fetch(`${apiEndpoint}/api/v1/meals/save-recommended`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          food_name: selectedRecipe.name,
          ingredients_used: [], // TODO: 실제 사용된 식재료 목록
          meal_type: '점심', // TODO: 실제 식사 유형
          portion_size_g: 300.0,
          memo: `${selectedRecipe.name} 조리 완료`
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ "${selectedRecipe.name}" 기록 완료!\n\n건강 점수: ${result.data.health_score}점\n등급: ${result.data.food_grade}`);
        router.push('/dashboard');
      } else {
        alert(`기록 저장 실패: ${result.message}`);
        resetFlow();
      }
    } catch (error) {
      console.error('❌ 음식 기록 오류:', error);
      alert('음식 기록 중 오류가 발생했습니다.');
      resetFlow();
    }
  };

  // 처음으로 돌아가기
  const resetFlow = () => {
    setFlowStep("chat");
    setMessages([INITIAL_BOT_MESSAGE]);
    setRecommendedRecipes([]);
    setSelectedRecipe(null);
    setHealthWarning("");
    setCookingSteps([]);
    setCurrentStepIndex(0);
    setRecipeIntro("");
  };

  // 식단 추천 채팅 보내기
  const sendDietChat = async () => {
    if (!dietChatInput.trim() || dietLoading) return;

    const userText = dietChatInput.trim();
    setDietChatInput("");

    setDietMessages((prev) => [...prev, { role: "user", text: userText }]);
    setDietLoading(true);

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 사용자 ID 가져오기
      const authRes = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
        credentials: 'include',
      });
      
      if (!authRes.ok) {
        setDietMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ 로그인이 필요합니다. 로그인 페이지로 이동해주세요." },
        ]);
        setDietLoading(false);
        return;
      }
      
      const authData = await authRes.json();
      const userId = authData.user_id;
      
      // 실제 백엔드 API 호출
      const res = await fetch(`${apiEndpoint}/api/v1/recommend/diet-plan?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ 
          user_request: userText,
          activity_level: "moderate"  // TODO: 사용자가 선택하도록 개선
        }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        const responseData = result.data;
        
        // API 응답을 프론트엔드 형식으로 변환
        const dietPlans: DietPlan[] = responseData.dietPlans.map((plan: any) => ({
          name: plan.name,
          description: plan.description,
          totalCalories: plan.totalCalories,
          meals: {
            breakfast: plan.meals.breakfast,
            lunch: plan.meals.lunch,
            dinner: plan.meals.dinner,
            snack: plan.meals.snack
          },
          nutrients: plan.nutrients
        }));
        
        setRecommendedDietPlans(dietPlans);
        
        // 메타데이터 저장 (저장 시 사용)
        setDietMetadata({
          bmr: responseData.bmr,
          tdee: responseData.tdee,
          targetCalories: responseData.targetCalories,
          healthGoal: responseData.healthGoal,
          healthGoalKr: responseData.healthGoalKr
        });
        
        // 봇 응답 메시지 생성
        const botMessage = `✅ 사용자 정보 바탕으로 추천된 식단 리스트 입니다.

📊 사용자 영양 정보:
- 기초대사량(BMR): ${responseData.bmr.toFixed(1)} kcal/day
- 1일 총 에너지 소비량(TDEE): ${responseData.tdee.toFixed(1)} kcal/day
- 목표 칼로리: ${responseData.targetCalories.toFixed(1)} kcal/day
- 건강 목표: ${responseData.healthGoalKr}

아래에서 원하시는 식단을 선택해주세요! 🍽️`;
        
        // 메시지에 식단 카드 포함
        setDietMessages((prev) => [...prev, { 
          role: "bot", 
          text: botMessage,
          dietCards: dietPlans
        }]);
        
        // dietFlowStep은 'chat' 상태 유지 (대화 중 선택 가능)
      } else {
        setDietMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ 식단 추천 실패: ${result.message || '알 수 없는 오류'}` },
        ]);
      }
    } catch (error) {
      console.error('❌ 식단 추천 오류:', error);
      setDietMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ 서버와 통신 중 문제가 발생했습니다. 나중에 다시 시도해주세요." },
      ]);
    } finally {
      setDietLoading(false);
    }
  };

  // 식단 선택
  const selectDietPlan = (plan: DietPlan) => {
    setSelectedDietPlan(plan);
    setDietFlowStep("complete");
  };

  // 영양소 파싱 헬퍼 함수
  const parseNutrients = (nutrientsStr: string) => {
    // "단백질 120g / 탄수화물 150g / 지방 45g" 형식 파싱
    const defaultValues = { protein: 0, carb: 0, fat: 0 };
    
    if (!nutrientsStr) return defaultValues;
    
    try {
      const proteinMatch = nutrientsStr.match(/단백질\s*(\d+(?:\.\d+)?)\s*g/);
      const carbMatch = nutrientsStr.match(/탄수화물\s*(\d+(?:\.\d+)?)\s*g/);
      const fatMatch = nutrientsStr.match(/지방\s*(\d+(?:\.\d+)?)\s*g/);
      
      return {
        protein: proteinMatch ? parseFloat(proteinMatch[1]) : 0,
        carb: carbMatch ? parseFloat(carbMatch[1]) : 0,
        fat: fatMatch ? parseFloat(fatMatch[1]) : 0,
      };
    } catch (error) {
      console.warn('영양소 파싱 실패:', error);
      return defaultValues;
    }
  };

  // 총 칼로리 파싱 헬퍼 함수
  const parseCalories = (caloriesStr: string) => {
    // "1500 kcal" 형식에서 숫자만 추출
    const match = caloriesStr.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // 식단 저장하기 (추천 식단 전용 API 사용)
  const saveDietPlan = async () => {
    if (!selectedDietPlan) return;
    
    // 로그인 확인
    if (!isLoggedIn) {
      setModalMessage('⚠️ 로그인이 필요합니다.');
      setShowModal(true);
      return;
    }

    setIsSaving(true);

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 사용자 ID 가져오기
      const authRes = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
        credentials: 'include',
      });
      
      if (!authRes.ok) {
        setModalMessage('⚠️ 로그인이 필요합니다.');
        setShowModal(true);
        setIsSaving(false);
        return;
      }
      
      const authData = await authRes.json();
      const userId = authData.user_id;

      // 전체 영양소 파싱
      const totalNutrients = parseNutrients(selectedDietPlan.nutrients || '');
      const totalCalories = parseCalories(selectedDietPlan.totalCalories || '0');
      
      // 끼니별로 비율 계산 (균등 분배 - 추후 개선 가능)
      const mealCount = [
        selectedDietPlan.meals.breakfast,
        selectedDietPlan.meals.lunch,
        selectedDietPlan.meals.dinner,
        selectedDietPlan.meals.snack
      ].filter(Boolean).length;
      
      const caloriesPerMeal = mealCount > 0 ? totalCalories / mealCount : 0;
      const proteinPerMeal = mealCount > 0 ? totalNutrients.protein / mealCount : 0;
      const carbPerMeal = mealCount > 0 ? totalNutrients.carb / mealCount : 0;
      const fatPerMeal = mealCount > 0 ? totalNutrients.fat / mealCount : 0;

      // 식단 저장 요청 데이터 구성
      const meals = [];
      
      const mealTypeMap: Record<string, string> = {
        '아침': 'breakfast',
        '점심': 'lunch',
        '저녁': 'dinner',
        '간식': 'snack'
      };
      
      if (selectedDietPlan.meals.breakfast) {
        meals.push({
          food_name: `${selectedDietPlan.name} - 아침`,
          meal_type: 'breakfast',
          ingredients: selectedDietPlan.meals.breakfast.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: caloriesPerMeal,
          protein: proteinPerMeal,
          carb: carbPerMeal,
          fat: fatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }
      
      if (selectedDietPlan.meals.lunch) {
        meals.push({
          food_name: `${selectedDietPlan.name} - 점심`,
          meal_type: 'lunch',
          ingredients: selectedDietPlan.meals.lunch.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: caloriesPerMeal,
          protein: proteinPerMeal,
          carb: carbPerMeal,
          fat: fatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }
      
      if (selectedDietPlan.meals.dinner) {
        meals.push({
          food_name: `${selectedDietPlan.name} - 저녁`,
          meal_type: 'dinner',
          ingredients: selectedDietPlan.meals.dinner.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: caloriesPerMeal,
          protein: proteinPerMeal,
          carb: carbPerMeal,
          fat: fatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }
      
      if (selectedDietPlan.meals.snack) {
        meals.push({
          food_name: `${selectedDietPlan.name} - 간식`,
          meal_type: 'snack',
          ingredients: selectedDietPlan.meals.snack.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: caloriesPerMeal,
          protein: proteinPerMeal,
          carb: carbPerMeal,
          fat: fatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }

      // 추천 식단 전용 저장 API 호출
      const response = await fetch(`${apiEndpoint}/api/v1/recommend/save-diet-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          diet_plan_name: selectedDietPlan.name,
          description: selectedDietPlan.description,
          // 메타데이터 추가
          bmr: dietMetadata?.bmr,
          tdee: dietMetadata?.tdee,
          target_calories: dietMetadata?.targetCalories,
          health_goal: dietMetadata?.healthGoal,
          meals: meals
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setModalMessage(`🎉 "${selectedDietPlan.name}" 식단이 성공적으로 저장되었습니다!\n\n저장된 식사: ${result.data.saved_count}개`);
        setShowModal(true);
        
        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        throw new Error(result.message || '저장 실패');
      }
    } catch (error) {
      console.error('❌ 식단 저장 중 오류:', error);
      setModalMessage(`❌ 식단 저장 중 오류가 발생했습니다.\n\n${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setShowModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  // 식단 흐름 초기화
  const resetDietFlow = () => {
    setDietFlowStep("chat");
    setDietMessages([
      { role: "bot", text: "안녕하세요! 식단 추천 도우미입니다.\n식단 추천을 원하시면 말씀해주세요 🥗\n예) '요즘 고기류를 먹고 싶은데 식단 추천해줘', '내가 가진 식재료 기반으로 식단 짜줘'\n\n⚠️ 본 추천은 참고용 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다." }
    ]);
    setRecommendedDietPlans([]);
    setSelectedDietPlan(null);
  };

  // 인증 체크 중
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />

      {/* 상단 탭 버튼 - 모바일 최적화 */}
      <section className="max-w-md mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 w-full">
          <button
            onClick={() => handleTabChange("recipe")}
            className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
              currentTab === "recipe"
                ? "bg-green-500 text-white shadow-md"
                : "text-slate-600 active:bg-slate-50"
            }`}
          >
            <span className="text-lg">🍳</span>
            <span className="text-sm">레시피 추천</span>
          </button>

          <button
            onClick={() => handleTabChange("diet")}
            className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
              currentTab === "diet"
                ? "bg-green-500 text-white shadow-md"
                : "text-slate-600 active:bg-slate-50"
            }`}
          >
            <span className="text-lg">🥗</span>
            <span className="text-sm">식단 추천</span>
          </button>
        </div>
      </section>

      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        {/* 레시피 추천 탭 */}
        {currentTab === "recipe" && (
          <>
            {/* 1단계: 채팅 */}
            {flowStep === "chat" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">🍳 레시피 추천</h1>
                  <p className="text-sm text-slate-600">건강 상태를 고려한 맞춤 레시피를 추천받으세요</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="space-y-3 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                    {messages.map((m, idx) => (
                      <div key={idx}>
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                            m.role === "bot"
                              ? "bg-slate-100 text-slate-800 border border-slate-200"
                              : "bg-green-500 text-white ml-auto shadow"
                          }`}
                        >
                          {m.text}
                        </div>
                        
                        {/* 건강 경고 표시 */}
                        {m.healthWarning && (
                          <div className="mt-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
                            <p className="text-xs text-amber-900 font-medium whitespace-pre-line leading-relaxed">
                              {m.healthWarning}
                            </p>
                          </div>
                        )}
                        
                        {/* 레시피 카드 표시 */}
                        {m.recipeCards && m.recipeCards.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-slate-600 font-medium px-1">💚 추천 레시피를 선택해주세요</p>
                            {m.recipeCards.map((recipe, recipeIdx) => (
                              <button
                                key={recipeIdx}
                                onClick={() => {
                                  setSelectedRecipe(recipe);
                                  setFlowStep("cooking");
                                }}
                                className="w-full text-left bg-white border-2 border-slate-200 rounded-xl p-3 hover:border-green-400 hover:shadow-md transition-all active:scale-[0.98]"
                              >
                                <div className="font-medium text-slate-900 mb-1">{recipe.name}</div>
                                <div className="text-xs text-slate-600 leading-relaxed">{recipe.description}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200">
                        답변 작성 중이에요...
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center gap-2">
                    <input
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="예) 나 오늘 대창 먹을건데"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendChat();
                        }
                      }}
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendChat}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        isLoading
                          ? "bg-slate-400 text-white cursor-not-allowed"
                          : "bg-green-500 text-white active:bg-green-600"
                      }`}
                    >
                      보내기
                    </button>
                  </div>
                </div>

                {/* 안내 문구 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                  <div className="font-semibold mb-1">💡 이렇게 물어보세요</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>"나 오늘 대창 먹을건데 레시피 추천해줘"</li>
                    <li>"닭가슴살이랑 브로콜리 있는데 요리법 알려줘"</li>
                    <li>"저염식 고등어 요리 레시피 알려줘"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2단계: 레시피 선택 */}
            {flowStep === "select" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">추천 레시피</h1>
                  <p className="text-sm text-slate-600">사용자 정보를 기반으로 추천된 레시피입니다</p>
                </div>

                {healthWarning && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                    <p className="text-xs text-amber-900 whitespace-pre-line leading-relaxed">{healthWarning}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {recommendedRecipes.map((recipe, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectRecipe(recipe)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 active:border-green-500 active:shadow-lg transition text-left"
                    >
                      <div className="text-xl mb-2">🍽️</div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{recipe.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{recipe.description}</p>
                      <div className="mt-3 text-green-600 font-medium text-xs">선택하기 →</div>
                    </button>
                  ))}
                </div>

                <div className="text-center mt-4">
                  <button
                    onClick={resetFlow}
                    className="text-sm text-slate-600 active:text-slate-900 underline"
                  >
                    처음으로 돌아가기
                  </button>
                </div>
              </div>
            )}

            {/* 3단계: 조리 과정 */}
            {flowStep === "cooking" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedRecipe?.name}</h1>
                  <p className="text-sm text-slate-600">{recipeIntro}</p>
                </div>

                <div className="bg-white rounded-xl border-2 border-green-500 shadow-lg p-6">
                  <div className="text-center mb-4">
                    <div className="inline-block bg-green-500 text-white px-3 py-1.5 rounded-full font-bold text-sm mb-3">
                      STEP {cookingSteps[currentStepIndex]?.stepNumber} / {cookingSteps.length}
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-base text-slate-800 leading-relaxed">
                      {cookingSteps[currentStepIndex]?.instruction}
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={nextStep}
                      className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold text-base active:bg-green-600 transition shadow-md"
                    >
                      {currentStepIndex < cookingSteps.length - 1 ? "다음 단계 →" : "조리 완료!"}
                    </button>
                  </div>
                </div>

                <div className="fixed bottom-20 right-4 z-20">
                  <button
                    onClick={exitCooking}
                    className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs active:bg-slate-700 transition shadow-lg"
                  >
                    종료
                  </button>
                </div>
              </div>
            )}

            {/* 4단계: 완료 */}
            {flowStep === "complete" && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎉</div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    맛있는 "{selectedRecipe?.name}"이<br />완성되었습니다!
                  </h1>
                  <p className="text-sm text-slate-600 mb-6">이 음식을 바로 기록 하시겠습니까?</p>

                  <div className="space-y-3 px-4">
                    <button
                      onClick={recordFood}
                      className="w-full py-3 bg-green-500 text-white rounded-lg font-bold text-base active:bg-green-600 transition shadow-md"
                    >
                      음식 기록하기
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full py-3 bg-slate-200 text-slate-700 rounded-lg font-bold text-base active:bg-slate-300 transition"
                    >
                      메인으로 돌아가기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 식단 추천 탭 */}
        {currentTab === "diet" && (
          <>
            {/* 1단계: 채팅 (식단 추천) */}
            {dietFlowStep === "chat" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">🥗 식단 추천</h1>
                  <p className="text-sm text-slate-600">건강 상태를 고려한 맞춤 식단을 추천받으세요</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="space-y-3 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                    {dietMessages.map((m, idx) => (
                      <div key={idx}>
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                            m.role === "bot"
                              ? "bg-slate-100 text-slate-800 border border-slate-200"
                              : "bg-green-500 text-white ml-auto shadow"
                          }`}
                        >
                          {m.text}
                        </div>
                        
                        {/* 식단 카드 표시 */}
                        {m.dietCards && m.dietCards.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-slate-600 font-medium px-1">💚 추천 식단을 선택해주세요</p>
                            {m.dietCards.map((plan, planIdx) => (
                              <button
                                key={planIdx}
                                onClick={() => {
                                  setSelectedDietPlan(plan);
                                  setDietFlowStep("complete");
                                }}
                                className="w-full text-left bg-white border-2 border-slate-200 rounded-xl p-3 hover:border-green-400 hover:shadow-md transition-all active:scale-[0.98]"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="font-medium text-slate-900">{plan.name}</div>
                                  <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                    {plan.totalCalories}
                                  </div>
                                </div>
                                <div className="text-xs text-slate-600 mb-2 leading-relaxed">{plan.description}</div>
                                
                                {/* 식사 미리보기 */}
                                {plan.meals && (
                                  <div className="space-y-1 mb-2">
                                    {plan.meals.breakfast && (
                                      <div className="text-xs text-slate-500">
                                        <span className="font-semibold">🌅 아침:</span> {plan.meals.breakfast.slice(0, 30)}...
                                      </div>
                                    )}
                                    {plan.meals.lunch && (
                                      <div className="text-xs text-slate-500">
                                        <span className="font-semibold">☀️ 점심:</span> {plan.meals.lunch.slice(0, 30)}...
                                      </div>
                                    )}
                                    {plan.meals.dinner && (
                                      <div className="text-xs text-slate-500">
                                        <span className="font-semibold">🌙 저녁:</span> {plan.meals.dinner.slice(0, 30)}...
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">
                                  {plan.nutrients}
                                </div>
                                
                                <div className="mt-2 text-green-600 font-medium text-xs">자세히 보기 →</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {dietLoading && (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200">
                        식단 추천 중이에요...
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex items-center gap-2">
                    <input
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="예) 고기류 먹고 싶은데"
                      value={dietChatInput}
                      onChange={(e) => setDietChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendDietChat();
                        }
                      }}
                      disabled={dietLoading}
                    />
                    <button
                      onClick={sendDietChat}
                      disabled={dietLoading}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        dietLoading
                          ? "bg-slate-400 text-white cursor-not-allowed"
                          : "bg-green-500 text-white active:bg-green-600"
                      }`}
                    >
                      보내기
                    </button>
                  </div>
                </div>

                {/* 안내 문구 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                  <div className="font-semibold mb-1">💡 이렇게 물어보세요</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>"요즘 고기류를 먹고 싶은데 식단 추천해줘"</li>
                    <li>"내가 가진 식재료 기반으로 식단 짜줘"</li>
                    <li>"다이어트용 저칼로리 식단 알려줘"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2단계: 식단 선택 */}
            {dietFlowStep === "select" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">추천 식단</h1>
                  <p className="text-sm text-slate-600">원하시는 식단을 선택해주세요</p>
                </div>

                <div className="space-y-3">
                  {recommendedDietPlans.map((plan, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectDietPlan(plan)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 active:border-green-500 active:shadow-lg transition text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xl">🍽️</div>
                        <span className="text-xs font-bold text-white bg-green-500 px-2 py-0.5 rounded">
                          {plan.totalCalories}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h3>
                      <p className="text-xs text-slate-600 mb-2">{plan.description}</p>

                      {/* 식사 구성 미리보기 */}
                      <div className="space-y-1.5 mb-2">
                        {plan.meals.breakfast && (
                          <div className="bg-orange-50 rounded px-2 py-1 text-xs">
                            <span className="font-semibold text-orange-700">🌅 아침:</span>
                            <span className="text-slate-600 ml-1">{plan.meals.breakfast.slice(0, 18)}...</span>
                          </div>
                        )}
                        {plan.meals.lunch && (
                          <div className="bg-yellow-50 rounded px-2 py-1 text-xs">
                            <span className="font-semibold text-yellow-700">☀️ 점심:</span>
                            <span className="text-slate-600 ml-1">{plan.meals.lunch.slice(0, 18)}...</span>
                          </div>
                        )}
                        {plan.meals.dinner && (
                          <div className="bg-indigo-50 rounded px-2 py-1 text-xs">
                            <span className="font-semibold text-indigo-700">🌙 저녁:</span>
                            <span className="text-slate-600 ml-1">{plan.meals.dinner.slice(0, 18)}...</span>
                          </div>
                        )}
                      </div>

                      {plan.nutrients && (
                        <div className="text-xs text-slate-500 border-t pt-1.5">
                          {plan.nutrients}
                        </div>
                      )}

                      <div className="mt-2 text-green-600 font-medium text-xs">선택하기 →</div>
                    </button>
                  ))}
                </div>

                <div className="text-center mt-4">
                  <button
                    onClick={resetDietFlow}
                    className="text-sm text-slate-600 active:text-slate-900 underline"
                  >
                    처음으로 돌아가기
                  </button>
                </div>
              </div>
            )}

            {/* 3단계: 완료 */}
            {dietFlowStep === "complete" && selectedDietPlan && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-4">✅</div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedDietPlan.name}
                  </h1>
                  <p className="text-sm text-slate-600 mb-2">{selectedDietPlan.description}</p>
                  <div className="inline-block bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-bold text-sm">
                    {selectedDietPlan.totalCalories}
                  </div>
                </div>

                {/* 식단 상세 보기 */}
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-md p-4">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">하루 식단 구성</h2>
                  
                  <div className="space-y-3">
                    {selectedDietPlan.meals.breakfast && (
                      <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🌅</span>
                          <h3 className="text-sm font-bold text-orange-700">아침</h3>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedDietPlan.meals.breakfast}</p>
                      </div>
                    )}

                    {selectedDietPlan.meals.lunch && (
                      <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">☀️</span>
                          <h3 className="text-sm font-bold text-yellow-700">점심</h3>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedDietPlan.meals.lunch}</p>
                      </div>
                    )}

                    {selectedDietPlan.meals.dinner && (
                      <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🌙</span>
                          <h3 className="text-sm font-bold text-indigo-700">저녁</h3>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedDietPlan.meals.dinner}</p>
                      </div>
                    )}

                    {selectedDietPlan.meals.snack && (
                      <div className="bg-pink-50 rounded-xl p-3 border border-pink-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🍎</span>
                          <h3 className="text-sm font-bold text-pink-700">간식</h3>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedDietPlan.meals.snack}</p>
                      </div>
                    )}
                  </div>

                  {selectedDietPlan.nutrients && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h3 className="text-xs font-semibold text-slate-700 mb-1">영양소 구성</h3>
                      <p className="text-xs text-slate-600">{selectedDietPlan.nutrients}</p>
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="space-y-3 px-4 mt-6">
                  <button
                    onClick={saveDietPlan}
                    disabled={isSaving}
                    className={`w-full py-3 rounded-lg font-bold text-base transition shadow-md ${
                      isSaving
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-green-500 text-white active:bg-green-600'
                    }`}
                  >
                    {isSaving ? '저장 중...' : '식단 저장하기'}
                  </button>
                  <button
                    onClick={() => setDietFlowStep("chat")}
                    className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold text-base active:bg-blue-600 transition shadow-md"
                  >
                    ← 다른 식단 보기
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="w-full py-3 bg-slate-200 text-slate-700 rounded-lg font-bold text-base active:bg-slate-300 transition"
                  >
                    메인으로 돌아가기
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {isLoggedIn && <MobileNav />}
      
      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <p className="text-slate-800 whitespace-pre-line mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 bg-green-500 text-white rounded-lg font-bold active:bg-green-600 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
