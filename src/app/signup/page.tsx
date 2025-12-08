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
  Mail, // ★ 추가
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

// 타입
type Gender = 'M' | 'F' | '';
type HealthGoal = 'loss' | 'maintain' | 'gain';
type Step = 1 | 2 | 3;

/** 회원가입 form 데이터 타입 */
interface SignupFormData {
  password: string;
  confirmPassword: string;
  /** 이메일 */
  email: string;            
  nickname: string;
  age: number | null;
  gender: Gender;

  weight: string;
  height: string;
  healthGoal: HealthGoal;
  hasAllergy: '' | 'yes' | 'no';
  allergyTriggers: string;

  comorbidities: string;
  healthGoalNote: string;
}

/** 에러 메시지 파서(FastAPI 대응) */
type ErrorDetail = string | { msg?: string; loc?: string | string[] } | Array<string | { msg?: string; loc?: string | string[] }>;
interface ApiErrorResponse {
  detail?: ErrorDetail;
  message?: string;
  error?: string;
}

function extractErrorMessage(data: ApiErrorResponse | string | null): string {
  try {
    if (!data) return '회원가입에 실패했습니다.';
    if (typeof data === 'string') return data;
    const d = data.detail;
    if (d !== undefined) {
      if (typeof d === 'string') return d;
      if (Array.isArray(d) && d.length > 0) {
        const x = d[0];
        if (typeof x === 'string') return x;
        if (typeof x === 'object' && x?.msg) {
          const loc = x?.loc ? ` (${Array.isArray(x.loc) ? x.loc.join('.') : x.loc})` : '';
          return `${x.msg}${loc}`;
        }
        return JSON.stringify(x);
      }
      if (typeof d === 'object' && d !== null && !Array.isArray(d)) {
        if (d.msg) return d.msg;
        return JSON.stringify(d);
      }
    }
    return (data.message || data.error || JSON.stringify(data));
  } catch {
    return '회원가입에 실패했습니다.';
  }
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

/** Email validation utility */
const isValidEmail = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [pending, setPending] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [weightTouched, setWeightTouched] = useState(false);
  const [heightTouched, setHeightTouched] = useState(false);
  const [allergyTriggersTouched, setAllergyTriggersTouched] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckMessage, setEmailCheckMessage] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);

  // 약관 동의 상태
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    sensitive: false,
  });
  const [openAgreementModal, setOpenAgreementModal] = useState<'terms' | 'privacy' | 'sensitive' | null>(null);

  const handleAllCheck = (checked: boolean) => {
    setAgreements({
      terms: checked,
      privacy: checked,
      sensitive: checked,
    });
  };

  const isAllAgreed = agreements.terms && agreements.privacy && agreements.sensitive;

  const [f, setF] = useState<SignupFormData>({
    password: '',
    confirmPassword: '',
    email: '',                 
    nickname: '',
    age: null,
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
    if (name === 'age' || name === 'weight' || name === 'height') {
      setF((s) => ({ ...s, [name]: value === '' ? null : Number(value) }));
    } else {
      setF((s) => ({ ...s, [name]: value }));
      if (name === 'email') {
        setEmailChecked(false);
        setEmailCheckMessage('');
      }
    }
  };

  const canNext1 = useMemo(() => {
    if (!f.email || !f.password || !f.confirmPassword) return false;
    if (f.email.trim().length < 2 || !isValidEmail(f.email) || !emailChecked) return false;
    if (f.password.length < 6) return false;
    if (f.password !== f.confirmPassword) return false;
    return true;
  }, [f]);

  const canNext2 = useMemo(() => {
    return (
      f.weight !== null &&
      !isNaN(Number(f.weight)) &&
      f.height !== null &&
      !isNaN(Number(f.height)) &&
      (f.hasAllergy === 'yes' ? f.allergyTriggers.trim() !== '' : true)
    );
  }, [f]);


  const prune = (obj: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === '' || v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      out[k] = v;
    });
    return out;
  };

  const checkEmailDuplication = async () => {
    if (emailChecking || !isValidEmail(f.email)) return;
    setEmailChecking(true);
    setEmailCheckMessage('');
    setEmailChecked(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/check-email?email=${encodeURIComponent(f.email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
      });

      const data = await res.json();

      if (res.ok && data.available) {
        setEmailChecked(true);
        setEmailCheckMessage('사용 가능한 이메일입니다.');
      } else {
        setEmailChecked(false);
        setEmailCheckMessage(data.message || '이미 사용 중인 이메일입니다.');
      }
    } catch (e) {
      console.error(e);
      setEmailChecked(false);
      setEmailCheckMessage('이메일 중복 확인 중 오류가 발생했습니다.');
    } finally {
      setEmailChecking(false);
    }
  };

  const submit = async () => {
    if (pending) return;
    setPending(true);

    try {


      // ▶ 회원가입 API가 받는 필드만 전송
      const payloadRaw = {
        username: f.email.trim(),
        password: f.password,
        nickname: f.nickname.trim() || f.email.trim(),
        email: f.email?.trim(),        
        gender: f.gender || null,
        age: f.age ?? null,
        weight: f.weight ? parseFloat(f.weight) : null,
        height: f.height ? parseFloat(f.height) : null,
        health_goal: f.healthGoal,
        allergies: f.allergyTriggers || null,
        diseases: f.comorbidities || null,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify(prune(payloadRaw)),
      });

      let data: ApiErrorResponse & { success?: boolean } | null = null;
      try { data = await res.json(); } catch { /* 빈 응답 대비 */ }

      if (res.ok && (data?.success ?? true)) {
        setModalMessage('🎉 회원가입이 완료되었습니다.\n로그인 페이지로 이동합니다.');
        setShowModal(true);
        // alert() 제거
      } else {
        setModalMessage(extractErrorMessage(data));
        setShowModal(true);
        // alert() 제거
      }
    } catch (e) {
      console.error(e);
      setModalMessage('❌ 회원가입 중 오류가 발생했습니다.');
      setShowModal(true);
      // alert() 제거
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
              {/* 이메일(필수)  */}
              <Field icon={<Mail className="w-5 h-5" />}>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    name="email"
                    placeholder="이메일 (필수)"
                    value={f.email}
                    onChange={onChange}
                    onBlur={() => setEmailTouched(true)}
                    className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                  />
                  <button
                    type="button"
                    onClick={checkEmailDuplication}
                    disabled={!isValidEmail(f.email) || emailChecking}
                    className="shrink-0 px-4 py-2 rounded-md bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {emailChecking ? '확인 중...' : '중복 확인'}
                  </button>
                </div>
                {emailTouched && !isValidEmail(f.email) && (
                  <p className="text-red-500 text-xs mt-1">유효한 이메일 형식이 아닙니다.</p>
                )}
                {emailCheckMessage && (
                  <p className={`text-xs mt-1 ${emailChecked ? 'text-green-500' : 'text-red-500'}`}>
                    {emailCheckMessage}
                  </p>
                )}
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
                    onBlur={() => setPasswordTouched(true)}
                    className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                  />
                  {passwordTouched && f.password.length < 6 && (
                    <p className="text-red-500 text-xs mt-1">비밀번호는 최소 6자리 이상입니다.</p>
                  )}
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="비밀번호 확인"
                    value={f.confirmPassword}
                    onChange={onChange}
                    onBlur={() => setConfirmPasswordTouched(true)}
                    className="w-full bg-slate-50/60 rounded-md px-3 py-2 outline-none text-base"
                  />
                  {confirmPasswordTouched && f.password !== f.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
                  )}
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

              {/* 나이 */}
              <Field icon={<Calendar className="w-5 h-5" />}>
                <input
                  name="age"
                  placeholder="나이"
                  value={f.age ?? ''}
                  onChange={onChange}
                  inputMode="numeric"
                  type="number"
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
                        onBlur={() => setWeightTouched(true)}
                        className="w-full bg-slate-50 rounded-md px-3 py-2 outline-none text-base"
                      />
                      <span className="text-sm text-slate-500">kg</span>
                    </div>
                    {weightTouched && f.weight === null && (
                      <p className="text-red-500 text-xs mt-1">몸무게를 입력해주세요.</p>
                    )}
                  </Field>

                  <Field icon={<Ruler className="w-5 h-5" />}>
                    <div className="flex items-center gap-2 w-full">
                      <input
                        name="height"
                        placeholder="키"
                        value={f.height}
                        onChange={onChange}
                        onBlur={() => setHeightTouched(true)}
                        className="w-full bg-slate-50 rounded-md px-3 py-2 outline-none text-base"
                      />
                      <span className="text-sm text-slate-500">cm</span>
                    </div>
                    {heightTouched && f.height === null && (
                      <p className="text-red-500 text-xs mt-1">키를 입력해주세요.</p>
                    )}
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
                      onChange={(e) => {
                        onChange(e);
                        if (e.target.value === 'no') {
                          setF((s) => ({ ...s, allergyTriggers: '' }));
                        }
                      }}
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
                    onBlur={() => setAllergyTriggersTouched(true)}
                    disabled={f.hasAllergy === 'no'}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 outline-none placeholder:text-xs placeholder:text-slate-400 text-base min-h-[100px] resize-y"
                  />
                  {allergyTriggersTouched && f.hasAllergy === 'yes' && f.allergyTriggers.trim() === '' && (
                    <p className="text-red-500 text-xs mt-1">보유 알레르기 정보를 입력해주세요.</p>
                  )}
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
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 outline-none placeholder:text-xs placeholder:text-slate-400 text-base min-h-[100px] resize-y"
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
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 outline-none placeholder:text-xs placeholder:text-slate-400 text-base min-h-[120px] resize-y"
                  />
                </Field>
              </div>

              {/* 약관 동의 */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAllAgreed}
                    onChange={(e) => handleAllCheck(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">전체 동의하기</span>
                </label>

                <div className="space-y-2 px-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.terms}
                        onChange={(e) => setAgreements((s) => ({ ...s, terms: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">[필수] 서비스 이용약관 동의</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setOpenAgreementModal('terms')}
                      className="text-xs text-slate-400 underline hover:text-emerald-500"
                    >
                      내용보기
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.privacy}
                        onChange={(e) => setAgreements((s) => ({ ...s, privacy: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">[필수] 개인정보 수집 및 이용 동의</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setOpenAgreementModal('privacy')}
                      className="text-xs text-slate-400 underline hover:text-emerald-500"
                    >
                      내용보기
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreements.sensitive}
                        onChange={(e) => setAgreements((s) => ({ ...s, sensitive: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-600">[필수] 민감정보 수집 및 이용 동의</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setOpenAgreementModal('sensitive')}
                      className="text-xs text-slate-400 underline hover:text-emerald-500"
                    >
                      내용보기
                    </button>
                  </div>
                </div>
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
                  disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
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
                  disabled={pending || !isAllAgreed}
                  className={`flex-1 rounded-xl py-3 font-bold shadow ${
                    pending || !isAllAgreed
                      ? 'bg-slate-300 text-white cursor-not-allowed'
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="rounded-2xl bg-white p-6 shadow-xl max-w-sm w-full text-center">
            <p className="text-lg font-medium text-slate-800 whitespace-pre-wrap mb-6">{modalMessage}</p>
            <button
              onClick={() => {
                setShowModal(false);
                // 회원가입 성공 시에만 홈으로 리다이렉트
                if (modalMessage.startsWith('🎉')) {
                  window.location.href = '/';
                }
              }}
              className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-white hover:bg-emerald-600"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 약관 동의 모달 */}
      {openAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="rounded-2xl bg-white p-6 shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {openAgreementModal === 'terms' && '서비스 이용약관'}
              {openAgreementModal === 'privacy' && '개인정보 수집 및 이용 동의'}
              {openAgreementModal === 'sensitive' && '민감정보 수집 및 이용 동의'}
            </h3>
            <div className="flex-1 overflow-y-auto text-sm text-slate-600 whitespace-pre-wrap border rounded-lg p-4 mb-4 bg-slate-50">
              {openAgreementModal === 'terms' && `제1조 (목적)
본 약관은 회사가 제공하는 건강 관리 및 식단 추천 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "회원"이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.
2. "서비스"란 회사가 제공하는 AI 기반 식단 분석, 추천 및 건강 리포트 기능을 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 회원이 서비스 가입 시 동의함으로써 효력이 발생합니다.
2. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 공지사항을 통해 알립니다.

제4조 (회원의 의무)
1. 회원은 서비스 이용 시 본인의 정보를 사실대로 입력해야 합니다.
2. 회원은 타인의 정보를 도용하거나 부정한 방법으로 서비스를 이용해서는 안 됩니다.
3. 회원은 회사의 지적재산권을 침해하는 행위를 해서는 안 됩니다.

제5조 (서비스의 제공 및 중단)
1. 회사는 연중무휴 24시간 서비스를 제공함을 원칙으로 합니다.
2. 단, 시스템 점검, 천재지변 등 불가피한 사유가 발생한 경우 서비스 제공을 일시 중단할 수 있습니다.

제6조 (면책조항)
회사가 제공하는 건강 및 영양 정보는 보조적인 수단이며, 전문적인 의료 행위를 대체하지 않습니다. 건강상의 문제가 있을 경우 반드시 의사 등 전문가와 상의해야 합니다.`}
              {openAgreementModal === 'privacy' && `[개인정보 수집 및 이용 동의]

회사는 다음과 같이 이용자의 개인정보를 수집 및 이용합니다.

1. 수집하는 개인정보 항목
- 필수항목: 이메일(ID), 비밀번호, 닉네임, 나이, 성별
- 서비스 이용 과정에서 자동 수집: 접속 로그, 쿠키, 기기 정보

2. 개인정보의 수집 및 이용목적
- 회원 관리: 본인 확인, 개인 식별, 가입 의사 확인, 불만 처리
- 서비스 제공: AI 기반 맞춤형 식단 추천, 영양 분석 리포트 생성
- 신규 서비스 개발 및 마케팅: 통계학적 분석, 서비스 유효성 확인

3. 개인정보의 보유 및 이용기간
- 원칙적으로 회원 탈퇴 시까지 보유 및 이용합니다.
- 단, 관련 법령에 의거하여 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
  - 로그인 기록: 3개월 (통신비밀보호법)
  - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)

※ 귀하는 개인정보 수집 및 이용에 거부할 권리가 있으나, 거부 시 회원가입 및 서비스 이용이 제한될 수 있습니다.`}
              {openAgreementModal === 'sensitive' && `[민감정보 수집 및 이용 동의]

회사는 개인 맞춤형 건강 관리 서비스를 제공하기 위해 다음과 같은 민감정보를 수집 및 이용합니다.

1. 수집하는 민감정보 항목
- 신체 정보: 키, 몸무게, BMI 지수
- 건강 정보: 알레르기 유무 및 유발 식품명, 기저질환 정보, 구체적 건강 목표(감량/유지/증량 등)
- 식습관 정보: 일일 섭취 음식 기록, 영양소 섭취 현황

2. 민감정보의 수집 및 이용목적
- 개인 맞춤형 권장 칼로리(TDEE) 및 영양소 비율 계산
- AI 기반 식단 추천 알고리즘의 정확도 향상
- 알레르기 유발 식재료 필터링 및 경고 기능 제공
- 주간/월간 건강 리포트 생성 및 추이 분석

3. 보유 및 이용기간
- 회원 탈퇴 시 즉시 파기하거나, 법령에 따른 보유 기간 동안 안전하게 보관 후 파기합니다.

4. 동의 거부 권리 및 불이익
- 귀하는 민감정보 수집 및 이용에 대한 동의를 거부할 수 있습니다.
- 단, 동의를 거부할 경우 본 서비스의 핵심 기능인 '맞춤형 식단 추천', '알레르기 경고', '건강 리포트' 등의 이용이 불가능하거나 제한될 수 있습니다.`}
            </div>
            <button
              onClick={() => setOpenAgreementModal(null)}
              className="w-full rounded-xl bg-slate-200 py-3 font-bold text-slate-700 hover:bg-slate-300"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
