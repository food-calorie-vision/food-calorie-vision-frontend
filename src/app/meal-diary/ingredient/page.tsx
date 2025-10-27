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
