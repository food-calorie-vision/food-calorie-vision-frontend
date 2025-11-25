'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import MobileNav from '@/components/MobileNav';
import { useSession } from '@/contexts/SessionContext';
import { API_BASE_URL } from '@/utils/api';

/* ===== Types ===== */
type Allergy = { id: string; name: string };
type Disease = { id: string; name: string; priority: number };

/* ===== Utils ===== */
function emojiForAllergy(name: string) {
  const n = name.toLowerCase();
  if (n.includes('땅콩') || n.includes('peanut')) return '🌰';
  if (n.includes('우유') || n.includes('milk') || n.includes('유당')) return '🥛';
  if (n.includes('계란') || n.includes('egg')) return '🥚';
  if (n.includes('밀') || n.includes('gluten') || n.includes('wheat')) return '🌾';
  if (n.includes('생선') || n.includes('fish')) return '🐟';
  if (n.includes('갑각') || n.includes('새우') || n.includes('crust')) return '🦐';
  if (n.includes('대두') || n.includes('soy')) return '🫘';
  return '⚠️';
}

const toast = (msg: string) => {
  const el = document.createElement('div');
  el.textContent = msg;
  el.className =
    'fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
};

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, userName, logout } = useSession();

  // 설정 상태
  const [allergies, setAllergies] = useState<Allergy[]>([
    { id: 'peanut', name: '땅콩' },
    { id: 'milk', name: '우유' },
  ]);
  const [diseases, setDiseases] = useState<Disease[]>([
    { id: 'dm', name: '당뇨병', priority: 1 },
    { id: 'htn', name: '고혈압', priority: 2 },
    { id: 'liver', name: '간질환', priority: 3 },
  ]);
  const [nickname, setNickname] = useState('user1234');
  const [heightCm, setHeightCm] = useState<string>(''); // cm
  const [weightKg, setWeightKg] = useState<string>(''); // kg

  const [openAddAllergy, setOpenAddAllergy] = useState(false);
  const [openAddDisease, setOpenAddDisease] = useState(false);
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const [inputName, setInputName] = useState('');
  const [formNick, setFormNick] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formPwd, setFormPwd] = useState('');
  const [formNewPwd, setFormNewPwd] = useState('');

  // 로컬 저장된 설정 값 불러오기
  useEffect(() => {
    const raw = localStorage.getItem('settings-demo');
    if (!raw) return;
    try {
      const s = JSON.parse(raw);

      if (Array.isArray(s.allergies)) {
        setAllergies(
          s.allergies
            .map((x: any) => ({
              id: String(x.id ?? x.name ?? '').toLowerCase(),
              name: String(x.name ?? x.id ?? ''),
            }))
            .filter((x: Allergy) => x.id && x.name),
        );
      }

      if (Array.isArray(s.diseases)) {
        setDiseases(
          reindex(
            s.diseases.map((x: any, i: number) => ({
              id: String(x.id ?? x.name ?? '').toLowerCase(),
              name: String(x.name ?? x.id ?? ''),
              priority: Number.isFinite(x.priority) ? x.priority : i + 1,
            })),
          ),
        );
      }

      if (s.nickname) setNickname(String(s.nickname));
      if (s.heightCm !== undefined) setHeightCm(String(s.heightCm));
      if (s.weightKg !== undefined) setWeightKg(String(s.weightKg));
    } catch {
      // JSON 파싱 실패 시 무시
    }
  }, []);

  const persist = () =>
    localStorage.setItem(
      'settings-demo',
      JSON.stringify({
        allergies,
        diseases,
        nickname,
        heightCm,
        weightKg,
      }),
    );

  const onAddAllergy = () => {
    const name = inputName.trim();
    if (!name) return;
    const id = name.toLowerCase();
    if (allergies.some((a) => a.id === id)) return toast('이미 추가된 알러지예요.');
    setAllergies((p) => [...p, { id, name }]);
    setInputName('');
    setOpenAddAllergy(false);
  };
  const removeAllergy = (id: string) => setAllergies((p) => p.filter((a) => a.id !== id));

  const onAddDisease = () => {
    const name = inputName.trim();
    if (!name) return;
    const id = name.toLowerCase();
    if (diseases.some((d) => d.id === id)) return toast('이미 추가된 질환이에요.');
    const maxPri = diseases.length ? Math.max(...diseases.map((d) => d.priority)) : 0;
    setDiseases(reindex([...diseases, { id, name, priority: maxPri + 1 }]));
    setInputName('');
    setOpenAddDisease(false);
  };
  const removeDisease = (id: string) => setDiseases((p) => reindex(p.filter((d) => d.id !== id)));

  function moveDisease(viewIdx: number, dir: 'up' | 'down') {
    const sorted = [...diseases].sort((a, b) => a.priority - b.priority);
    const from = viewIdx;
    const to = dir === 'up' ? Math.max(0, from - 1) : Math.min(sorted.length - 1, from + 1);
    if (from === to) return;
    const [item] = sorted.splice(from, 1);
    sorted.splice(to, 0, item);
    setDiseases(reindex(sorted));
  }
  function reindex(list: Disease[]) {
    return list.map((d, i) => ({ ...d, priority: i + 1 }));
  }

  const saveAll = () => {
    persist();
    toast('설정이 저장되었습니다.');
  };

  const openEditAccount = () => {
    setFormNick(nickname || '');
    setFormHeight(heightCm || '');
    setFormWeight(weightKg || '');
    setFormPwd('');
    setFormNewPwd('');
    setOpenAccountModal(true);
  };

  const saveAccount = () => {
    if (!formNick.trim()) return toast('닉네임을 입력하세요.');
    if ((formPwd && !formNewPwd) || (!formPwd && formNewPwd)) {
      return toast('현재/새 비밀번호를 모두 입력하거나 모두 비워주세요.');
    }
    // TODO: 비밀번호 변경 API 연동 시 여기에서 호출
    setNickname(formNick.trim());
    setHeightCm(formHeight.trim());
    setWeightKg(formWeight.trim());
    persist();
    setOpenAccountModal(false);
    toast('계정 정보가 저장되었습니다.');
  };

  return (
    <div className="min-h-screen bg-white mobile-content">
      {/* 상단 공통 헤더 */}
      <MobileHeader
        isLoggedIn={isAuthenticated}
        userName={userName}
        handleLogout={logout}
      />

      {/* 메인 컨텐츠 */}
      <main className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* 설정 페이지 타이틀 영역 */}
        <div className="mb-6 text-center">
          <div className="text-4xl mb-2">⚙️</div>
          <h1 className="text-xl font-bold text-gray-900">설정</h1>
          <p className="text-sm text-gray-500 mt-1">
            건강 정보와 계정 정보를 관리해 보세요.
          </p>
        </div>

        <div className="space-y-5">
          {/* 건강 정보 */}
          <SectionCard title="건강 정보" subtitle="알러지·질환 설정">
            {/* 알러지 설정 */}
            <div className="space-y-2">
              <div className="text-sm text-gray-700 font-medium">알러지 설정</div>
              <div className="space-y-2">
                {allergies.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{emojiForAllergy(a.name)}</span>
                      <span className="text-gray-800 text-sm">{a.name}</span>
                    </div>
                    <button
                      onClick={() => removeAllergy(a.id)}
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setInputName('');
                  setOpenAddAllergy(true);
                }}
                className="w-full text-left text-gray-700 text-sm border rounded-lg px-3 py-3 hover:bg-gray-50"
              >
                + 기타 알러지 추가
              </button>
            </div>

            <hr className="my-4 border-dashed" />

            {/* 질환 설정 */}
            <div className="space-y-2">
              <div className="text-sm text-gray-700 font-medium">질환 설정</div>
              <div className="space-y-2">
                {[...diseases]
                  .sort((a, b) => a.priority - b.priority)
                  .map((d, viewIdx) => (
                    <div key={d.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {d.priority}
                        </span>
                        <span className="text-gray-800 text-sm">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveDisease(viewIdx, 'up')}
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                          aria-label="위로"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveDisease(viewIdx, 'down')}
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                          aria-label="아래로"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => removeDisease(d.id)}
                          className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <button
                onClick={() => {
                  setInputName('');
                  setOpenAddDisease(true);
                }}
                className="w-full text-left text-gray-700 text-sm border rounded-lg px-3 py-3 hover:bg-gray-50"
              >
                + 기타 질환 추가
              </button>
            </div>
          </SectionCard>

          {/* 계정 */}
          <SectionCard title="계정" subtitle="닉네임/비밀번호/신체정보">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>닉네임 <span className="text-gray-500">{nickname || '-'}</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span>키 <span className="text-gray-500">{heightCm ? `${heightCm} cm` : '-'}</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span>몸무게 <span className="text-gray-500">{weightKg ? `${weightKg} kg` : '-'}</span></span>
              </div>
              <div className="pt-1">
                <button
                  onClick={openEditAccount}
                  className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  계정 수정
                </button>
              </div>
            </div>
          </SectionCard>

          <button
            onClick={saveAll}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl py-3"
          >
            변경사항 저장하기
          </button>
        </div>
      </main>

      {/* Bottom Sheet: 알러지/질환 추가 */}
      {openAddAllergy && (
        <BottomSheet title="알러지 추가" onClose={() => setOpenAddAllergy(false)}>
          <AddNameForm
            placeholder="예: 갑각류"
            value={inputName}
            onChange={setInputName}
            onCancel={() => setOpenAddAllergy(false)}
            onConfirm={onAddAllergy}
          />
        </BottomSheet>
      )}
      {openAddDisease && (
        <BottomSheet title="질환 추가" onClose={() => setOpenAddDisease(false)}>
          <AddNameForm
            placeholder="예: 갑상선 질환"
            value={inputName}
            onChange={setInputName}
            onCancel={() => setOpenAddDisease(false)}
            onConfirm={onAddDisease}
          />
        </BottomSheet>
      )}

      {/* Center Modal: 계정 수정 */}
      {openAccountModal && (
        <CenterModal title="계정 수정" onClose={() => setOpenAccountModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">닉네임</label>
              <input
                value={formNick}
                onChange={(e) => setFormNick(e.target.value)}
                className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="닉네임을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">키 (cm)</label>
                <input
                  inputMode="decimal"
                  value={formHeight}
                  onChange={(e) => setFormHeight(e.target.value)}
                  className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="예: 164"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">몸무게 (kg)</label>
                <input
                  inputMode="decimal"
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="예: 52.3"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">비밀번호 변경(선택)</div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">현재 비밀번호</label>
              <input
                type="password"
                value={formPwd}
                onChange={(e) => setFormPwd(e.target.value)}
                className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="현재 비밀번호"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">새 비밀번호</label>
              <input
                type="password"
                value={formNewPwd}
                onChange={(e) => setFormNewPwd(e.target.value)}
                className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="새 비밀번호"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setOpenAccountModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={saveAccount}
                className="px-4 py-2 text-sm rounded-lg text-white bg-green-500 hover:bg-green-600"
              >
                저장
              </button>
            </div>
          </div>
        </CenterModal>
      )}

      {/* 하단 모바일 네비게이션 */}
      <MobileNav />
    </div>
  );
}

/* ===== Reusable UI ===== */
function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-end"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl p-4 pb-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-300 mb-3" />
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CenterModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddNameForm({
  placeholder,
  value,
  onChange,
  onCancel,
  onConfirm,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-3">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-3 rounded-lg text-white bg-green-500 hover:bg-green-600"
        >
          추가
        </button>
      </div>
    </div>
  );
}
