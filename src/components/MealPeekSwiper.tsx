'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type FoodPrediction = {
  name: string;
  confidence: number;
  selected: boolean;
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
};

type UploadedImage = {
  id: string;
  url: string;
  predictions?: FoodPrediction[];
};

type Phase = 'name' | 'custom_input' | 'ingredients' | 'done';

type Props = {
  images: UploadedImage[];
  autoSwipeDelayMs?: number;
  onConfirmItem?: (r: { id: string; name: string | null; ingredients: string[]; portionText: string }) => void;
  onDeleteImage?: (imageId: string) => void; // 이미지 삭제 콜백
};

// 인덱스 순환 헬퍼
const wrap = (i: number, len: number) => ((i % len) + len) % len;

export default function MealPeekSwiper({
  images,
  autoSwipeDelayMs = 700,
  onConfirmItem,
  onDeleteImage,
}: Props) {
  const [index, setIndex] = useState(0);
  const [phaseById, setPhaseById] = useState<Record<string, Phase>>({});
  const [pickedNameById, setPickedNameById] = useState<Record<string, string | null>>({});
  const [pickedIngrById, setPickedIngrById] = useState<Record<string, string[]>>({});
  const [quantityById, setQuantityById] = useState<Record<string, string>>({}); // 섭취량 상태 추가
  const [customFoodName, setCustomFoodName] = useState<string>('');
  const [customIngredients, setCustomIngredients] = useState<string>('');

  // 이미지 변경 시 초기화
  useEffect(() => {
    const init: Record<string, Phase> = {};
    images.forEach((img) => {
      // 이미 완료된 상태라면 유지 (API 호출 후 리렌더링 시 초기화 방지)
      if (!phaseById[img.id] || phaseById[img.id] !== 'done') {
        init[img.id] = 'name';
      } else {
        init[img.id] = 'done';
      }
    });
    // 기존 상태 병합 (새 이미지 추가 시 기존 상태 유지)
    setPhaseById(prev => ({ ...init, ...prev }));
    
    // 초기 인덱스는 0으로 리셋하지 않음 (사용자가 보고 있던 위치 유지)
  }, [images.length]); // 이미지 개수가 바뀔 때만 실행

  const hasItems = images.length > 0;
  const current = hasItems ? images[wrap(index, images.length)] : undefined;

  // 모든 React Hooks를 조건문/early return 전에 호출
  const peekItems = useMemo(() => {
    if (!hasItems) return [];
    const n = Math.min(3, Math.max(0, images.length - 1));
    return Array.from({ length: n }, (_, k) => images[wrap(index + 1 + k, images.length)]);
  }, [images, index, hasItems]);

  const nameCandidates = useMemo<string[]>(
    () => (current?.predictions ? current.predictions.map((p) => p.name) : []),
    [current]
  );

  const ingredientsCandidates = useMemo<string[]>(() => {
    if (!current) return [];
    
    // 선택된 음식의 실제 재료 가져오기 (GPT Vision 추출)
    const chosenName = pickedNameById[current.id] ?? nameCandidates[0];
    
    if (!chosenName) return [];
    
    const selectedPrediction = current.predictions?.find((p) => p.name === chosenName);
    const ingredients = selectedPrediction?.ingredients ?? [];
    
    // 빈 값, "-", 공백 제거 및 중복 제거
    return ingredients
      .filter((ing) => ing && ing.trim() !== '' && ing.trim() !== '-')
      .filter((ing, index, self) => self.indexOf(ing) === index);
  }, [current, nameCandidates, pickedNameById]);

  // ✅ 안전 가드: current가 없으면 아무것도 렌더하지 않음 (모든 Hooks 호출 후)
  if (!hasItems || !current) return null;

  const goNext = () => setIndex((i) => wrap(i + 1, images.length));
  const goPrev = () => setIndex((i) => wrap(i - 1, images.length));

  const phase: Phase = phaseById[current.id] ?? 'name';

  const chooseName = (n: string) =>
    setPickedNameById((prev) => ({ ...prev, [current.id]: n }));

  const confirmName = (name: string) => {
    setPickedNameById((prev) => ({ ...prev, [current.id]: name }));
    setPhaseById((prev) => ({ ...prev, [current.id]: 'ingredients' }));
  };

  const toggleIngredient = (ing: string) =>
    setPickedIngrById((prev) => {
      const cur = new Set(prev[current.id] ?? []);
      cur.has(ing) ? cur.delete(ing) : cur.add(ing);
      return { ...prev, [current.id]: Array.from(cur) };
    });

  const confirmIngredientsAndQuantity = () => {
    const selectedName = pickedNameById[current.id];
    const finalName = selectedName || nameCandidates[0] || null;
    const portionText = quantityById[current.id] || '1인분'; // 기본값 1인분
    
    console.log('🔍 confirmIngredientsAndQuantity 디버그:', {
      currentImageId: current.id,
      finalName,
      portionText
    });
    
    setPhaseById((prev) => ({ ...prev, [current.id]: 'done' }));
    
    onConfirmItem?.({
      id: current.id,
      name: finalName,
      ingredients: pickedIngrById[current.id] ?? [],
      portionText: portionText,
    });
    
    // 다중 이미지인 경우에만 자동으로 다음 이미지로 전환
    if (images.length > 1) {
      setTimeout(() => goNext(), autoSwipeDelayMs);
    }
  };


  const goBackToNameSelection = () => {
    setPhaseById((prev) => ({ ...prev, [current.id]: 'name' }));
    setPickedIngrById((prev) => ({ ...prev, [current.id]: [] })); // 재료 선택 초기화
  };

  const openCustomInput = () => {
    setPhaseById((prev) => ({ ...prev, [current.id]: 'custom_input' }));
    setCustomFoodName('');
    setCustomIngredients('');
  };

  const confirmCustomFood = () => {
    if (!customFoodName.trim()) {
      alert('음식 이름을 입력해주세요.');
      return;
    }
    
    // 직접 입력한 음식명 저장
    setPickedNameById((prev) => ({ ...prev, [current.id]: customFoodName.trim() }));
    
    // 재료 파싱 (콤마 또는 공백으로 구분)
    const ingredients = customIngredients
      .split(/[,\s]+/)
      .map(i => i.trim())
      .filter(i => i.length > 0);
    
    setPickedIngrById((prev) => ({ ...prev, [current.id]: ingredients }));
    
    // 섭취량 입력 단계로 이동하지 않고 바로 ingredients 단계로 이동 (UI 통합)
    setPhaseById((prev) => ({ ...prev, [current.id]: 'ingredients' }));
    setQuantityById(prev => ({ ...prev, [current.id]: '1인분' }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      {/* 진행 표시 */}
      <div className="flex items-center justify-between mb-2 text-sm text-slate-500">
        <div>오늘의 식사일기 · {wrap(index, images.length) + 1} / {images.length}</div>
      </div>

      <div className={`relative select-none ${current?.predictions ? 'h-[650px]' : 'h-[350px]'}`}>
        {/* 뒤 카드 peek - 다중 이미지일 때만 표시 */}
        {images.length > 1 && (
          <div className="absolute inset-0 pointer-events-none">
            {peekItems.map((it, i) => (
              <div
                key={it.id}
                className="absolute top-5 right-5 overflow-hidden rounded-2xl shadow"
                style={{
                  transform: `translateX(${i * 26}px) translateY(${i * 8}px) scale(${0.96 - i * 0.06})`,
                  opacity: 0.35 - i * 0.07,
                  width: '75%',
                  height: '80%',
                  background: '#f5f5f5',
                }}
              >
                <img src={it.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* 메인 카드 */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id}
            drag={images.length > 1 ? "x" : false} // 단일 이미지일 때는 드래그 비활성화
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (images.length > 1) {
                if (info.offset.x < -80) goNext();
                else if (info.offset.x > 80) goPrev();
              }
            }}
            initial={{ x: images.length > 1 ? 40 : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: images.length > 1 ? -40 : 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
            whileTap={{ scale: 0.98 }}
            className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-md h-full overflow-hidden flex flex-col"
            style={{ touchAction: 'pan-y' }}  // 모바일 세로 스크롤 충돌 방지
          >
            <div className="h-48 relative flex-shrink-0">
              <img src={current.url} alt="meal" className="w-full h-full object-cover" />
              
              {/* 삭제 버튼 - 우측 상단 */}
              {onDeleteImage && (
                <button
                  onClick={() => {
                    onDeleteImage(current.id);
                    // 삭제 후 이미지가 남아있으면 다음 이미지로 이동
                    if (images.length > 1) {
                      goNext();
                    }
                  }}
                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-600 transition z-20"
                  aria-label="이미지 삭제"
                >
                  <span className="text-lg font-bold">×</span>
                </button>
              )}
              
              {/* 이전/다음 버튼 - 다중 이미지일 때만 표시 */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button onClick={goPrev} className="px-3 py-1 rounded-lg bg-white/90 border text-sm">
                    이전
                  </button>
                  <button onClick={goNext} className="px-3 py-1 rounded-lg bg-white/90 border text-sm">
                    다음
                  </button>
                </div>
              )}
            </div>

            {/* 하단 컨트롤 */}
            <div className="flex-1 p-4 flex flex-col">
              {!current.predictions && (
                <div className="text-sm text-slate-500">
                  분석 결과가 아직 없습니다. 아래의 <b>식단 분석 시작</b> 버튼을 먼저 눌러주세요.
                </div>
              )}

              {current.predictions && phase === 'name' && (
                <div className="flex flex-col h-full">
                  <div className="flex-shrink-0 mb-3">
                    <p className="text-sm text-slate-600 mb-2">업로드한 음식은</p>
                    <p className="text-lg font-bold text-slate-900">
                      <span className="text-green-600">{nameCandidates[0]}</span> 로 보입니다.
                    </p>
                    {nameCandidates.length > 1 && (
                      <p className="text-xs text-slate-500 mt-1">다른 후보를 선택하려면 아래에서 골라주세요</p>
                    )}
                  </div>
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1 min-h-0">
                    {current.predictions.slice(0, 3).map((pred) => {
                      // pickedNameById에 값이 있으면 우선 사용, 없으면 pred.selected 사용
                      const selected = pickedNameById[current.id] 
                        ? pickedNameById[current.id] === pred.name 
                        : pred.selected;
                      const confidencePercent = (pred.confidence * 100).toFixed(0);
                      const getConfidenceColor = (conf: number) => {
                        if (conf >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
                        if (conf >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                        return 'text-orange-600 bg-orange-50 border-orange-200';
                      };
                      return (
                        <button
                          key={pred.name}
                          onClick={() => {
                            confirmName(pred.name);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition ${
                            selected
                              ? 'bg-green-50 text-slate-700 border-green-400 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-green-300 active:bg-slate-50'
                          }`}
                        >
                          <span className="font-medium text-base flex-1 text-left break-words">
                            {pred.name}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                              getConfidenceColor(pred.confidence)
                            }`}>
                              {confidencePercent}%
                            </span>
                            {selected && (
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">✓</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* 직접 입력 버튼 */}
                    <button
                      onClick={openCustomInput}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      <span className="text-lg">✏️</span>
                      <span className="font-medium">해당 음식이 없나요? 직접 입력하기</span>
                    </button>
                  </div>
                </div>
              )}

              {current.predictions && phase === 'custom_input' && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="flex-shrink-0 mb-3">
                    <p className="text-lg font-bold text-slate-900 mb-1">음식 직접 입력</p>
                    <p className="text-xs text-slate-600">원하는 음식이 목록에 없다면 직접 입력해주세요.</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                    {/* 음식 이름 입력 */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        음식 이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customFoodName}
                        onChange={(e) => setCustomFoodName(e.target.value)}
                        placeholder="예: 엄마표 김치찌개"
                        className="w-full px-3 py-2.5 text-base border-2 border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none transition"
                      />
                    </div>
                    
                    {/* 재료 입력 (선택) */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        주재료 (선택)
                      </label>
                      <input
                        type="text"
                        value={customIngredients}
                        onChange={(e) => setCustomIngredients(e.target.value)}
                        placeholder="예: 김치, 돼지고기, 두부"
                        className="w-full px-3 py-2.5 text-base border-2 border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none transition"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        콤마(,)로 구분하여 입력해주세요
                      </p>
                    </div>
                    
                    {/* 안내 메시지 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        💡 <b>직접 입력한 음식은</b> 나만의 음식 DB에 저장되어, 다음에 같은 음식을 먹을 때 자동으로 추천됩니다!
                      </p>
                    </div>
                  </div>
                  
                  {/* 버튼 */}
                  <div className="mt-3 flex-shrink-0 space-y-2">
                    <button
                      onClick={confirmCustomFood}
                      className="w-full px-4 py-2.5 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition shadow-sm text-sm"
                    >
                      확인
                    </button>
                    <button
                      onClick={goBackToNameSelection}
                      className="w-full px-4 py-2.5 rounded-lg bg-white border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition text-sm"
                    >
                      뒤로 가기
                    </button>
                  </div>
                </div>
              )}

              {current.predictions && phase === 'ingredients' && (
                <div className="flex flex-col h-full">
                  <div className="flex-shrink-0 mb-3">
                    <p className="text-lg font-bold text-green-600 mb-1">
                      {pickedNameById[current.id] || nameCandidates[0] || '(선택 없음)'}
                    </p>
                    <p className="text-sm text-slate-600">
                        재료와 섭취량을 확인해주세요.
                    </p>
                  </div>
                  
                  {/* 통합된 입력 영역 */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    
                    {/* 섹션 1: 재료 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            들어간 재료
                        </label>
                        <div className="flex flex-wrap gap-2 content-start">
                            {ingredientsCandidates.map((ing) => {
                            const selected = (pickedIngrById[current.id] ?? []).includes(ing);
                            return (
                                <button
                                key={ing}
                                onClick={() => toggleIngredient(ing)}
                                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                                    selected 
                                    ? 'bg-green-500 text-white border-green-600 shadow-sm' 
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-green-300 active:bg-slate-50'
                                }`}
                                >
                                {selected && <span className="mr-1">✓</span>}
                                {ing}
                                </button>
                            );
                            })}
                        </div>
                    </div>
                    
                    {/* 구분선 */}
                    <hr className="border-slate-200 mb-6" />
                    
                    {/* 섹션 2: 섭취량 */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            섭취량
                        </label>
                        <input
                            type="text"
                            value={quantityById[current.id] || ''}
                            onChange={(e) => setQuantityById(prev => ({ ...prev, [current.id]: e.target.value }))}
                            placeholder="예: 밥 한 공기, 피자 2조각, 200g"
                            className="w-full px-4 py-3 text-lg border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-slate-800 placeholder-slate-400 transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmIngredientsAndQuantity();
                            }}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            드신 양을 편하게 적어주세요.
                        </p>
                    </div>
                  </div>

                  <div className="mt-4 flex-shrink-0">
                    <button
                      onClick={confirmIngredientsAndQuantity}
                      className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm flex items-center justify-center"
                    >
                      영양 정보 계산하기 →
                    </button>
                  </div>
                </div>
              )}

              {current.predictions && phase === 'done' && (
                <div className="flex flex-col h-full relative">
                  <div className="flex-shrink-0 mb-2 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</div>
                        <p className="font-bold text-slate-800 truncate max-w-[200px]">
                            {pickedNameById[current.id] || nameCandidates[0]}
                        </p>
                     </div>
                     <button 
                        onClick={() => setPhaseById(prev => ({ ...prev, [current.id]: 'ingredients' }))}
                        className="text-xs text-slate-400 underline hover:text-slate-600"
                     >
                        수정
                     </button>
                  </div>
                  
                  {/* 영양 정보 미리보기 카드 */}
                  <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center items-center">
                     {/* 선택된 prediction 찾기 */}
                     {(() => {
                        const selectedName = pickedNameById[current.id] || nameCandidates[0];
                        // selected인 항목을 최우선으로 찾음 (업데이트된 항목은 selected: true임)
                        const prediction = current.predictions?.find(p => p.selected) || current.predictions?.find(p => p.name === selectedName);
                        
                        console.log('🔍 [MealPeekSwiper] 렌더링 디버그:', {
                            phase,
                            currentId: current.id,
                            selectedName,
                            hasCalories: prediction?.calories !== undefined,
                            prediction
                        });
                        
                        if (prediction && prediction.calories !== undefined) {
                            return (
                                <div className="w-full space-y-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-slate-900">{prediction.calories} <span className="text-lg font-medium text-slate-500">kcal</span></p>
                                        <p className="text-sm text-slate-500 mt-1">{prediction.portionSize || quantityById[current.id]}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <p className="text-xs text-slate-500">탄수화물</p>
                                            <p className="font-bold text-slate-800">{prediction.nutrients?.carbs.toFixed(1)}g</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <p className="text-xs text-slate-500">단백질</p>
                                            <p className="font-bold text-slate-800">{prediction.nutrients?.protein.toFixed(1)}g</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <p className="text-xs text-slate-500">지방</p>
                                            <p className="font-bold text-slate-800">{prediction.nutrients?.fat.toFixed(1)}g</p>
                                        </div>
                                    </div>
                                    
                                    {prediction.healthScore !== undefined && (
                                        <div className="bg-green-100 p-3 rounded-lg flex items-center justify-between relative group">
                                            <span className="text-sm font-bold text-green-800 flex items-center cursor-help">
                                                건강 점수
                                                <span className="ml-1 text-xs bg-green-200 text-green-700 rounded-full w-4 h-4 flex items-center justify-center">i</span>
                                            </span>
                                            <span className="text-lg font-bold text-green-700">{prediction.healthScore}점</span>
                                            
                                            {/* 툴팁 */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-56 text-center pointer-events-none z-50 shadow-lg">
                                                영양 밀도와 균형을 종합한 점수입니다.<br/>(NRF9.3 지수 기반)
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        } else {
                            return (
                                <div className="text-center text-slate-400">
                                    <div className="animate-spin text-2xl mb-2">🔄</div>
                                    <p className="text-sm">영양 정보를 계산하고 있습니다...</p>
                                </div>
                            );
                        }
                     })()}
                  </div>
                  
                  {images.length > 1 && (
                      <p className="text-xs text-center text-slate-400 mt-3">다음 사진으로 이동합니다...</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
