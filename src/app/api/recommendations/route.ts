import { NextResponse } from "next/server";

// GET: 추천 식단 리스트 (임시 하드코딩 데이터)
export async function GET() {
  try {
    const recommendations = [
      {
        id: 1,
        name: "연어 덮밥",
        description: "사용자 건강 목표에 따른 추천 메뉴",
        calories: 450,
        nutrients: { protein: 35, carbs: 45, fat: 12, sodium: 600 },
      },
      {
        id: 2,
        name: "제육볶음",
        description: "사용자 건강 목표에 따른 추천 메뉴",
        calories: 380,
        nutrients: { protein: 28, carbs: 25, fat: 18, sodium: 800 },
      },
      {
        id: 3,
        name: "고등어 구이 정식",
        description: "사용자 건강 목표에 따른 추천 메뉴",
        calories: 420,
        nutrients: { protein: 32, carbs: 40, fat: 15, sodium: 700 },
      },
    ];

    return NextResponse.json(recommendations);
  } catch (_error) {
    return NextResponse.json(
      { error: "추천 음식을 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST: 챗봇 응답 (레시피/식단 관련 질문 분석 후 답변)
export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const userText = String(message || "");

    let reply =
      "오늘 컨디션 기준으로 추천하는 식단은 ‘단백질 강화형 점심’이에요 🍗\n" +
      "닭가슴살 샐러드와 삶은 달걀을 추천드릴게요.";

    // 간단한 규칙 기반 답변
    const lower = userText.toLowerCase();

    if (
      lower.includes("단백질") ||
      lower.includes("닭") ||
      lower.includes("닭가슴살") ||
      lower.includes("근력") ||
      lower.includes("운동")
    ) {
      reply =
        "단백질 식단 예시 🍗\n" +
        "- 닭가슴살 샐러드 + 삶은 달걀\n" +
        "- 구운 연어 덮밥(연어는 단백질+오메가3)\n" +
        "- 데친 브로콜리 같이 곁들이면 비타민/식이섬유 보충돼요.";
    } else if (
      lower.includes("저염") ||
      lower.includes("짜지") ||
      lower.includes("혈압") ||
      lower.includes("나트륨")
    ) {
      reply =
        "저염 식단 예시 🥗\n" +
        "- 두부 채소조림 (간은 간장 적게, 대신 후추/허브)\n" +
        "- 구운 고등어 + 현미밥 (기름은 키우고 소금은 줄이기)\n" +
        "- 삶은 달걀 흰자와 아보카도는 나트륨 낮고 포만감은 유지돼요.";
    } else if (
      lower.includes("균형") ||
      lower.includes("밸런스") ||
      lower.includes("골고루")
    ) {
      reply =
        "균형 잡힌 식단 예시 🍱\n" +
        "- 현미밥\n" +
        "- 닭가슴살 or 두부 단백질 반찬\n" +
        "- 데친 채소(시금치나 브로콜리)\n" +
        "- 과일 한 조각(사과/베리류)\n" +
        "탄/단/지 비율이 골고루라서 일반적인 일상 식사로 무난해요.";
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("POST /api/recommendations error:", err);
    return NextResponse.json(
      { error: "추천 응답 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
