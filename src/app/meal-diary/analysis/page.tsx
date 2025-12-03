'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MealPeekSwiper from '@/components/MealPeekSwiper';
import type { FoodAnalysisResult, FoodCandidate } from '@/types';
import { API_BASE_URL } from '@/utils/api';

type FoodPrediction = {
  name: string;
  confidence: number;
  selected: boolean;
  foodId?: string; // 확정된 Food ID
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
  error?: string; // 에러 메시지
};

export default function MealDiaryPage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedImages, setCompletedImages] = useState<Set<string>>(new Set());
  const [showError, setShowError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const apiEndpoint = API_BASE_URL;
  
  // 재치있는 로딩 메시지 배열
  const funnyLoadingMessages = [
    '🔍 AI가 음식을 열심히 관찰 중...',
    '📸 이미지 분석 시작!',
    '🤖 GPT가 음식 백과사전 뒤지는 중...',
    '🍜 칼로리 눈물 빠지게 계산 중!',
    '📊 영양소 정보 수집 중...',
    '🔬 음식 성분 분석 중...',
    '🎯 최적의 매칭 찾는 중...',
    '✨ 거의 다 왔어요!'
  ];

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user_id) {
            setUserId(data.user_id);
          } else {
            alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            router.push('/');
          }
        } else if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/');
      }
    };
    
    fetchUserInfo();
  }, [apiEndpoint, router]);

  const handleDeleteImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setCompletedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  };

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
    setCompletedImages(new Set()); // 분석 시작 시 초기화
    
    // 재치있는 로딩 메시지 순차 표시
    let messageIndex = 0;
    setLoadingMessage(funnyLoadingMessages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % funnyLoadingMessages.length;
      setLoadingMessage(funnyLoadingMessages[messageIndex]);
    }, 2000); // 2초마다 메시지 변경
    
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
                  ingredients: candidate.ingredients || [],
                  // 영양소 정보는 Preview 단계에서 채워짐 (초기값 null/undefined)
                });
              });
            } else {
              // 단일 결과만 있는 경우
              predictions.push({
                name: analysis.foodName,
                confidence: analysis.confidence,
                selected: true,
                description: analysis.description,
                ingredients: analysis.ingredients,
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
          // 에러 발생 시 해당 이미지 객체 그대로 반환 (분석 안 된 상태)
          // 또는 에러 상태를 표시할 수 있는 플래그 추가 가능
          return {
            ...img,
            error: '분석 실패' 
          };
        }
      });

      // 모든 분석 완료 대기 (에러가 발생해도 배열로 반환됨)
      const results = await Promise.all(analysisPromises);
      
      // 분석 성공한 것과 실패한 것 구분
      const successCount = results.filter(r => r.predictions).length;
      const failCount = results.filter(r => !r.predictions).length;
      
      setImages(results);
      
      if (failCount > 0) {
          if (successCount === 0) {
              throw new Error('모든 이미지 분석에 실패했습니다.');
          } else {
              // 부분 성공
              setModalMessage(`⚠️ ${failCount}개의 이미지 분석에 실패했습니다.\n다시 시도하거나 직접 입력해주세요.`);
              setShowModal(true);
          }
      }
      
      console.log('🎉 분석 종료');
      
      clearInterval(messageInterval);
      setLoadingMessage('');
      
    } catch (error) {
      clearInterval(messageInterval);
      setLoadingMessage('');
      console.error('❌ 분석 중 오류:', error);
      
      // 에러 발생 시 시각적 피드백
      setShowError(true);
      setIsShaking(true);
      
      // 에러 모달 표시
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setModalMessage(`⚠️ 문제가 생겨 분석을 할 수 없습니다.\n\n오류: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`);
      setShowModal(true);
      
      // 애니메이션 종료
      setTimeout(() => setIsShaking(false), 600);
      setTimeout(() => setShowError(false), 2000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAllFoods = async () => {
    if (!userId) {
      setModalMessage('⚠️ 로그인이 필요합니다.');
      setShowModal(true);
      return;
    }

    setIsSaving(true);
    
    try {
      const savePromises = images.map(async (img) => {
        // 선택된 prediction 찾기
        const selectedPrediction = img.predictions?.find(p => p.selected);
        
        if (!selectedPrediction) {
          console.warn(`이미지 ${img.id}에 선택된 음식이 없습니다.`);
          return { success: false, imageId: img.id };
        }
        
        // 영양 정보가 없는 경우 (Preview 실패 등) -> 안전 장치
        if (!selectedPrediction.foodId || selectedPrediction.calories === undefined) {
             console.warn(`이미지 ${img.id}의 영양 정보가 불완전합니다.`);
             // 필요하다면 여기서 한번 더 Preview 호출하거나 에러 처리
             // return { success: false, imageId: img.id, error: 'Incomplete data' };
        }

        // 음식 저장 API 호출
        try {
          const response = await fetch(`${apiEndpoint}/api/v1/food/save-food`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              userId: userId,
              foodId: selectedPrediction.foodId || `TEMP_${Date.now()}`, // ID가 없으면 임시 생성 (방어 코드)
              foodName: selectedPrediction.name,
              mealType: selectedMealType,
              portionSizeG: parseFloat(selectedPrediction.portionSize?.replace('g', '') || '100'),
              imageRef: null,
              
              // 확정된 영양 정보 전송 (재계산 방지)
              calories: selectedPrediction.calories || 0,
              protein: selectedPrediction.nutrients?.protein || 0,
              carbs: selectedPrediction.nutrients?.carbs || 0,
              fat: selectedPrediction.nutrients?.fat || 0,
              sodium: selectedPrediction.nutrients?.sodium || 0,
              fiber: selectedPrediction.nutrients?.fiber || 0,
              
              healthScore: selectedPrediction.healthScore || 0,
              
              ingredients: selectedPrediction.ingredients || [],
              foodClass1: "사용자입력", 
              foodClass2: null
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log(`✅ 음식 저장 성공 (${img.id}):`, result);
          
          return { success: true, imageId: img.id, data: result };
        } catch (error) {
          console.error(`❌ 음식 저장 실패 (${img.id}):`, error);
          return { success: false, imageId: img.id, error };
        }
      });

      const results = await Promise.all(savePromises);
      
      // 결과 확인
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (failCount === 0) {
        setModalMessage(`🎉 모든 음식이 성공적으로 저장되었습니다!\n(${successCount}개 저장)`);
        setShowModal(true);
        
        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setModalMessage(`⚠️ 일부 음식 저장에 실패했습니다.\n성공: ${successCount}개, 실패: ${failCount}개`);
        setShowModal(true);
      }
    } catch (error) {
      console.error('❌ 음식 저장 중 오류:', error);
      setModalMessage('❌ 음식 저장 중 오류가 발생했습니다.');
      setShowModal(true);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            🍽️ 식단 분석
          </h2>
          <p className="text-sm text-slate-600">
            음식 이미지를 업로드하면 AI가 자동으로 분석해드립니다
          </p>
        </div>

        {/* 식사 유형 선택 */}
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm">
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

        {/* 이미지 업로드 영역 - 모바일 최적화 */}
        <div className="mb-6">
        <label
          htmlFor="meal-upload"
          className="block w-full border-2 border-dashed border-green-300 bg-white rounded-2xl p-10 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 active:scale-[0.98] transition-all duration-200 shadow-sm"
        >
          <div className="text-5xl mb-4">📸</div>
          <div className="text-slate-800 font-semibold text-lg mb-1">음식 이미지 업로드</div>
          <div className="text-sm text-slate-500">여러 이미지를 한 번에 업로드할 수 있습니다</div>
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
        <div
          className={`transition-all duration-300 ${
            showError ? 'border-4 border-red-500 rounded-2xl p-2' : ''
          } ${isShaking ? 'animate-shake' : ''}`}
        >
          <MealPeekSwiper
            images={images.map((img) => ({
              ...img,
              predictions: img.predictions?.map((pred) => ({
                ...pred, // 모든 속성 복사 (영양 정보 포함)
              })),
            }))}
            onDeleteImage={handleDeleteImage}
            onConfirmItem={async (r) => {
              console.log('확정 결과 (Preview 요청):', r);
              
              // API 호출: preview-nutrition
              try {
                const response = await fetch(`${apiEndpoint}/api/v1/food/preview-nutrition`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    foodName: r.name,
                    ingredients: r.ingredients,
                    portionText: r.portionText
                  }),
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ 영양 정보 계산 완료:', result);
                  
                  if (result.success && result.data) {
                    const nutritionData = result.data;
                    
                    // 이미지 predictions 업데이트 (영양 정보 채우기)
                    setImages(prevImages => prevImages.map(img => {
                      if (img.id === r.id) {
                        const currentPredictions = img.predictions || [];
                        const existingPredIndex = currentPredictions.findIndex(p => p.name === r.name);
                        
                        let newPredictions: FoodPrediction[] = [];
                        
                        if (existingPredIndex !== -1) {
                            // 기존 항목이 있으면 업데이트
                            newPredictions = currentPredictions.map((p, idx) => {
                                if (idx === existingPredIndex) {
                                    return {
                                        ...p,
                                        selected: true,
                                        calories: nutritionData.calories,
                                        nutrients: nutritionData.nutrients,
                                        portionSize: `${nutritionData.portionSizeG}g`,
                                        healthScore: nutritionData.healthScore,
                                        foodId: nutritionData.foodId,
                                        ingredients: r.ingredients // 재료도 최신으로 업데이트
                                    };
                                }
                                return { ...p, selected: false };
                            });
                        } else {
                            // 없으면 새로 추가 (맨 앞에)
                            const newPred: FoodPrediction = {
                                name: r.name!,
                                confidence: 1.0,
                                selected: true,
                                ingredients: r.ingredients,
                                calories: nutritionData.calories,
                                nutrients: nutritionData.nutrients,
                                portionSize: `${nutritionData.portionSizeG}g`,
                                healthScore: nutritionData.healthScore,
                                foodId: nutritionData.foodId
                            };
                            newPredictions = [newPred, ...currentPredictions.map(p => ({ ...p, selected: false }))];
                        }
                        
                        console.log(`🖼️ 이미지(${img.id}) 업데이트됨:`, newPredictions[0]);
                        
                        return {
                            ...img,
                            predictions: newPredictions
                        };
                      }
                      return img;
                    }));
                  }
                } else {
                    console.error('영양 정보 계산 실패:', await response.text());
                    alert('영양 정보를 계산하는데 실패했습니다.');
                }
              } catch (error) {
                console.error('❌ Preview API 오류:', error);
                alert('서버와 통신 중 오류가 발생했습니다.');
              }
              
              setCompletedImages((prev) => new Set(prev).add(r.id));
            }}
          />
        </div>
      )}

        {/* 분석 버튼 */}
        {images.length > 0 && !images[0].predictions && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-md ${
              isAnalyzing
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 active:scale-95'
            }`}
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin text-2xl">🔄</div>
                <div className="text-sm">{loadingMessage}</div>
              </div>
            ) : (
              `✨ 분석 시작 (${images.length}개)`
            )}
          </button>
        )}

        {/* 저장 버튼 */}
        {images.length > 0 && images[0].predictions && (
        <>
          <button
            onClick={() => {
              const incompleteCount = images.length - completedImages.size;
              if (incompleteCount > 0) {
                setShowError(true);
                setIsShaking(true);
                
                setModalMessage(`아직 선택하지 않은 음식이 ${incompleteCount}개 있어요.\n모든 음식을 선택해주세요! 🙏`);
                setShowModal(true);
                
                setTimeout(() => setIsShaking(false), 600);
                setTimeout(() => setShowError(false), 2000);
              } else {
                // 모두 완료됨 - 저장 처리
                handleSaveAllFoods();
              }
            }}
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-md ${
              isSaving
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 active:scale-95'
            }`}
          >
            {isSaving ? '💾 저장 중...' : '✅ 선택한 음식 저장하기'}
          </button>

          {/* 진행 상황 표시 */}
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <span className="text-sm font-medium text-slate-600">
                {completedImages.size} / {images.length} 개 완료
              </span>
              {completedImages.size === images.length && (
                <span className="text-green-500">✓</span>
              )}
            </div>
          </div>
        </>
      )}

        {/* 모달 팝업 */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowModal(false)}
          >
            <div 
              className={`rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-modalSlideUp ${
                modalMessage.includes('문제가 생겨') || modalMessage.includes('선택하지 않은')
                  ? 'bg-gradient-to-br from-red-50 to-white border-2 border-red-200'
                  : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {modalMessage.includes('성공') ? '🎉' : modalMessage.includes('문제가 생겨') ? '🚨' : '⚠️'}
                </div>
                <p className={`text-lg font-semibold whitespace-pre-line leading-relaxed mb-6 ${
                  modalMessage.includes('문제가 생겨') ? 'text-red-700' : 'text-slate-800'
                }`}>
                  {modalMessage}
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className={`w-full text-white py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all duration-200 shadow-lg ${
                    modalMessage.includes('문제가 생겨')
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 애니메이션 CSS */}
        <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(10px) rotate(1deg); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-modalSlideUp {
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        `}</style>
      </div>
      </div>
    );
  }
