'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

type Phase = 'name' | 'ingredients' | 'done';

type Props = {
  images: UploadedImage[];
  autoSwipeDelayMs?: number;
  onConfirmItem?: (r: { id: string; name: string | null; ingredients: string[] }) => void;
};

// 인덱스 순환 헬퍼
const wrap = (i: number, len: number) => ((i % len) + len) % len;

const INGREDIENT_PRESETS: Record<string, string[]> = {
  김치찌개: ['김치', '돼지고기', '두부', '대파', '마늘'],
  된장찌개: ['된장', '두부', '애호박', '감자', '대파'],
  순두부찌개: ['순두부', '계란', '대파', '고춧가루'],
  부대찌개: ['햄', '소세지', '김치', '콩', '라면사리'],
};
const DEFAULT_INGREDIENTS = ['밥', '김치', '계란', '파'];

export default function MealPeekSwiper({
  images,
  autoSwipeDelayMs = 700,
  onConfirmItem,
}: Props) {
  const [index, setIndex] = useState(0);
  const [phaseById, setPhaseById] = useState<Record<string, Phase>>({});
  const [pickedNameById, setPickedNameById] = useState<Record<string, string | null>>({});
  const [pickedIngrById, setPickedIngrById] = useState<Record<string, string[]>>({});

  // 이미지 변경 시 초기화
  useEffect(() => {
    const init: Record<string, Phase> = {};
    images.forEach((img) => (init[img.id] = 'name'));
    setPhaseById(init);
    setPickedNameById({});
    setPickedIngrById({});
    setIndex(0);
  }, [images]);

  const hasItems = images.length > 0;
  const current = hasItems ? images[wrap(index, images.length)] : undefined;

  // ✅ 안전 가드: current가 없으면 아무것도 렌더하지 않음
  if (!hasItems || !current) return null;

  const peekItems = useMemo(() => {
    const n = Math.min(3, Math.max(0, images.length - 1));
    return Array.from({ length: n }, (_, k) => images[wrap(index + 1 + k, images.length)]);
  }, [images, index]);

  const goNext = () => setIndex((i) => wrap(i + 1, images.length));
  const goPrev = () => setIndex((i) => wrap(i - 1, images.length));

  const phase: Phase = phaseById[current.id] ?? 'name';

  const nameCandidates = useMemo<string[]>(
    () => (current.predictions ? current.predictions.map((p) => p.name) : []),
    [current]
  );

  const ingredientsCandidates = useMemo<string[]>(() => {
    const chosen = pickedNameById[current.id] ?? nameCandidates[0];
    if (!chosen) return DEFAULT_INGREDIENTS;
    return INGREDIENT_PRESETS[chosen] ?? DEFAULT_INGREDIENTS;
  }, [current.id, nameCandidates, pickedNameById]);

  const chooseName = (n: string) =>
    setPickedNameById((prev) => ({ ...prev, [current.id]: n }));

  const confirmName = () => {
    const chosen = pickedNameById[current.id] ?? nameCandidates[0] ?? null;
    setPickedNameById((prev) => ({ ...prev, [current.id]: chosen }));
    setPhaseById((prev) => ({ ...prev, [current.id]: 'ingredients' }));
  };

  const toggleIngredient = (ing: string) =>
    setPickedIngrById((prev) => {
      const cur = new Set(prev[current.id] ?? []);
      cur.has(ing) ? cur.delete(ing) : cur.add(ing);
      return { ...prev, [current.id]: Array.from(cur) };
    });

  const confirmIngredients = () => {
    setPhaseById((prev) => ({ ...prev, [current.id]: 'done' }));
    onConfirmItem?.({
      id: current.id,
      name: pickedNameById[current.id] ?? nameCandidates[0] ?? null,
      ingredients: pickedIngrById[current.id] ?? [],
    });
    setTimeout(() => goNext(), autoSwipeDelayMs); // 루프 자동 전환
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      {/* 진행 표시 */}
      <div className="flex items-center justify-between mb-2 text-sm text-slate-500">
        <div>오늘의 식사일기 · {wrap(index, images.length) + 1} / {images.length}</div>
        <div className="hidden md:block">←/→ 키로 이동, Enter로 확정</div>
      </div>

      <div className="relative h-[420px] select-none">
        {/* 뒤 카드 peek */}
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

        {/* 메인 카드 */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={current.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) goNext();
              else if (info.offset.x > 80) goPrev();
            }}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
            whileTap={{ scale: 0.98 }}
            className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-md h-full overflow-hidden"
            style={{ touchAction: 'pan-y' }}  // 모바일 세로 스크롤 충돌 방지
          >
            <div className="h-[62%] relative">
              <img src={current.url} alt="meal" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button onClick={goPrev} className="px-3 py-1 rounded-lg bg-white/90 border text-sm">
                  이전
                </button>
                <button onClick={goNext} className="px-3 py-1 rounded-lg bg-white/90 border text-sm">
                  다음
                </button>
              </div>
            </div>

            {/* 하단 컨트롤 */}
            <div className="h-[38%] p-4">
              {!current.predictions && (
                <div className="text-sm text-slate-500">
                  분석 결과가 아직 없습니다. 아래의 <b>식단 분석 시작</b> 버튼을 먼저 눌러주세요.
                </div>
              )}

              {current.predictions && phase === 'name' && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">이름 후보를 선택하세요</p>
                  <div className="flex flex-wrap gap-2">
                    {nameCandidates.map((n) => {
                      const selected = (pickedNameById[current.id] ?? null) === n;
                      return (
                        <button
                          key={n}
                          onClick={() => chooseName(n)}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            selected ? 'bg-black text-white border-black' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={confirmName}
                      disabled={(pickedNameById[current.id] ?? nameCandidates[0] ?? null) === null}
                      className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-40"
                    >
                      이름 확정
                    </button>
                  </div>
                </div>
              )}

              {current.predictions && phase === 'ingredients' && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">재료 후보를 확인/선택하세요</p>
                  <div className="flex flex-wrap gap-2">
                    {ingredientsCandidates.map((ing) => {
                      const selected = (pickedIngrById[current.id] ?? []).includes(ing);
                      return (
                        <button
                          key={ing}
                          onClick={() => toggleIngredient(ing)}
                          className={`px-3 py-1 rounded-full border text-sm ${
                            selected ? 'bg-black text-white border-black' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={confirmIngredients}
                      className="px-4 py-2 rounded-lg bg-black text-white text-sm"
                    >
                      재료 확정 → 다음
                    </button>
                  </div>
                </div>
              )}

              {current.predictions && phase === 'done' && (
                <div className="text-sm text-slate-500">확인 완료! 다음 사진으로 이동합니다…</div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
