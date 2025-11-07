/**
 * health_goal 값을 한글로 변환
 * @param healthGoal - DB에서 가져온 health_goal 값 ('gain', 'maintain', 'loss')
 * @returns 한글 변환된 목표
 */
export function translateHealthGoal(healthGoal: string | undefined | null): string {
  if (!healthGoal) return '목표 없음';
  
  const translations: Record<string, string> = {
    'gain': '벌크업',
    'maintain': '유지',
    'loss': '다이어트',
  };
  
  return translations[healthGoal.toLowerCase()] || healthGoal;
}

