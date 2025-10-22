import { NextResponse } from 'next/server';
import { UserIntakeData } from '@/types';

// 실제로는 여기서 DB에서 사용자 섭취 현황을 조회합니다
export async function GET() {
  try {
    // 샘플 데이터 - 실제로는 DB 쿼리로 대체
    const intakeData: UserIntakeData = {
      totalCalories: 1850,
      targetCalories: 2000,
      nutrients: {
        sodium: 1200,
        carbs: 180,
        protein: 85,
        fat: 45,
        sugar: 30
      }
    };

    return NextResponse.json(intakeData);
  } catch (error) {
    return NextResponse.json(
      { error: '섭취 현황을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

