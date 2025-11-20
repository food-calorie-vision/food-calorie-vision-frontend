# 🥗 KCalculator - AI 기반 음식 칼로리 관리 및 맞춤 식단 추천

**GPT-4o Vision**과 **식약처 영양 데이터**를 활용한 지능형 건강 관리 웹 애플리케이션입니다.

> 📝 **최신 업데이트 (2024-11-19)**: AI 식단 추천 시스템 추가 (Harris-Benedict 공식 기반)

## 📋 프로젝트 개요

KCalculator는 사용자의 건강 정보를 기반으로:
- 🤖 **AI 음식 분석**: GPT-4o Vision으로 음식 사진 자동 분석
- 🥗 **AI 식단 추천**: 개인 맞춤형 하루 식단 3가지 옵션 제공
- 🍽️ **재료 레시피**: 냉장고 재료 사진으로 레시피 추천
- 📊 **영양 추적**: 일일 칼로리 및 영양소 섭취량 관리
- 💪 **건강 목표 관리**: 증량/유지/감량 목표 설정 및 달성률 추적
- 📈 **식단 분석**: 7일간 섭취 패턴 및 자주 먹는 음식 분석

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
- 이메일 기반 회원가입 (개인정보, 건강정보, 알레르기)
- 세션 기반 로그인/로그아웃
- 사용자 프로필 관리

### 2. AI 음식 분석 (GPT-4o Vision) 📸
- 음식 사진 업로드 → GPT-4o Vision 자동 분석
- 4개 후보 제공 (1~4순위)
- 사용자 선택 → 식약처 DB 매칭으로 정확한 영양소 조회
- 재료 추출 및 저장
- 음식 일기에 자동 기록

### 3. AI 식단 추천 (GPT-4o) 🥗 ✨ NEW
- **Harris-Benedict 공식** 기반 칼로리 계산
  - 기초대사량(BMR) 자동 산출
  - 1일 총 에너지 소비량(TDEE) 계산
  - 건강 목표별 목표 칼로리 제시
- GPT-4o가 **3가지 식단 옵션** 제공
  - 각 식단: 아침/점심/저녁/간식 구성
  - 재료 및 칼로리 상세 정보
  - 영양소 비율 (탄수화물/단백질/지방)
- 선택한 식단 저장 (DietPlan DB)

### 4. 재료 기반 레시피 추천 🍳
- 냉장고 재료 사진 촬영
- GPT-4o가 재료 인식 후 레시피 추천
- 단계별 조리법 제공
- 건강 점수 및 제안 사항

### 5. 대시보드 📊
- MY SCORE: 식단 점수 확인 및 상세 분석
- 일일 칼로리 섭취량 그래프 (7일간 트렌드)
- 자주 먹는 음식 리스트 (칼로리 및 영양소 정보)
- 우측 플로팅 액션 버튼 (5개 기능 페이지 이동)
- 상세 점수 현황 페이지 (영역별 점수 분석)

### 6. 식단 관리
- 음식 일기 (meal-diary/analysis)
- 일일 섭취량 기록 및 추적
- 영양 성분 분석
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
| `/dashboard` | MY PAGE 대시보드 | ✅ 완료 |
| `/score-detail` | 상세 점수 현황 | ✅ 완료 |
| `/meal-diary/analysis` | 음식 일기 (AI 분석) | ✅ 완료 |
| `/recommend` | AI 식단 추천 ✨ NEW | ✅ 완료 |
| `/health-report` | 건강 리포트 | 🔧 개발 예정 |
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

## 🔗 백엔드 연동

본 프론트엔드는 FastAPI 백엔드와 연동되어 동작합니다.

- **백엔드 저장소**: `food-calorie-vision-backend/`
- **API Base URL**: `http://localhost:8000/api/v1`
- **인증 방식**: 세션 기반 (쿠키)
- **주요 통신**:
  - 음식 분석: `POST /food/analyze`
  - 식단 추천: `POST /recommend/diet-plan`
  - 식단 저장: `POST /recommend/save-diet-plan`
  - 사용자 정보: `GET /user/health-info`

백엔드 설치 및 실행 방법은 `food-calorie-vision-backend/README.md`를 참고하세요.

## 🚧 개발 현황

### 완료됨 ✅
- [x] MY PAGE 대시보드 리뉴얼
- [x] 점수 시스템 및 상세 분석 기능
- [x] 플로팅 액션 버튼 구현
- [x] 일일 칼로리 그래프 개선
- [x] 자주 먹는 음식 리스트 기능
- [x] 백엔드 API 연동 (FastAPI)
- [x] 세션 기반 인증 시스템
- [x] MySQL 데이터베이스 연동
- [x] GPT-4o Vision 음식 분석
  - [x] 4개 후보 제공 + 사용자 선택
  - [x] 식약처 DB 매칭
  - [x] 음식 일기 자동 기록
- [x] GPT-4o 재료 레시피 추천
- [x] GPT-4o AI 식단 추천 시스템
  - [x] Harris-Benedict 공식 BMR/TDEE 계산
  - [x] 3가지 식단 옵션 제공
  - [x] 추천 식단 저장 기능
  - [x] 식단 목록/상세 조회 API

### 진행 예정 🚧
- [ ] 저장된 식단 목록 UI 구현
- [ ] 식단 진행률 추적 (섭취 여부 체크)
- [ ] 건강 리포트 페이지
- [ ] NRF9.3 영양 점수 완성
- [ ] 모바일 반응형 개선
- [ ] PWA 지원
- [ ] 알림 기능
- [ ] 소셜 공유 기능

## 📧 문의 및 지원

문제가 발생하거나 기능 추가 요청이 있으신 경우 이슈를 등록해주세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**마지막 업데이트**: 2024년 11월 19일  
**버전**: 2.0.0 (AI 식단 추천 시스템 추가)
