import { NextResponse } from 'next/server';

// FastAPI 백엔드로 프록시
export async function GET() {
  try {
    const apiEndpoint = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    const response = await fetch(`${apiEndpoint}/api/v1/user/intake-data`, {
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
    console.error('Intake data API error:', error);
    return NextResponse.json(
      { error: '섭취 현황을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
