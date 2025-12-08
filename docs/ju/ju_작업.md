# 회원가입 시 개인정보 및 민감정보 수집 동의 구현 (Case A)

## 📋 개요
사용자의 신체 정보(키, 몸무게 등)와 건강 정보(알레르기 등)를 수집하므로, 회원가입 시 법적 요구사항을 준수하기 위해 약관 동의 절차를 추가해야 합니다.
본 구현은 프론트엔드에서 동의 여부를 확인하고 가입 요청을 보내는 방식(Case A)으로 진행합니다.

## ✅ 작업 체크리스트

- [x] **UI 컴포넌트 추가** (`SignupForm` 또는 관련 컴포넌트)
    - [x] **[필수] 서비스 이용약관 동의** 체크박스
    - [x] **[필수] 개인정보 수집 및 이용 동의** 체크박스
    - [x] **[필수] 민감정보 수집 및 이용 동의** 체크박스
    - [x] **[전체 동의]** 체크박스 (편의 기능)

- [x] **약관 내용 모달/팝업 구현**
    - [x] 각 동의 항목 옆에 '내용 보기' 또는 '전문 보기' 링크/버튼 추가
    - [x] 클릭 시 해당 약관의 상세 내용을 보여주는 모달(Modal) 창 구현
    - [x] 약관 텍스트(더미 또는 표준 문구) 준비

- [x] **상태 관리 및 로직 구현**
    - [x] 각 체크박스의 상태(`agreedService`, `agreedPrivacy`, `agreedSensitive`) 관리 (useState 등)
    - [x] '전체 동의' 클릭 시 모든 항목 체크/해제 로직
    - [x] 개별 항목 체크 시 '전체 동의' 상태 연동 로직
    - [x] **유효성 검사**: 필수 항목 3개가 모두 체크되지 않으면 '회원가입' 버튼 비활성화 (Disabled) 처리

- [x] **약관 내용 작성 (예시)**
    - [x] **개인정보 수집 및 이용 동의**: 이메일, 비밀번호, 닉네임, 성별, 나이 (목적: 회원 식별, 서비스 제공)
    - [x] **민감정보 수집 및 이용 동의**: 키, 몸무게, 건강 목표, 식습관 데이터 (목적: 맞춤형 식단/운동 추천, 건강 분석)

## 📝 구현 상세 가이드 (참고용)

### 1. 동의 항목 구조
```typescript
const [agreements, setAgreements] = useState({
  termsOfService: false, // 서비스 이용약관
  privacyPolicy: false,  // 개인정보 수집 및 이용
  sensitiveData: false,  // 민감정보 수집 및 이용
});

// 전체 동의 핸들러
const handleAllCheck = (checked) => {
  setAgreements({
    termsOfService: checked,
    privacyPolicy: checked,
    sensitiveData: checked,
  });
};

// 가입 버튼 활성화 조건
const isAllAgreed = agreements.termsOfService && agreements.privacyPolicy && agreements.sensitiveData;
```

### 2. UI 레이아웃 예시
```jsx
<div>
  <Checkbox 
    checked={isAllAgreed} 
    onChange={(e) => handleAllCheck(e.target.checked)}
  >
    전체 동의하기
  </Checkbox>
  <hr />
  <div className="flex justify-between">
    <Checkbox checked={agreements.termsOfService} ...>
      [필수] 서비스 이용약관 동의
    </Checkbox>
    <button onClick={openTermsModal}>내용 보기</button>
  </div>
  <div className="flex justify-between">
    <Checkbox checked={agreements.privacyPolicy} ...>
      [필수] 개인정보 수집 및 이용 동의
    </Checkbox>
    <button onClick={openPrivacyModal}>내용 보기</button>
  </div>
  <div className="flex justify-between">
    <Checkbox checked={agreements.sensitiveData} ...>
      [필수] 민감정보 수집 및 이용 동의
    </Checkbox>
    <button onClick={openSensitiveModal}>내용 보기</button>
  </div>
</div>
```

## ⚠️ 주의사항
- 백엔드 DB에는 별도의 동의 일시를 저장하지 않으므로(Case A), **프론트엔드에서 철저하게 체크 여부를 검증**한 후 API를 호출해야 합니다.
- 민감정보(키, 몸무게 등)는 별도의 항목으로 분리하여 동의를 받아야 법적 리스크를 최소화할 수 있습니다.