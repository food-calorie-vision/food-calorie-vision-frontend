# 레시피 저장 오류 분석 및 해결

## 1. 문제 상황
- **증상**: 레시피 추천 후 '요리 완료' 버튼을 눌러 레시피를 저장하려고 할 때 500 에러 발생.
- **오류 메시지**: `AttributeError: 'SaveRecipeRequest' object has no attribute 'portion_size_g'`
- **원인**: 
  - Backend의 `SaveRecipeRequest` Pydantic 모델에 `portion_size_g` 필드가 정의되지 않음.
  - 하지만 `routes/recipes.py` 로직에서는 `save_request.portion_size_g`를 참조하고 있음.
  - Frontend에서도 해당 필드를 보내지 않고 있었을 가능성 있음.

## 2. 에러 로그
```text
2025-12-09 14:27:33,882 INFO sqlalchemy.engine.Engine [cached since 0.05005s ago] ('%버섯200g%', '%버섯200g%', '%버섯200g%', '%버섯200g%', '%버섯200g류%', 20)
...
❌ 레시피 저장 오류: 'SaveRecipeRequest' object has no attribute 'portion_size_g'
Traceback (most recent call last):
  File "/home/pollux/workspace/food-calorie-vision-main/food-calorie-vision-backend/app/api/v1/routes/recipes.py", line 783, in save_recipe_as_meal
    reference_value=save_request.portion_size_g,
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/pollux/workspace/food-calorie-vision-main/food-calorie-vision-backend/.venv/lib/python3.12/site-packages/pydantic/main.py", line 856, in __getattr__
    raise AttributeError(f'{type(self).__name__!r} object has no attribute {item!r}')
AttributeError: 'SaveRecipeRequest' object has no attribute 'portion_size_g'
INFO:     127.0.0.1:34150 - "POST /api/v1/recipes/save HTTP/1.1" 500 Internal Server Error
```

## 3. 해결 방안 (Code Changes)

### Backend (`food-calorie-vision-backend/app/api/v1/schemas/recipe.py`)
`SaveRecipeRequest` 모델에 `portion_size_g` 필드 추가.

```python
class SaveRecipeRequest(BaseModel):
    """레시피 완료 후 식단 기록 요청"""
    recipe_name: str = Field(..., description="레시피 이름")
    actual_servings: float = Field(1.0, description="실제 섭취량 (인분)")
    portion_size_g: float = Field(250.0, description="1인분 기준 중량(g)")  # Added
    meal_type: str = Field("lunch", description="식사 유형 (breakfast, lunch, dinner, snack)")
    nutrition_info: NutritionInfo = Field(..., description="영양 정보")
    ingredients: Optional[List[str]] = Field(None, description="재료 목록")
```

### Frontend (`food-calorie-vision-frontend/src/app/recommend/page.tsx`)
API 호출 시 `portion_size_g` 데이터 전송 추가.

```typescript
        body: JSON.stringify({
          recipe_name: selectedRecipe.name,
          actual_servings: 1.0,  // TODO: 사용자가 입력하도록 개선
          portion_size_g: 250.0, // 기본 1인분 중량 (Added)
          meal_type: selectedMealType || 'lunch',  // ✨ 사용자가 선택한 식사 유형 사용
          nutrition_info: {
            // ...
          }
```
