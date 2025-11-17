'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  const [images, setImages] = useState<IngredientImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      for (const img of images) {
        if (img.predictions || !img.file) continue; // 이미 분석되었거나 파일이 없으면 스킵

        try {
          console.log(`🔍 백엔드로 이미지 분석 중: ${img.id}`);
          
          // FormData로 이미지 전송
          const formData = new FormData();
          formData.append('file', img.file);
          
          // 백엔드 API 호출 (Roboflow + GPT Vision)
          const response = await fetch(`${apiEndpoint}/api/v1/ingredients/analyze-with-roboflow-gpt`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('식재료 분석에 실패했습니다.');
          }

          const result = await response.json();
          console.log('📦 백엔드 분석 결과:', result);

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

          // 이미지 상태 업데이트 (빈 결과는 빈 배열로)
          setImages((prev) =>
            prev.map((i) =>
              i.id === img.id
                ? { ...i, predictions: ingredientPredictions }
                : i
            )
          );
        } catch (error) {
          console.error(`❌ 이미지 분석 실패 (${img.id}):`, error);
          setImages((prev) =>
            prev.map((i) =>
              i.id === img.id
                ? { ...i, predictions: [] }
                : i
            )
          );
        }
      }
    } catch (error) {
      console.error('❌ 전체 분석 프로세스 실패:', error);
      alert('식재료 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
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
    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiEndpoint}/api/v1/ingredients/recommendations`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('음식 추천을 가져오는데 실패했습니다.');
      }

      const result = await response.json();
      
      // 추천 결과를 alert로 표시 (나중에 UI 개선 가능)
      if (result.success && result.data) {
        alert(`🍽️ 추천 음식:\n\n${result.data.recommendations}`);
      }
    } catch (error) {
      console.error('❌ 음식 추천 오류:', error);
      alert('음식 추천을 가져오는 중 오류가 발생했습니다.');
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
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🥕 식재료 입력
          </h2>
          <p className="text-sm text-slate-600">
            냉장고 속 식재료 이미지를 업로드하면 AI가 자동으로 인식해드립니다
          </p>
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
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 active:scale-[0.98] transition-all duration-200 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                분석 중...
              </span>
            ) : (
              '🔍 식재료 분석 시작'
            )}
          </button>
        )}

        {/* 저장 버튼 */}
        {images.length > 0 && images[0].predictions && (
          <div className="space-y-4">
            <button 
              onClick={handleSaveIngredients}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              💾 선택한 식재료 저장하기
            </button>
            <button 
              onClick={handleGetRecommendations}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🍽️ 저장된 식재료로 음식 추천받기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
