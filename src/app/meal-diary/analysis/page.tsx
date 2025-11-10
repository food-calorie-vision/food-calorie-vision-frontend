'use client';

import { useState } from 'react';
import MealPeekSwiper from '@/components/MealPeekSwiper';

type FoodPrediction = {
  name: string;
  confidence: number;
  selected: boolean;
  // 추가 영양 정보
  description?: string;
  ingredients?: string[];
  calories?: number;
  nutrients?: {
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
    fiber?: number;
  };
  portionSize?: string;
  healthScore?: number;
  suggestions?: string[];
};

type UploadedImage = {
  id: string;
  url: string;
  file?: File; // 실제 파일 객체 저장
  predictions?: FoodPrediction[];
  isReanalyzing?: boolean; // 재분석 중 상태
};

export default function MealDiaryPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    console.log('📤 이미지 업로드:', files.length, '개');

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          file: file, // 실제 파일 객체 저장 (백엔드 전송용)
        };
        setImages((prev) => [...prev, newImage]);
        console.log('✅ 이미지 추가됨:', file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    console.log('🚀 분석 시작 - 이미지 개수:', images.length);
    setIsAnalyzing(true);
    
    try {
      // 각 이미지를 백엔드 API로 전송하여 분석
      const analysisPromises = images.map(async (img) => {
        if (!img.file) {
          console.warn('⚠️ 파일 객체가 없음:', img.id);
          return img;
        }

        try {
          console.log('📡 백엔드 API 호출:', img.file.name);
          
          // FormData 생성
          const formData = new FormData();
          formData.append('file', img.file);

          // 백엔드 API 호출
          const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${apiEndpoint}/api/v1/food/analysis-upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          console.log('📥 응답 상태:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API 오류:', errorText);
            throw new Error(`API 오류 (${response.status})`);
          }

          const result = await response.json();
          console.log('✅ 분석 결과:', result);

          if (result.success && result.data?.analysis) {
            const analysis = result.data.analysis;
            
            // 후보 음식이 있으면 candidates 사용, 없으면 단일 결과만
            const predictions: FoodPrediction[] = [];
            
            if (analysis.candidates && analysis.candidates.length > 0) {
              // 여러 후보가 있는 경우: 각 후보를 predictions로 변환
              analysis.candidates.forEach((candidate: any, index: number) => {
                predictions.push({
                  name: candidate.foodName,
                  confidence: candidate.confidence,
                  selected: index === 0, // 첫 번째만 선택
                  description: candidate.description || '',
                  // 첫 번째 후보만 상세 정보 포함
                  ...(index === 0 && {
                    ingredients: analysis.ingredients,
                    calories: analysis.calories,
                    nutrients: analysis.nutrients,
                    portionSize: analysis.portionSize,
                    healthScore: analysis.healthScore,
                    suggestions: analysis.suggestions,
                  }),
                });
              });
            } else {
              // 단일 결과만 있는 경우 (레거시 호환)
              predictions.push({
                name: analysis.foodName,
                confidence: analysis.confidence,
                selected: true,
                description: analysis.description,
                ingredients: analysis.ingredients,
                calories: analysis.calories,
                nutrients: analysis.nutrients,
                portionSize: analysis.portionSize,
                healthScore: analysis.healthScore,
                suggestions: analysis.suggestions,
              });
            }
            
            return {
              ...img,
              predictions,
            };
          } else {
            throw new Error('분석 결과가 없습니다.');
          }
        } catch (error) {
          console.error('❌ 이미지 분석 실패:', error);
          // 오류 발생 시 더미 데이터 반환
          return {
            ...img,
            predictions: [
              { 
                name: '분석 실패', 
                confidence: 0, 
                selected: false,
                description: error instanceof Error ? error.message : '알 수 없는 오류'
              },
            ],
          };
        }
      });

      // 모든 분석 완료 대기
      const analyzedImages = await Promise.all(analysisPromises);
      setImages(analyzedImages);
      console.log('🎉 모든 이미지 분석 완료');
      
    } catch (error) {
      console.error('❌ 분석 중 오류:', error);
      alert('이미지 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePrediction = async (imageId: string, foodName: string) => {
    // 이미 선택된 음식인지 확인
    const currentImage = images.find(img => img.id === imageId);
    const currentPred = currentImage?.predictions?.find(p => p.name === foodName);
    
    if (currentPred?.selected) {
      // 이미 선택된 음식은 토글 해제하지 않음
      return;
    }
    
    // 재분석 중이면 클릭 무시
    if (currentImage?.isReanalyzing) {
      console.log('⚠️ 재분석 중... 잠시 기다려주세요');
      return;
    }
    
    console.log(`🔄 다른 후보 선택: ${foodName}`);
    
    // 일단 UI 업데이트 (선택 표시)
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== imageId) return img;
        return {
          ...img,
          predictions: img.predictions?.map((pred) => ({
            ...pred,
            selected: pred.name === foodName,
          })),
        };
      })
    );
    
    // 선택한 음식의 영양 정보가 없으면 재분석 요청
    if (currentPred && !currentPred.calories) {
      console.log(`📡 재분석 API 호출: ${foodName}`);
      
      // 재분석 시작 - 로딩 상태 설정
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, isReanalyzing: true } : img))
      );
      
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiEndpoint}/api/v1/food/reanalyze-with-selection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            selectedFoodName: foodName,
            ingredients: currentPred.ingredients || [],
          }),
        });
        
        if (!response.ok) {
          throw new Error(`재분석 실패: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ 재분석 완료:', result);
        
        if (result.success && result.data?.analysis) {
          const analysis = result.data.analysis;
          
          // 선택한 음식의 영양 정보 업데이트
          setImages((prev) =>
            prev.map((img) => {
              if (img.id !== imageId) return img;
              return {
                ...img,
                isReanalyzing: false, // 로딩 종료
                predictions: img.predictions?.map((pred) => {
                  if (pred.name === foodName) {
                    return {
                      ...pred,
                      calories: analysis.calories,
                      nutrients: analysis.nutrients,
                      ingredients: analysis.ingredients,
                      portionSize: analysis.portionSize,
                      healthScore: analysis.healthScore,
                      suggestions: analysis.suggestions,
                    };
                  }
                  return pred;
                }),
              };
            })
          );
        }
      } catch (error) {
        console.error('❌ 재분석 오류:', error);
        
        // 로딩 종료
        setImages((prev) =>
          prev.map((img) => (img.id === imageId ? { ...img, isReanalyzing: false } : img))
        );
        
        alert('음식 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">식단 분석</h2>
        <p className="text-sm text-slate-600">
          음식 이미지를 업로드하면 AI가 자동으로 분석해드립니다.
        </p>
      </div>

      {/* 이미지 업로드 영역 - 모바일 최적화 */}
      <div className="mb-4">
        <label
          htmlFor="meal-upload"
          className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer active:border-green-500 active:bg-green-50 transition"
        >
          <div className="text-4xl mb-3">📸</div>
          <div className="text-slate-700 font-medium mb-1">이미지 업로드</div>
          <div className="text-xs text-slate-500">터치하여 이미지를 추가하세요</div>
          <input
            id="meal-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

    {/* 스와이프 영역 */}
    {images.length > 0 && (
      <MealPeekSwiper
        images={images}
        onConfirmItem={(r) => {
          console.log('확정 결과', r);
        }}
        />
      )}

      {/* 업로드된 이미지 목록 */}
      {images.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            업로드된 이미지 ({images.length}개)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((img) => (
              <div key={img.id} className="border rounded-xl overflow-hidden">
                <div className="relative">
                  <img src={img.url} alt="음식" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                  >
                    ×
                  </button>
                </div>

                {/* 분석 결과 */}
                {img.predictions && (
                  <div className="p-4 bg-slate-50 relative">
                    {/* 재분석 로딩 오버레이 */}
                    {img.isReanalyzing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-2"></div>
                          <p className="text-sm font-semibold text-slate-700">영양 정보 불러오는 중...</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm font-semibold text-slate-700 mb-3">분석 결과:</div>
                    <div className="space-y-3">
                      {img.predictions.map((pred) => (
                        <div key={pred.name} className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden">
                          {/* 음식명 및 선택 버튼 */}
                          <button
                            onClick={() => togglePrediction(img.id, pred.name)}
                            disabled={img.isReanalyzing}
                            className={`w-full flex items-center justify-between px-4 py-3 transition ${
                              pred.selected
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-50'
                            } ${img.isReanalyzing ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-bold text-lg">{pred.name}</span>
                              {pred.description && (
                                <span className={`text-xs mt-1 ${pred.selected ? 'text-white opacity-90' : 'text-slate-500'}`}>
                                  {pred.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm opacity-80">
                                {(pred.confidence * 100).toFixed(0)}%
                              </span>
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  pred.selected
                                    ? 'bg-white border-white'
                                    : 'bg-slate-100 border-slate-300'
                                }`}
                              >
                                {pred.selected && <span className="text-green-500 text-sm">✓</span>}
                              </div>
                            </div>
                          </button>

                          {/* 영양 정보 (선택된 경우에만 표시) */}
                          {pred.selected && pred.calories !== undefined && (
                            <div className="px-4 pb-3 space-y-2">
                              {/* 주요 재료 */}
                              {pred.ingredients && pred.ingredients.length > 0 && (
                                <div className="pt-2">
                                  <div className="text-xs font-semibold text-slate-600 mb-1">주요 재료:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {pred.ingredients.map((ingredient, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs"
                                      >
                                        {ingredient}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 칼로리 및 건강 점수 */}
                              <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="bg-orange-50 rounded p-2">
                                  <div className="text-xs text-orange-700">칼로리</div>
                                  <div className="text-lg font-bold text-orange-900">{pred.calories} kcal</div>
                                  {pred.portionSize && (
                                    <div className="text-xs text-orange-600">{pred.portionSize}</div>
                                  )}
                                </div>
                                {pred.healthScore !== undefined && (
                                  <div className="bg-indigo-50 rounded p-2">
                                    <div className="text-xs text-indigo-700">건강 점수</div>
                                    <div className="text-lg font-bold text-indigo-900">{pred.healthScore}점</div>
                                    <div className="text-xs text-indigo-600">
                                      {pred.healthScore >= 75 ? '우수' : pred.healthScore >= 50 ? '보통' : '개선 필요'}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 영양 성분 */}
                              {pred.nutrients && (
                                <div className="bg-blue-50 rounded p-2">
                                  <div className="text-xs font-semibold text-blue-700 mb-1">영양 성분</div>
                                  <div className="grid grid-cols-4 gap-2 text-center">
                                    <div>
                                      <div className="text-xs text-blue-600">단백질</div>
                                      <div className="text-sm font-bold text-blue-900">{pred.nutrients.protein.toFixed(1)}g</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-blue-600">탄수화물</div>
                                      <div className="text-sm font-bold text-blue-900">{pred.nutrients.carbs.toFixed(1)}g</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-blue-600">지방</div>
                                      <div className="text-sm font-bold text-blue-900">{pred.nutrients.fat.toFixed(1)}g</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-blue-600">나트륨</div>
                                      <div className="text-sm font-bold text-blue-900">{pred.nutrients.sodium.toFixed(0)}mg</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 건강 팁 */}
                              {pred.suggestions && pred.suggestions.length > 0 && (
                                <div className="bg-purple-50 rounded p-2">
                                  <div className="text-xs font-semibold text-purple-700 mb-1">건강 팁</div>
                                  <ul className="space-y-0.5">
                                    {pred.suggestions.map((suggestion, idx) => (
                                      <li key={idx} className="text-xs text-purple-700 flex items-start">
                                        <span className="w-1 h-1 bg-purple-400 rounded-full mt-1.5 mr-1.5 flex-shrink-0"></span>
                                        {suggestion}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
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
          className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? '분석 중...' : '식단 분석 시작'}
        </button>
      )}

      {/* 저장 버튼 */}
      {images.length > 0 && images[0].predictions && (
        <button className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition">
          선택한 음식 저장하기
        </button>
      )}
    </div>
  );
}
