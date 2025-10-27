"use client";

import React, { useState } from "react";
import Link from "next/link";

type ChatMessage = { role: "bot" | "user"; text: string };

// 챗봇 초기 안내 메시지
const INITIAL_BOT_MESSAGE: ChatMessage = {
  role: "bot",
  text:
    "안녕하세요! KCalculator 레시피 도우미입니다.\n" +
    "지금 집에 있는 재료나 식단 조건을 말해주시면 맞춤 레시피를 제안해드릴게요 🍳\n" +
    "예) '저염으로 닭가슴살 요리 알려줘', '계란+애호박 반찬 뭐 만들어?'",
};

export default function RecommendPage() {
  // 상단 탭 상태: 레시피 추천 / 식단 추천
  const [mainTab, setMainTab] = useState<"recipe" | "diet">("recipe");

  // 챗봇 상태
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_BOT_MESSAGE,
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 사용자가 직접 입력해서 보내는 경우 (Enter나 ▶ 버튼)
  const sendChat = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userText = chatInput.trim();
    setChatInput("");

    // 사용자의 메시지를 먼저 화면에 추가
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    setIsLoading(true);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              "죄송해요, 지금은 답변을 생성할 수 없어요. 다시 시도해 주세요 🙇‍♀️",
          },
        ]);
      }
    } catch (_err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            "서버와 통신 중 문제가 발생했습니다. 로컬 dev 서버가 켜져 있는지 확인해주세요.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // "다음 식단 제안 받기 →" 눌렀을 때
  // - 탭 자동으로 recipe로 전환
  // - 대화 완전 리셋 후 새 추천 받기
  const handleNextPlanRequest = async () => {
    // 레시피 탭으로 전환해서 챗봇이 보이게
    setMainTab("recipe");

    // 로딩 시작
    setIsLoading(true);

    try {
      const autoQuestion =
        "오늘 식단 기준으로 다음 추천 식단 하나만 제안해줘. 단백질/저염/균형 중에서 가장 어울리는 구성 알려줘.";

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: autoQuestion }),
      });

      const data = await res.json();

      const botFollowup: ChatMessage = data.reply
        ? { role: "bot", text: data.reply }
        : {
            role: "bot",
            text:
              "죄송해요, 지금은 다음 식단 제안을 불러올 수 없어요. 다시 시도해 주세요 🙇‍♀️",
          };

      // ✅ 대화 완전 리셋: 초기 안내 + 새로 받은 추천만 남김
      setMessages([INITIAL_BOT_MESSAGE, botFollowup]);
    } catch (_err) {
      setMessages([
        INITIAL_BOT_MESSAGE,
        {
          role: "bot",
          text:
            "서버와 통신 중 문제가 발생했습니다. 로컬 dev 서버가 켜져 있는지 확인해주세요.",
        },
      ]);
    } finally {
        setIsLoading(false);
    }
  };

  // 더미 식단 카드 데이터
  const mealPlans = [
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* 왼쪽 로고/타이틀 */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="text-xl font-bold text-slate-800">
                KCalculator
              </span>
            </Link>

            <span className="text-slate-400">|</span>

            <h1 className="text-lg font-semibold text-slate-700">
              레시피 / 식단 추천
            </h1>
          </div>

          {/* 오른쪽 유저 상태 */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-slate-600">
              환영합니다! (user님)
            </span>
            <button className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* 상단 탭 버튼 */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
          <button
            onClick={() => setMainTab("recipe")}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
              mainTab === "recipe"
                ? "bg-green-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">🍳</span>
            <span>레시피 추천</span>
          </button>

          <button
            onClick={() => setMainTab("diet")}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 cursor-pointer ${
              mainTab === "diet"
                ? "bg-green-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">🥗</span>
            <span>식단 추천</span>
          </button>
        </div>
      </section>

      {/* 본문 */}
      <main className="max-w-7xl mx-auto px-4 space-y-8">
        {/* 레시피 추천 탭 (챗봇 쪽) */}
        {mainTab === "recipe" && (
          <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* 왼쪽: 안내 + 경고문 + 채팅 */}
            <div className="flex flex-col gap-6">
              {/* 안내 카드 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-slate-800 mb-2">
                  사용자의 건강 상태 기반 맞춤 레시피
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  최근 섭취 패턴, 목표(다이어트/체중증가/저염 등),
                  <br />
                  알레르기, 선호 식재료를 고려해서 레시피를 제안해요.
                  <br />
                  “매운 거 줄이고 단백질은 높게” 같은 조건도 말할 수 있어요.
                </p>
              </div>

              {/* 건강 주의 안내 */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm leading-relaxed shadow-sm">
                <div className="font-semibold mb-2 flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>건강 참고 고지</span>
                </div>
                <p className="mb-2">
                  제공되는 정보는 일반적인 영양 가이드를 기반으로 한 참고용입니다.
                  진단이나 의료적 조언이 아니며 실제 식단 변경 또는
                  알레르기/질환 관련 결정은 전문의와 상담하시길 권장합니다.
                </p>
                <p>
                  개인 질환(고혈압, 당뇨, 신장질환 등)이나 복용 중인 약물이 있다면
                  나트륨/당/단백질 섭취 기준이 달라질 수 있어요.
                  본인 맞춤 지침을 우선하세요.
                </p>
              </div>

              {/* 챗봇 카드 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[320px]">
                {/* 채팅창 내용 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
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
                    <div className="max-w-[80%] rounded-lg px-4 py-3 leading-relaxed whitespace-pre-line bg-slate-100 text-slate-500 border border-slate-200">
                      답변 작성 중이에요...
                    </div>
                  )}
                </div>

                {/* 입력 영역 */}
                <div className="border-t border-slate-200 p-3 flex items-center gap-2">
                  <input
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder={
                      isLoading
                        ? "답변 생성 중..."
                        : "예) 저염으로 닭가슴살 반찬 뭐 할 수 있어?"
                    }
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
                    className={`text-sm font-medium rounded-lg px-3 py-2 transition ${
                      isLoading
                        ? "bg-slate-400 text-white cursor-not-allowed"
                        : "bg-slate-800 text-white hover:bg-slate-900"
                    }`}
                  >
                    {isLoading ? "..." : "▶"}
                  </button>
                </div>
              </div>
            </div>

            {/* 오른쪽: 힌트 */}
            <aside className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 h-fit">
              <div className="text-sm text-slate-500">
                <div className="text-slate-800 font-semibold text-base mb-1">
                  오늘 컨디션 기반 맞춤 진행 중
                </div>
                <p className="leading-relaxed">
                  “최근 아침을 자주 거르셨어요.”
                  <br />
                  “단백질 섭취 비율이 낮아요.”
                  <br />
                  “물 섭취도 조금 부족해요.”
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs leading-relaxed text-slate-600">
                <div className="font-semibold text-slate-700 mb-2">
                  이런 것도 물어볼 수 있어요
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>“계란+애호박으로 반찬 뭐 만들어?”</li>
                  <li>“단백질 많은데 짜지 않은 저녁 추천해줘”</li>
                  <li>“운동 끝나고 바로 먹을 가벼운 식단?”</li>
                </ul>
              </div>
            </aside>
          </section>
        )}

        {/* 식단 추천 탭 */}
        {mainTab === "diet" && (
          <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* 왼쪽: 추천 식단 카드 리스트 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-slate-800">
                추천 식단
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed -mt-2 mb-2">
                현재 건강 상태와 목표를 바탕으로, 오늘 먹으면 좋은 식단이에요.
                특정 메뉴를 클릭하면 상세 구성을 볼 수 있어요.
              </p>

              <div className="space-y-3">
                {mealPlans.map((plan, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-slate-800 font-semibold text-sm">
                        {plan.title}
                      </div>
                      <span className="text-[10px] font-semibold text-white bg-blue-600 px-2 py-1 rounded-md">
                        {plan.badge}
                      </span>
                    </div>
                    <div className="text-[13px] text-slate-600 leading-relaxed">
                      {plan.desc}
                    </div>
                    <div className="text-[12px] text-slate-400">
                      {plan.kcal}
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-200">
                위 식단은 일반적인 권장 패턴이며,
                <br />
                개인의 질환/복용 약물에 따라 달라질 수 있어요.
              </div>
            </div>

            {/* 오른쪽: 행동 유도 영역 */}
            <aside className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 h-fit">
              <div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  KCalculator 챗봇
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  “이 식단 지금 먹어도 될까요?”
                </div>
                <div className="text-[11px] text-slate-400">
                  상황별 맞춤 코멘트 제공중
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs leading-relaxed text-slate-600 shadow-inner">
                <div className="text-slate-800 font-medium mb-1">
                  예시 대화
                </div>
                <p className="text-slate-700 mb-2">
                  “저 지금 약 먹는 중인데요, 저염식으로 가야 돼요.
                  이 메뉴 괜찮나요?”
                </p>
                <div className="text-green-700 font-medium">
                  → “나트륨은 낮은 편이라 괜찮아요.
                  단백질 보충에는 좋아요. 다만 간은 세지 않게 드세요.”
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                {/* 여기 버튼이 챗봇 리셋 + 새 제안 호출 */}
                <button
                  onClick={handleNextPlanRequest}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition text-center"
                >
                  다음 식단 제안 받기 →
                </button>

                <button className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition text-center">
                  종료 후 식단 기록으로 이동 →
                </button>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                * “식단 기록으로 이동”은 나중에 /health-report 등 실제 기록
                화면에 연결하면 돼요.
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}
