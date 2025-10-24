import { NextRequest, NextResponse } from 'next/server';

// 식단 추천 API 엔드포인트
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user';
    const healthGoal = searchParams.get('healthGoal') || '건강유지';

    // FastAPI 백엔드 연동 시 사용할 구조
    const apiEndpoint = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    // 백엔드로 전송할 데이터 구조
    const requestData = {
      userId,
      healthGoal,
      timestamp: new Date().toISOString()
    };

    // FastAPI 백엔드 호출 (현재는 목업 응답)
    // const response = await fetch(`${apiEndpoint}/api/meal-recommendations`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(requestData),
    // });
    
    // const recommendations = await response.json();

    // 임시 목업 응답
    const mockRecommendations = [
      {
        id: 1,
        name: '연어 덮밥',
        calories: 450,
        description: '사용자 건강 목표에 따른 추천 메뉴',
        isSelected: true,
        nutrients: {
          protein: 35,
          carbs: 45,
          fat: 12,
          sodium: 800
        }
      },
      {
        id: 2,
        name: '제육볶음',
        calories: 380,
        description: '사용자 건강 목표에 따른 추천 메뉴',
        isSelected: false,
        nutrients: {
          protein: 28,
          carbs: 35,
          fat: 15,
          sodium: 1200
        }
      },
      {
        id: 3,
        name: '고등어 구이 정식',
        calories: 420,
        description: '사용자 건강 목표에 따른 추천 메뉴',
        isSelected: false,
        nutrients: {
          protein: 32,
          carbs: 40,
          fat: 18,
          sodium: 900
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        recommendations: mockRecommendations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Meal recommendations GET API error:', error);
    return NextResponse.json(
      { success: false, error: '식단 추천 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mealId, userId } = body;

    // FastAPI 백엔드 연동 시 사용할 구조
    const apiEndpoint = process.env.FASTAPI_URL || 'http://localhost:8000';

    // 백엔드로 전송할 데이터 구조
    const requestData = {
      mealId,
      userId,
      timestamp: new Date().toISOString()
    };

    // FastAPI 백엔드 호출 (현재는 목업 응답)
    // const response = await fetch(`${apiEndpoint}/api/meal-selection`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(requestData),
    // });
    
    // const result = await response.json();

    // 임시 목업 응답
    const mockSelectedMeal = {
      id: mealId,
      name: `선택된 음식 ${mealId}`,
      calories: 400
    };

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        message: `식단 ${mealId}이(가) 성공적으로 선택되었습니다.`,
        selectedMeal: mockSelectedMeal
      }
    });

  } catch (error) {
    console.error('Meal recommendations POST API error:', error);
    return NextResponse.json(
      { success: false, error: '식단 선택 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
