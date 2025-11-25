'use client';

import Link from 'next/link';
import { useState } from 'react';
import { API_BASE_URL } from '@/utils/api';

// ERDCloud User 테이블 기반 회원가입 폼 데이터
interface SignupFormData {
  email: string;
  username: string;
  password: string;
  nickname: string;
  gender: string;
  age: string;
  weight: string;
  height: string;
  healthGoal: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    username: '',
    password: '',
    nickname: '',
    gender: 'M',
    age: '',
    weight: '',
    height: '',
    healthGoal: 'maintain',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // 필수 입력 필드 검증
    if (!formData.email || !formData.username || !formData.password) {
      alert('이메일, 사용자명, 비밀번호는 필수 입력 사항입니다.');
      return;
    }

    if (formData.username.length < 2) {
      alert('사용자명은 최소 2자 이상이어야 합니다.');
      return;
    }

    if (formData.password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      // 백엔드 API에 맞게 데이터 변환
      const signupData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname || formData.username, // 닉네임 없으면 username 사용
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        health_goal: formData.healthGoal,
      };

      console.log('전송할 데이터:', signupData);

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      console.log('서버 응답:', data);

      if (response.ok && data.success) {
        alert(`회원가입이 완료되었습니다! (User ID: ${data.user_id})\n로그인 페이지로 이동합니다.`);
        window.location.href = '/';
      } else {
        console.error('회원가입 실패:', data);
        alert(data.detail || data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      {/* 헤더 */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 transition">
          <span className="text-2xl mr-2">←</span>
          <span className="font-medium">돌아가기</span>
        </Link>
      </div>

      {/* 회원가입 폼 */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-8">회원가입</h1>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            {/* 왼쪽 컬럼 */}
            <div className="space-y-6">
              {/* 1. 이메일 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">1</span>
                  이메일 (필수)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 2. 사용자명 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">2</span>
                  사용자명 (필수)
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 3. 비밀번호 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">3</span>
                  비밀번호 (필수)
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password (최소 6자)"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 4. 닉네임 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-slate-400 text-lg">4</span>
                  닉네임 (선택)
                </label>
                <input
                  type="text"
                  name="nickname"
                  placeholder="Nickname (없으면 사용자명 사용)"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 5. 성별 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                  <span className="text-slate-400 text-lg">5</span>
                  성별 (선택)
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="M"
                      checked={formData.gender === 'M'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">남자</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="F"
                      checked={formData.gender === 'F'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">여자</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼 */}
            <div className="space-y-6">
              {/* 6. 나이 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-slate-400 text-lg">6</span>
                  나이 (선택)
                </label>
                <input
                  type="number"
                  name="age"
                  placeholder="나이 (숫자만)"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  max="150"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 7. 체중 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-slate-400 text-lg">7</span>
                  체중 (선택)
                </label>
                <input
                  type="number"
                  name="weight"
                  placeholder="체중 (kg)"
                  value={formData.weight}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>
              
              {/* 8. 키 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-slate-400 text-lg">8</span>
                  키 (선택)
                </label>
                <input
                  type="number"
                  name="height"
                  placeholder="키 (cm)"
                  value={formData.height}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 9. 건강 목표 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                  <span className="text-red-500 text-lg">9</span>
                  건강 목표
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="healthGoal"
                      value="loss"
                      checked={formData.healthGoal === 'loss'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">감량</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="healthGoal"
                      value="maintain"
                      checked={formData.healthGoal === 'maintain'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">유지</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="healthGoal"
                      value="gain"
                      checked={formData.healthGoal === 'gain'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">증량</span>
                  </label>
                </div>
              </div>

              {/* 안내 메시지 */}
              {/* <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600 text-sm">
                  <strong>📝 변경사항:</strong>
                  <br />
                  - 이메일 기반 로그인으로 변경되었습니다.
                  <br />
                  - 건강 정보는 추후 대시보드에서 입력 가능합니다.
                  <br />- User ID는 자동 생성됩니다.
                </p>
              </div> */}
            </div>
          </div>

          {/* 회원가입 버튼 */}
          <div className="mt-12">
            <button
              onClick={handleSubmit}
              className="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-lg"
            >
              회원가입
            </button>
          </div>

          {/* 로그인 링크 */}
          <div className="text-center mt-6">
            <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm">
              이미 계정이 있으신가요? <span className="text-green-600 font-medium">로그인하기 →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
