import { NextRequest, NextResponse } from 'next/server';

// 챗봇 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, selectedMeal, imageData } = body;

    // FastAPI 백엔드 연동 시 사용할 구조
    const apiEndpoint = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    // 백엔드로 전송할 데이터 구조
    const requestData = {
      message,
      selectedMeal,
      imageData,
      timestamp: new Date().toISOString(),
      userId: 'user' // 실제로는 인증된 사용자 ID
    };

    // FastAPI 백엔드 호출 (현재는 목업 응답)
    // const response = await fetch(`${apiEndpoint}/api/chat`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(requestData),
    // });
    
    // const botResponse = await response.json();

    // 임시 목업 응답
    const mockResponse = generateMockResponse(message, selectedMeal);

    return NextResponse.json({
      success: true,
      data: {
        message: mockResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: '챗봇 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateMockResponse(message: string, selectedMeal: any): string {
  const input = message.toLowerCase();
  
  if (input.includes('칼로리') || input.includes('영양')) {
    if (selectedMeal && selectedMeal.calories && selectedMeal.nutrients) {
      return `${selectedMeal.name}의 칼로리는 ${selectedMeal.calories}kcal입니다. 주요 영양소는 단백질 ${selectedMeal.nutrients.protein}g, 탄수화물 ${selectedMeal.nutrients.carbs}g, 지방 ${selectedMeal.nutrients.fat}g, 나트륨 ${selectedMeal.nutrients.sodium}mg 입니다.`;
    }
    return '선택된 음식에 대한 칼로리 및 영양 정보가 없습니다.';
  }
  if (input.includes('만드는 법') || input.includes('레시피')) {
    return `${selectedMeal?.name || '이 음식'}의 레시피는 '레시피 검색' 페이지에서 찾아보실 수 있습니다.`;
  }
  if (input.includes('사진')) {
    return '사진을 보내주시면 AI가 분석하여 답변해 드릴 수 있습니다.';
  }
  return `선택하신 ${selectedMeal?.name || '음식'}에 대해 더 자세히 알려드릴 수 있습니다. 무엇이 궁금하신가요?`;
}
