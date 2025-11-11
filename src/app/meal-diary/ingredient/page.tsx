'use client';

import { useState } from 'react';

type IngredientPrediction = {
  name: string;
  count: number;
  selected: boolean;
};

type IngredientImage = {
  id: string;
  url: string;
  predictions?: IngredientPrediction[];
};

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
                  <div className="relative">
                    <img src={img.url} alt="식재료" className="w-full h-64 object-cover" />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg"
                    >
                      ×
                    </button>
                  </div>

                  {/* 분석 결과 */}
                  {img.predictions && (
                    <div className="p-6">
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
          <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl">
            💾 선택한 식재료 저장하기
          </button>
        )}
      </div>
    </div>
  );
}
