'use client';

import { useState } from 'react';
import Link from 'next/link';

type FoodPrediction = {
  name: string;
  confidence: number;
  selected: boolean;
};

type IngredientPrediction = {
  name: string;
  count: number;
  selected: boolean;
};

type UploadedImage = {
  id: string;
  url: string;
  predictions?: FoodPrediction[];
};

type IngredientImage = {
  id: string;
  url: string;
  predictions?: IngredientPrediction[];
};

export default function MealDiaryPage() {
  const [activeTab, setActiveTab] = useState<'meal' | 'ingredient'>('meal');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="text-xl font-bold text-slate-800">KCalculator</span>
            </Link>
            <span className="text-slate-400">|</span>
            <h1 className="text-lg font-semibold text-slate-700">오늘의 식사 일기</h1>
          </div>
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 underline-offset-4 hover:underline"
          >
            홈으로
          </Link>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('meal')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'meal'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">🍽️</span>
            <span>식단 분석</span>
          </button>
          <button
            onClick={() => setActiveTab('ingredient')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'ingredient'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">🥕</span>
            <span>식재료 입력</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {activeTab === 'meal' ? <MealAnalysisTab /> : <IngredientInputTab />}
      </div>
    </div>
  );
}

// 1. 식단 분석 탭
function MealAnalysisTab() {
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
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">식단 분석</h2>
        <p className="text-slate-600">
          음식 이미지를 업로드하면 AI가 자동으로 분석해드립니다. (한 이미지당 음식 1개)
        </p>
      </div>

      {/* 이미지 업로드 영역 */}
      <div className="mb-6">
        <label
          htmlFor="meal-upload"
          className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
        >
          <div className="text-5xl mb-4">📸</div>
          <div className="text-slate-700 font-medium mb-2">이미지 업로드</div>
          <div className="text-sm text-slate-500">클릭하거나 드래그하여 이미지를 추가하세요</div>
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

// 2. 식재료 입력 탭
function IngredientInputTab() {
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
        prev.map((img, idx) => ({
          ...img,
          predictions: [
            { name: '당근', count: 3, selected: true },
            { name: '양파', count: 2, selected: true },
            { name: '감자', count: 5, selected: true },
          ],
        }))
      );
      setIsAnalyzing(false);
    }, 2000);
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">식재료 입력</h2>
        <p className="text-slate-600">
          냉장고 속 식재료 이미지를 업로드하면 AI가 자동으로 인식해드립니다. (여러 이미지 동시 업로드 가능)
        </p>
      </div>

      {/* 이미지 업로드 영역 */}
      <div className="mb-6">
        <label
          htmlFor="ingredient-upload"
          className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
        >
          <div className="text-5xl mb-4">🥕</div>
          <div className="text-slate-700 font-medium mb-2">식재료 이미지 업로드</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((img) => (
              <div key={img.id} className="border rounded-xl overflow-hidden">
                <div className="relative">
                  <img src={img.url} alt="식재료" className="w-full h-48 object-cover" />
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
                    <div className="text-sm font-semibold text-slate-700 mb-3">인식된 식재료:</div>
                    <div className="space-y-3">
                      {img.predictions.map((pred) => (
                        <div
                          key={pred.name}
                          className={`p-3 rounded-lg border-2 transition ${
                            pred.selected
                              ? 'bg-green-50 border-green-500'
                              : 'bg-white border-slate-200 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-800">{pred.name}</span>
                            <button
                              onClick={() => toggleIngredient(img.id, pred.name)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                                pred.selected
                                  ? 'bg-green-500 border-green-600'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              {pred.selected && <span className="text-white text-sm">✓</span>}
                            </button>
                          </div>

                          {pred.selected && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">수량:</span>
                              <button
                                onClick={() => updateCount(img.id, pred.name, -1)}
                                className="w-8 h-8 bg-slate-200 rounded-lg hover:bg-slate-300 transition font-bold"
                              >
                                −
                              </button>
                              <span className="w-12 text-center font-semibold text-slate-800">
                                {pred.count}
                              </span>
                              <button
                                onClick={() => updateCount(img.id, pred.name, 1)}
                                className="w-8 h-8 bg-slate-200 rounded-lg hover:bg-slate-300 transition font-bold"
                              >
                                +
                              </button>
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
          {isAnalyzing ? '분석 중...' : '식재료 분석 시작'}
        </button>
      )}

      {/* 저장 버튼 */}
      {images.length > 0 && images[0].predictions && (
        <button className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition">
          선택한 식재료 저장하기
        </button>
      )}
    </div>
  );
}
