# 🚀 빌드 및 배포 가이드

**작성일**: 2025-10-22  
**대상**: food-calorie-vision-frontend  

---

## 📌 개요

프로젝트 빌드, 배포, 성능 최적화, 모니터링에 대한 완벽한 가이드입니다.

---

## 🏗️ 개발 서버 실행

### 로컬 개발

```bash
npm run dev
```

**결과**:
```
✅ 개발 서버 시작
✅ http://localhost:3000 에서 접근 가능
✅ Hot reload 활성화 (파일 변경 시 자동 새로고침)
✅ Turbopack으로 빠른 빌드
```

### 특정 포트에서 실행

```bash
npm run dev -- -p 3001
```

---

## 🔨 프로덕션 빌드

### 빌드 수행

```bash
npm run build
```

**프로세스**:
```
Step 1: 파일 스캔 및 분석
        → 모든 TypeScript/JavaScript 파일 검토
        
Step 2: 모듈 해석
        → import 경로 검증 (@/ 별칭 포함)
        → 모든 의존성 확인
        
Step 3: TypeScript 컴파일
        → 타입 체크 수행
        → JavaScript로 변환
        
Step 4: Tailwind CSS 처리
        → 모든 클래스 추출
        → 사용하지 않는 클래스 제거 (tree-shaking)
        → CSS 파일 생성
        
Step 5: 페이지 생성
        → 정적 페이지 미리 생성
        → API 라우트 처리
        → sitemap.xml, robots.txt 생성
        
Step 6: 최적화
        → 이미지 최적화
        → JavaScript 번들 최소화
        → CSS 번들 최소화
```

### 빌드 결과

```
✓ Compiled successfully in 6.5s
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (10/10)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                         Size
┌ ○ /                            5.92 kB
├ ○ /signup                      5.26 kB
├ ○ /dashboard                   <unknown>
├ ○ /customized-diet             <unknown>
├ ƒ /api/health-info             -
├ ƒ /api/intake-data             -
└ ƒ /api/recommendations         -
```

**기호 설명**:
- `○` (Static) - 정적 페이지 (미리 생성)
- `ƒ` (Dynamic) - 동적 페이지 (요청 시 생성)

---

## 🚀 배포

### 1. Next.js 서버로 배포 (로컬)

```bash
# 빌드
npm run build

# 서버 시작
npm start
```

**결과**:
```
✅ http://localhost:3000 에서 프로덕션 빌드 실행
✅ 최적화된 성능
✅ 정적 파일 캐싱 활성화
```

### 2. Vercel로 배포 (권장)

#### 설정
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 로그인
vercel login

# 3. 배포
vercel
```

#### 자동 배포 (GitHub 연동)
```bash
1. GitHub에 코드 푸시
2. Vercel Dashboard에서 프로젝트 연결
3. 자동으로 빌드 및 배포
```

### 3. Docker로 배포

#### Dockerfile 생성

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 빌드
COPY . .
RUN npm run build

# 포트 노출
EXPOSE 3000

# 시작 명령
CMD ["npm", "start"]
```

#### 빌드 및 실행

```bash
# Docker 이미지 빌드
docker build -t food-calorie-vision .

# 컨테이너 실행
docker run -p 3000:3000 food-calorie-vision
```

---

## 📊 빌드 최적화

### 1. 번들 분석

```bash
# 번들 크기 분석
npm run build
# .next/static 폴더 확인
```

### 2. 사용하지 않는 코드 제거

#### Dead Code Elimination
```javascript
// 사용하지 않는 함수 제거
// Webpack/Turbopack이 자동으로 처리

// 동적 import 사용
const Component = dynamic(() => import('@/components/Heavy'));
```

#### Tailwind CSS Tree-shaking
```css
/* globals.css */
@import "tailwindcss";

/* 사용하지 않는 클래스는 자동 제거됨 */
/* tailwind.config.ts의 content 경로가 정확하면 정상 작동 */
```

### 3. 이미지 최적화

#### Next.js Image 컴포넌트 사용

```tsx
import Image from 'next/image';

export default function Component() {
  return (
    <Image
      src="/image.png"
      alt="설명"
      width={400}
      height={300}
      priority // 필요한 경우만 사용
    />
  );
}
```

### 4. 동적 임포트

```tsx
import dynamic from 'next/dynamic';

// 필요할 때만 로드
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <div>로딩 중...</div>,
  ssr: false
});
```

---

## 🔍 성능 모니터링

### 1. 빌드 시간

```bash
npm run build 2>&1 | tee build.log
```

**목표**: 10초 이내

### 2. 페이지 로드 시간

브라우저 개발자 도구:
```
F12 → Network 탭
→ 페이지 로드 시간 확인
→ 느린 리소스 식별
```

### 3. Core Web Vitals

```bash
npm run build

# 페이지 성능 측정 도구
# https://pagespeed.web.dev 방문
```

**측정 항목**:
- **LCP** (Largest Contentful Paint): 2.5초 이내 목표
- **FID** (First Input Delay): 100ms 이내 목표
- **CLS** (Cumulative Layout Shift): 0.1 이내 목표

---

## 🔧 환경 변수 설정

### .env.local 파일 생성

```bash
# API 엔드포인트
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 데이터베이스
DATABASE_URL=your_database_url

# 기타 설정
NODE_ENV=development
```

### 사용법

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function fetchData() {
  const response = await fetch(`${apiUrl}/health-info`);
  return response.json();
}
```

---

## 📋 배포 체크리스트

### 배포 전

- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 없음
- [ ] 모든 페이지 로드 테스트
- [ ] 모든 API 엔드포인트 테스트
- [ ] 반응형 디자인 테스트 (모바일, 태블릿, 데스크톱)
- [ ] 브라우저 호환성 테스트 (Chrome, Firefox, Safari, Edge)
- [ ] 환경 변수 설정 확인
- [ ] 보안 설정 확인 (CORS, CSP 등)

### 배포 후

- [ ] 프로덕션 사이트 로드 테스트
- [ ] 페이지 로드 시간 모니터링
- [ ] 에러 로깅 확인
- [ ] 사용자 분석 설정
- [ ] SSL/TLS 인증서 확인
- [ ] 도메인 설정 확인

---

## 🐛 배포 문제 해결

### 문제 1: 빌드 실패

**증상**:
```
Build Error: Turbopack build failed
```

**해결**:
```bash
# 1. 캐시 삭제
rm -rf .next node_modules

# 2. 의존성 재설치
npm install

# 3. 빌드 재시도
npm run build
```

### 문제 2: 스타일 미적용

**증상**:
```
프로덕션에서 Tailwind 클래스가 작동하지 않음
```

**해결**:
```bash
# 1. tailwind.config.ts content 경로 확인
# 2. globals.css import 확인
# 3. 캐시 삭제
rm -rf .next

# 4. 빌드 재시도
npm run build
```

### 문제 3: 메모리 부족

**증상**:
```
Error: JavaScript heap out of memory
```

**해결**:
```bash
# Node.js 메모리 증가
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

---

## 📈 성능 개선 팁

### 1. Code Splitting

```typescript
// 동적 import로 필요할 때만 로드
const HeavyComponent = dynamic(() => import('@/components/Heavy'));
```

### 2. 캐싱 전략

```javascript
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### 3. CDN 활용

```bash
# Vercel 사용 시 자동으로 CDN에 배포
# 정적 파일은 엣지에서 캐싱됨
```

### 4. 데이터베이스 최적화

```typescript
// 쿼리 최적화
// 인덱스 생성
// N+1 쿼리 피하기
```

---

## 🔒 보안 설정

### 환경 변수 보호

```bash
# .env.local은 절대 깃에 커밋하지 않기
echo ".env.local" >> .gitignore
```

### CORS 설정

```typescript
// API 라우트
export async function GET(request: Request) {
  return new Response(JSON.stringify({...}), {
    headers: {
      'Access-Control-Allow-Origin': 'https://yourdomain.com',
      'Access-Control-Allow-Methods': 'GET, POST',
    },
  });
}
```

### CSP (Content Security Policy)

```javascript
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'",
        },
      ],
    },
  ],
};
```

---

## 📊 배포 후 모니터링

### 1. 에러 추적

```typescript
// Sentry 같은 에러 추적 서비스 설정
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 2. 성능 모니터링

```typescript
// 분석 도구 설정
import { analytics } from '@/lib/analytics';

export default function Page() {
  useEffect(() => {
    analytics.pageview();
  }, []);
  
  return <div>...</div>;
}
```

### 3. 로그 수집

```typescript
// 구조화된 로깅
console.log(JSON.stringify({
  timestamp: new Date(),
  level: 'info',
  message: 'User signed up',
  userId: user.id,
}));
```

---

## ✨ 최종 결론

### ✅ 빌드 성공 기준
- ✅ 0 에러
- ✅ 모든 페이지 생성됨
- ✅ 10초 이내 완료

### 📊 배포 준비 상태
- ✅ 로컬 빌드 성공
- ✅ 모든 테스트 통과
- ✅ 보안 설정 완료

### 🚀 배포 준비
- ✅ 환경 변수 설정
- ✅ 도메인 준비
- ✅ SSL 인증서 준비

---

**작성 완료**: 2025-10-22  
**최종 상태**: ✅ 배포 준비 완료  
**다음 단계**: `npm run build` 후 배포 수행
