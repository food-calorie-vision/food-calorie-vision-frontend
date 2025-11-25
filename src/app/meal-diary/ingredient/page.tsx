'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type IngredientPrediction = {
  name: string;
  count: number;
  selected: boolean;
  confidence?: number;
};

type IngredientImage = {
  id: string;
  url: string;
  file?: File;
  predictions?: IngredientPrediction[];
  manualInput?: string;
  filteredSuggestions?: string[];
  showSuggestions?: boolean;
};

type RecipeStepPayload =
  | string
  | {
      title?: string;
      description?: string;
      instruction?: string;
      tip?: string;
    };

type RecommendedFood = {
  name: string;
  description: string;
  ingredients: string[];
  steps: RecipeStepPayload[];
};

type CookingStep = {
  stepNumber: number;
  title: string;
  description: string;
  tip?: string;
};

type RecommendedFoodPayload = {
  name?: string;
  description?: string;
  ingredients?: string[];
  steps?: RecipeStepPayload[];
};

type UserIngredientRecord = {
  ingredient_name: string;
  count: number;
  is_used: boolean;
};

// 한국 식재료 목록 (자동완성용)
const KOREAN_INGREDIENTS = [
  '감자', '고구마', '당근', '양파', '대파', '마늘', '생강', '무', '배추', '상추',
  '시금치', '브로콜리', '양배추', '오이', '호박', '가지', '피망', '파프리카', '토마토', '버섯',
  '계란', '두부', '닭고기', '돼지고기', '쇠고기', '삼겹살', '닭가슴살', '참치', '연어', '새우',
  '오징어', '고등어', '김', '미역', '다시마', '멸치', '콩', '팥', '녹두', '땅콩',
  '쌀', '밀가루', '국수', '파스타', '빵', '떡', '식빵', '우유', '치즈', '버터',
  '요구르트', '사과', '바나나', '귤', '딸기', '수박', '포도', '배', '복숭아', '키위',
  '고추', '청양고추', '고춧가루', '간장', '된장', '고추장', '식초', '설탕', '소금', '후추',
  '참기름', '들기름', '식용유', '올리브유', '카레', '케첩', '마요네즈', '머스타드'
];

export default function IngredientPage() {
  const router = useRouter();
  const [images, setImages] = useState<IngredientImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState({ current: 0, total: 0 });
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  // 재치있는 로딩 메시지 배열
  const funnyLoadingMessages = [
    '🔍 식재료 인식 시작!',
    '🤖 AI가 냉장고 속을 열심히 관찰 중...',
    '📸 이미지 분석 중...',
    '🥕 식재료 데이터베이스 검색 중...',
    '🎯 최적의 매칭 찾는 중...',
    '✨ 거의 다 왔어요!'
  ];
  
  const recommendLoadingMessages = [
    '🤖 GPT가 레시피 책 뒤지는 중...',
    '👨‍🍳 영양사가 메뉴 고민 중...',
    '🍳 건강한 레시피 찾는 중...',
    '📊 칼로리 계산 중...',
    '✨ 맛있는 추천 준비 중!'
  ];
  
  // 추천 관련 상태
  const [flowStep, setFlowStep] = useState<'input' | 'recommend' | 'cooking' | 'complete'>('input');
  const [recommendedFoods, setRecommendedFoods] = useState<RecommendedFood[]>([]);
  const [selectedFood, setSelectedFood] = useState<RecommendedFood | null>(null);
  const [cookingSteps, setCookingSteps] = useState<CookingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const hasCookingSteps = cookingSteps.length > 0;
  const safeCookingIndex = hasCookingSteps
    ? Math.min(Math.max(currentStepIndex, 0), cookingSteps.length - 1)
    : 0;
  const cookingStepDisplayNumber = hasCookingSteps ? safeCookingIndex + 1 : 0;
  const cookingProgressPercent = hasCookingSteps
    ? Math.round(((safeCookingIndex + 1) / cookingSteps.length) * 100)
    : 0;
  
  // 재료 확인 모달 상태
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [ingredientsWithQuantity, setIngredientsWithQuantity] = useState<Array<{name: string, quantity: number, available: number}>>([]);
  
  // 인증 로딩 상태
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 인증 체크 함수
  const checkAuthAndRedirect = (response: Response) => {
    if (response.status === 401 || response.status === 403) {
      alert('⚠️ 로그인이 만료되었습니다. 다시 로그인해주세요.');
      router.push('/login');
      return true;
    }
    return false;
  };

  // 페이지 로드 시 인증 확인 (한 번만)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
          credentials: 'include',
        });
        
        if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
          return;
        }
        
        // 인증 성공
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('인증 확인 실패:', error);
        alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/');
      }
    };
    
    checkAuth();
  }, [router]);

  // 인증 체크 중이면 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-medium">로그인 확인 중...</p>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: IngredientImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          file: file,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // 재치있는 로딩 메시지 순차 표시
    let messageIndex = 0;
    setLoadingMessage(funnyLoadingMessages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % funnyLoadingMessages.length;
      setLoadingMessage(funnyLoadingMessages[messageIndex]);
    }, 2000); // 2초마다 메시지 변경

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 분석할 이미지 필터링
      const imagesToAnalyze = images.filter(img => !img.predictions && img.file);
      
      if (imagesToAnalyze.length === 0) {
        alert('분석할 이미지가 없습니다.');
        clearInterval(messageInterval);
        setLoadingMessage('');
        setIsAnalyzing(false);
        return;
      }

      // 진행률 초기화
      setAnalyzingProgress({ current: 0, total: imagesToAnalyze.length });
      console.log(`🚀 총 ${imagesToAnalyze.length}개 이미지 분석 시작`);

      // 모든 이미지를 병렬로 분석 (Promise.all)
      const analysisPromises = imagesToAnalyze.map(async (img, index) => {
        try {
          console.log(`🔍 [${index + 1}/${imagesToAnalyze.length}] 이미지 분석 중: ${img.id}`);
          
          // FormData로 이미지 전송
          const formData = new FormData();
          formData.append('file', img.file!);
          
          // 백엔드 API 호출 (Roboflow + GPT Vision)
          const response = await fetch(`${apiEndpoint}/api/v1/ingredients/analyze-with-roboflow-gpt`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          // 인증 체크
          if (checkAuthAndRedirect(response)) {
            return null;
          }

          if (!response.ok) {
            throw new Error('식재료 분석에 실패했습니다.');
          }

          const result = await response.json();
          console.log(`📦 [${index + 1}/${imagesToAnalyze.length}] 분석 결과:`, result);

          // 진행률 업데이트
          setAnalyzingProgress(prev => ({ ...prev, current: prev.current + 1 }));

          // 결과를 우리 형식으로 변환
          const ingredientMap = new Map<string, { count: number; confidence: number }>();
          
          if (result.success && result.data.ingredients) {
            result.data.ingredients.forEach((ingredient: { name?: string; confidence?: number }) => {
              const name = ingredient.name || '알 수 없음';
              const confidence = ingredient.confidence || 0;
              
              if (ingredientMap.has(name)) {
                const existing = ingredientMap.get(name)!;
                ingredientMap.set(name, {
                  count: existing.count + 1,
                  confidence: Math.max(existing.confidence, confidence)
                });
              } else {
                ingredientMap.set(name, { count: 1, confidence });
              }
            });
          }

          // Map을 배열로 변환
          const ingredientPredictions: IngredientPrediction[] = Array.from(ingredientMap.entries())
            .map(([name, data]) => ({
              name,
              count: data.count,
              selected: true,
              confidence: data.confidence
            }))
            .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

          return { id: img.id, predictions: ingredientPredictions };
        } catch (error) {
          console.error(`❌ 이미지 분석 실패 (${img.id}):`, error);
          // 진행률 업데이트 (실패해도 카운트)
          setAnalyzingProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return { id: img.id, predictions: [] };
        }
      });

      // 모든 분석 완료 대기
      const results = await Promise.all(analysisPromises);
      console.log(`✅ 모든 분석 완료! 총 ${results.length}개 결과`);

      // 한 번에 모든 결과 업데이트
      setImages((prev) =>
        prev.map((img) => {
          const result = results.find(r => r.id === img.id);
          if (result) {
            return { ...img, predictions: result.predictions };
          }
          return img;
        })
      );

      alert(`✅ ${results.length}개 이미지 분석 완료!`);
      clearInterval(messageInterval);
      setLoadingMessage('');
      
    } catch (error) {
      console.error('❌ 전체 분석 프로세스 실패:', error);
      alert('식재료 분석 중 오류가 발생했습니다.');
      clearInterval(messageInterval);
      setLoadingMessage('');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingProgress({ current: 0, total: 0 });
    }
  };

  const toggleIngredient = (imageId: string, ingredientName: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== imageId) return img;
        return {
          ...img,
          predictions: img.predictions?.map((pred) => ({
            ...pred,
            selected: pred.name === ingredientName ? !pred.selected : pred.selected,
          })),
        };
      })
    );
  };

  const updateCount = (imageId: string, ingredientName: string, delta: number) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== imageId) return img;
        return {
          ...img,
          predictions: img.predictions?.map((pred) =>
            pred.name === ingredientName
              ? { ...pred, count: Math.max(0, pred.count + delta) }
              : pred
          ),
        };
      })
    );
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSaveIngredients = async () => {
    // 선택된 식재료들만 추출
    const selectedIngredients: { name: string; count: number }[] = [];
    
    images.forEach((img) => {
      img.predictions?.forEach((pred) => {
        if (pred.selected && pred.count > 0) {
          selectedIngredients.push({
            name: pred.name,
            count: pred.count,
          });
        }
      });
    });

    if (selectedIngredients.length === 0) {
      alert('저장할 식재료를 선택해주세요.');
      return;
    }

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiEndpoint}/api/v1/ingredients/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ingredients: selectedIngredients }),
      });

      // 인증 체크
      if (checkAuthAndRedirect(response)) {
        return;
      }

      if (!response.ok) {
        throw new Error('식재료 저장에 실패했습니다.');
      }

      await response.json();
      alert(`✅ ${selectedIngredients.length}개의 식재료가 저장되었습니다!`);
      
      // 저장 후 초기화
      setImages([]);
    } catch (error) {
      console.error('❌ 식재료 저장 오류:', error);
      alert('식재료 저장 중 오류가 발생했습니다.');
    }
  };

  const handleGetRecommendations = async () => {
    setIsLoadingRecommendations(true);
    
    // 재치있는 로딩 메시지 순차 표시
    let messageIndex = 0;
    setLoadingMessage(recommendLoadingMessages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % recommendLoadingMessages.length;
      setLoadingMessage(recommendLoadingMessages[messageIndex]);
    }, 2000);
    
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiEndpoint}/api/v1/ingredients/recommendations`, {
        method: 'GET',
        credentials: 'include',
      });

      // 인증 체크
      if (checkAuthAndRedirect(response)) {
        setIsLoadingRecommendations(false);
        return;
      }

      if (!response.ok) {
        throw new Error('음식 추천을 가져오는데 실패했습니다.');
      }

      const result = await response.json();
      
      console.log('🔍 추천 API 응답:', result);
      console.log('📝 응답 메시지:', result.message);
      console.log('📊 재료 개수:', result.data?.total_ingredients);
      
      if (result.success && result.data) {
        // 추천 결과 표시 (모달이나 새 섹션으로)
        setRecommendedFoods(parseRecommendations(result.data.recommendations));
        setFlowStep('recommend');
      } else {
        alert('추천을 가져올 수 없습니다.');
      }
      clearInterval(messageInterval);
      setLoadingMessage('');
    } catch (error) {
      console.error('❌ 음식 추천 오류:', error);
      alert('음식 추천을 가져오는 중 오류가 발생했습니다. 환경 변수(OPENAI_API_KEY)가 설정되었는지 확인해주세요.');
      clearInterval(messageInterval);
      setLoadingMessage('');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  // GPT 추천 텍스트를 파싱해서 음식 목록으로 변환
  const parseRecommendations = (text: string): RecommendedFood[] => {
    try {
      // JSON 형식으로 파싱
      const parsed = JSON.parse(text);
      
      if (parsed.foods && Array.isArray(parsed.foods)) {
        return parsed.foods.map((food: RecommendedFoodPayload) => ({
          name: food.name || "이름 없음",
          description: food.description || "",
          ingredients: food.ingredients || [],
          steps: Array.isArray(food.steps) ? (food.steps as RecipeStepPayload[]) : []
        }));
      }
      
      // JSON 형식이 아니면 빈 배열 반환
      console.warn('⚠️ JSON 형식이 아닌 응답:', text);
      return [];
    } catch (error) {
      console.error('❌ 추천 파싱 오류:', error);
      console.log('원본 텍스트:', text);
      
      // 파싱 실패 시 더미 데이터 반환 (개발 중에만)
      return [
        {
          name: "추천 불러오기 실패",
          description: "응답 형식을 파싱할 수 없습니다. 백엔드 로그를 확인해주세요.",
          ingredients: [],
          steps: ["백엔드 서버를 확인하세요"]
        }
      ];
    }
  };

  // 수동 입력 핸들러 (이미지별)
  const handleManualInputChange = (imageId: string, value: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== imageId) return img;

      if (value.trim()) {
        const filtered = KOREAN_INGREDIENTS.filter(ingredient =>
          ingredient.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 10);

        return {
          ...img,
          manualInput: value,
          filteredSuggestions: filtered,
          showSuggestions: true
        };
      } else {
        return {
          ...img,
          manualInput: value,
          filteredSuggestions: [],
          showSuggestions: false
        };
      }
    }));
  };

  // 수동으로 재료 추가 (특정 이미지에)
  const handleAddManualIngredient = (imageId: string, ingredientName: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== imageId) return img;

      const existingPred = img.predictions?.find(p => p.name === ingredientName);
      
      if (existingPred) {
        // 이미 있으면 수량만 증가
        return {
          ...img,
          predictions: img.predictions?.map(p => 
            p.name === ingredientName ? { ...p, count: p.count + 1 } : p
          ),
          manualInput: '',
          filteredSuggestions: [],
          showSuggestions: false
        };
      } else {
        // 없으면 새로 추가
        return {
          ...img,
          predictions: [
            ...(img.predictions || []),
            { name: ingredientName, count: 1, selected: true, confidence: 1.0 }
          ],
          manualInput: '',
          filteredSuggestions: [],
          showSuggestions: false
        };
      }
    }));
  };

  // Enter 키로 추가
  const handleManualInputKeyDown = (imageId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    const img = images.find(i => i.id === imageId);
    if (!img) return;

    if (e.key === 'Enter' && img.manualInput?.trim()) {
      if (img.filteredSuggestions && img.filteredSuggestions.length > 0) {
        // 첫 번째 제안 선택
        handleAddManualIngredient(imageId, img.filteredSuggestions[0]);
      } else {
        // 입력한 그대로 추가
        handleAddManualIngredient(imageId, img.manualInput.trim());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            🥕 식재료 입력
          </h2>
          <p className="text-sm text-slate-600">
            냉장고 속 식재료 이미지를 업로드하면 AI가 자동으로 인식해드립니다
          </p>
        </div>

        {/* 식사 유형 선택 */}
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm hidden">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            식사 유형 선택
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedMealType('breakfast')}
              className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                selectedMealType === 'breakfast'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="text-lg">🌅</div>
              <div>아침</div>
            </button>
            <button
              onClick={() => setSelectedMealType('lunch')}
              className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                selectedMealType === 'lunch'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="text-lg">☀️</div>
              <div>점심</div>
            </button>
            <button
              onClick={() => setSelectedMealType('dinner')}
              className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                selectedMealType === 'dinner'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="text-lg">🌙</div>
              <div>저녁</div>
            </button>
            <button
              onClick={() => setSelectedMealType('snack')}
              className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                selectedMealType === 'snack'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="text-lg">🍪</div>
              <div>간식</div>
            </button>
          </div>
        </div>

        {/* 이미지 업로드 영역 */}
        <div className="mb-6">
          <label
            htmlFor="ingredient-upload"
            className="block w-full border-2 border-dashed border-green-300 bg-white rounded-2xl p-10 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            <div className="text-5xl mb-4">🥕</div>
            <div className="text-slate-800 font-semibold text-lg mb-1">식재료 이미지 업로드</div>
            <div className="text-sm text-slate-500">여러 이미지를 한 번에 업로드할 수 있습니다</div>
            <input
              id="ingredient-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* 업로드된 이미지 목록 */}
        {images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              업로드된 이미지 ({images.length}개)
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {images.map((img) => (
                <div key={img.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-64">
                    {img.url && (
                      <Image 
                        src={img.url} 
                        alt="식재료" 
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg z-10"
                    >
                      ×
                    </button>
                  </div>

                  {/* 분석 결과 */}
                  {img.predictions && (
                    <div className="p-6">
                      {img.predictions.length > 0 ? (
                        <>
                          <div className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <span className="text-lg">✨</span>
                            인식된 식재료
                          </div>
                          <div className="space-y-3">
                            {img.predictions.map((pred) => (
                              <div
                                key={pred.name}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                  pred.selected
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-sm'
                                    : 'bg-slate-50 border-slate-200 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-semibold text-slate-800 text-lg">{pred.name}</span>
                                  <button
                                    onClick={() => toggleIngredient(img.id, pred.name)}
                                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all active:scale-95 ${
                                      pred.selected
                                        ? 'bg-green-500 border-green-600 shadow-sm'
                                        : 'bg-white border-slate-300 hover:border-slate-400'
                                    }`}
                                  >
                                    {pred.selected && <span className="text-white text-sm font-bold">✓</span>}
                                  </button>
                                </div>

                                {pred.selected && (
                                  <div className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                    <span className="text-sm font-medium text-slate-600">수량:</span>
                                    <button
                                      onClick={() => updateCount(img.id, pred.name, -1)}
                                      className="w-9 h-9 bg-slate-200 rounded-xl hover:bg-slate-300 active:scale-95 transition-all font-bold text-slate-700"
                                    >
                                      −
                                    </button>
                                    <span className="w-14 text-center font-bold text-slate-800 text-lg">
                                      {pred.count}
                                    </span>
                                    <button
                                      onClick={() => updateCount(img.id, pred.name, 1)}
                                      className="w-9 h-9 bg-slate-200 rounded-xl hover:bg-slate-300 active:scale-95 transition-all font-bold text-slate-700"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center">
                          <div className="text-3xl mb-2">🔍</div>
                          <div className="font-semibold text-amber-800 mb-1">식재료를 찾지 못했습니다</div>
                          <div className="text-sm text-amber-700">아래에서 직접 추가해주세요!</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 이미지별 수동 입력 (분석 후에만 표시) */}
                  {img.predictions && (
                    <div className="px-6 pb-6">
                      <div className="border-t border-slate-200 pt-4">
                        <div className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                          <span>✏️</span>
                          못 찾은 재료가 있나요? 직접 추가하세요
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={img.manualInput || ''}
                            onChange={(e) => handleManualInputChange(img.id, e.target.value)}
                            onKeyDown={(e) => handleManualInputKeyDown(img.id, e)}
                            onBlur={() => {
                              setTimeout(() => {
                                setImages(prev => prev.map(i => 
                                  i.id === img.id ? { ...i, showSuggestions: false } : i
                                ));
                              }, 200);
                            }}
                            onFocus={() => {
                              if (img.manualInput) {
                                setImages(prev => prev.map(i => 
                                  i.id === img.id ? { ...i, showSuggestions: true } : i
                                ));
                              }
                            }}
                            placeholder="예: 당근, 감자, 양파..."
                            className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-sm"
                          />
                          
                          {/* 자동완성 드롭다운 */}
                          {img.showSuggestions && img.filteredSuggestions && img.filteredSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {img.filteredSuggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleAddManualIngredient(img.id, suggestion)}
                                  className="px-4 py-2 hover:bg-green-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 text-sm"
                                >
                                  <span className="text-slate-800 font-medium">{suggestion}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          💡 입력하면 자동완성 목록이 나타나요. Enter로 추가!
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 분석 버튼 */}
        {images.length > 0 && !images[0].predictions && (
          <div className="space-y-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 active:scale-[0.98] transition-all duration-200 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isAnalyzing ? (
                <span className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {loadingMessage || '분석 중...'}
                  </div>
                  {analyzingProgress.total > 0 && (
                    <div className="text-sm font-normal">
                      {analyzingProgress.current} / {analyzingProgress.total} 완료
                    </div>
                  )}
                </span>
              ) : (
                '🔍 식재료 분석 시작'
              )}
            </button>
            
            {/* 진행률 바 */}
            {isAnalyzing && analyzingProgress.total > 0 && (
              <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">분석 진행률</span>
                  <span className="text-green-600 font-bold">
                    {Math.round((analyzingProgress.current / analyzingProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(analyzingProgress.current / analyzingProgress.total) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-600 text-center">
                  💡 모든 이미지를 병렬로 분석하는 중입니다. 잠시만 기다려주세요!
                </div>
              </div>
            )}
          </div>
        )}

        {/* 저장 및 추천 버튼 */}
        {flowStep === 'input' && (
          <div className="space-y-4 mt-6">
            {/* 식재료 저장 버튼 - 분석 완료 시에만 표시 */}
            {images.length > 0 && images[0].predictions && (
              <button 
                onClick={handleSaveIngredients}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                💾 선택한 식재료 저장하기
              </button>
            )}
            
            {/* 음식 추천 버튼 - 항상 표시 (재료 없어도 추천 가능) */}
            <button 
              onClick={handleGetRecommendations}
              disabled={isLoadingRecommendations}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed"
            >
              {isLoadingRecommendations ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {loadingMessage || '추천 불러오는 중...'}
                </span>
              ) : (
                '🍽️ 보유 식재료로 음식 추천받기'
              )}
            </button>
            
            {images.length === 0 && (
              <div className="text-center text-sm text-slate-600 bg-purple-50 p-3 rounded-xl">
                💡 식재료가 없어도 추천받을 수 있어요! 
                <br />보유 식재료를 기반으로 맞춤 음식을 추천해드립니다.
              </div>
            )}
          </div>
        )}

        {/* 추천 결과 표시 */}
        {flowStep === 'recommend' && recommendedFoods.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-800">🍽️ 추천 음식</h3>
              <button
                onClick={() => {
                  setFlowStep('input');
                  setRecommendedFoods([]);
                  setSelectedFood(null);
                }}
                className="text-sm text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100"
              >
                ← 돌아가기
              </button>
            </div>

            {/* 안내 문구들 */}
            <div className="space-y-3 mb-4">
              <div className="text-sm bg-green-50 border-2 border-green-200 p-4 rounded-xl text-center">
                <div className="text-lg mb-1">🥗</div>
                <div className="font-medium text-green-800">
                  다양한 재료를 추가해 더욱 풍성한 레시피를 만나보세요!
                </div>
              </div>
              
              <div className="text-sm bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                ⚠️ <strong>면책 조항:</strong> 본 추천은 AI 기반 일반적인 조언이며, 전문 영양사나 의사의 의학적 소견이 아닙니다. 
                건강 상태나 질병이 있는 경우 반드시 전문의와 상담하시기 바랍니다.
              </div>
            </div>

            {recommendedFoods.map((food, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md"
              >
                <h4 className="text-xl font-bold text-slate-800 mb-2">{food.name}</h4>
                <p className="text-slate-600 mb-4">{food.description}</p>
                
                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-700 mb-2">필요한 재료:</div>
                  <div className="flex flex-wrap gap-2">
                    {food.ingredients.map((ing, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedFood(food);
                    const normalizedSteps = (food.steps || []).map((step, i) => {
                      if (typeof step === "string") {
                        return {
                          stepNumber: i + 1,
                          title: `단계 ${i + 1}`,
                          description: step,
                        };
                      }
                      const resolvedTitle =
                        step.title ||
                        (step.instruction
                          ? step.instruction.split("\n")[0]?.trim()
                          : "") ||
                        `단계 ${i + 1}`;
                      const resolvedDescription =
                        step.description || step.instruction || "";
                      return {
                        stepNumber: i + 1,
                        title: resolvedTitle,
                        description: resolvedDescription,
                        tip: step.tip,
                      };
                    });
                    setCookingSteps(normalizedSteps);
                    setCurrentStepIndex(normalizedSteps.length > 0 ? 0 : -1);
                    setFlowStep('cooking');
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  👨‍🍳 이 음식 만들기
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 조리 단계 표시 */}
        {flowStep === 'cooking' && selectedFood && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-800">
                👨‍🍳 {selectedFood.name} 만들기
              </h3>
              <button
                onClick={() => {
                  setFlowStep('recommend');
                  setSelectedFood(null);
                  setCurrentStepIndex(0);
                }}
                className="text-sm text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100"
              >
                ← 돌아가기
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-purple-600">
                    STEP {cookingStepDisplayNumber} / {hasCookingSteps ? cookingSteps.length : 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    {cookingProgressPercent}% 완료
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${cookingProgressPercent}%` }}
                  />
                </div>
              </div>

              {hasCookingSteps ? (
                <div className="text-lg text-slate-800 mb-6 p-5 bg-purple-50 rounded-xl space-y-3">
                  <p className="font-semibold text-xl text-purple-900">
                    {cookingSteps[safeCookingIndex]?.title}
                  </p>
                  <p className="leading-relaxed text-base whitespace-pre-line">
                    {cookingSteps[safeCookingIndex]?.description}
                  </p>
                  {cookingSteps[safeCookingIndex]?.tip && (
                    <p className="text-sm text-purple-600 whitespace-pre-line">
                      💡 {cookingSteps[safeCookingIndex]?.tip}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-slate-500 mb-6 p-5 bg-purple-50 rounded-xl">
                  표시할 조리 단계가 없습니다. 추천을 다시 받아주세요.
                </div>
              )}

              {hasCookingSteps && (
                <div className="flex gap-3">
                  {safeCookingIndex < cookingSteps.length - 1 ? (
                    <button
                      onClick={() => setCurrentStepIndex(prev => prev + 1)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all"
                    >
                      다음 단계 →
                    </button>
                  ) : (
                    <button
                      onClick={handleCookingCompletion}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all"
                    >
                      🎉 조리 완료 & 기록하기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 재료 확인 모달 */}
        {showIngredientModal && selectedFood && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">사용한 재료 확인</h3>
              <p className="text-sm text-gray-600 mb-4">
                실제 사용한 재료의 수량을 확인하고 조정해주세요.
              </p>
              
              {/* 식사 유형 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  식사 유형
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setSelectedMealType('breakfast')}
                    className={`py-2 rounded-lg text-xs font-medium transition ${
                      selectedMealType === 'breakfast'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    🌅<br/>아침
                  </button>
                  <button
                    onClick={() => setSelectedMealType('lunch')}
                    className={`py-2 rounded-lg text-xs font-medium transition ${
                      selectedMealType === 'lunch'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    ☀️<br/>점심
                  </button>
                  <button
                    onClick={() => setSelectedMealType('dinner')}
                    className={`py-2 rounded-lg text-xs font-medium transition ${
                      selectedMealType === 'dinner'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    🌙<br/>저녁
                  </button>
                  <button
                    onClick={() => setSelectedMealType('snack')}
                    className={`py-2 rounded-lg text-xs font-medium transition ${
                      selectedMealType === 'snack'
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    🍪<br/>간식
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {ingredientsWithQuantity.map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{ingredient.name}</div>
                      <div className="text-xs text-gray-500">보유: {ingredient.available}개</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newList = [...ingredientsWithQuantity];
                          if (newList[index].quantity > 0) {
                            newList[index].quantity -= 1;
                            setIngredientsWithQuantity(newList);
                          }
                        }}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      
                      <span className="w-12 text-center font-bold">{ingredient.quantity}</span>
                      
                      <button
                        onClick={() => {
                          const newList = [...ingredientsWithQuantity];
                          newList[index].quantity += 1;
                          setIngredientsWithQuantity(newList);
                        }}
                        className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowIngredientModal(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    // 실제 저장 함수 호출
                    try {
                      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                      const response = await fetch(`${apiEndpoint}/api/v1/meals/save-recommended`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          food_name: selectedFood.name,
                          ingredients_used: selectedFood.ingredients, // 레거시 지원
                          ingredients_with_quantity: ingredientsWithQuantity.map(ing => ({
                            name: ing.name,
                            quantity: ing.quantity
                          })),
                          meal_type: selectedMealType || 'lunch',  // ✨ 사용자가 선택한 식사 유형 사용
                          portion_size_g: 300.0,
                          memo: `${selectedFood.name} 조리 완료`
                        }),
                      });

                      if (checkAuthAndRedirect(response)) {
                        return;
                      }

                      const result = await response.json();

                      if (result.success) {
                        setShowIngredientModal(false);
                        alert(`✅ "${selectedFood.name}" 기록 완료!\n\n건강 점수: ${result.data.health_score}점\n등급: ${result.data.food_grade}`);
                        window.location.href = '/dashboard';
                      } else {
                        alert(`기록 저장 실패: ${result.message}`);
                        setShowIngredientModal(false);
                      }
                    } catch (error) {
                      console.error('❌ 음식 기록 오류:', error);
                      alert('음식 기록 중 오류가 발생했습니다.');
                      setShowIngredientModal(false);
                    }
                  }}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
  const handleCookingCompletion = async () => {
    if (!selectedFood) return;

    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const ingredientsResponse = await fetch(`${apiEndpoint}/api/v1/ingredients/my-ingredients`, {
        credentials: 'include',
      });

      console.log('🌐 API 응답 상태:', ingredientsResponse.status);

      if (checkAuthAndRedirect(ingredientsResponse)) {
        return;
      }

      const ingredientsResult = await ingredientsResponse.json();
      console.log('📦 API 전체 응답:', ingredientsResult);

      const userIngredients: UserIngredientRecord[] = Array.isArray(ingredientsResult.data)
        ? ingredientsResult.data
        : [];

      console.log('='.repeat(60));
      console.log('🔍 DB에서 조회한 사용자 식재료 (총 ' + userIngredients.length + '개):');
      userIngredients.forEach((ing, idx) => {
        console.log(`  ${idx + 1}. "${ing.ingredient_name}" - 수량: ${ing.count}, is_used: ${ing.is_used}`);
      });
      console.log('📋 레시피 필요 재료:', selectedFood.ingredients);
      console.log('='.repeat(60));

      const ingredientsData = selectedFood.ingredients.map((ingredientName, index) => {
        console.log(`\n[재료 ${index + 1}/${selectedFood.ingredients.length}] "${ingredientName}" 매칭 시작...`);

        const found = userIngredients.find((ing) => {
          const dbName = ing.ingredient_name.toLowerCase().trim();
          const recipeName = ingredientName.toLowerCase().trim();

          console.log(`  🔎 비교: DB "${dbName}" vs 레시피 "${recipeName}"`);

          if (dbName === recipeName) {
            console.log('    ✅ 정확히 일치!');
            return true;
          }

          if (dbName.length >= 2 && recipeName.length >= 2) {
            if (dbName.includes(recipeName)) {
              console.log(`    ✅ DB가 레시피 포함 (${dbName} includes ${recipeName})`);
              return true;
            }
            if (recipeName.includes(dbName)) {
              console.log(`    ✅ 레시피가 DB 포함 (${recipeName} includes ${dbName})`);
              return true;
            }
          }

          return false;
        });

        if (found) {
          console.log(`  ✅ 매칭 성공: "${found.ingredient_name}", 수량: ${found.count}, is_used: ${found.is_used}`);
        } else {
          console.log('  ❌ 매칭 실패: DB에 없음');
        }

        const availableCount = found && !found.is_used ? found.count : 0;
        console.log(`  📊 최종 보유 수량: ${availableCount}개`);

        return {
          name: ingredientName,
          quantity: 1,
          available: availableCount,
        };
      });

      console.log('\n' + '='.repeat(60));
      console.log('✅ 최종 재료 수량 데이터:');
      ingredientsData.forEach((item, idx) => {
        console.log(`  ${idx + 1}. "${item.name}" - 사용량: ${item.quantity}, 보유: ${item.available}개`);
      });
      console.log('='.repeat(60));

      setIngredientsWithQuantity(ingredientsData);
      setShowIngredientModal(true);
    } catch (error) {
      console.error('❌ 재료 조회 오류:', error);
      alert('재료 정보를 불러오는데 실패했습니다.');
    }
  };
