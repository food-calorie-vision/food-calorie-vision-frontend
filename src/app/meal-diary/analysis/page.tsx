'use client';

import { useState } from 'react';
import MealPeekSwiper from '@/components/MealPeekSwiper';
import type { FoodAnalysisResult, FoodCandidate } from '@/types';

type FoodPrediction = {
  name: string;
  confidence: number;
  selected: boolean;
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

  const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          file: file, // 실제 파일 객체 저장
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setCompletedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    setCompletedImages(new Set());

    try {
      const analysisPromises = images.map(async (img) => {
        if (!img.file) {
          console.error('❌ 파일이 없습니다:', img.id);
          return img;
        }

        const formData = new FormData();
        formData.append('file', img.file);

        try {
          console.log('📤 백엔드로 이미지 전송 중...', img.id);
          const response = await fetch(`${apiEndpoint}/api/v1/food/analysis-upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log('✅ 백엔드 응답:', result);

          if (result.success && result.data?.analysis) {
            const analysis: FoodAnalysisResult = result.data.analysis;
            const predictions: FoodPrediction[] = [];

            // 후보 음식이 있으면 변환
            if (analysis.candidates && analysis.candidates.length > 0) {
              analysis.candidates.forEach((candidate: FoodCandidate, index: number) => {
                predictions.push({
                  name: candidate.foodName,
                  confidence: candidate.confidence,
                  selected: index === 0, // 첫 번째 후보만 선택
                  description: candidate.description || '',
                  // 첫 번째 후보만 전체 정보 포함
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
              // 후보가 없으면 단일 결과로 처리
              predictions.push({
                name: analysis.foodName,
                confidence: analysis.confidence,
                selected: true,
                description: analysis.description || '',
                ingredients: analysis.ingredients,
                calories: analysis.calories,
                nutrients: analysis.nutrients,
                portionSize: analysis.portionSize,
                healthScore: analysis.healthScore,
                suggestions: analysis.suggestions,
              });
            }

            return { ...img, predictions };
          } else {
            console.error('❌ 분석 실패:', result.message || result.error);
            return img;
          }
        } catch (error) {
          console.error('❌ 이미지 분석 오류:', error);
          return img;
        }
      });

      const analyzedImages = await Promise.all(analysisPromises);
      setImages(analyzedImages);
    } catch (error) {
      console.error('❌ 전체 분석 오류:', error);
      setModalMessage('분석 중 오류가 발생했습니다.\n다시 시도해주세요.');
      setShowModal(true);
    } finally {
      setIsAnalyzing(false);
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
            onConfirmItem={(r) => {
              console.log('확정 결과', r);
              setCompletedImages((prev) => new Set(prev).add(r.id));
            }}
            onDeleteImage={handleDeleteImage}
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

                // 모달 팝업 표시
                setModalMessage(
                  `아직 선택하지 않은 음식이 ${incompleteCount}개 있어요.\n모든 음식을 선택해주세요!`
                );
                setShowModal(true);

                // 흔들림 애니메이션 종료
                setTimeout(() => {
                  setIsShaking(false);
                }, 600);

                // 빨간 테두리 제거
                setTimeout(() => {
                  setShowError(false);
                }, 2000);
              } else {
                // 모두 완료됨 - 저장 처리
                setModalMessage('음식이 성공적으로 저장되었습니다! 🎉');
                setShowModal(true);
                // TODO: 실제 저장 로직 추가
              }
            }}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition shadow-md"
          >
            선택한 음식 저장하기
          </button>

          {/* 진행 상황 표시 */}
          <div className="mt-3 text-center text-sm text-slate-600">
            {completedImages.size} / {images.length} 개 완료
          </div>
        </>
      )}

      {/* 커스텀 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">
                {modalMessage.includes('성공') ? '🎉' : '⚠️'}
              </div>
              <p className="text-lg font-medium text-slate-800 whitespace-pre-line leading-relaxed mb-6">
                {modalMessage}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
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
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        @keyframes modal {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal {
          animation: modal 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
