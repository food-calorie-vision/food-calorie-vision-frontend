"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import { useSession } from "@/contexts/SessionContext";
import { API_BASE_URL } from "@/utils/api";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatBubble from "@/components/chat/ChatBubble";
import { useChatSession } from "@/hooks/useChatSession";

type FlowStep = "chat" | "select" | "cooking" | "complete";
type RecipeAgentActionType =
  | "CONFIRMATION"
  | "HEALTH_CONFIRMATION"
  | "RECOMMENDATION_RESULT"
  | "TEXT_ONLY"
  | "INGREDIENT_CHECK"
  | "COOKING_STEPS";
type ChatMessage = { 
  role: "bot" | "user"; 
  text: string;
  recipeCards?: Recipe[];
  dietCards?: DietPlan[];
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
  total_weight_g?: number;
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

// 챗봇 초기 안내 메시지 배열 (레시피)
const INITIAL_RECIPE_MESSAGES: ChatMessage[] = [
  { role: "bot", text: "안녕하세요! KCalculator 레시피 도우미입니다. 🍳" },
  { role: "bot", text: "어떤 요리가 궁금하세요? 원하시는 레시피를 말씀해주시면 맞춤 추천해드릴게요." },
  { role: "bot", text: "예) '대창 레시피 추천해줘', '닭가슴살이랑 브로콜리 있는데 요리법 알려줘'" },
  { role: "bot", text: "⚠️ 본 추천은 참고용 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다." }
];

// 챗봇 초기 안내 메시지 배열 (식단)
const INITIAL_DIET_MESSAGES: ChatMessage[] = [
  { role: "bot", text: "안녕하세요! KCalculator 식단 도우미입니다. 🥗" },
  { role: "bot", text: "건강 목표와 취향에 맞는 식단을 추천해드릴게요." },
  { role: "bot", text: "예) '고기 위주 식단 추천해줘', '다이어트용 저칼로리 식단 짜줘'" },
  { role: "bot", text: "⚠️ 본 추천은 참고용 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다." }
];

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

const recipeConfirmDebug = (...args: unknown[]) => {
  console.debug("[RecipeConfirm]", ...args);
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
  const { isAuthenticated, userName, logout, isCheckingAuth, userId } = useSession();
  const { sessionId } = useChatSession();
  const apiEndpoint = API_BASE_URL;

  // URL params에서 tab 읽기 (기본값: recipe)
  const currentTab = (searchParams?.get("tab") || "recipe") as "recipe" | "diet";

  // 흐름 관리
  const [flowStep, setFlowStep] = useState<FlowStep>("chat");
  
  // 챗봇 상태
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState({ text: "", seconds: 0 });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 초기 메시지 순차 표시 함수
  const startInitialMessageSequence = (
    messageSetter: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
    loadingSetter: React.Dispatch<React.SetStateAction<boolean>>,
    messagesToShow: ChatMessage[]
  ) => {
    // 기존 타임아웃 클리어
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    
    messageSetter([]);
    loadingSetter(true);
    setLoadingStatus({ text: "메시지를 불러오는 중", seconds: 0 });

    let totalDelay = 200; // 첫 메시지 표시 전 0.2초 대기 (속도 개선)

    messagesToShow.forEach((msg, index) => {
      const timeout = setTimeout(() => {
        messageSetter((prev) => [...prev, msg]);
        
        if (index === messagesToShow.length - 1) {
          loadingSetter(false);
          setLoadingStatus({ text: "", seconds: 0 });
        }
      }, totalDelay);

      timeoutsRef.current.push(timeout);
      
      // 다음 메시지 딜레이: 기본 0.3초 + 메시지 길이에 비례 (속도 개선)
      totalDelay += 300 + msg.text.length * 20;
    });
  };
  
  // 재치있는 로딩 메시지 배열
  const funnyRecipeLoadingMessages = [
    '🩺 사용자의 질환과 알러지를 확인하고 있습니다...',
    '🥗 건강에 맞는 맞춤 레시피를 생성 중입니다...',
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
  const [dietMessages, setDietMessages] = useState<ChatMessage[]>([]);
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
const [contextReady, setContextReady] = useState(false);
  const [pendingRecipeConfirmation, setPendingRecipeConfirmation] = useState<string | null>(null);
  const [pendingHealthConfirmation, setPendingHealthConfirmation] = useState<string | null>(null);
  const [healthConfirmationWarning, setHealthConfirmationWarning] = useState<string>("");
  const [healthConfirmationSuggestions, setHealthConfirmationSuggestions] = useState<string[]>([]);
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 컴포넌트 마운트 또는 탭 변경 시 초기 메시지 표시
  useEffect(() => {
    if (currentTab === "recipe") {
      // 사용자 메시지가 없다면, 초기 안내 상태로 간주하고 애니메이션 실행
      if (!messages.some(m => m.role === 'user')) {
        startInitialMessageSequence(setMessages, setIsLoading, INITIAL_RECIPE_MESSAGES);
      }
    } else if (currentTab === "diet") {
      // 사용자 메시지가 없다면, 초기 안내 상태로 간주하고 애니메이션 실행
      if (!dietMessages.some(m => m.role === 'user')) {
        startInitialMessageSequence(setDietMessages, setDietLoading, INITIAL_DIET_MESSAGES);
      }
    }

    // 컴포넌트 언마운트 시 타임아웃 클리어
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [currentTab]);

  // Recommend 탭 진입 시 사용자 컨텍스트 미리 새로고침
  const refreshChatContext = useCallback(async () => {
    if (!isAuthenticated || isCheckingAuth) {
      return;
    }
    try {
      setContextReady(false);
      const res = await fetch(`${apiEndpoint}/api/v1/chat/context`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        console.error("⚠️ 컨텍스트 새로고침 실패:", res.status);
        return;
      }
      await res.json(); // 데이터는 현재 UI에서 직접 사용하지 않음
      setContextReady(true);
    } catch (error) {
      console.error("⚠️ 컨텍스트 새로고침 오류:", error);
    }
  }, [apiEndpoint, isAuthenticated, isCheckingAuth]);

  useEffect(() => {
    if (!isAuthenticated || isCheckingAuth) {
      return;
    }
    refreshChatContext();
  }, [refreshChatContext, isAuthenticated, isCheckingAuth]);

  useEffect(() => {
    if (!isAuthenticated || isCheckingAuth || !contextReady) return;
    const prewarm = async () => {
      try {
        await fetch(`${apiEndpoint}/api/v1/chat/prewarm`, {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("⚠️ AI 워밍업 실패:", error);
      }
    };
    prewarm();
  }, [apiEndpoint, contextReady, isAuthenticated, isCheckingAuth]);


  // 채팅 메시지 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, loadingRecipeDetail, dietMessages, dietLoading]);

  // 탭 변경
  const handleTabChange = (tab: "recipe" | "diet") => {
    router.push(`/recommend?tab=${tab}`);
  };


  // 식사 유형 선택 처리
  const buildConversationHistory = (baseMessages: ChatMessage[]) => {
    return baseMessages.slice(-6).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text
    }));
  };
  
  const handleRecipeAgentResponse = (response: RecipeAgentResponse, fallbackUserText: string) => {
    const safeSuggestions =
      response.suggestions && response.suggestions.length > 0
        ? response.suggestions
        : ["레시피 추천해줘", "다른 질문 있어"];
    if (response.action_type === "HEALTH_CONFIRMATION") {
      setPendingUserRequest(null);
      setPendingRecipeConfirmation(null);
      setPendingHealthConfirmation(fallbackUserText);
      setShowMealTypeSelection(false);
      setHealthConfirmationWarning(response.data?.health_warning || response.message || "건강을 우선할까요?");
      setHealthConfirmationSuggestions(safeSuggestions);
      return;
    }
    if (response.action_type === "CONFIRMATION") {
      setPendingUserRequest(fallbackUserText);
      setShowMealTypeSelection(true);
      setRecommendedRecipes([]);
      setSelectedRecipe(null);
      setPendingHealthConfirmation(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.message,
          actionType: response.action_type,
          suggestions: safeSuggestions
        }
      ]);
      return;
    }
    
    if (response.action_type === "TEXT_ONLY") {
      setPendingUserRequest(null);
      setShowMealTypeSelection(false);
      setRecommendedRecipes([]);
      setSelectedRecipe(null);
      setPendingHealthConfirmation(null);
      setHealthConfirmationWarning("");
      setHealthConfirmationSuggestions([]);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.message,
          actionType: response.action_type,
          suggestions: safeSuggestions
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
    setPendingHealthConfirmation(null);
    setHealthConfirmationWarning("");
    setHealthConfirmationSuggestions([]);
    setRecommendedRecipes(recipes);
    setSelectedRecipe(null);
    
    const botMessage = response.message || response.data?.user_friendly_message || `✅ "${fallbackUserText}" 관련 레시피를 추천해드릴게요!\n\n아래에서 원하시는 레시피를 선택해주세요! 🍳`;
    
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: botMessage,
        recipeCards: recipes,
        actionType: response.action_type,
        suggestions: safeSuggestions
      }
    ]);
  };
  
  const requestRecipeAgentResponse = async ({
    latestUserMessage,
    baseRequest,
    mealType,
    conversationMessages,
    mode = "clarify",
    safetyMode,
  }: {
    latestUserMessage: string;
    baseRequest?: string;
    mealType?: string | null;
    conversationMessages: ChatMessage[];
    mode?: "clarify" | "execute";
    safetyMode?: "proceed" | "health_first";
  }) => {
    if (!latestUserMessage || !sessionId) return null;
    
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
    
    let result: { response?: string; message?: string; needs_tool_call?: boolean } | null = null;

    try {
      // API 호출 전 필수 값 확인
      if (!userId || !sessionId) {
        clearInterval(messageInterval);
        setIsLoading(false);
        setLoadingStatus({ text: "", seconds: 0 });

        const errorMsg = !userId ? "사용자 정보를 불러오는 중입니다." : "세션 정보를 초기화하는 중입니다.";
        console.error("API 호출 중단:", errorMsg);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `⚠️ ${errorMsg} 잠시 후 다시 시도해주세요.` },
        ]);
        return;
      }
      
      recipeConfirmDebug("Dispatching POST /chat", {
        sessionId,
        userId,
        mode,
        latestUserMessage,
        baseRequest,
        mealType,
      });
      const res = await fetch(`${apiEndpoint}/api/v1/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          message: baseRequest || latestUserMessage,
          mode,
          safety_mode: safetyMode || null,
        }),
      });
      
      result = await res.json();
      recipeConfirmDebug("POST /chat settled", {
        status: res.status,
        needsToolCall: result?.needs_tool_call,
        rawResponseType: typeof result?.response,
      });
      
      if (result.response) {
        // 백엔드 응답이 문자열화된 JSON일 경우 파싱
        try {
          const parsedData = JSON.parse(result.response);
          handleRecipeAgentResponse(parsedData as RecipeAgentResponse, latestUserMessage);
        } catch (parseError) {
          console.error('❌ 레시피 응답 파싱 실패:', parseError, result.response);
          const fallbackMessage = typeof result.response === 'string'
            ? result.response
            : 'AI 응답을 해석할 수 없어요.';
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: fallbackMessage },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ 레시피 추천에 실패했습니다: ${result.message || '알 수 없는 오류'}` },
        ]);
      }
    } catch (error) {
      console.error('❌ 레시피 추천 오류:', error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ 서버와 통신 중 문제가 발생했습니다. 나중에 다시 시도해주세요." },
      ]);
      setPendingUserRequest("");
      return null;
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
      setLoadingStatus({ text: "", seconds: 0 });
    }

    const responseSummary = { needsToolCall: Boolean(result?.needs_tool_call) };
    recipeConfirmDebug("requestRecipeAgentResponse completed", responseSummary);
    return responseSummary;
  };
  
  const affirmativeTokens = ["네", "넵", "예", "응", "어", "좋아요", "좋아", "그래", "그래요", "ok", "ㅇ", "ㅇㅇ"];
  const negativeTokens = ["아니", "아니요", "아니오", "싫어", "괜찮아", "괜찮아요", "노", "no"];
  const healthProceedTokens = [
    "그대로진행",
    "그대로진행해줘",
    "원래대로",
    "원래대로진행",
    "그래도진행",
    "진행해줘",
    "그대로가",
    "그대로",
    "괜찮아그대로",
    "그대로부탁해",
  ];
  const healthSaferTokens = [
    "건강하게",
    "건강하게바꿔줘",
    "건강우선",
    "건강위주",
    "저염으로",
    "안전하게",
    "건강하게해줘",
    "건강하게추천",
    "조심할래",
    "조심해서",
  ];

  const normalizeAnswer = (text: string) => text.replace(/\s+/g, "").toLowerCase();

  const processRecipeUserMessage = async (userText: string, baseRequest?: string, mealTypeOverride?: string | null) => {
    const trimmed = userText.trim();
    if (!trimmed) return;
    
    const updatedMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(updatedMessages);
    setPendingUserRequest(null);
    setShowMealTypeSelection(false);

    const normalized = normalizeAnswer(trimmed);
    const isAffirmative = affirmativeTokens.includes(normalized);
    const isNegative = negativeTokens.includes(normalized);

    if (pendingHealthConfirmation) {
      recipeConfirmDebug("Pending health confirmation detected", {
        reply: trimmed,
        normalizedReply: normalized,
      });
      const storedHealth = pendingHealthConfirmation;
      const isProceed = healthProceedTokens.includes(normalized);
      const isHealthFirst = healthSaferTokens.includes(normalized);
      if (isProceed || isHealthFirst) {
        setPendingHealthConfirmation(null);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: isProceed
              ? "알겠습니다. 말씀하신 그대로 진행해볼게요!"
              : "좋아요. 건강을 우선해서 레시피를 찾아볼게요.",
          },
        ]);
        await requestRecipeAgentResponse({
          latestUserMessage: storedHealth,
          baseRequest: storedHealth,
          mealType: mealTypeOverride,
          conversationMessages: [...updatedMessages, { role: "bot", text: "레시피를 준비하는 중입니다." }],
          mode: "execute",
          safetyMode: isProceed ? "proceed" : "health_first",
        });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "건강을 우선할지, 원래대로 진행할지 알려주세요 😊",
            suggestions: ["그대로 진행해줘", "건강하게 바꿔줘"],
          },
        ]);
      }
      return;
    }

    if (pendingRecipeConfirmation) {
      recipeConfirmDebug("Pending confirmation detected", {
        reply: trimmed,
        normalizedReply: normalized,
        pendingRecipeConfirmation,
        isAffirmative,
        isNegative,
      });
      if (isAffirmative) {
        const stored = pendingRecipeConfirmation;
        setPendingRecipeConfirmation(null);
        recipeConfirmDebug("Affirmative reply received, triggering execute mode", {
          storedRequest: stored,
          mealTypeOverride,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "좋아요! 잠시만 기다려주세요. 레시피를 찾아볼게요.",
          },
        ]);
        await requestRecipeAgentResponse({
          latestUserMessage: stored,
          baseRequest: stored,
          mealType: mealTypeOverride,
          conversationMessages: [...updatedMessages, { role: "bot", text: "레시피를 준비하는 중입니다." }],
          mode: "execute",
        });
      } else if (isNegative) {
        setPendingRecipeConfirmation(null);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "알겠습니다. 다른 요청이 있으면 말씀해주세요!",
          },
        ]);
        recipeConfirmDebug("Negative reply received, pending confirmation cleared");
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "레시피를 보여드릴까요? 네/아니오로 알려주세요 😊",
            suggestions: ["네, 보여줘", "아니, 괜찮아"],
          },
        ]);
        recipeConfirmDebug("Ambiguous reply received while waiting for confirmation");
      }
      return;
    }
    
    const detectedMealType = mealTypeOverride ?? detectMealTypeFromText(trimmed);
    if (detectedMealType) {
      setSelectedMealType(detectedMealType);
    }
    
    setRecommendedRecipes([]);
    setSelectedRecipe(null);
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    
    const clarifyResult = await requestRecipeAgentResponse({
      latestUserMessage: trimmed,
      baseRequest: baseRequest || trimmed,
      mealType: detectedMealType,
      conversationMessages: updatedMessages,
      mode: "clarify",
    });

    if (clarifyResult?.needsToolCall) {
      recipeConfirmDebug("Clarify result requires user confirmation", {
        originalMessage: trimmed,
        baseRequest,
        detectedMealType,
      });
      setPendingRecipeConfirmation(baseRequest || trimmed);
    } else if (userMessageCount === 0) {
      setPendingRecipeConfirmation(null);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || isLoading || isCheckingAuth || !userId || !sessionId) return;
    
    const userText = chatInput.trim();
    setChatInput("");
    await processRecipeUserMessage(userText);
  };
  
  const handleSuggestionClick = async (text: string) => {
    if (isLoading || isCheckingAuth || !isAuthenticated || !userId || !sessionId) {
      console.warn("Suggestion click ignored: Chat is not ready or user not authenticated.");
      return;
    }
    await processRecipeUserMessage(text);
  };

  const handleMealTypeSelect = async (mealType: string) => {
    if (isLoading || isCheckingAuth || !isAuthenticated || !userId || !sessionId) {
      console.warn("Meal type selection ignored: Chat is not ready or user not authenticated.");
      return;
    }
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
      if (!isAuthenticated) {
        setMessages((prev) => [...prev, { role: "bot", text: "⚠️ 로그인이 필요합니다." }]);
        setLoadingRecipeDetail(false);
        return;
      }
      const res = await fetch(`${apiEndpoint}/api/v1/recipes/ingredient-check`, {
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
      if (!isAuthenticated) {
        setMessages((prev) => [...prev, { role: "bot", text: "⚠️ 로그인이 필요합니다." }]);
        setIsGeneratingCookingSteps(false);
        return;
      }
      const res = await fetch(`${apiEndpoint}/api/v1/recipes/custom-recipe`, {
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
          ? customData.steps.map((step: { step_number?: number; stepNumber?: number; title?: string; description?: string; tip?: string }, index: number) => ({
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
          },
          total_weight_g: customData.total_weight_g
        });
        setRecipeIntro(customData.intro || "");
        setCookingMarkdown(customData.instructions_markdown || "");
        setCookingSteps(convertedSteps);
        setCurrentStepIndex(-1);
        setCookingComplete(false);
        setIngredientChecklistRecipe(null);
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
    setFlowStep("complete");
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
                      portion_size_g: recipeDetail.total_weight_g || 250.0,
                      meal_type: selectedMealType || 'lunch',  // ✨ 사용자가 선택한 식사 유형 사용
                      nutrition_info: {            calories: recipeDetail.nutrition_info.calories,
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
    startInitialMessageSequence(setMessages, setIsLoading, INITIAL_RECIPE_MESSAGES);
    setRecommendedRecipes([]);
    setSelectedRecipe(null);
    setSelectedMealType(null);
    setPendingUserRequest(null);
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
    if (!dietChatInput.trim() || dietLoading || isCheckingAuth || !userId || !sessionId) return;

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
      if (!isAuthenticated) {
        clearInterval(messageInterval);
        setDietLoading(false);
        setDietLoadingStatus({ text: "", seconds: 0 });
        setDietMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ 로그인이 필요합니다. 로그인 페이지로 이동해주세요." },
        ]);
        return;
      }
      // user_id와 session_id 체크는 isCheckingAuth 또는 userId, sessionId 자체로 한번 더 걸러지므로, 명시적인 재확인 대신 흐름상 필요한 메시지 추가
      if (!userId || !sessionId) {
        clearInterval(messageInterval);
        setDietLoading(false);
        setDietLoadingStatus({ text: "", seconds: 0 });
        console.error("User ID 또는 Session ID가 호출 시점에 준비되지 않았습니다.");
        setDietMessages((prev) => [
          ...prev,
          { role: "bot", text: "잠시 후 다시 시도해주세요." },
        ]);
        return;
      }
      
      // 식단 추천 전용 API 호출 (/api/v1/recommend/diet-plan)
      const res = await fetch(`${apiEndpoint}/api/v1/recommend/diet-plan`, {
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
        try {
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
- 기초대사량(BMR): ${(responseData.bmr || 0).toFixed(1)} kcal/day
- 1일 총 에너지 소비량(TDEE): ${(responseData.tdee || 0).toFixed(1)} kcal/day
- 목표 칼로리: ${(responseData.targetCalories || 0).toFixed(1)} kcal/day
- 건강 목표: ${responseData.healthGoalKr || '정보 없음'}

아래에서 원하시는 식단을 선택해주세요! 🍽️`;
          
          // 메시지에 식단 카드 포함
          setDietMessages((prev) => [...prev, { 
            role: "bot", 
            text: botMessage,
            dietCards: dietPlans
          }]);
        } catch (parseError) {
          console.error('❌ 식단 응답 파싱 실패:', parseError, result.response);
          setDietMessages((prev) => [
            ...prev,
            { role: "bot", text: "AI 응답을 해석할 수 없어요. 잠시 후 다시 시도해주세요." },
          ]);
        }
      } else {
        const message = result.message || '알 수 없는 오류';
        setDietMessages((prev) => [
          ...prev,
          { role: "bot", text: `❌ 식단 추천 실패: ${message}` },
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
    if (!isAuthenticated) {
      setModalMessage('⚠️ 로그인이 필요합니다.');
      setShowModal(true);
      return;
    }

    setIsSaving(true);

    try {
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
          food_name: `${selectedDietPlan.name}: ${selectedDietPlan.meals.breakfast}`,
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
          food_name: `${selectedDietPlan.name}: ${selectedDietPlan.meals.lunch}`,
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
          food_name: `${selectedDietPlan.name}: ${selectedDietPlan.meals.dinner}`,
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
          food_name: `${selectedDietPlan.name}: ${selectedDietPlan.meals.snack}`,
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
    startInitialMessageSequence(setDietMessages, setDietLoading, INITIAL_DIET_MESSAGES);
    setRecommendedDietPlans([]);
    setSelectedDietPlan(null);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white mobile-content">
      <MobileHeader isLoggedIn={isAuthenticated} userName={userName} handleLogout={logout} />

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
        {(isCheckingAuth || !userId || !sessionId) ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <TypingIndicator />
            <p className="mt-4 text-slate-600">사용자 정보를 안전하게 불러오는 중...</p>
          </div>
        ) : (
          <>
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
                  <div ref={chatContainerRef} className="space-y-4 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto scroll-smooth flex flex-col p-2">
                    {messages.map((m, idx) => (
                      <div key={idx} className="flex flex-col">
                        {m.role === 'user' ? (
                          <ChatBubble role="user">
                            {m.text}
                          </ChatBubble>
                        ) : (
                          <>
                            <ChatBubble role="bot">
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
                                        disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                                        className="px-3 py-1 text-xs rounded-full border border-slate-300 bg-white text-slate-600 hover:border-green-400 hover:text-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                                      disabled={isGeneratingCookingSteps || isLoading || isCheckingAuth || !userId || !sessionId}
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
                                      disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 hover:border-orange-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <div className="text-3xl mb-1">🌅</div>
                                      <div className="text-sm font-bold text-slate-800">아침</div>
                                    </button>
                                    <button
                                      onClick={() => handleMealTypeSelect('lunch')}
                                      disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-2 border-yellow-200 hover:border-yellow-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <div className="text-3xl mb-1">☀️</div>
                                      <div className="text-sm font-bold text-slate-800">점심</div>
                                    </button>
                                    <button
                                      onClick={() => handleMealTypeSelect('dinner')}
                                      disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-2 border-indigo-200 hover:border-indigo-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <div className="text-3xl mb-1">🌙</div>
                                      <div className="text-sm font-bold text-slate-800">저녁</div>
                                    </button>
                                    <button
                                      onClick={() => handleMealTypeSelect('snack')}
                                      disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                                      className="py-4 px-3 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 border-2 border-pink-200 hover:border-pink-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              </ChatBubble>
                          </>
                        )}
                      </div>
                    ))}

                    {pendingHealthConfirmation && healthConfirmationWarning && (
                      <ChatBubble role="bot" className="!bg-gradient-to-r !from-red-50 !to-orange-50 !border-red-300 !shadow-sm">
                        <div className="flex items-start gap-2">
                          <div className="text-xl">⚠️</div>
                          <div className="flex-1">
                            <div className="font-bold text-red-800 mb-1">건강 알림</div>
                            <div className="text-red-700 whitespace-pre-line text-sm">
                              {healthConfirmationWarning}
                            </div>
                          </div>
                        </div>
                        {healthConfirmationSuggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {healthConfirmationSuggestions.map((suggestion, suggestionIdx) => (
                              <button
                                key={`health-confirm-${suggestionIdx}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                                className="px-3 py-1 text-xs rounded-full border border-red-200 bg-white text-red-700 hover:border-red-400 hover:text-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </ChatBubble>
                    )}

                    {isLoading && (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                        <TypingIndicator />
                        <span>
                          {loadingStatus.text}{loadingStatus.text && '...'} {loadingStatus.seconds > 0 && `(${loadingStatus.seconds}초)`}
                        </span>
                      </div>
                    )}
                    
                    {loadingRecipeDetail && (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                        <TypingIndicator />
                        <span>
                          {loadingStatus.text}{loadingStatus.text && '...'} {loadingStatus.seconds > 0 && `(${loadingStatus.seconds}초)`}
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
                      disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                    />
                    <button
                      onClick={sendChat}
                      disabled={isLoading || isCheckingAuth || !userId || !sessionId}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        (isLoading || isCheckingAuth || !userId || !sessionId)
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

                {/* Recipe Adjusted Banner */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-800 font-semibold">
                    선택하신 재료에 맞게 레시피가 조정되었어요!
                  </p>
                </div>

                {/* Ingredients & Notes Section */}
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-4">
                  <h2 className="text-base font-bold text-slate-900 mb-3 border-b pb-2">
                    📋 재료 및 주요 변경사항
                  </h2>
                  
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">재료 목록</h3>
                    <ul className="space-y-1.5 text-sm pl-2">
                      {ingredientChecklistItems.map((ingredient) => {
                        const hasIngredient = ingredientChecklistState[ingredient] ?? true;
                        const detail = recipeDetail?.ingredients.find(d => d.name === ingredient);
                        return (
                          <li key={ingredient} className={`flex items-center gap-2 ${!hasIngredient ? 'text-slate-400' : 'text-slate-700'}`}>
                            <span className={`font-medium ${!hasIngredient ? 'line-through' : ''}`}>
                              {ingredient}
                            </span>
                            {detail?.amount && <span className="text-xs text-slate-500">({detail.amount})</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {(() => {
                    const allTips = cookingSteps
                      .map(step => step.tip)
                      .filter(tip => tip && tip.trim() !== '');
                      
                    if (allTips.length > 0) {
                      return (
                        <div className="border-t border-slate-100 pt-3">
                          <h3 className="text-sm font-semibold text-slate-800 mb-2">셰프의 Tip & 변경사항</h3>
                          <ul className="space-y-1 text-xs text-green-700 list-disc pl-5">
                            {allTips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Cooking Steps Section */}
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
                          <p className="text-xs text-green-600 whitespace-pre-line pt-2">
                            💡 {cookingSteps[currentStepIndex]?.tip}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={startCooking}
                        className="w-full max-w-xs mx-auto py-3 bg-green-500 text-white rounded-lg font-bold text-base active:bg-green-600 transition shadow-md"
                      >
                        요리 시작하기
                      </button>
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
                  <div className="space-y-4 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto flex flex-col p-2">
                    {dietMessages.map((m, idx) => (
                      <div key={idx} className="flex flex-col">
                        {m.role === 'user' ? (
                          <ChatBubble role="user">
                            {m.text}
                          </ChatBubble>
                        ) : (
                          <ChatBubble role="bot">
                            <div className="whitespace-pre-line">
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
                          </ChatBubble>
                        )}
                      </div>
                    ))}

                    {dietLoading && (
                      <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-2">
                        <TypingIndicator />
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
                      disabled={dietLoading || isCheckingAuth || !userId || !sessionId}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                        (dietLoading || isCheckingAuth || !userId || !sessionId)
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
          </>
        )}
      </main>

      {isAuthenticated && <MobileNav />}
      
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
