# 🥗 KCalculator - 음식 칼로리 관리 및 맞춤식단 추천

개인의 건강 정보를 기반으로 맞춤형 식단을 추천하고 일일 칼로리 섭취량을 관리하는 건강 관리 웹 애플리케이션입니다.

## 📋 프로젝트 개요

KCalculator는 사용자의 건강 정보(체중 목표, 기저질환, 알레르기 등)를 수집하고, 이를 기반으로:
- ✅ 개인 맞춤형 식단 추천
- 📊 일일 칼로리 및 영양 추적
- 💪 건강 목표 관리
- 📈 식단 기록 및 분석

## 🏗️ 프로젝트 구조

```
food-calorie-vision-frontend/
├── src/
│   ├── app/
│   │   ├── api/                 # API 라우트
│   │   │   ├── health-info/     # 건강 정보 API
│   │   │   ├── intake-data/     # 섭취 현황 API
│   │   │   └── recommendations/ # 추천 음식 API
│   │   ├── dashboard/           # 대시보드 페이지
│   │   ├── customized-diet/     # 맞춤식단 페이지
│   │   ├── signup/              # 회원가입 페이지
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   ├── page.tsx             # 홈/로그인 페이지
│   │   ├── globals.css          # 전역 스타일
│   │   └── favicon.ico
│   ├── components/              # 재사용 가능한 컴포넌트
│   │   ├── Header.tsx           # 상단 네비게이션
│   │   ├── NutrientRatioChart.tsx   # 영양 비율 차트
│   │   ├── CalorieIntakeChart.tsx   # 칼로리 섭취 차트
│   │   ├── HealthStatus.tsx     # 건강 상태 정보
│   │   └── RecommendedDiet.tsx  # 추천 식단
│   ├── types/
│   │   └── index.ts             # TypeScript 타입 정의
│   └── public/                  # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## ✨ 주요 기능

### 1. 인증 및 회원가입
- 회원가입: 개인정보, 건강정보, 알레르기 정보 수집
- 로그인/로그아웃

### 2. 대시보드 (NEW!)
- MY SCORE: 식단 점수 확인 및 상세 분석
- 일일 칼로리 섭취량 그래프 (7일간 트렌드)
- 자주 먹는 음식 리스트 (칼로리 및 영양소 정보)
- 우측 플로팅 액션 버튼 (5개 기능 페이지 이동)
- 상세 점수 현황 페이지 (영역별 점수 분석)

### 3. 맞춤식단 추천
- 사용자의 건강 목표와 섭취 현황 분석
- 개인화된 식단 추천
- 영양 정보 제공

### 4. 식단 관리
- 일일 섭취량 기록
- 영양 성분 추적
- 개인 목표 대비 현황 비교

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15.5.6
- **React**: 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts 3.3.0
- **Icons**: lucide-react 0.546.0

### Tools
- **Build Tool**: Turbopack
- **Linting**: ESLint 9
- **Package Manager**: npm

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 1. 프로젝트 디렉토리로 이동
cd food-calorie-vision-frontend

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 확인
# http://localhost:3000
```

## 📦 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 🔧 API 엔드포인트

### GET /api/health-info
사용자의 건강 정보를 반환합니다.

**응답 예시:**
```json
{
  "goal": "체중 감량",
  "diseases": ["고혈압", "고지혈증"],
  "recommendedCalories": 2000,
  "activityLevel": "중간"
}
```

### GET /api/intake-data
사용자의 일일 섭취 현황을 반환합니다.

**응답 예시:**
```json
{
  "totalCalories": 1850,
  "targetCalories": 2000,
  "nutrients": {
    "sodium": 1200,
    "carbs": 180,
    "protein": 85,
    "fat": 45,
    "sugar": 30
  }
}
```

### GET /api/recommendations
추천 음식 목록을 반환합니다.

**응답 예시:**
```json
[
  {
    "id": 1,
    "name": "연어 덮밥",
    "description": "사용자 건강 목표에 따른 추천 메뉴",
    "calories": 450,
    "nutrients": {
      "protein": 35,
      "carbs": 45,
      "fat": 12,
      "sodium": 600
    }
  }
]
```

## 🎨 페이지 라우팅

| 경로 | 설명 | 상태 |
|------|------|------|
| `/` | 홈/로그인 페이지 | ✅ 완료 |
| `/signup` | 회원가입 페이지 | ✅ 완료 |
| `/dashboard` | MY PAGE 대시보드 (NEW!) | ✅ 완료 |
| `/score-detail` | 상세 점수 현황 (NEW!) | ✅ 완료 |
| `/customized-diet` | 맞춤식단 추천 | ✅ 완료 |
| `/health-report` | 식사일기 | 🔧 개발 예정 |
| `/recipe` | 레시피 검색 | 🔧 개발 예정 |
| `/mypage` | 마이페이지 | 🔧 개발 예정 |

## 📝 주요 컴포넌트

### Header
- 로그인 상태에 따른 네비게이션 표시
- 현재 페이지 하이라이트
- 로그인/로그아웃 기능

### MyScore (NEW!)
- 식단 점수 확인 및 피드백 제공
- 전날 대비 점수 변화 표시
- 상세 점수 현황 페이지 이동 기능

### DailyCalorieChart (NEW!)
- 7일간 일일 칼로리 섭취량 라인 그래프
- 목표 칼로리 참조선 표시
- recharts LineChart 사용

### FrequentFoodsList (NEW!)
- 자주 먹는 음식 4가지 표시
- 칼로리 및 3대 영양소 정보 제공
- 그리드 레이아웃으로 깔끔한 표시

### FloatingActionButtons (NEW!)
- 우측 플로팅 액션 버튼
- 클릭 시 5개 버튼으로 확장
- 각 기능 페이지로 이동하는 네비게이션

### CalorieIntakeChart
- 목표 칼로리 vs 섭취 칼로리 비교 차트
- recharts BarChart 사용

### NutrientRatioChart
- 5가지 주요 영양소 비율 표시
- recharts PieChart 사용
- 실시간 데이터 반영

### HealthStatus
- 건강 목표, 질환, 추천 칼로리 정보 표시
- lucide-react 아이콘 사용

### RecommendedDiet
- 추천 음식 목록 표시
- 음식 선택 기능
- 선택된 음식 상세 정보 표시

## 🔐 타입 정의

### User
```typescript
interface User {
  id: string;
  username: string;
  nickname: string;
  email?: string;
}
```

### SignupFormData
```typescript
interface SignupFormData {
  userId: string;
  nickname: string;
  password: string;
  gender: '남자' | '여자';
  birthDate: string;
  hasAllergy: '예' | '아니오';
  allergyInfo?: string;
  bodyType: '감량' | '유지' | '증량';
  medicalCondition?: string;
  healthGoal: string;
}
```

## 📚 개발 가이드

### 새로운 페이지 추가

1. `src/app/[new-page]/page.tsx` 생성
2. 필요한 컴포넌트 import
3. metadata 정의
4. 컴포넌트 구현

### 새로운 컴포넌트 추가

1. `src/components/[ComponentName].tsx` 생성
2. 'use client' 선언 (필요시)
3. TypeScript 타입 정의
4. 컴포넌트 export

### API 라우트 추가

1. `src/app/api/[endpoint]/route.ts` 생성
2. GET/POST 함수 구현
3. NextResponse 반환

## 🐛 알려진 문제

- 로그인 상태 관리가 클라이언트 사이드에서만 처리됨 (실제 구현 필요)
- 샘플 API 데이터 사용 중 (실제 DB 연동 필요)

## 🚧 향후 개선 사항

- [x] MY PAGE 대시보드 리뉴얼
- [x] 점수 시스템 및 상세 분석 기능
- [x] 플로팅 액션 버튼 구현
- [x] 일일 칼로리 그래프 개선
- [x] 자주 먹는 음식 리스트 기능
- [ ] 백엔드 API 연동
- [ ] 사용자 인증 및 세션 관리
- [ ] 데이터베이스 구현
- [ ] 식사 기록 기능
- [ ] 레시피 검색 기능
- [ ] 모바일 앱 최적화
- [ ] 알림 기능
- [ ] 커뮤니티 기능

## 📧 문의 및 지원

문제가 발생하거나 기능 추가 요청이 있으신 경우 이슈를 등록해주세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**마지막 업데이트**: 2024년 10월 22일
**통합 버전**: 1.0.0
