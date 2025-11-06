import { NextRequest, NextResponse } from 'next/server';

// 식단 추천 API 엔드포인트 (FastAPI 백엔드로 프록시)
export async function GET(request: NextRequest) {
  try {
    const apiEndpoint = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    const response = await fetch(`${apiEndpoint}/api/v1/meals/recommendations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

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
    const apiEndpoint = process.env.FASTAPI_URL || 'http://localhost:8000';

    const response = await fetch(`${apiEndpoint}/api/v1/meals/selection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Meal recommendations POST API error:', error);
    return NextResponse.json(
      { success: false, error: '식단 선택 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
