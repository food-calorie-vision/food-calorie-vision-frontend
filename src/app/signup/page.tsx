'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  Lock,
  User,
  Calendar,
  ChevronLeft,
  Scale,
  Ruler,
  Pill,
  Activity,
  AtSign,
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

// 타입
type Gender = 'M' | 'F' | '';
type HealthGoal = 'loss' | 'maintain' | 'gain';
type Step = 1 | 2 | 3;

/** 회원가입 form 데이터 타입 */
interface SignupFormData {
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  birthdate: string;
  gender: Gender;

  weight: string;
  height: string;
  healthGoal: HealthGoal;
  hasAllergy: '' | 'yes' | 'no';
  allergyTriggers: string;

  comorbidities: string;
  healthGoalNote: string;
}

/** 라벨 + 아이콘 박스 */
function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 focus-within:ring-2 focus-within:ring-emerald-500">
      <div className="shrink-0 text-slate-400 mt-1">{icon}</div>
      <div className="w-full">{children}</div>
    </div>
  );
}

/** YYYY/MM/DD or YYYYMMDD → age 계산 */
function birthToAge(birthStr: string): number | null {
  const digits = (birthStr || '').replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));

  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [pending, setPending] = useState(false);

  const [f, setF] = useState<SignupFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    birthdate: '',
    gender: '',

    weight: '',
    height: '',
    healthGoal: 'maintain',
    hasAllergy: '',
    allergyTriggers: '',

    comorbidities: '',
    healthGoalNote: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setF((s) => ({ ...s, [name]: value }));
  };

  const canNext1 = useMemo(() => {
    if (!f.username || !f.password || !f.confirmPassword) return false;
    if (f.username.trim().length < 2) return false;
    if (f.password.length < 6) return false;
    if (f.password !== f.confirmPassword) return false;
    return true;
  }, [f]);

  const prune = (obj: Record<string, any>) => {
    const out: Record<string, any> = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === '' || v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      out[k] = v;
    });
    return out;
  };

  const submit = async () => {
    if (pending) return;
    setPending(true);

    try {
      const age = birthToAge(f.birthdate);
      const payloadRaw = {
        username: f.username.trim(),
        password: f.password,
        nickname: f.nickname.trim() || f.username.trim(),
        gender: f.gender || null,

        age: age ?? null,
        weight: f.weight ? parseFloat(f.weight) : null,
        height: f.height ? parseFloat(f.height) : null,
        health_goal: f.healthGoal,

        has_allergy: f.hasAllergy === '' ? null : f.hasAllergy === 'yes',
        allergy_triggers: f.allergyTriggers.trim() || null,

        comorbidities: f.comorbidities.trim() || null,
        health_goal_note: f.healthGoalNote.trim() || null,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prune(payloadRaw)),
        credentials: 'omit',
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success ?? true)) {
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/';
      } else {
        alert(data.detail || data.message || '회원가입에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  };

  /** 단계 UI */
  const Progress = (
    <div className="mb-6">
      <div className="flex items-center justify-center mb-3">
        <div className="flex w-full max-w-sm items-center gap-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        </div>
      </div>

      <div className="flex justify-center gap-6 text-xs font-medium text-slate-600">
        <span className={step === 1 ? 'text-emerald-600 font-semibold' : ''}>기본정보</span>
        <span className={step === 2 ? 'text-emerald-600 font-semibold' : ''}>체중/알레르기</span>
        <span className={step === 3 ? 'text-emerald-600 font-semibold' : ''}>기타정보</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-[env(safe-area-inset-bottom)]">
      {/* 상단 */}
      <div className="max-w-md mx-auto px-4 pt-6">
        <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900">
          <ChevronLeft className="w-5 h-5 mr-1" /> 홈으로
        </Link>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-6">
          <h1 className="text-2xl font-bold text-center text-slate-900">회원가입</h1>

          {Progress}

          {/* STEP 1 - 기본정보 */}
          {step === 1 && (
            <div className="space-y-5">
              {/* 아이디 */}
              <Field icon={<AtSign className="w-5 h-5" />}>
                <input
                  name="username"
                  placeholder="아이디"
                  value={f.username}
                  onChange={onChange}
                  className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                />
              </Field>

              {/* 비밀번호 + 확인 */}
              <Field icon={<Lock className="w-5 h-5" />}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 w-full">
                  <input
                    type="password"
                    name="password"
                    placeholder="비밀번호 (6자 이상)"
                    value={f.password}
                    onChange={onChange}
                    className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="비밀번호 확인"
                    value={f.confirmPassword}
                    onChange={onChange}
                    className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                  />
                </div>
              </Field>

              {/* 닉네임 */}
              <Field icon={<User className="w-5 h-5" />}>
                <input
                  name="nickname"
                  placeholder="닉네임 (선택)"
                  value={f.nickname}
                  onChange={onChange}
                  className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                />
              </Field>

              {/* 생년월일 */}
              <Field icon={<Calendar className="w-5 h-5" />}>
                <input
                  name="birthdate"
                  placeholder="생년월일 8자리 (YYYY/MM/DD)"
                  value={f.birthdate}
                  onChange={onChange}
                  inputMode="numeric"
                  className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                />
              </Field>

              {/* 성별 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'M' as Gender, t: '남자' },
                  { k: 'F' as Gender, t: '여자' },
                  { k: '' as Gender, t: '선택안함' },
                ].map((g) => (
                  <button
                    key={g.k}
                    type="button"
                    onClick={() => setF((s) => ({ ...s, gender: g.k }))}

                    className={`py-3 rounded-xl border text-sm font-medium ${
                      f.gender === g.k
                        ? 'border-emerald-600 bg-emerald-500 text-white shadow'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    {g.t}
                  </button>
                ))}
              </div>

              {/* 안내문 */}
              <p className="text-xs leading-5 text-emerald-700 pt-2">
                신분증 상의 이름, 생년월일, 성별과 일치하지 않으면 실명인증이 불가능합니다.
              </p>
            </div>
          )}

          {/* STEP 2 - 체중/알레르기 */}
          {step === 2 && (
            <div className="space-y-6">
              {/* 신체 정보 */}
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">신체 정보</div>

                <div className="grid grid-cols-2 gap-3">
                  <Field icon={<Scale className="w-5 h-5" />}>
                    <div className="flex items-center gap-2 w-full">
                      <input
                        name="weight"
                        placeholder="체중"
                        value={f.weight}
                        onChange={onChange}
                        className="w-full bg-slate-50 rounded-md px-3 py-2 outline-none text-base"
                      />
                      <span className="text-sm text-slate-500">kg</span>
                    </div>
                  </Field>

                  <Field icon={<Ruler className="w-5 h-5" />}>
                    <div className="flex items-center gap-2 w-full">
                      <input
                        name="height"
                        placeholder="키"
                        value={f.height}
                        onChange={onChange}
                        className="w-full bg-slate-50 rounded-md px-3 py-2 outline-none text-base"
                      />
                      <span className="text-sm text-slate-500">cm</span>
                    </div>
                  </Field>
                </div>
              </div>

              {/* 체중 목표 */}
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">체중 목표</div>
                <div className="flex gap-2">
                  {[
                    { v: 'loss' as HealthGoal, t: '감량' },
                    { v: 'maintain' as HealthGoal, t: '유지' },
                    { v: 'gain' as HealthGoal, t: '증량' },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setF((s) => ({ ...s, healthGoal: o.v }))}
                      className={`px-4 py-2 rounded-full border text-sm ${
                        f.healthGoal === o.v
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      {o.t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 알레르기 유무 */}
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">
                  식품 알레르기 유무
                </div>

                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasAllergy"
                      value="yes"
                      checked={f.hasAllergy === 'yes'}
                      onChange={onChange}
                    />
                    <span className="text-slate-700 text-sm">있음</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasAllergy"
                      value="no"
                      checked={f.hasAllergy === 'no'}
                      onChange={onChange}
                    />
                    <span className="text-slate-700 text-sm">없음</span>
                  </label>
                </div>
              </div>

              {/* 보유 알레르기 정보 */}
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">보유 알레르기 정보</div>

                <Field icon={<Pill className="w-5 h-5" />}>
                  <textarea
                    name="allergyTriggers"
                    placeholder={`알레르기 유발 성분을 입력해 주세요.

(쉼표로 구분, 예시 - 새우, 땅콩)`}
                    value={f.allergyTriggers}
                    onChange={onChange}
                    onFocus={() => {
                      if (f.hasAllergy === '') {
                        setF((s) => ({ ...s, hasAllergy: 'yes' }));
                      }
                    }}
                    disabled={f.hasAllergy === 'no'}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 outline-none placeholder:text-slate-400 text-base min-h-[100px] resize-y"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 3 - 기타정보 */}
          {step === 3 && (
            <div className="space-y-6">
              {/* 기저질환 */}
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">기저질환 정보</div>

                <Field icon={<Activity className="w-5 h-5" />}>
                  <textarea
                    name="comorbidities"
                    placeholder={`기저질환을 입력해 주세요.

(예시 - 고혈압, 당뇨)`}
                    value={f.comorbidities}
                    onChange={onChange}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 outline-none placeholder:text-slate-400 text-base min-h-[100px] resize-y"
                  />
                </Field>
              </div>

              {/* 건강 목표 */}
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">건강목표</div>

                <Field icon={<Activity className="w-5 h-5" />}>
                  <textarea
                    name="healthGoalNote"
                    placeholder={`구체적인 건강 목표를 작성해 주세요.

예시:
1) 혈압을 120/80으로 낮추고 싶어요
2) 옆구리살을 줄이고 싶어요`}
                    value={f.healthGoalNote}
                    onChange={onChange}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 outline-none placeholder:text-slate-400 text-base min-h-[120px] resize-y"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="sticky bottom-0 -mx-6 mt-6 bg-white/90 backdrop-blur px-6 py-4 border-t">
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-700 hover:border-emerald-300"
                >
                  이전
                </button>
              )}

              {step < 3 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={step === 1 && !canNext1}
                  className={`flex-1 rounded-xl py-3 font-bold shadow ${
                    step === 1 && !canNext1
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  다음
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className={`flex-1 rounded-xl py-3 font-bold shadow ${
                    pending
                      ? 'bg-emerald-300 text-white cursor-wait'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  가입하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 로그인 링크 */}
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            이미 계정이 있으신가요?{' '}
            <span className="text-emerald-700 font-semibold">로그인하기 →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
