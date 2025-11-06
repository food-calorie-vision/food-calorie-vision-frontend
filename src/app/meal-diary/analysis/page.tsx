'use client';

import { useState } from 'react';
import MealPeekSwiper from '@/components/MealPeekSwiper';

type FoodPrediction = {
  name: string;
  confidence: number;
  selected: boolean;
};

type UploadedImage = {
  id: string;
  url: string;
  predictions?: FoodPrediction[];
};

export default function MealDiaryPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    // 모의 비전 모델 분석 (2초 후 결과 표시)
    setTimeout(() => {
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          predictions: [
            { name: '김치찌개', confidence: 0.92, selected: true },
            { name: '된장찌개', confidence: 0.78, selected: false },
            { name: '순두부찌개', confidence: 0.65, selected: false },
            { name: '부대찌개', confidence: 0.53, selected: false },
          ],
        }))
      );
      setIsAnalyzing(false);
    }, 2000);
  };

  const togglePrediction = (imageId: string, foodName: string) => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== imageId) return img;
        return {
          ...img,
          predictions: img.predictions?.map((pred) => ({
            ...pred,
            selected: pred.name === foodName ? !pred.selected : pred.selected,
          })),
        };
      })
    );
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
                  <div className="p-4 bg-slate-50">
                    <div className="text-sm font-semibold text-slate-700 mb-3">분석 결과:</div>
                    <div className="space-y-2">
                      {img.predictions.map((pred) => (
                        <button
                          key={pred.name}
                          onClick={() => togglePrediction(img.id, pred.name)}
                          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border-2 transition ${
                            pred.selected
                              ? 'bg-green-500 text-white border-green-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-green-300'
                          }`}
                        >
                          <span className="font-medium">{pred.name}</span>
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
