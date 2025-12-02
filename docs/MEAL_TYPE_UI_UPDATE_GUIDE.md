# 식사 유형 (meal_type) UI 업데이트 가이드

## ✅ 완료된 작업

### 1. 식사일기 - 음식 분석 페이지 (`/meal-diary/analysis`)
- **파일**: `src/app/meal-diary/analysis/page.tsx`
- **변경 사항**:
  - 식사 유형 선택 버튼 추가 (🌅 아침, ☀️ 점심, 🌙 저녁, 🍪 간식)
  - `selectedMealType` state 추가
  - API 호출 시 `mealType` 파라미터 포함

**UI 위치**: 페이지 상단, "식단 분석" 제목 아래

---

## 🔧 추가 작업 필요 페이지

### 2. 레시피 추천 페이지 (`/recommend`)
**파일**: `src/app/recommend/page.tsx`

#### 추가할 위치
레시피 완료 후 "음식 기록하기" 버튼 클릭 시 식사 유형 선택 모달 표시

#### 구현 예시
```typescript
// State 추가
const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
const [showMealTypeModal, setShowMealTypeModal] = useState(false);

// 음식 기록 버튼 클릭 시
const handleRecordFood = () => {
  setShowMealTypeModal(true); // 모달 표시
};

// 모달에서 식사 유형 선택 후 저장
const handleSaveRecipe = async () => {
  const response = await fetch(`${apiEndpoint}/api/v1/recipes/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      recipeName: selectedRecipe.recipe_name,
      actualServings: servings,
      mealType: selectedMealType, // ✨ 추가!
      nutritionInfo: selectedRecipe.nutrition_info,
      ingredients: selectedRecipe.ingredients.map(i => i.name),
      foodClass1: getFoodClassFromName(selectedRecipe.recipe_name),
    }),
  });
};
```

#### UI 디자인 (모달)
```tsx
{showMealTypeModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
      <h3 className="text-lg font-bold mb-4">식사 유형을 선택하세요</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setSelectedMealType('breakfast')}
          className={`py-4 rounded-lg font-medium ${
            selectedMealType === 'breakfast'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          🌅 아침
        </button>
        <button
          onClick={() => setSelectedMealType('lunch')}
          className={`py-4 rounded-lg font-medium ${
            selectedMealType === 'lunch'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          ☀️ 점심
        </button>
        <button
          onClick={() => setSelectedMealType('dinner')}
          className={`py-4 rounded-lg font-medium ${
            selectedMealType === 'dinner'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          🌙 저녁
        </button>
        <button
          onClick={() => setSelectedMealType('snack')}
          className={`py-4 rounded-lg font-medium ${
            selectedMealType === 'snack'
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          🍪 간식
        </button>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => setShowMealTypeModal(false)}
          className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium"
        >
          취소
        </button>
        <button
          onClick={handleSaveRecipe}
          className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium"
        >
          저장
        </button>
      </div>
    </div>
  </div>
)}
```

---

### 3. 식재료 기반 레시피 페이지 (`/meal-diary/ingredient`)
**파일**: `src/app/meal-diary/ingredient/page.tsx`

레시피 추천 페이지와 동일한 방식으로 구현

---

## 📊 현재 상태 요약

| 페이지 | 파일 | 상태 | 비고 |
|--------|------|------|------|
| 식사일기 - 음식 분석 | `/meal-diary/analysis/page.tsx` | ✅ 완료 | 상단에 버튼 4개 |
| 레시피 추천 | `/recommend/page.tsx` | ⚠️ 미완료 | 모달 추가 필요 |
| 식재료 레시피 | `/meal-diary/ingredient/page.tsx` | ⚠️ 미완료 | 모달 추가 필요 |

---

## 🎨 디자인 가이드

### 색상
- **선택됨**: `bg-green-500 text-white shadow-md`
- **선택 안됨**: `bg-slate-100 text-slate-700 hover:bg-slate-200`

### 아이콘
- 🌅 아침 (breakfast)
- ☀️ 점심 (lunch)
- 🌙 저녁 (dinner)
- 🍪 간식 (snack)

### 레이아웃
- **버튼 형식**: 4개 버튼을 가로로 배치 (`grid-cols-4`)
- **모달 형식**: 2x2 그리드 (`grid-cols-2`)

---

## 🧪 테스트 체크리스트

### 식사일기 페이지
- [ ] 페이지 로드 시 기본값 "점심" 선택됨
- [ ] 각 버튼 클릭 시 선택 상태 변경
- [ ] 음식 저장 시 선택한 meal_type이 API로 전송됨
- [ ] 저장 성공 후 DB에 올바른 meal_type 저장 확인

### 레시피 페이지
- [ ] "음식 기록하기" 클릭 시 모달 표시
- [ ] 모달에서 식사 유형 선택 가능
- [ ] 취소 버튼 클릭 시 모달 닫힘
- [ ] 저장 버튼 클릭 시 선택한 meal_type과 함께 저장

---

## 📝 추가 개선 사항

### 1. 스마트 기본값 (선택사항)
현재 시간 기반으로 기본값 자동 설정:

```typescript
const getSmartDefaultMealType = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 20) return 'dinner';
  return 'snack';
};

// State 초기화 시
const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(
  getSmartDefaultMealType()
);
```

### 2. 식사 유형별 통계 표시 (대시보드)
- 아침/점심/저녁/간식별 칼로리 섭취량 차트
- 식사 유형별 자주 먹는 음식
- 식사 패턴 분석

### 3. 식사 시간 기록
- 현재는 `consumed_at`만 저장
- 추후 식사 시간대 분석 가능

---

## 🚀 배포 전 확인사항

1. ✅ DB 마이그레이션 실행 완료
2. ✅ 백엔드 API 정상 동작 확인
3. ✅ 식사일기 페이지 UI 추가 완료
4. ⚠️ 레시피 페이지 UI 추가 (진행 중)
5. ⚠️ 식재료 레시피 페이지 UI 추가 (진행 중)
6. ⚠️ 통합 테스트 실행
7. ⚠️ 모바일 반응형 확인

---

**작성일**: 2025-11-20  
**작성자**: AI Assistant

