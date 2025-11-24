"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import { API_BASE_URL } from "@/utils/api";

type FlowStep = "chat" | "select" | "cooking" | "complete";
type RecipeAgentActionType =
  | "CONFIRMATION"
  | "RECOMMENDATION_RESULT"
  | "TEXT_ONLY"
  | "INGREDIENT_CHECK"
  | "COOKING_STEPS";

type ChatMessage = { 
  role: "bot" | "user"; 
  text: string;
  recipeCards?: Recipe[];
  dietCards?: DietPlan[];
  healthWarning?: string;
  actionType?: RecipeAgentActionType;
  suggestions?: string[];
  ingredientCheck?: {
    recipeName: string;
    ingredients: string[];
  };
  cookingMarkdown?: {
    recipeName: string;
    markdown: string;
  };
};

type Recipe = {
  name: string;
  description: string;
  calories?: number;
  cooking_time?: string;
  difficulty?: string;
  suitable_reason?: string;
  // 개별 정보를 저장하기 위한 필드
  fullInfo?: {
    description: string;
    calories: number;
    cooking_time: string;
    difficulty: string;
  };
};

type RecipeAgentResponse = {
  response_id: string;
  action_type: RecipeAgentActionType;
  message: string;
  suggestions?: string[];
  data?: {
    recipes?: Recipe[];
    inferred_preference?: string;
    health_warning?: string;
    user_friendly_message?: string;
  };
};

type RawDietPlan = {
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
  meal_details?: DietPlan["meal_details"];
};

type DietPlanApiResponse = {
  dietPlans: RawDietPlan[];
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  healthGoal?: string;
  healthGoalKr?: string;
};

type CookingStep = {
  stepNumber: number;
  title: string;
  description: string;
  tip?: string;
};

type RecipeDetail = {
  recipe_name: string;
  intro: string;
  estimated_time: string;
  total_steps: number;
  ingredients: Array<{ name: string; amount: string }>;
  steps: CookingStep[];
  nutrition_info: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber?: string;
    sodium?: string;
  };
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
  meal_details?: {
    breakfast?: { calories: number; protein: number; carb: number; fat: number; };
    lunch?: { calories: number; protein: number; carb: number; fat: number; };
    dinner?: { calories: number; protein: number; carb: number; fat: number; };
    snack?: { calories: number; protein: number; carb: number; fat: number; };
  };
};

// 음식 이름에서 분류 추론하는 함수
const getFoodClassFromName = (recipeName: string): string => {
  const name = recipeName.toLowerCase();
  if (name.includes('볶음') || name.includes('볶아')) return '볶음류';
  if (name.includes('구이') || name.includes('구워')) return '구이류';
  if (name.includes('찜') || name.includes('찜아')) return '찜류';
  if (name.includes('튀김') || name.includes('튀겨')) return '튀김류';
  if (name.includes('국') || name.includes('탕') || name.includes('찌개')) return '국물류';
  if (name.includes('면') || name.includes('라면')) return '면류';
  if (name.includes('밥') || name.includes('덮밥')) return '밥류';
  if (name.includes('샐러드') || name.includes('무침')) return '샐러드류';
  if (name.includes('스테이크')) return '스테이크류';
  return '요리';
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

const detectMealTypeFromText = (text: string): string | null => {
  const normalized = text.replace(/\s+/g, "").toLowerCase();
  const map: Record<string, string> = {
    breakfast: "breakfast",
    아침: "breakfast",
    모닝: "breakfast",
    점심: "lunch",
    런치: "lunch",
    lunch: "lunch",
    저녁: "dinner",
    디너: "dinner",
    dinner: "dinner",
    간식: "snack",
    간단한간식: "snack",
    스낵: "snack",
    snack: "snack",
  };
  for (const [keyword, mealType] of Object.entries(map)) {
    if (normalized.includes(keyword)) {
      return mealType;
    }
  }
  return null;
};

const buildStepsFromMarkdown = (markdown?: string | null): CookingStep[] => {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const steps: CookingStep[] = [];
  let current: CookingStep | null = null;
  const stepRegex = /^\s*(\d+)[\.\)]\s*(.*)/;

  lines.forEach((line) => {
    const match = stepRegex.exec(line);
    if (match) {
      if (current) {
        current.description = current.description.trim();
        steps.push(current);
      }
      const titleText = match[2]?.trim() || `단계 ${steps.length + 1}`;
      current = {
        stepNumber: steps.length + 1,
        title: titleText.startsWith("📌") ? titleText : `단계 ${steps.length + 1}`,
        description: titleText.startsWith("📌") ? "" : titleText,
      };
    } else if (current) {
      current.description = `${current.description}\n${line}`.trim();
    }
  });

  if (current) {
    current.description = current.description.trim();
    steps.push(current);
  }

  return steps;
};

export default function RecommendPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiEndpoint = API_BASE_URL;
  
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
  const [loadingStatus, setLoadingStatus] = useState({ text: "", seconds: 0 });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // 재치있는 로딩 메시지 배열
  const funnyRecipeLoadingMessages = [
    '📚 레시피 북 뒤지는 중...',
    '👨‍🍳 고든 램지에게 물어보는 중...',
    '😅 욕 먹는 중... (농담입니다)',
    '🤖 GPT가 요리책 읽는 중...',
    '🔥 맛있는 레시피 찾는 중...',
    '📊 영양소 계산 중...',
    '✨ 거의 다 왔어요!'
  ];

  // 레시피 선택 상태
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [healthWarning, setHealthWarning] = useState<string>("");
  
  // 식사 유형 추적
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);  // 선택된 식사 유형
  const [pendingUserRequest, setPendingUserRequest] = useState<string | null>(null);
  const [showMealTypeSelection, setShowMealTypeSelection] = useState(false);

  // 조리 상태
  const [recipeDetail, setRecipeDetail] = useState<RecipeDetail | null>(null);
  const [cookingSteps, setCookingSteps] = useState<CookingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);  // -1: 시작 전, 0+: 진행 중
  const [recipeIntro, setRecipeIntro] = useState("");
  const [loadingRecipeDetail, setLoadingRecipeDetail] = useState(false);
  const [cookingComplete, setCookingComplete] = useState(false);
  const [ingredientChecklistRecipe, setIngredientChecklistRecipe] = useState<string | null>(null);
  const [ingredientChecklistItems, setIngredientChecklistItems] = useState<string[]>([]);
  const [ingredientChecklistState, setIngredientChecklistState] = useState<Record<string, boolean>>({});
  const [isGeneratingCookingSteps, setIsGeneratingCookingSteps] = useState(false);
  const [cookingMarkdown, setCookingMarkdown] = useState<string | null>(null);

  // 식단 추천 상태 (diet 탭용)
  const [dietFlowStep, setDietFlowStep] = useState<"chat" | "select" | "cooking" | "complete">("chat");
  const [dietMessages, setDietMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "안녕하세요! 식단 추천 도우미입니다.\n식단 추천을 원하시면 말씀해주세요 🥗\n예) '요즘 고기류를 먹고 싶은데 식단 추천해줘', '내가 가진 식재료 기반으로 식단 짜줘'\n\n⚠️ 본 추천은 참고용 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다." }
  ]);
  const [dietChatInput, setDietChatInput] = useState("");
  const [dietLoading, setDietLoading] = useState(false);
  const [dietLoadingStatus, setDietLoadingStatus] = useState({ text: "", seconds: 0 }); // 식단 추천 로딩 상태 추가
  const [recommendedDietPlans, setRecommendedDietPlans] = useState<DietPlan[]>([]);
  const [selectedDietPlan, setSelectedDietPlan] = useState<DietPlan | null>(null);
  
  // 선택된 끼니 상태 (체크박스)
  const [selectedMeals, setSelectedMeals] = useState<{
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
  }>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: true,
  });
  
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
            router.push('/');
          }
        } else if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
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
  }, [router, apiEndpoint]);

  // 채팅 메시지 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, loadingRecipeDetail]);

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

  // 식사 유형 선택 처리
  const buildConversationHistory = (baseMessages: ChatMessage[]) => {
    return baseMessages.slice(-6).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text
    }));
  };
  
  const handleRecipeAgentResponse = (response: RecipeAgentResponse, fallbackUserText: string) => {
    if (response.action_type === "CONFIRMATION") {
      setPendingUserRequest(fallbackUserText);
      setShowMealTypeSelection(true);
      setRecommendedRecipes([]);
      setSelectedRecipe(null);
      setHealthWarning("");
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.message,
          actionType: response.action_type,
          suggestions: response.suggestions
        }
      ]);
      return;
    }
    
    if (response.action_type === "TEXT_ONLY") {
      setPendingUserRequest(null);
      setShowMealTypeSelection(false);
      setRecommendedRecipes([]);
      setSelectedRecipe(null);
      setHealthWarning("");
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.message,
          actionType: response.action_type,
          suggestions: response.suggestions
        }
      ]);
      return;
    }
    
    const recipePayload = response.data?.recipes ?? [];
    const recipes: Recipe[] = recipePayload.map((rec) => ({
      name: rec.name,
      description: rec.description,
      calories: rec.calories,
      cooking_time: rec.cooking_time,
      difficulty: rec.difficulty,
      suitable_reason: rec.suitable_reason,
      fullInfo: {
        description: rec.description,
        calories: rec.calories,
        cooking_time: rec.cooking_time,
        difficulty: rec.difficulty
      }
    }));
    
    setPendingUserRequest(null);
    setShowMealTypeSelection(false);
    setRecommendedRecipes(recipes);
    setSelectedRecipe(null);
    
    const healthWarn = response.data?.health_warning || "";
    setHealthWarning(healthWarn);
    if (healthWarn) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: healthWarn,
          healthWarning: healthWarn
        }
      ]);
    }
    
    const botMessage = response.message || response.data?.user_friendly_message || `✅ "${fallbackUserText}" 관련 레시피를 추천해드릴게요!\n\n아래에서 원하시는 레시피를 선택해주세요! 🍳`;
    
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: botMessage,
        recipeCards: recipes,
        actionType: response.action_type,
        suggestions: response.suggestions
      }
    ]);
  };
  
  const requestRecipeAgentResponse = async ({
    latestUserMessage,
    baseRequest,
    mealType,
    conversationMessages,
  }: {
    latestUserMessage: string;
    baseRequest?: string;
    mealType?: string | null;
    conversationMessages: ChatMessage[];
  }) => {
    if (!latestUserMessage) return;
    
    setIsLoading(true);
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setLoadingStatus({
        text: funnyRecipeLoadingMessages[messageIndex],
        seconds: 0
      });
      messageIndex = (messageIndex + 1) % funnyRecipeLoadingMessages.length;
    }, 2000);
    setLoadingStatus({ text: funnyRecipeLoadingMessages[0], seconds: 0 });
    
    try {
      const authRes = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
        credentials: 'include',
      });
      
      if (!authRes.ok) {
        clearInterval(messageInterval);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ 로그인이 필요합니다. 로그인 페이지로 이동해주세요." },
        ]);
        setIsLoading(false);
        setLoadingStatus({ text: "", seconds: 0 });
        setPendingUserRequest("");
        return;
      }
      
      const authData = await authRes.json();
      const userId = authData.user_id;
      
      const conversation_history = buildConversationHistory(conversationMessages);
      
      const res = await fetch(`${apiEndpoint}/api/v1/recipes/recommendations?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          user_request: baseRequest || latestUserMessage,
          conversation_history,
          meal_type: mealType || null
        }),
      });
      
      const result = await res.json();
      
      if (result.success && result.data) {
        handleRecipeAgentResponse(result.data as RecipeAgentResponse, latestUserMessage);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ 레시피 추천 실패: ${result.message || '알 수 없는 오류'}` },
        ]);
      }
    } catch (error) {
      console.error('❌ 레시피 추천 오류:', error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ 서버와 통신 중 문제가 발생했습니다. 나중에 다시 시도해주세요." },
      ]);
      setPendingUserRequest("");
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
      setLoadingStatus({ text: "", seconds: 0 });
    }
  };
  
  const processRecipeUserMessage = async (userText: string, baseRequest?: string, mealTypeOverride?: string | null) => {
    const trimmed = userText.trim();
    if (!trimmed) return;
    
    const updatedMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(updatedMessages);
    setPendingUserRequest(null);
    setShowMealTypeSelection(false);
    
    const detectedMealType = mealTypeOverride ?? detectMealTypeFromText(trimmed);
    if (detectedMealType) {
      setSelectedMealType(detectedMealType);
    }
    
    setRecommendedRecipes([]);
    setSelectedRecipe(null);
    setHealthWarning("");
    
    await requestRecipeAgentResponse({
      latestUserMessage: trimmed,
      baseRequest: baseRequest || trimmed,
      mealType: detectedMealType,
      conversationMessages: updatedMessages
    });
  };

  const sendChat = async () => {
    if (!chatInput.trim() || isLoading) return;
    
    const userText = chatInput.trim();
    setChatInput("");
    await processRecipeUserMessage(userText);
  };
  
  const handleSuggestionClick = async (text: string) => {
    if (isLoading) return;
    await processRecipeUserMessage(text);
  };

  const handleMealTypeSelect = async (mealType: string) => {
    if (!pendingUserRequest) {
      setShowMealTypeSelection(false);
      return;
    }
    const mealTypeKr = {
      breakfast: "아침으로 부탁해",
      lunch: "점심으로 부탁해",
      dinner: "저녁으로 부탁해",
      snack: "간식으로 부탁해"
    }[mealType] || "그 끼니로 부탁해";
    
    setShowMealTypeSelection(false);
    await processRecipeUserMessage(mealTypeKr, pendingUserRequest, mealType);
    setPendingUserRequest(null);
  };

  // 레시피 선택 - 재료 확인 단계
  const selectRecipe = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIngredientChecklistRecipe(recipe.name);
    setIngredientChecklistItems([]);
    setIngredientChecklistState({});
    setCookingMarkdown(null);
    setRecipeDetail(null);
    setLoadingRecipeDetail(true);
    
    try {
      const authRes = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
        credentials: 'include',
      });
      if (!authRes.ok) {
        setMessages((prev) => [...prev, { role: "bot", text: "⚠️ 로그인이 필요합니다." }]);
        setLoadingRecipeDetail(false);
        return;
      }
      const authData = await authRes.json();
      const userId = authData.user_id;
      const res = await fetch(`${apiEndpoint}/api/v1/recipes/ingredient-check?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ recipe_name: recipe.name })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const ingredients: string[] = result.data.ingredients || [];
        const defaultState: Record<string, boolean> = {};
        ingredients.forEach((item) => {
          defaultState[item] = true;
        });
        setIngredientChecklistItems(ingredients);
        setIngredientChecklistState(defaultState);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: `"${recipe.name}" 준비 전에 필요한 재료를 확인해볼게요.`,
            actionType: "INGREDIENT_CHECK",
            ingredientCheck: {
              recipeName: recipe.name,
              ingredients
            }
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ 재료 확인에 실패했습니다: ${result.message || '알 수 없는 오류'}` }
        ]);
      }
    } catch (error) {
      console.error('❌ 재료 확인 오류:', error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ 재료 확인 중 오류가 발생했습니다." }
      ]);
    } finally {
      setLoadingRecipeDetail(false);
    }
  };

  const toggleIngredientAvailability = (ingredient: string) => {
    setIngredientChecklistState((prev) => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  const handleStartCustomCooking = async () => {
    if (!ingredientChecklistRecipe || !selectedRecipe) return;
    setIsGeneratingCookingSteps(true);
    
    const excludedIngredients = ingredientChecklistItems.filter((item) => !ingredientChecklistState[item]);
    
    try {
      const authRes = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
        credentials: 'include',
      });
      if (!authRes.ok) {
        setMessages((prev) => [...prev, { role: "bot", text: "⚠️ 로그인이 필요합니다." }]);
        setIsGeneratingCookingSteps(false);
        return;
      }
      const authData = await authRes.json();
      const userId = authData.user_id;
      const res = await fetch(`${apiEndpoint}/api/v1/recipes/custom-recipe?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          recipe_name: ingredientChecklistRecipe,
          excluded_ingredients: excludedIngredients,
          available_ingredients: ingredientChecklistItems,
          meal_type: selectedMealType
        })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const customData = result.data;
        const nutrition = customData.nutrition_info;
        let convertedSteps: CookingStep[] = Array.isArray(customData.steps)
          ? customData.steps.map((step: any, index: number) => ({
              stepNumber: step.step_number ?? step.stepNumber ?? index + 1,
              title: step.title || `단계 ${index + 1}`,
              description: step.description || "",
              tip: step.tip,
            }))
          : [];
        if (convertedSteps.length === 0 && customData.instructions_markdown) {
          convertedSteps = buildStepsFromMarkdown(customData.instructions_markdown);
        }
        setRecipeDetail({
          recipe_name: customData.recipe_name,
          intro: customData.intro || "",
          estimated_time: customData.estimated_time || "",
          total_steps: convertedSteps.length,
          ingredients: customData.ingredients || [],
          steps: convertedSteps,
          nutrition_info: {
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            fiber: nutrition.fiber,
            sodium: nutrition.sodium
          }
        });
        setRecipeIntro(customData.intro || "");
        setCookingMarkdown(customData.instructions_markdown || "");
        setCookingSteps(convertedSteps);
        setCurrentStepIndex(-1);
        setCookingComplete(false);
        setIngredientChecklistRecipe(null);
        setIngredientChecklistItems([]);
        setIngredientChecklistState({});
        setFlowStep("cooking");
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: `"${customData.recipe_name}" 재료 구성이 준비됐어요.\n아래의 '요리 시작하기' 버튼을 눌러 단계별로 진행해볼까요?`
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ 맞춤 조리법 생성 실패: ${result.message || '알 수 없는 오류'}` }
        ]);
      }
    } catch (error) {
      console.error('❌ 맞춤 조리법 오류:', error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ 맞춤 조리법 생성 중 오류가 발생했습니다." }
      ]);
    } finally {
      setIsGeneratingCookingSteps(false);
    }
  };

  // 조리 시작 (1단계 표시)
  const startCooking = () => {
    if (cookingSteps.length === 0) return;
    setCurrentStepIndex(0);
  };

  // 다음 조리 단계
  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex < cookingSteps.length) {
      setCurrentStepIndex(nextIndex);
    } else {
      // 조리 완료
      finishCooking();
    }
  };

  // 이전 단계
  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    
  if (prevIndex >= 0) {
      setCurrentStepIndex(prevIndex);
    }
  };

  // 조리 완료
  const finishCooking = () => {
    if (!recipeDetail) return;
    
    let completeMessage = `🎉 "${recipeDetail.recipe_name}" 조리 완료!\n\n`;
    completeMessage += `축하합니다! 맛있는 요리가 완성되었습니다.\n\n`;
    completeMessage += `📊 영양 정보:\n`;
    completeMessage += `  • 칼로리: ${recipeDetail.nutrition_info.calories}kcal\n`;
    completeMessage += `  • 단백질: ${recipeDetail.nutrition_info.protein}\n`;
    completeMessage += `  • 탄수화물: ${recipeDetail.nutrition_info.carbs}\n`;
    completeMessage += `  • 지방: ${recipeDetail.nutrition_info.fat}\n\n`;
    completeMessage += `💡 아래 버튼을 눌러 식단에 기록하세요!`;
    
    setMessages((prev) => [...prev, { role: "bot", text: completeMessage }]);
    setCookingComplete(true);
  };

  // 조리 종료
  const exitCooking = () => {
    if (confirm("조리를 종료하고 메인으로 돌아가시겠습니까?")) {
      resetFlow();
    }
  };

  // 음식 기록하기 - 레시피 완료 후 호출
  const recordFood = async () => {
    if (!selectedRecipe || !recipeDetail) return;

    try {
      // 레시피 저장 API 호출 (새로운 API 사용)
      console.log(`📤 레시피 저장 요청: meal_type=${selectedMealType}`);
      
      const response = await fetch(`${apiEndpoint}/api/v1/recipes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipe_name: selectedRecipe.name,
          actual_servings: 1.0,  // TODO: 사용자가 입력하도록 개선
          meal_type: selectedMealType || 'lunch',  // ✨ 사용자가 선택한 식사 유형 사용
          nutrition_info: {
            calories: recipeDetail.nutrition_info.calories,
            protein: recipeDetail.nutrition_info.protein,
            carbs: recipeDetail.nutrition_info.carbs,
            fat: recipeDetail.nutrition_info.fat,
            fiber: recipeDetail.nutrition_info.fiber || "0g",
            sodium: recipeDetail.nutrition_info.sodium || "0mg"
          },
          // 재료 목록 전달
          ingredients: recipeDetail.ingredients ? recipeDetail.ingredients.map((ing) => ing.name) : [],
          // 음식 분류 추론 (레시피 이름에서)
          food_class_1: getFoodClassFromName(selectedRecipe.name)
        }),
      });

      const result = await response.json();

      if (result.success) {
        const nrfScore = result.data?.nrf_score || result.data?.health_score || 0;
        const successMessage = `✅ "${selectedRecipe.name}" 기록 완료!\n\n건강 점수(NRF9.3): ${nrfScore.toFixed(1)}점`;
        setMessages((prev) => [...prev, { role: "bot", text: successMessage }]);
        
        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: `❌ 기록 저장 실패: ${result.message || '알 수 없는 오류'}` }]);
      }
    } catch (error) {
      console.error('❌ 음식 기록 오류:', error);
      setMessages((prev) => [...prev, { role: "bot", text: '❌ 음식 기록 중 오류가 발생했습니다.' }]);
    }
  };

  // 처음으로 돌아가기
  const resetFlow = () => {
    setFlowStep("chat");
    setMessages([INITIAL_BOT_MESSAGE]);
    setRecommendedRecipes([]);
    setSelectedRecipe(null);
    setSelectedMealType(null);
    setPendingUserRequest(null);
    setHealthWarning("");
    setRecipeDetail(null);
    setCookingSteps([]);
    setCurrentStepIndex(-1);
    setRecipeIntro("");
    setCookingComplete(false);
    setLoadingRecipeDetail(false);
    setIngredientChecklistRecipe(null);
    setIngredientChecklistItems([]);
    setIngredientChecklistState({});
    setCookingMarkdown(null);
    setIsGeneratingCookingSteps(false);
  };

  // 재치있는 식단 추천 로딩 메시지 배열
  const funnyDietLoadingMessages = [
    '🏋️ 최고의 트레이너에게 식단 분석 받는 중...',
    '🤫 몰래 다른 거 찾아보는 중...',
    '📊 칼로리 계산하는 중...',
    '😰 좌절하고 추천받은 식단 계산해보기...',
    '🥗 건강한 식단 찾는 중...',
    '💪 영양소 균형 맞추는 중...',
    '🎯 당신에게 딱 맞는 식단 찾는 중...',
    '✨ 거의 다 왔어요!'
  ];

  // 식단 추천 채팅 보내기
  const sendDietChat = async () => {
    if (!dietChatInput.trim() || dietLoading) return;

    const userText = dietChatInput.trim();
    setDietChatInput("");

    setDietMessages((prev) => [...prev, { role: "user", text: userText }]);
    setDietLoading(true);
    
    // 재치있는 로딩 메시지 순환
    let messageIndex = 0;
    setDietLoadingStatus({ text: funnyDietLoadingMessages[0], seconds: 0 });
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % funnyDietLoadingMessages.length;
      setDietLoadingStatus({ 
        text: funnyDietLoadingMessages[messageIndex], 
        seconds: 0 
      });
    }, 2000); // 2초마다 메시지 변경

    try {
      // 사용자 인증 확인
      const authRes = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
        credentials: 'include',
      });
      
      if (!authRes.ok) {
        clearInterval(messageInterval);
        setDietMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ 로그인이 필요합니다. 로그인 페이지로 이동해주세요." },
        ]);
        setDietLoading(false);
        setDietLoadingStatus({ text: "", seconds: 0 });
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
        const responseData: DietPlanApiResponse = result.data;
        
        // API 응답을 프론트엔드 형식으로 변환
        const rawDietPlans = Array.isArray(responseData.dietPlans) ? responseData.dietPlans : [];
        const dietPlans: DietPlan[] = rawDietPlans.map((plan) => ({
          name: plan.name,
          description: plan.description,
          totalCalories: plan.totalCalories,
          meals: {
            breakfast: plan.meals?.breakfast,
            lunch: plan.meals?.lunch,
            dinner: plan.meals?.dinner,
            snack: plan.meals?.snack
          },
          nutrients: plan.nutrients,
          meal_details: plan.meal_details  // 끼니별 상세 정보 추가
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
      clearInterval(messageInterval);
      setDietLoading(false);
      setDietLoadingStatus({ text: "", seconds: 0 });
    }
  };

  // 식단 선택
  const selectDietPlan = (plan: DietPlan) => {
    setSelectedDietPlan(plan);
    // 선택 가능한 끼니만 체크 (존재하는 끼니만 true로 설정)
    setSelectedMeals({
      breakfast: !!plan.meals.breakfast,
      lunch: !!plan.meals.lunch,
      dinner: !!plan.meals.dinner,
      snack: !!plan.meals.snack,
    });
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

      // meal_details가 있으면 실제 칼로리 사용, 없으면 fallback (균등 분배)
      const useMealDetails = selectedDietPlan.meal_details && Object.keys(selectedDietPlan.meal_details).length > 0;
      
      // Fallback용: 전체 영양소 파싱 및 균등 분배
      let fallbackCaloriesPerMeal = 0;
      let fallbackProteinPerMeal = 0;
      let fallbackCarbPerMeal = 0;
      let fallbackFatPerMeal = 0;
      
      if (!useMealDetails) {
        const totalNutrients = parseNutrients(selectedDietPlan.nutrients || '');
        const totalCalories = parseCalories(selectedDietPlan.totalCalories || '0');
        
        const mealCount = [
          selectedDietPlan.meals.breakfast,
          selectedDietPlan.meals.lunch,
          selectedDietPlan.meals.dinner,
          selectedDietPlan.meals.snack
        ].filter(Boolean).length;
        
        fallbackCaloriesPerMeal = mealCount > 0 ? totalCalories / mealCount : 0;
        fallbackProteinPerMeal = mealCount > 0 ? totalNutrients.protein / mealCount : 0;
        fallbackCarbPerMeal = mealCount > 0 ? totalNutrients.carb / mealCount : 0;
        fallbackFatPerMeal = mealCount > 0 ? totalNutrients.fat / mealCount : 0;
        
        console.log('⚠️ meal_details 없음 - Fallback 균등 분배 사용', { fallbackCaloriesPerMeal, fallbackProteinPerMeal });
      } else {
        console.log('✅ meal_details 사용 - 실제 끼니별 칼로리 사용', selectedDietPlan.meal_details);
      }

      // 식단 저장 요청 데이터 구성 (선택된 끼니만)
      const meals = [];
      
      // 아침 (선택된 경우에만)
      if (selectedDietPlan.meals.breakfast && selectedMeals.breakfast) {
        const details = useMealDetails ? selectedDietPlan.meal_details?.breakfast : null;
        meals.push({
          food_name: `${selectedDietPlan.name} - 아침`,
          meal_type: 'breakfast',
          ingredients: selectedDietPlan.meals.breakfast.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: details?.calories || fallbackCaloriesPerMeal,
          protein: details?.protein || fallbackProteinPerMeal,
          carb: details?.carb || fallbackCarbPerMeal,
          fat: details?.fat || fallbackFatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }
      
      // 점심 (선택된 경우에만)
      if (selectedDietPlan.meals.lunch && selectedMeals.lunch) {
        const details = useMealDetails ? selectedDietPlan.meal_details?.lunch : null;
        meals.push({
          food_name: `${selectedDietPlan.name} - 점심`,
          meal_type: 'lunch',
          ingredients: selectedDietPlan.meals.lunch.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: details?.calories || fallbackCaloriesPerMeal,
          protein: details?.protein || fallbackProteinPerMeal,
          carb: details?.carb || fallbackCarbPerMeal,
          fat: details?.fat || fallbackFatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }
      
      // 저녁 (선택된 경우에만)
      if (selectedDietPlan.meals.dinner && selectedMeals.dinner) {
        const details = useMealDetails ? selectedDietPlan.meal_details?.dinner : null;
        meals.push({
          food_name: `${selectedDietPlan.name} - 저녁`,
          meal_type: 'dinner',
          ingredients: selectedDietPlan.meals.dinner.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: details?.calories || fallbackCaloriesPerMeal,
          protein: details?.protein || fallbackProteinPerMeal,
          carb: details?.carb || fallbackCarbPerMeal,
          fat: details?.fat || fallbackFatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }
      
      // 간식 (선택된 경우에만)
      if (selectedDietPlan.meals.snack && selectedMeals.snack) {
        const details = useMealDetails ? selectedDietPlan.meal_details?.snack : null;
        meals.push({
          food_name: `${selectedDietPlan.name} - 간식`,
          meal_type: 'snack',
          ingredients: selectedDietPlan.meals.snack.split(/[+,]/).map(s => s.trim()).filter(s => s.length > 0),
          calories: details?.calories || fallbackCaloriesPerMeal,
          protein: details?.protein || fallbackProteinPerMeal,
          carb: details?.carb || fallbackCarbPerMeal,
          fat: details?.fat || fallbackFatPerMeal,
          consumed_at: new Date().toISOString()
        });
      }
      
      // 선택된 끼니가 없으면 경고
      if (meals.length === 0) {
        setModalMessage('⚠️ 저장할 끼니를 최소 1개 이상 선택해주세요.');
        setShowModal(true);
        setIsSaving(false);
        return;
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
                  <div ref={chatContainerRef} className="space-y-3 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto scroll-smooth">
                    {messages.map((m, idx) => (
                      <div key={idx}>
                        {/* 사용자 메시지는 기존대로 */}
                        {m.role === "user" ? (
                          <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-line bg-green-500 text-white ml-auto shadow">
                            {m.text}
                          </div>
                        ) : (
                          /* 봇 메시지 */
                          <div>
                            {/* 건강 경고가 있으면 별도의 경고 메시지 버블로 표시 */}
                            {m.healthWarning ? (
                              <div className="max-w-[95%] rounded-lg px-4 py-3 text-sm leading-relaxed bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 shadow-sm">
                                <div className="flex items-start gap-2">
                                  <div className="text-xl">⚠️</div>
                                  <div className="flex-1">
                                    <div className="font-bold text-red-800 mb-1">건강 알림</div>
                                    <div className="text-red-700 whitespace-pre-line">
                                      {m.text}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* 일반 메시지 또는 레시피 추천 메시지 */
                              <div className="max-w-[95%] rounded-lg px-3 py-3 text-sm leading-relaxed bg-slate-100 text-slate-800 border border-slate-200">
                                {/* 메시지 텍스트 */}
                                <div className="whitespace-pre-line mb-2">
                                  {m.text}
                                </div>
                                
                                {/* 빠른 응답 제안 */}
                                {m.suggestions && m.suggestions.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {m.suggestions.map((suggestion, suggestionIdx) => (
                                      <button
                                        key={`suggestion-${idx}-${suggestionIdx}`}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="px-3 py-1 text-xs rounded-full border border-slate-300 bg-white text-slate-600 hover:border-green-400 hover:text-green-600 transition"
                                        type="button"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                
                                {/* 재료 확인 단계 */}
                                {m.actionType === "INGREDIENT_CHECK" && m.ingredientCheck && ingredientChecklistRecipe === m.ingredientCheck.recipeName && (
                                  <div className="mt-3 space-y-3 border border-slate-200 rounded-lg p-3 bg-white">
                                    <p className="text-xs text-slate-600">보유 중인 재료만 체크한 뒤 요리를 시작하세요.</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                      {m.ingredientCheck.ingredients.map((ingredient) => (
                                        <label key={ingredient} className="flex items-center gap-2 text-sm text-slate-700">
                                          <input
                                            type="checkbox"
                                            className="w-4 h-4 text-green-500"
                                            checked={ingredientChecklistState[ingredient] ?? true}
                                            onChange={() => toggleIngredientAvailability(ingredient)}
                                          />
                                          <span>{ingredient}</span>
                                        </label>
                                      ))}
                                    </div>
                                    <button
                                      onClick={handleStartCustomCooking}
                                      disabled={isGeneratingCookingSteps}
                                      className="w-full py-2 rounded-lg font-semibold text-sm text-white bg-green-500 active:bg-green-600 disabled:opacity-60"
                                    >
                                      {isGeneratingCookingSteps ? "조리법 준비 중..." : "요리 시작"}
                                    </button>
                                  </div>
                                )}
                                
                                {/* 식사 유형 선택 버튼 */}
                                {idx === messages.length - 1 && showMealTypeSelection && m.actionType === "CONFIRMATION" && (
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => handleMealTypeSelect('breakfast')}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 hover:border-orange-400 transition-all active:scale-95"
                                    >
                                      <div className="text-3xl mb-1">🌅</div>
                                      <div className="text-sm font-bold text-slate-800">아침</div>
                                    </button>
                                    <button
                                      onClick={() => handleMealTypeSelect('lunch')}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-2 border-yellow-200 hover:border-yellow-400 transition-all active:scale-95"
                                    >
                                      <div className="text-3xl mb-1">☀️</div>
                                      <div className="text-sm font-bold text-slate-800">점심</div>
                                    </button>
                                    <button
                                      onClick={() => handleMealTypeSelect('dinner')}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-2 border-indigo-200 hover:border-indigo-400 transition-all active:scale-95"
                                    >
                                      <div className="text-3xl mb-1">🌙</div>
                                      <div className="text-sm font-bold text-slate-800">저녁</div>
                                    </button>
                                    <button
                                      onClick={() => handleMealTypeSelect('snack')}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 border-2 border-pink-200 hover:border-pink-400 transition-all active:scale-95"
                                    >
                                      <div className="text-3xl mb-1">🍪</div>
                                      <div className="text-sm font-bold text-slate-800">간식</div>
                                    </button>
                                  </div>
                                )}
                            {/* 레시피 카드 표시 - 메시지 내부에 포함 */}
                            {m.recipeCards && m.recipeCards.length > 0 && (
                              <div className="mt-2 space-y-2">
                                <p className="text-xs text-slate-600 font-semibold mb-2">💚 추천 레시피를 선택해주세요:</p>
                                {m.recipeCards.map((recipe, recipeIdx) => (
                                  <button
                                    key={recipeIdx}
                                    onClick={() => selectRecipe(recipe)}
                                    disabled={loadingRecipeDetail}
                                    className="w-full text-left bg-white border-2 border-slate-300 rounded-lg p-2.5 hover:border-green-500 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <div className="font-semibold text-slate-900 mb-2 text-sm">{recipe.name}</div>
                                    <div className="space-y-1 text-xs text-slate-600">
                                      {/* 음식 설명 */}
                                      <div className="leading-relaxed">{recipe.description}</div>
                                      {/* 칼로리 */}
                                      {recipe.calories && (
                                        <div className="text-slate-500">• 칼로리: {recipe.calories}kcal</div>
                                      )}
                                      {/* 난이도 */}
                                      {recipe.difficulty && (
                                        <div className="text-slate-500">• 난이도: {recipe.difficulty}</div>
                                      )}
                                      {/* 소요시간 */}
                                      {recipe.cooking_time && (
                                        <div className="text-slate-500">• 소요시간: {recipe.cooking_time}</div>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                        <span>
                          {loadingStatus.text}... {loadingStatus.seconds > 0 && `(${loadingStatus.seconds}초)`}
                        </span>
                      </div>
                    )}
                    
                    {loadingRecipeDetail && (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                        <span>
                          {loadingStatus.text}... {loadingStatus.seconds > 0 && `(${loadingStatus.seconds}초)`}
                        </span>
                      </div>
                    )}
                  </div>


                  {/* 식단 기록 및 메뉴 버튼 */}
                  {cookingComplete && (
                    <div className="border-t border-slate-200 pt-3 pb-2 space-y-2">
                      <button
                        onClick={recordFood}
                        className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold text-sm active:bg-blue-600 transition shadow-md"
                      >
                        📝 식단에 기록하기
                      </button>
                      <button
                        onClick={resetFlow}
                        className="w-full py-3 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm active:bg-slate-300 transition"
                      >
                        🔙 메뉴로 돌아가기
                      </button>
                    </div>
                  )}

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
                    <li>&quot;나 오늘 대창 먹을건데 레시피 추천해줘&quot;</li>
                    <li>&quot;닭가슴살이랑 브로콜리 있는데 요리법 알려줘&quot;</li>
                    <li>&quot;저염식 고등어 요리 레시피 알려줘&quot;</li>
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

                {cookingMarkdown && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800">
                    <div className="text-xs font-semibold text-slate-500 mb-2">재료 변경 사항</div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                      {cookingMarkdown}
                    </ReactMarkdown>
                  </div>
                )}

                <div className="bg-white rounded-xl border-2 border-green-500 shadow-lg p-6">
                  <div className="text-center mb-4">
                    {currentStepIndex >= 0 ? (
                      <div className="inline-block bg-green-500 text-white px-3 py-1.5 rounded-full font-bold text-sm mb-3">
                        STEP {cookingSteps[currentStepIndex]?.stepNumber} / {cookingSteps.length}
                      </div>
                    ) : (
                      <div className="inline-block bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-bold text-sm mb-3">
                        조리를 시작해보세요
                      </div>
                    )}
                  </div>

                  <div className="text-center mb-6">
                    {currentStepIndex >= 0 ? (
                      <div className="space-y-3 text-slate-800">
                        <p className="text-base font-semibold">{cookingSteps[currentStepIndex]?.title}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {cookingSteps[currentStepIndex]?.description}
                        </p>
                        {cookingSteps[currentStepIndex]?.tip && (
                          <p className="text-xs text-green-600 whitespace-pre-line">
                            💡 {cookingSteps[currentStepIndex]?.tip}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">아래 버튼을 눌러 조리를 시작하세요.</p>
                    )}
                  </div>

                  {currentStepIndex >= 0 && (
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={prevStep}
                        disabled={currentStepIndex === 0}
                        className="py-3 px-4 bg-slate-200 text-slate-700 rounded-lg font-bold text-base active:bg-slate-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← 이전
                      </button>
                      <button
                        onClick={nextStep}
                        className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold text-base active:bg-green-600 transition shadow-md"
                      >
                        {currentStepIndex < cookingSteps.length - 1 ? "다음 단계 →" : "조리 완료!"}
                      </button>
                    </div>
                  )}
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
                    맛있는 &quot;{selectedRecipe?.name}&quot;이<br />완성되었습니다!
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
                                onClick={() => selectDietPlan(plan)}
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
                                        <span className="font-semibold">🌅 아침:</span> {plan.meals.breakfast.slice(0, 25)}...
                                        {plan.meal_details?.breakfast?.calories && (
                                          <span className="text-green-600 font-semibold ml-1">
                                            ({plan.meal_details.breakfast.calories}kcal)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {plan.meals.lunch && (
                                      <div className="text-xs text-slate-500">
                                        <span className="font-semibold">☀️ 점심:</span> {plan.meals.lunch.slice(0, 25)}...
                                        {plan.meal_details?.lunch?.calories && (
                                          <span className="text-green-600 font-semibold ml-1">
                                            ({plan.meal_details.lunch.calories}kcal)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {plan.meals.dinner && (
                                      <div className="text-xs text-slate-500">
                                        <span className="font-semibold">🌙 저녁:</span> {plan.meals.dinner.slice(0, 25)}...
                                        {plan.meal_details?.dinner?.calories && (
                                          <span className="text-green-600 font-semibold ml-1">
                                            ({plan.meal_details.dinner.calories}kcal)
                                          </span>
                                        )}
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
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                        <span>
                          {dietLoadingStatus.text}
                        </span>
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
                    <li>&quot;요즘 고기류를 먹고 싶은데 식단 추천해줘&quot;</li>
                    <li>&quot;내가 가진 식재료 기반으로 식단 짜줘&quot;</li>
                    <li>&quot;다이어트용 저칼로리 식단 알려줘&quot;</li>
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
                  <h2 className="text-lg font-bold text-slate-900 mb-2 text-center">하루 식단 구성</h2>
                  <p className="text-xs text-slate-500 text-center mb-4">저장할 끼니를 선택하세요</p>
                  
                  <div className="space-y-3">
                    {selectedDietPlan.meals.breakfast && (
                      <div className={`bg-orange-50 rounded-xl p-3 border-2 transition ${
                        selectedMeals.breakfast ? 'border-orange-400' : 'border-orange-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedMeals.breakfast}
                              onChange={(e) => setSelectedMeals(prev => ({ ...prev, breakfast: e.target.checked }))}
                              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <span className="text-lg">🌅</span>
                            <h3 className="text-sm font-bold text-orange-700">아침</h3>
                          </div>
                          {selectedDietPlan.meal_details?.breakfast?.calories && (
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                              {selectedDietPlan.meal_details.breakfast.calories}kcal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed ml-6">{selectedDietPlan.meals.breakfast}</p>
                        {selectedDietPlan.meal_details?.breakfast && (
                          <div className="text-xs text-slate-500 mt-2 ml-6">
                            단백질 {selectedDietPlan.meal_details.breakfast.protein}g / 
                            탄수화물 {selectedDietPlan.meal_details.breakfast.carb}g / 
                            지방 {selectedDietPlan.meal_details.breakfast.fat}g
                          </div>
                        )}
                      </div>
                    )}

                    {selectedDietPlan.meals.lunch && (
                      <div className={`bg-yellow-50 rounded-xl p-3 border-2 transition ${
                        selectedMeals.lunch ? 'border-yellow-400' : 'border-yellow-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedMeals.lunch}
                              onChange={(e) => setSelectedMeals(prev => ({ ...prev, lunch: e.target.checked }))}
                              className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                            />
                            <span className="text-lg">☀️</span>
                            <h3 className="text-sm font-bold text-yellow-700">점심</h3>
                          </div>
                          {selectedDietPlan.meal_details?.lunch?.calories && (
                            <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                              {selectedDietPlan.meal_details.lunch.calories}kcal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed ml-6">{selectedDietPlan.meals.lunch}</p>
                        {selectedDietPlan.meal_details?.lunch && (
                          <div className="text-xs text-slate-500 mt-2 ml-6">
                            단백질 {selectedDietPlan.meal_details.lunch.protein}g / 
                            탄수화물 {selectedDietPlan.meal_details.lunch.carb}g / 
                            지방 {selectedDietPlan.meal_details.lunch.fat}g
                          </div>
                        )}
                      </div>
                    )}

                    {selectedDietPlan.meals.dinner && (
                      <div className={`bg-indigo-50 rounded-xl p-3 border-2 transition ${
                        selectedMeals.dinner ? 'border-indigo-400' : 'border-indigo-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedMeals.dinner}
                              onChange={(e) => setSelectedMeals(prev => ({ ...prev, dinner: e.target.checked }))}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-lg">🌙</span>
                            <h3 className="text-sm font-bold text-indigo-700">저녁</h3>
                          </div>
                          {selectedDietPlan.meal_details?.dinner?.calories && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                              {selectedDietPlan.meal_details.dinner.calories}kcal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed ml-6">{selectedDietPlan.meals.dinner}</p>
                        {selectedDietPlan.meal_details?.dinner && (
                          <div className="text-xs text-slate-500 mt-2 ml-6">
                            단백질 {selectedDietPlan.meal_details.dinner.protein}g / 
                            탄수화물 {selectedDietPlan.meal_details.dinner.carb}g / 
                            지방 {selectedDietPlan.meal_details.dinner.fat}g
                          </div>
                        )}
                      </div>
                    )}

                    {selectedDietPlan.meals.snack && (
                      <div className={`bg-pink-50 rounded-xl p-3 border-2 transition ${
                        selectedMeals.snack ? 'border-pink-400' : 'border-pink-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedMeals.snack}
                              onChange={(e) => setSelectedMeals(prev => ({ ...prev, snack: e.target.checked }))}
                              className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                            />
                            <span className="text-lg">🍎</span>
                            <h3 className="text-sm font-bold text-pink-700">간식</h3>
                          </div>
                          {selectedDietPlan.meal_details?.snack?.calories && (
                            <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                              {selectedDietPlan.meal_details.snack.calories}kcal
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed ml-6">{selectedDietPlan.meals.snack}</p>
                        {selectedDietPlan.meal_details?.snack && (
                          <div className="text-xs text-slate-500 mt-2 ml-6">
                            단백질 {selectedDietPlan.meal_details.snack.protein}g / 
                            탄수화물 {selectedDietPlan.meal_details.snack.carb}g / 
                            지방 {selectedDietPlan.meal_details.snack.fat}g
                          </div>
                        )}
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
                    {isSaving ? '저장 중...' : `선택한 끼니 저장하기 (${
                      [selectedMeals.breakfast, selectedMeals.lunch, selectedMeals.dinner, selectedMeals.snack]
                        .filter(Boolean).length
                    }개)`}
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
