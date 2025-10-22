import { NextResponse } from 'next/server';
import { RecommendedFood } from '@/types';

// 실제로는 여기서 사용자 건강 정보와 섭취 현황을 기반으로 추천 음식을 조회합니다
export async function GET() {
  try {
    // 샘플 데이터 - 실제로는 AI 추천 알고리즘이나 DB 쿼리로 대체
    const recommendations: RecommendedFood[] = [
      {
        id: 1,
        name: '연어 덮밥',
        description: '사용자 건강 목표에 따른 추천 메뉴',
        calories: 450,
        nutrients: {
          protein: 35,
          carbs: 45,
          fat: 12,
          sodium: 600
        }
      },
      {
        id: 2,
        name: '제육볶음',
        description: '사용자 건강 목표에 따른 추천 메뉴',
        calories: 380,
        nutrients: {
          protein: 28,
          carbs: 25,
          fat: 18,
          sodium: 800
        }
      },
      {
        id: 3,
        name: '고등어 구이 정식',
        description: '사용자 건강 목표에 따른 추천 메뉴',
        calories: 420,
        nutrients: {
          protein: 32,
          carbs: 40,
          fat: 15,
          sodium: 700
        }
      }
    ];

    return NextResponse.json(recommendations);
  } catch (error) {
    return NextResponse.json(
      { error: '추천 음식을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
