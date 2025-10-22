import { NextResponse } from 'next/server';
import { UserHealthInfo } from '@/types';

// 실제로는 여기서 DB에서 사용자 건강 정보를 조회합니다
export async function GET() {
  try {
    // 샘플 데이터 - 실제로는 DB 쿼리로 대체
    const healthInfo: UserHealthInfo = {
      goal: '체중 감량',
      diseases: ['고혈압', '고지혈증'],
      recommendedCalories: 2000,
      activityLevel: '중간'
    };

    return NextResponse.json(healthInfo);
  } catch (error) {
    return NextResponse.json(
      { error: '건강 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
