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
  const [completedImages, setCompletedImages] = useState<Set<string>>(new Set());
  const [showError, setShowError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div 
        className={`max-w-2xl mx-auto p-4 pb-8 transition-all duration-300 ${
          showError ? 'ring-8 ring-red-500/50 rounded-3xl' : ''
        } ${isShaking ? 'animate-shake' : ''}`}
      >
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🍽️ 식단 분석
          </h2>
          <p className="text-sm text-slate-600">
            음식 이미지를 업로드하면 AI가 자동으로 분석해드립니다
          </p>
        </div>

        {/* 이미지 업로드 영역 */}
        <div className="mb-6">
          <label
            htmlFor="meal-upload"
            className={`block w-full border-2 border-dashed bg-white rounded-2xl p-10 text-center cursor-pointer active:scale-[0.98] transition-all duration-200 shadow-sm ${
              showError 
                ? 'border-red-500 bg-red-50/50 hover:border-red-600' 
                : 'border-green-300 hover:border-green-500 hover:bg-green-50/50'
            }`}
          >
            <div className="text-5xl mb-4">📸</div>
            <div className="text-slate-800 font-semibold text-lg mb-1">이미지 업로드</div>
            <div className="text-sm text-slate-500">터치하여 이미지를 추가하세요</div>
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

        {/* 진행 상황 바 */}
        {images.length > 0 && images[0].predictions && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">진행 상황</span>
              <span className="text-sm font-bold text-green-600">
                {completedImages.size} / {images.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(completedImages.size / images.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 스와이프 영역 */}
        {images.length > 0 && (
          <div
            className={`transition-all duration-300 ${
              showError ? 'ring-4 ring-red-500 rounded-2xl' : ''
            } ${isShaking ? 'animate-shake' : ''}`}
          >
            <MealPeekSwiper
              images={images}
              onConfirmItem={(r) => {
                console.log('✅ 확정 결과:', r);
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
              '🔍 식단 분석 시작'
            )}
          </button>
        )}

        {/* 저장 버튼 */}
        {images.length > 0 && images[0].predictions && (
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
                setModalMessage('음식이 성공적으로 저장되었습니다! 🎉');
                setShowModal(true);
                // TODO: 실제 저장 로직 추가
              }
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            💾 선택한 음식 저장하기
          </button>
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
