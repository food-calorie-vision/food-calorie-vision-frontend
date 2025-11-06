'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SignupFormData } from '@/types';

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    userId: '',
    nickname: '',
    password: '',
    gender: '남자',
    birthDate: '',
    hasAllergy: '아니오',
    allergyInfo: '',
    bodyType: '유지',
    medicalCondition: '',
    healthGoal: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // 필수 입력 필드 검증
    if (!formData.userId || !formData.nickname || !formData.password) {
      alert('아이디, 닉네임, 비밀번호는 필수 입력 사항입니다.');
      return;
    }

    if (formData.userId.length < 3) {
      alert('아이디는 최소 3자 이상이어야 합니다.');
      return;
    }

    if (formData.password.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!formData.birthDate) {
      alert('생년월일을 입력해주세요.');
      return;
    }

    if (!formData.healthGoal) {
      alert('건강 목표를 입력해주세요.');
      return;
    }
    
    try {
      // 생년월일 형식 변환: YYYYMMDD -> YYYY-MM-DD
      let birthDateFormatted = formData.birthDate;
      if (formData.birthDate.length === 8) {
        const year = formData.birthDate.substring(0, 4);
        const month = formData.birthDate.substring(4, 6);
        const day = formData.birthDate.substring(6, 8);
        birthDateFormatted = `${year}-${month}-${day}`;
      }

      // 백엔드 API에 맞게 데이터 변환
      const signupData = {
        user_id: formData.userId,
        nickname: formData.nickname,
        password: formData.password,
        gender: formData.gender,
        birth_date: birthDateFormatted, // YYYY-MM-DD 형식
        has_allergy: formData.hasAllergy,
        allergy_info: formData.allergyInfo || null,
        body_type: formData.bodyType,
        medical_condition: formData.medicalCondition || null,
        health_goal: formData.healthGoal,
        email: null, // 프론트엔드에 이메일 필드 없음
      };

      console.log('전송할 데이터:', signupData); // 디버깅용

      const response = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      console.log('서버 응답:', data); // 디버깅용

      if (response.ok && data.success) {
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        // 로그인 페이지로 이동
        window.location.href = '/';
      } else {
        console.error('회원가입 실패:', data); // 상세 에러 로그
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
              {/* 1. 아이디 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">1</span>
                  아이디
                </label>
                <input
                  type="text"
                  name="userId"
                  placeholder="ID"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 2. 닉네임 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">2</span>
                  닉네임
                </label>
                <input
                  type="text"
                  name="nickname"
                  placeholder="Nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 3. 비밀번호 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">3</span>
                  비밀번호
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 4. 성별 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                  <span className="text-red-500 text-lg">4</span>
                  성별
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="남자"
                      checked={formData.gender === '남자'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">남자</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="여자"
                      checked={formData.gender === '여자'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">여자</span>
                  </label>
                </div>
              </div>

              {/* 5. 생년월일 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">5</span>
                  생년월일
                </label>
                <input
                  type="text"
                  name="birthDate"
                  placeholder="생년월일 8자리(YYYYMMDD)"
                  value={formData.birthDate}
                  onChange={handleChange}
                  maxLength={8}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                />
              </div>

              {/* 6. 식품 알레르기 보유여부 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                  <span className="text-red-500 text-lg">6</span>
                  식품 알레르기 보유여부
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasAllergy"
                      value="예"
                      checked={formData.hasAllergy === '예'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">예</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasAllergy"
                      value="아니오"
                      checked={formData.hasAllergy === '아니오'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">아니오</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼 */}
            <div className="space-y-6">
              {/* 7. 알레르기 유발 성분 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">7</span>
                  알레르기유발성분
                </label>
                <textarea
                  name="allergyInfo"
                  placeholder="없으면 생략가능 (여러개인 경우 쉼표(,)로 구분하여 작성)"
                  value={formData.allergyInfo}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
                />
                <p className="text-slate-400 text-xs mt-1">ex) 땅콩, 새우, 조개 등</p>
              </div>

              {/* 8. 체중목표 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-3">
                  <span className="text-red-500 text-lg">8</span>
                  체중목표
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value="감량"
                      checked={formData.bodyType === '감량'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">감량</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value="유지"
                      checked={formData.bodyType === '유지'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">유지</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bodyType"
                      value="증량"
                      checked={formData.bodyType === '증량'}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-slate-700">증량</span>
                  </label>
                </div>
              </div>

              {/* 9. 기저질환 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">9</span>
                  기저질환
                </label>
                <textarea
                  name="medicalCondition"
                  placeholder="없으면 생략가능 (여러개인 경우 쉼표(,)로 구분하여 작성)"
                  value={formData.medicalCondition}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
                />
                <p className="text-slate-400 text-xs mt-1">ex) 고혈압, 당뇨, 인구건조증 등</p>
              </div>

              {/* 10. 건강목표 */}
              <div>
                <label className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="text-red-500 text-lg">10</span>
                  건강목표
                </label>
                <textarea
                  name="healthGoal"
                  placeholder="구체적인 건강목표를 작성해주세요"
                  value={formData.healthGoal}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none"
                />
                <p className="text-slate-400 text-xs mt-1">
                  ex) 1. 혈압을 120/80 정상범위로 낮추고 싶어요
                  <br />
                  2. 혈중 콜레스테롤을 줄이고 싶어요
                </p>
              </div>
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
