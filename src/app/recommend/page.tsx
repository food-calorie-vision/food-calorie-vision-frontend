"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

type FlowStep = "chat" | "select" | "cooking" | "complete";
type ChatMessage = { role: "bot" | "user"; text: string };

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
    "예) '나 오늘 대창 먹을건데 레시피 추천해줘', '삼겹살 요리하고 싶어'",
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
  const [dietFlowStep, setDietFlowStep] = useState<"chat" | "select" | "complete">("chat");
  const [dietMessages, setDietMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "안녕하세요! 식단 추천 도우미입니다.\n식단 추천을 원하시면 말씀해주세요 🥗\n예) '요즘 고기류를 먹고 싶은데 식단 추천해줘', '내가 가진 식재료 기반으로 식단 짜줘'" }
  ]);
  const [dietChatInput, setDietChatInput] = useState("");
  const [dietLoading, setDietLoading] = useState(false);
  const [recommendedDietPlans, setRecommendedDietPlans] = useState<DietPlan[]>([]);
  const [selectedDietPlan, setSelectedDietPlan] = useState<DietPlan | null>(null);

  // 로그인 상태 확인
  useEffect(() => {
    if (typeof window !== "undefined") {
      const expire = sessionStorage.getItem("login_expire");
      const user = sessionStorage.getItem("user_name");

      if (expire && Date.now() < Number(expire)) {
        setIsLoggedIn(true);
        setUserName(user || "");
      } else {
        alert("로그인이 필요합니다.");
        router.push("/");
      }
      setIsCheckingAuth(false);
    }
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
        { role: "bot", text: "안녕하세요! 식단 추천 도우미입니다.\n식단 추천을 원하시면 말씀해주세요 🥗\n예) '요즘 고기류를 먹고 싶은데 식단 추천해줘', '내가 가진 식재료 기반으로 식단 짜줘'" }
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
        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
        
        // 더미 데이터로 레시피 추천 생성
        setHealthWarning("⚠️ 건강 경고\n고지혈증이 있으신데 대창은 포화지방이 높아 권장하지 않습니다.");
        setRecommendedRecipes([
          { name: "연어 덮밥", description: "신선한 연어를 활용한 고단백, 오메가-3 풍부한 건강식" },
          { name: "제육볶음", description: "돼지고기와 채소를 함께 볶아 영양 밸런스를 잡은 요리" },
          { name: "고등어 구이 정식", description: "등푸른 생선의 좋은 지방과 단백질이 풍부한 정식" },
        ]);
        
        setFlowStep("select");
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
  const recordFood = () => {
    alert(`"${selectedRecipe?.name}"을(를) 식단에 기록했습니다!`);
    resetFlow();
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
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `식단 추천 요청: ${userText}. 하루 전체 식단(아침/점심/저녁/간식)을 추천하거나, 여러 식단 옵션을 제공해주세요.` 
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setDietMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
        
        // 더미 데이터로 식단 옵션 생성
        setRecommendedDietPlans([
          {
            name: "고기 중심 식단 A",
            description: "고단백 식단으로 근육 생성에 도움",
            totalCalories: "약 1500 kcal",
            meals: {
              breakfast: "현미밥 1공기 + 닭가슴살 구이 100g + 시금치 무침",
              lunch: "연어 덮밥 1인분 + 계란국",
              dinner: "고등어 구이 1마리 + 두부조림 + 배추김치",
              snack: "그릭요거트 1컵 + 아몬드 10알"
            },
            nutrients: "단백질 120g / 탄수화물 150g / 지방 45g"
          },
          {
            name: "균형 식단 B",
            description: "탄수화물, 단백질, 지방의 균형이 잡힌 식단",
            totalCalories: "약 1800 kcal",
            meals: {
              breakfast: "토스트 2장 + 스크램블 에그 + 샐러드",
              lunch: "소고기 된장찌개 + 밥 + 나물 반찬",
              dinner: "닭가슴살 샐러드 + 고구마",
              snack: "바나나 1개 + 견과류"
            },
            nutrients: "단백질 90g / 탄수화물 220g / 지방 55g"
          },
          {
            name: "저칼로리 식단 C",
            description: "체중 감량에 최적화된 저칼로리 식단",
            totalCalories: "약 1200 kcal",
            meals: {
              breakfast: "오트밀 + 베리류 + 우유",
              lunch: "닭가슴살 샐러드 + 통곡물 빵",
              dinner: "두부 스테이크 + 채소 볶음",
              snack: "사과 1개"
            },
            nutrients: "단백질 80g / 탄수화물 120g / 지방 30g"
          }
        ]);
        
        setDietFlowStep("select");
      }
    } catch (_err) {
      setDietMessages((prev) => [
        ...prev,
        { role: "bot", text: "서버와 통신 중 문제가 발생했습니다." },
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

  // 식단 저장하기
  const saveDietPlan = () => {
    alert(`"${selectedDietPlan?.name}"을(를) 식단에 저장했습니다!`);
    resetDietFlow();
  };

  // 식단 흐름 초기화
  const resetDietFlow = () => {
    setDietFlowStep("chat");
    setDietMessages([
      { role: "bot", text: "안녕하세요! 식단 추천 도우미입니다.\n식단 추천을 원하시면 말씀해주세요 🥗\n예) '요즘 고기류를 먹고 싶은데 식단 추천해줘', '내가 가진 식재료 기반으로 식단 짜줘'" }
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
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16">
      <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />

      {/* 상단 탭 버튼 */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
          <button
            onClick={() => handleTabChange("recipe")}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
              currentTab === "recipe"
                ? "bg-green-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">🍳</span>
            <span>레시피 추천</span>
          </button>

          <button
            onClick={() => handleTabChange("diet")}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
              currentTab === "diet"
                ? "bg-green-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">🥗</span>
            <span>식단 추천</span>
          </button>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 레시피 추천 탭 */}
        {currentTab === "recipe" && (
          <>
            {/* 1단계: 채팅 */}
            {flowStep === "chat" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">🍳 레시피 추천</h1>
                  <p className="text-slate-600">건강 상태를 고려한 맞춤 레시피를 추천받으세요</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`max-w-[80%] rounded-lg px-4 py-3 leading-relaxed whitespace-pre-line ${
                          m.role === "bot"
                            ? "bg-slate-100 text-slate-800 border border-slate-200"
                            : "bg-green-500 text-white ml-auto shadow"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200">
                        답변 작성 중이에요...
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex items-center gap-2">
                    <input
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="예) 나 오늘 대창 먹을건데 레시피 추천해줘"
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
                      className={`px-6 py-3 rounded-lg font-medium transition ${
                        isLoading
                          ? "bg-slate-400 text-white cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      보내기
                    </button>
                  </div>
                </div>

                {/* 안내 문구 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <div className="font-semibold mb-2">💡 이렇게 물어보세요</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>"나 오늘 대창 먹을건데 레시피 추천해줘"</li>
                    <li>"닭가슴살이랑 브로콜리 있는데 요리법 알려줘"</li>
                    <li>"저염식 고등어 요리 레시피 알려줘"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2단계: 레시피 선택 */}
            {flowStep === "select" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">추천 레시피</h1>
                  <p className="text-slate-600">사용자 정보를 기반으로 추천된 레시피입니다</p>
                </div>

                {healthWarning && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                    <p className="text-amber-900 whitespace-pre-line leading-relaxed">{healthWarning}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                  {recommendedRecipes.map((recipe, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectRecipe(recipe)}
                      className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition text-left"
                    >
                      <div className="text-2xl mb-3">🍽️</div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{recipe.name}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{recipe.description}</p>
                      <div className="mt-4 text-green-600 font-medium text-sm">선택하기 →</div>
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={resetFlow}
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    처음으로 돌아가기
                  </button>
                </div>
              </div>
            )}

            {/* 3단계: 조리 과정 */}
            {flowStep === "cooking" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedRecipe?.name}</h1>
                  <p className="text-slate-600">{recipeIntro}</p>
                </div>

                <div className="bg-white rounded-xl border-2 border-green-500 shadow-lg p-8">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-full font-bold mb-4">
                      STEP {cookingSteps[currentStepIndex]?.stepNumber} / {cookingSteps.length}
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <p className="text-xl text-slate-800 leading-relaxed">
                      {cookingSteps[currentStepIndex]?.instruction}
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={nextStep}
                      className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-md"
                    >
                      {currentStepIndex < cookingSteps.length - 1 ? "다음 단계 →" : "조리 완료!"}
                    </button>
                  </div>
                </div>

                <div className="fixed bottom-8 right-8">
                  <button
                    onClick={exitCooking}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700 transition shadow-lg"
                  >
                    종료
                  </button>
                </div>
              </div>
            )}

            {/* 4단계: 완료 */}
            {flowStep === "complete" && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">🎉</div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-4">
                    맛있는 "{selectedRecipe?.name}"이 완성되었습니다!
                  </h1>
                  <p className="text-lg text-slate-600 mb-8">이 음식을 바로 기록 하시겠습니까?</p>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={recordFood}
                      className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-md"
                    >
                      음식 기록하기
                    </button>
                    <button
                      onClick={() => router.push("/")}
                      className="px-8 py-4 bg-slate-200 text-slate-700 rounded-lg font-bold text-lg hover:bg-slate-300 transition"
                    >
                      종료 후 메인 페이지로 이동
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
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">🥗 식단 추천</h1>
                  <p className="text-slate-600">건강 상태를 고려한 맞춤 식단을 추천받으세요</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {dietMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`max-w-[80%] rounded-lg px-4 py-3 leading-relaxed whitespace-pre-line ${
                          m.role === "bot"
                            ? "bg-slate-100 text-slate-800 border border-slate-200"
                            : "bg-green-500 text-white ml-auto shadow"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}

                    {dietLoading && (
                      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200">
                        식단 추천 중이에요...
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex items-center gap-2">
                    <input
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="예) 요즘 고기류를 먹고 싶은데 식단 추천해줘"
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
                      className={`px-6 py-3 rounded-lg font-medium transition ${
                        dietLoading
                          ? "bg-slate-400 text-white cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      보내기
                    </button>
                  </div>
                </div>

                {/* 안내 문구 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <div className="font-semibold mb-2">💡 이렇게 물어보세요</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>"요즘 고기류를 먹고 싶은데 식단 추천해줘"</li>
                    <li>"내가 가진 식재료 기반으로 식단 짜줘"</li>
                    <li>"다이어트용 저칼로리 식단 알려줘"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 2단계: 식단 선택 */}
            {dietFlowStep === "select" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">추천 식단</h1>
                  <p className="text-slate-600">원하시는 식단을 선택해주세요</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {recommendedDietPlans.map((plan, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectDietPlan(plan)}
                      className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition text-left"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl">🍽️</div>
                        <span className="text-xs font-bold text-white bg-green-500 px-2 py-1 rounded">
                          {plan.totalCalories}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
                      <p className="text-sm text-slate-600 mb-3">{plan.description}</p>

                      {/* 식사 구성 미리보기 */}
                      <div className="space-y-2 mb-3 text-xs">
                        {plan.meals.breakfast && (
                          <div className="bg-orange-50 rounded px-2 py-1">
                            <span className="font-semibold text-orange-700">🌅 아침:</span>
                            <span className="text-slate-600 ml-1">{plan.meals.breakfast.slice(0, 20)}...</span>
                          </div>
                        )}
                        {plan.meals.lunch && (
                          <div className="bg-yellow-50 rounded px-2 py-1">
                            <span className="font-semibold text-yellow-700">☀️ 점심:</span>
                            <span className="text-slate-600 ml-1">{plan.meals.lunch.slice(0, 20)}...</span>
                          </div>
                        )}
                        {plan.meals.dinner && (
                          <div className="bg-indigo-50 rounded px-2 py-1">
                            <span className="font-semibold text-indigo-700">🌙 저녁:</span>
                            <span className="text-slate-600 ml-1">{plan.meals.dinner.slice(0, 20)}...</span>
                          </div>
                        )}
                      </div>

                      {plan.nutrients && (
                        <div className="text-xs text-slate-500 border-t pt-2">
                          {plan.nutrients}
                        </div>
                      )}

                      <div className="mt-4 text-green-600 font-medium text-sm">선택하기 →</div>
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={resetDietFlow}
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    처음으로 돌아가기
                  </button>
                </div>
              </div>
            )}

            {/* 3단계: 완료 */}
            {dietFlowStep === "complete" && selectedDietPlan && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-6">✅</div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {selectedDietPlan.name}
                  </h1>
                  <p className="text-lg text-slate-600 mb-2">{selectedDietPlan.description}</p>
                  <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold">
                    {selectedDietPlan.totalCalories}
                  </div>
                </div>

                {/* 식단 상세 보기 */}
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-md p-8 max-w-3xl mx-auto">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">하루 식단 구성</h2>
                  
                  <div className="space-y-4">
                    {selectedDietPlan.meals.breakfast && (
                      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🌅</span>
                          <h3 className="text-lg font-bold text-orange-700">아침</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{selectedDietPlan.meals.breakfast}</p>
                      </div>
                    )}

                    {selectedDietPlan.meals.lunch && (
                      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">☀️</span>
                          <h3 className="text-lg font-bold text-yellow-700">점심</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{selectedDietPlan.meals.lunch}</p>
                      </div>
                    )}

                    {selectedDietPlan.meals.dinner && (
                      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🌙</span>
                          <h3 className="text-lg font-bold text-indigo-700">저녁</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{selectedDietPlan.meals.dinner}</p>
                      </div>
                    )}

                    {selectedDietPlan.meals.snack && (
                      <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🍎</span>
                          <h3 className="text-lg font-bold text-pink-700">간식</h3>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{selectedDietPlan.meals.snack}</p>
                      </div>
                    )}
                  </div>

                  {selectedDietPlan.nutrients && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">영양소 구성</h3>
                      <p className="text-slate-600">{selectedDietPlan.nutrients}</p>
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-4 justify-center mt-8">
                  <button
                    onClick={saveDietPlan}
                    className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-md"
                  >
                    식단 저장하기
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="px-8 py-4 bg-slate-200 text-slate-700 rounded-lg font-bold text-lg hover:bg-slate-300 transition"
                  >
                    메인으로 돌아가기
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
