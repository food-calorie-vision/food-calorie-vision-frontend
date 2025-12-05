import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/utils/api';

// 챗봇 API 엔드포인트 (FastAPI 백엔드로 프록시)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiEndpoint = process.env.FASTAPI_URL || API_BASE_URL;
    
    const response = await fetch(`${apiEndpoint}/api/v1/chat_v2`, {
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
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: '챗봇 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
