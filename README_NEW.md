<div align="center">

# 🌱 K-Calculator

### 🥗 AI가 함께하는 똑똑한 건강 여정

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,15,18,21,24&height=200&section=header&text=K-Calculator&fontSize=70&fontAlignY=35&animation=twinkling&fontColor=fff" />

[![GitHub stars](https://img.shields.io/github/stars/food-calorie-vision/food-calorie-vision-frontend?style=for-the-badge&logo=github&color=81c784)](https://github.com/food-calorie-vision/food-calorie-vision-frontend/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/food-calorie-vision/food-calorie-vision-frontend?style=for-the-badge&logo=github&color=66bb6a)](https://github.com/food-calorie-vision/food-calorie-vision-frontend/network/members)
[![GitHub issues](https://img.shields.io/github/issues/food-calorie-vision/food-calorie-vision-frontend?style=for-the-badge&logo=github&color=4caf50)](https://github.com/food-calorie-vision/food-calorie-vision-frontend/issues)

<br/>

**📸 찰칵! 음식을 찍으면 AI가 알려주는 영양 정보**  
**🤖 GPT-4o가 추천하는 나만의 건강 식단**  
**🌿 매일매일 성장하는 건강 여정**

[🚀 시작하기](#-시작하기) • [✨ 주요 기능](#-주요-기능) • [🛠 기술 스택](#-기술-스택) • [👥 팀 소개](#-팀-소개)

</div>

---

<br/>

## 🌟 프로젝트 소개

> *"오늘 뭐 먹었더라? 이거 칼로리가 얼마지?"*  
> 이런 고민, 이제 그만! 📸

**K-Calculator**는 음식 사진 한 장으로 시작하는 **스마트 건강 관리 서비스**입니다.  
GPT-4o Vision AI가 음식을 분석하고, 식약처 데이터로 정확한 영양 정보를 제공합니다.

<div align="center">

### 🎯 우리의 미션

```
🌱 건강한 습관 → 💪 튼튼한 몸 → ✨ 행복한 일상
```

</div>

<br/>

---

<br/>

## ✨ 프론트엔드 핵심 기능

<div align="center">

> 🎨 **UI/UX에 집중한 프론트엔드** — 백엔드 API와 연동하여 사용자 경험을 극대화합니다.

<br/>

<table align="center">
<tr>
<td align="center" width="25%">

### 📸 사진 업로드 & 분석 UI
<br/>

드래그앤드롭 / 카메라 촬영  
실시간 분석 로딩 애니메이션  
4개 후보 선택 인터페이스

</td>
<td align="center" width="25%">

### 🍱 식단 추천 화면
<br/>

3가지 스타일 카드 레이아웃  
아침/점심/저녁/간식 탭 구성  
저장 & 즐겨찾기 기능

</td>
<td align="center" width="25%">

### 📊 대시보드 & 차트
<br/>

Recharts 기반 7일 칼로리 그래프  
자주 먹는 음식 TOP5  
MY SCORE 게이지 시각화

</td>
<td align="center" width="25%">

### 🏅 뱃지 & 스트릭
<br/>

뱃지 컬렉션 그리드 뷰  
연속 기록 캘린더  
달성률 프로그레스 바

</td>
</tr>
</table>

<br/>

#### 🔎 페이지별 기능 맵

| 페이지 | 주요 컴포넌트 | 연동 API |
|:---:|:---|:---|
| 🏠 **홈 (로그인)** | 로그인 폼, 소셜 로그인 버튼, 서비스 소개 슬라이드 | `POST /auth/login` |
| 📝 **회원가입** | 3단계 스텝 폼 (기본정보 → 신체정보 → 건강목표) | `POST /auth/signup` |
| 📊 **대시보드** | MyScore, DailyCalorieChart, FrequentFoodsList, BadgeShowcase | `GET /user/intake-data`, `GET /meals/dashboard-stats` |
| 📸 **음식 분석** | 이미지 업로더, 분석 결과 카드, 후보 선택 모달 | `POST /food/analysis-upload` |
| 🥗 **식단 추천** | 식단 옵션 카드 3장, 상세 영양소 표, 저장 버튼 | `POST /recommend/diet-plan` |
| 🍳 **레시피 추천** | 재료 입력/사진 업로드, 레시피 카드 리스트 | `POST /ingredients/recommend-recipes` |
| 🏆 **점수 상세** | 영역별 레이더 차트, 개선 제안 리스트 | `GET /meals/score-detail` |
| 💬 **고객센터** | 공지사항 아코디언, 문의 작성 폼 | `GET /announcements`, `POST /inquiries` |

<br/>

</div>

<br/>

---

<br/>

## 🎬 서비스 미리보기

<div align="center">

### 📱 메인 화면
*로그인, 소개, 오늘의 건강 정보를 한눈에*

<br/>

### 🍽️ 식단 추천
*목표에 맞는 식단을 3가지 옵션으로 비교 선택*

<br/>

### 📊 대시보드
*지난 7일 식단 상태와 자주 먹는 음식 요약*

<br/>

> 💡 **Tip:** “기록”은 최소화, “정보”는 최대화되도록 설계했어요. 📈

</div>

<br/>

---

<br/>

## 🛠 기술 스택

<div align="center">

### Frontend
<img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/Recharts-22C55E?style=for-the-badge&logo=chartdotjs&logoColor=white"/>

### Backend
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
<img src="https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>

### AI & Data
<img src="https://img.shields.io/badge/GPT--4o_Vision-74AA9C?style=for-the-badge&logo=openai&logoColor=white"/>
<img src="https://img.shields.io/badge/YOLO_11-00FFFF?style=for-the-badge&logo=yolo&logoColor=black"/>
<img src="https://img.shields.io/badge/식약처_API-4CAF50?style=for-the-badge&logo=databricks&logoColor=white"/>

### Tools
<img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/>
<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white"/>

</div>

<br/>

---

<br/>

## 🚀 시작하기

<div align="center">

### 🌱 빠른 시작 가이드

</div>

```bash
# 1️⃣ 저장소 클론
git clone https://github.com/food-calorie-vision/food-calorie-vision-frontend.git

# 2️⃣ 프로젝트 디렉토리로 이동
cd food-calorie-vision-frontend

# 3️⃣ 패키지 설치
npm install

# 4️⃣ 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 백엔드 API URL 설정

# 5️⃣ 개발 서버 실행
npm run dev

# 6️⃣ 브라우저에서 확인
# 🌐 http://localhost:3000
```

<div align="center">

### 🎉 완료! 이제 건강한 여정을 시작하세요!

</div>

<br/>

---

<br/>

## 📂 프로젝트 구조

```
🌳 food-calorie-vision-frontend/
│
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📄 page.tsx           # 🏠 홈/로그인
│   │   ├── 📁 signup/            # 📝 회원가입
│   │   ├── 📁 dashboard/         # 📊 대시보드
│   │   ├── 📁 meal-diary/        # 🍽️ 식단 일기
│   │   │   ├── 📁 analysis/     # 📸 AI 음식 분석
│   │   │   └── 📁 ingredient/   # 🥕 식재료 입력
│   │   ├── 📁 recommend/         # 🎯 식단/레시피 추천
│   │   ├── 📁 score-detail/      # 🏆 상세 점수
│   │   └── 📁 contact/           # 💬 고객센터
│   │
│   ├── 📁 components/             # 재사용 컴포넌트
│   │   ├── 🎨 MobileHeader.tsx
│   │   ├── 📊 MyScore.tsx
│   │   ├── 📈 DailyCalorieChart.tsx
│   │   ├── 🎯 FrequentFoodsList.tsx
│   │   ├── 🏅 BadgeShowcase.tsx
│   │   └── ⚡ FloatingActionButtons.tsx
│   │
│   ├── 📁 contexts/               # Context API
│   │   └── 🔐 SessionContext.tsx
│   │
│   ├── 📁 hooks/                  # Custom Hooks
│   │   └── 💬 useChatSession.ts
│   │
│   ├── 📁 types/                  # TypeScript 타입
│   │   └── 📝 report.d.ts
│   │
│   └── 📁 utils/                  # 유틸리티
│       └── 🔧 api.ts
│
├── 📁 public/                     # 정적 파일
│   └── 🖼️ 뱃지 이미지들
│
├── ⚙️ package.json
├── 🎨 tailwind.config.ts
├── 📘 tsconfig.json
└── 📖 README.md                   # 이 파일!
```

<br/>

---

<br/>

## 🎯 핵심 기능 상세

<details>
<summary><b>📸 AI 음식 분석 (GPT-4o Vision)</b></summary>

<br/>

### 작동 방식

1. **사진 업로드** 📷  
   → 음식 사진을 찍거나 업로드

2. **YOLO 객체 탐지** 🎯  
   → YOLO11-large 모델과 Roboflow 재료 탐지 API로 음식·식재료 위치 파악

3. **GPT Vision 분석** 🤖  
   → GPT-4o가 음식 종류 4가지 후보 제시

4. **사용자 선택** ✅  
   → 가장 정확한 음식 선택

5. **영양 정보 제공** 📊  
   → 식약처 DB 매칭으로 정확한 영양소 정보

### 특징
- ✨ **4개 후보 제공**으로 높은 정확도
- 🎯 **식약처 공식 데이터** 기반
- 💾 **자동 기록**으로 편리함

</details>

<details>
<summary><b>🍱 AI 식단 추천 (GPT-4o)</b></summary>

<br/>

### 추천 과정

1. **건강 정보 분석** 👤  
   → 나이, 성별, 체중, 활동량 고려

2. **칼로리 계산** 🧮  
   → Harris-Benedict 공식으로 BMR/TDEE 산출

3. **목표 설정** 🎯  
   → 증량/유지/감량 목표에 맞춤

4. **3가지 옵션** 🍽️  
   → GPT-4o가 아침/점심/저녁/간식 구성

5. **선택 & 저장** 💾  
   → 마음에 드는 식단 저장

### 특징
- 🔬 **과학적 계산**으로 신뢰도 UP
- 🎨 **3가지 스타일** 다양한 선택지
- 📝 **상세 레시피** 포함

</details>

<details>
<summary><b>🏅 뱃지 & 성취 시스템</b></summary>

<br/>

### 수집 가능한 뱃지

| 뱃지 | 이름 | 달성 조건 |
|:---:|:---|:---|
| 🏃 | **칼로리 헌터** | 목표 칼로리 달성 |
| 🥬 | **채소 탐험가** | 채소 충분히 섭취 |
| 💧 | **수분 챔피언** | 물 충분히 마시기 |
| 🧂 | **나트륨 가디언** | 저염식 실천 |
| ⚖️ | **밸런스 마스터** | 영양 균형 맞추기 |

### 연속 기록
- 📅 **스트릭 시스템**으로 매일 동기부여
- 🔥 **연속 N일 달성** 시 특별 보상
- 📊 **캘린더 뷰**로 한눈에 확인

</details>

<br/>

---

<br/>

## 📱 주요 페이지 소개

<div align="center">

| 페이지 | 주요 기능 | 상태 |
|:---:|:---|:---:|
| 🏠 **홈** | 로그인 & 서비스 소개 | ✅ |
| 📝 **회원가입** | 3단계 건강 정보 입력 | ✅ |
| 📊 **대시보드** | MY SCORE, 칼로리 그래프, 자주 먹는 음식 | ✅ |
| 🍽️ **식단 일기** | 음식 사진 분석 & 기록 | ✅ |
| 🎯 **식단 추천** | AI 맞춤 식단 & 레시피 | ✅ |
| 🏆 **점수 상세** | 영역별 점수 분석 | ✅ |
| 💬 **고객센터** | 공지사항 & 문의하기 | ✅ |

</div>

<br/>

---

<br/>

## 🎨 디자인 시스템

<div align="center">

### 🌈 컬러 팔레트

```
🟢 Primary Green    #4CAF50  건강, 신선함
🟡 Accent Yellow    #FFC107  활력, 에너지
🔵 Info Blue        #2196F3  신뢰, 안정
🔴 Warning Red      #FF5252  주의, 강조
⚪ Background       #FFFFFF  깔끔, 여백
```

### 🎭 디자인 철학

> *"복잡하지 않게, 예쁘고 귀엽게, 사용하기 쉽게"*

- 🌿 **자연 친화적** 색상과 아이콘
- 🎨 **직관적인** UI/UX
- 💚 **따뜻한** 감성 디자인

</div>

<br/>

---

<br/>

## 👥 팀 소개

<div align="center">

### 🌱 K-Calculator Team

*건강한 세상을 만드는 사람들*

<br/>

| 👤 | 이름 | 역할 | GitHub |
|:---:|:---:|:---|:---:|
| 🎨 | **김은진** | Frontend Lead, UI/UX | [@eunjinlo](https://github.com/eunjinlo) |
| 💻 | **주연석** | Frontend Dev, AI Integration | [@YeonSeok-Joo](https://github.com/YeonSeok-Joo) |
| 🔧 | **권혁** | Backend Lead, Database | [@Hyuk-CBRN4](https://github.com/Hyuk-CBRN4) |
| 🤖 | **김준호** | Backend Dev, AI Model | [@Junho-06](https://github.com/Junho-06) |

<br/>

### 💬 한 마디!

> *"매일매일 더 건강해지는 여러분을 응원합니다!"* 🎉

</div>

<br/>

---

<br/>

## 📊 프로젝트 현황

<div align="center">

### 📈 개발 진행률

```
██████████████████████████  100% Complete!
```

| 분류 | 진행률 |
|:---|:---:|
| 🎨 Frontend | ██████████████████████ 100% |
| 🔧 Backend | ██████████████████████ 100% |
| 🤖 AI Model | ██████████████████████ 100% |
| 📝 문서화 | ██████████████████████ 100% |

<br/>

### 🎯 마일스톤

- [x] ~~프로젝트 기획 및 설계~~ *(2025.09)*
- [x] ~~데이터베이스 구축~~ *(2025.10)*
- [x] ~~AI 모델 개발~~ *(2025.11)*
- [x] ~~프론트엔드 개발~~ *(2025.11)*
- [x] ~~백엔드 개발~~ *(2025.11)*
- [x] ~~통합 테스트~~ *(2025.11)*
- [ ] 🚀 **서비스 런칭** *(2025.12)*

</div>

<br/>

---

<br/>

## 🔗 관련 링크

<div align="center">

| 링크 | 설명 |
|:---:|:---|
| 🖥️ [Frontend Repo](https://github.com/food-calorie-vision/food-calorie-vision-frontend) | 프론트엔드 저장소 |
| ⚙️ [Backend Repo](https://github.com/food-calorie-vision/food-calorie-vision-backend) | 백엔드 저장소 |
| 📚 [API Docs](https://github.com/food-calorie-vision/food-calorie-vision-backend/tree/main/docs) | API 문서 |
| 🎨 [Figma](https://www.figma.com/) | 디자인 시안 |
| 📊 [ERD](https://www.erdcloud.com/) | 데이터베이스 설계 |

</div>

<br/>

---

<br/>

## 🤝 기여하기

<div align="center">

### 함께 만들어가요! 🌟

이 프로젝트에 기여하고 싶으신가요?

1. 🍴 Fork the Project
2. 🌿 Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. ✅ Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push to the Branch (`git push origin feature/AmazingFeature`)
5. 🎉 Open a Pull Request

<br/>

### 💡 제안하기

버그 리포트나 기능 제안은 [Issues](https://github.com/food-calorie-vision/food-calorie-vision-frontend/issues)에서!

</div>

<br/>

---

<br/>

## 📜 라이선스

<div align="center">

이 프로젝트는 **MIT License** 하에 배포됩니다.

자세한 내용은 [LICENSE](LICENSE) 파일을 확인해주세요.

</div>

<br/>

---

<br/>

## 📧 문의

<div align="center">

### 💌 Contact Us

질문이나 제안사항이 있으신가요?

📧 **Email:** team@k-calculator.com  
💬 **Issues:** [GitHub Issues](https://github.com/food-calorie-vision/food-calorie-vision-frontend/issues)

<br/>

### 🌟 Star 주시면 힘이 됩니다!

[![Star](https://img.shields.io/github/stars/food-calorie-vision/food-calorie-vision-frontend?style=social)](https://github.com/food-calorie-vision/food-calorie-vision-frontend/stargazers)

</div>

<br/>

---

<br/>

<div align="center">

### 🌱 함께 성장하는 건강한 내일

<br/>

**Made with 💚 by K-Calculator Team**

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,15,18,21,24&height=150&section=footer" />

</div>

