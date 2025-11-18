'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
          }
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    };
    
    fetchUserInfo();
  }, [apiEndpoint]);

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
                  ingredients: candidate.ingredients || [], // 각 후보의 재료 포함!
                  // 첫 번째 후보만 전체 영양소 정보 포함
                  ...(index === 0 && {
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
          throw error; // 상위 catch로 전달
        }
      });

      // 모든 분석 완료 대기
      const analyzedImages = await Promise.all(analysisPromises);
      setImages(analyzedImages);
      console.log('🎉 모든 이미지 분석 완료');
      
    } catch (error) {
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
              foodName: selectedPrediction.name,
              ingredients: selectedPrediction.ingredients || [],
              portionSizeG: 100, // 기본값 (나중에 사용자 입력으로 변경 가능)
              // imageRef: null로 설정 (Base64는 너무 커서 DB에 저장 불가)
              // TODO: 추후 S3/CloudFlare 등 파일 스토리지 연동 시 URL 저장
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
        <div
          className={`transition-all duration-300 ${
            showError ? 'border-4 border-red-500 rounded-2xl p-2' : ''
          } ${isShaking ? 'animate-shake' : ''}`}
        >
          <MealPeekSwiper
            images={images.map((img) => ({
              ...img,
              predictions: img.predictions?.map((pred) => ({
                name: pred.name,
                confidence: pred.confidence,
                selected: pred.selected,
                ingredients: pred.ingredients, // GPT Vision이 추출한 재료 전달
              })),
            }))}
            onConfirmItem={async (r) => {
              console.log('확정 결과', r);
              
              // 선택한 음식명이 1순위가 아닌 경우, API 재호출
              const targetImage = images.find(img => img.id === r.id);
              const firstCandidateName = targetImage?.predictions?.[0]?.name;
              
              if (r.name && r.name !== firstCandidateName) {
                console.log(`🔄 사용자가 다른 후보를 선택했습니다: ${r.name}`);
                
                try {
                  const response = await fetch(`${apiEndpoint}/api/v1/food/reanalyze-with-selection`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      selectedFoodName: r.name,
                      ingredients: r.ingredients,
                    }),
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    console.log('✅ 재분석 완료:', result);
                    
                    // 이미지 predictions 업데이트
                    if (result.success && result.data?.analysis) {
                      const analysis = result.data.analysis;
                      setImages(prev => prev.map(img => {
                        if (img.id === r.id) {
                          return {
                            ...img,
                            predictions: img.predictions?.map(pred => {
                              if (pred.name === r.name) {
                                // 선택한 후보에 영양소 정보 업데이트
                                return {
                                  ...pred,
                                  selected: true,
                                  calories: analysis.calories,
                                  nutrients: analysis.nutrients,
                                  portionSize: analysis.portionSize,
                                  healthScore: analysis.healthScore,
                                  suggestions: analysis.suggestions,
                                };
                              }
                              return { ...pred, selected: false };
                            }),
                          };
                        }
                        return img;
                      }));
                    }
                  }
                } catch (error) {
                  console.error('❌ 재분석 실패:', error);
                }
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
          className="w-full bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? '분석 중...' : '식단 분석 시작'}
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
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSaving ? '저장 중...' : '선택한 음식 저장하기'}
          </button>

          {/* 진행 상황 표시 */}
          <div className="mt-3 text-center text-sm text-slate-600">
            {completedImages.size} / {images.length} 개 완료
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
      </div>

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
  );
}
