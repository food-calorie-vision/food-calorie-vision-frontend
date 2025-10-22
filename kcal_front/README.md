# KCalculator - 건강 관리 대시보드

Next.js를 사용하여 구축된 건강 및 식단 관리 대시보드입니다.

## 주요 기능

### 1. 사용자 건강 정보 시각화
- DB에서 사용자 건강 정보를 조회하여 건강 상태를 표시
- 건강 목표, 현재 질환, 추천 섭취 열량, 활동 수준 정보 제공

### 2. 영양 성분 섭취 현황 시각화
- DB에서 사용자 섭취 음식 현황을 조회하여 칼로리 섭취 현황을 바차트로 표시
- 섭취한 영양 성분 비율을 파이차트로 시각화 (나트륨, 탄수화물, 단백질, 지방, 당류)

### 3. 개인화된 음식 추천
- 사용자의 건강 정보와 섭취 현황을 기반으로 3가지 음식을 추천
- 추천 음식 선택 기능 제공
- 각 음식의 칼로리 정보 표시

## 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── health-info/route.ts      # 사용자 건강 정보 API
│   │   ├── intake-data/route.ts      # 섭취 현황 데이터 API
│   │   └── recommendations/route.ts  # 추천 음식 API
│   ├── customized-diet/
│   │   └── page.tsx                  # Customized diet 페이지
│   └── page.tsx                      # 메인 페이지
├── components/
│   ├── Header.tsx                    # 헤더 컴포넌트
│   ├── NutrientRatioChart.tsx        # 영양 성분 비율 파이차트
│   ├── HealthStatus.tsx              # 건강 상태 정보
│   ├── CalorieIntakeChart.tsx        # 칼로리 섭취 현황 바차트
│   └── RecommendedDiet.tsx           # 추천 식단 카드
└── types/
    └── index.ts                      # TypeScript 타입 정의
```

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 개발 서버 실행:
```bash
npm run dev
```

3. 브라우저에서 `http://localhost:3000` 접속

## API 엔드포인트

- `GET /api/health-info` - 사용자 건강 정보 조회
- `GET /api/intake-data` - 사용자 섭취 현황 조회
- `GET /api/recommendations` - 추천 음식 목록 조회

## 주요 컴포넌트 설명

### Header
- KCalculator 로고 및 네비게이션 메뉴
- 로그인/회원가입 버튼
- 현재 페이지 하이라이트

### NutrientRatioChart
- 사용자 섭취 영양 성분을 파이차트로 시각화
- 색상별 범례 제공
- API에서 실시간 데이터 로드

### HealthStatus
- 사용자 건강 목표 및 현재 상태 정보
- 불릿 포인트 형태로 정보 표시
- API에서 실시간 데이터 로드

### CalorieIntakeChart
- 섭취 칼로리와 목표 칼로리를 바차트로 비교
- 툴팁으로 상세 정보 제공
- API에서 실시간 데이터 로드

### RecommendedDiet
- 3가지 추천 음식을 카드 형태로 표시
- 음식 선택 기능
- 선택된 음식에 대한 추가 정보 표시

## 향후 개선 사항

1. 실제 데이터베이스 연동
2. 사용자 인증 시스템
3. 음식 상세 정보 모달
4. 식단 계획 기능
5. 건강 리포트 생성
6. 모바일 반응형 최적화

## 라이선스

MIT License