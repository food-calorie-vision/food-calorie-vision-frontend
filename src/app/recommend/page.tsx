"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

// 챗봇 초기 안내 메시지
const INITIAL_BOT_MESSAGE: ChatMessage = {
  role: "bot",
  text:
    "안녕하세요! KCalculator 레시피 도우미입니다.\n" +
    "먹고 싶은 음식을 말씀해주시면 건강 상태를 고려한 레시피를 추천해드릴게요 🍳\n" +
    "예) '나 오늘 대창 먹을건데 레시피 추천해줘', '삼겹살 요리하고 싶어'",
};

export default function RecommendPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
        
        // 더미 데이터로 레시피 추천 생성 (실제로는 LLM 응답 파싱)
        setHealthWarning("⚠️ 건강 경고\n고지혈증이 있으신데 대창은 포화지방이 높아 권장하지 않습니다.");
        setRecommendedRecipes([
          { name: "연어 덮밥", description: "신선한 연어를 활용한 고단백, 오메가-3 풍부한 건강식" },
          { name: "제육볶음", description: "돼지고기와 채소를 함께 볶아 영양 밸런스를 잡은 요리" },
          { name: "고등어 구이 정식", description: "등푸른 생선의 좋은 지방과 단백질이 풍부한 정식" },
        ]);
        
        // 선택 단계로 이동
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
    
    // 더미 조리법 데이터 (실제로는 LLM에서 받아옴)
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 1단계: 채팅 */}
        {flowStep === "chat" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">🍳 레시피 추천</h1>
              <p className="text-slate-600">건강 상태를 고려한 맞춤 레시피를 추천받으세요</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              {/* 채팅 메시지 */}
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

              {/* 입력창 */}
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
          </div>
        )}

        {/* 2단계: 레시피 선택 */}
        {flowStep === "select" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">추천 레시피</h1>
              <p className="text-slate-600">사용자 정보를 기반으로 추천된 레시피입니다</p>
            </div>

            {/* 건강 경고 */}
            {healthWarning && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                <p className="text-amber-900 whitespace-pre-line leading-relaxed">{healthWarning}</p>
              </div>
            )}

            {/* 레시피 카드들 */}
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

            {/* 현재 조리 단계 */}
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

              {/* 버튼 영역 */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={nextStep}
                  className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-md"
                >
                  {currentStepIndex < cookingSteps.length - 1 ? "다음 단계 →" : "조리 완료!"}
                </button>
              </div>
            </div>

            {/* 종료 버튼 (우측 하단 고정) */}
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
      </main>
    </div>
  );
}
