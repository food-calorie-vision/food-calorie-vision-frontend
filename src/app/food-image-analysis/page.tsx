'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Search, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { FoodAnalysisResult } from '@/types';

export default function FoodImageAnalysisPage() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mealType, setMealType] = useState('점심'); // 식사 유형
  const [memo, setMemo] = useState(''); // 메모
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 인증 체크 (페이지 로드 시 한 번만)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiEndpoint}/api/v1/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user_id) {
            setIsLoggedIn(true);
            setUserName(data.nickname || data.username);
            setIsCheckingAuth(false);
          } else {
            alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            router.push('/');
          }
        } else if (response.status === 401 || response.status === 403) {
          alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/');
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        alert('⚠️ 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // 인증 체크 중이면 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-medium">로그인 확인 중...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('login_expire');
      sessionStorage.removeItem('user_name');
      alert('로그아웃되었습니다.');
      router.push('/');
    }
  };

  // 이미지 업로드 처리
  const handleImageUpload = (file: File) => {
    console.log('📤 handleImageUpload 호출됨:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      console.log('✅ 이미지 상태 업데이트 완료');
      
      // 이미지 프리뷰 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        console.log('✅ 이미지 프리뷰 생성 완료');
      };
      reader.readAsDataURL(file);
      
      // 이전 분석 결과 초기화
      setAnalysisResult(null);
    } else {
      console.warn('⚠️ 유효하지 않은 이미지 파일:', file.type);
    }
  };

  // 드래그 앤 드롭 처리
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // AI 이미지 분석 시작 (YOLO + GPT-Vision + DB)
  const startAnalysis = async () => {
    console.log('🔔 startAnalysis 함수 호출됨!');
    console.log('📸 uploadedImage 상태:', uploadedImage);
    
    if (!uploadedImage) {
      console.warn('⚠️ 업로드된 이미지가 없습니다.');
      alert('먼저 이미지를 업로드해주세요.');
      return;
    }

    console.log('🚀 분석 시작:', {
      fileName: uploadedImage.name,
      fileSize: uploadedImage.size,
      fileType: uploadedImage.type
    });

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // FormData 생성 (백엔드가 multipart/form-data를 기대함)
      const formData = new FormData();
      formData.append('file', uploadedImage);

      // 백엔드 API 직접 호출
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiUrl = `${apiEndpoint}/api/v1/food/analysis-upload`;
      
      console.log('📡 API 호출:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include', // 세션 쿠키 포함
      });

      console.log('📥 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 서버 응답 에러:', errorText);
        throw new Error(`서버 오류 (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('📦 응답 데이터:', result);

      if (result.success) {
        setAnalysisResult(result.data.analysis);
        console.log('✅ 분석 완료:', result.data.analysis);
        alert('분석이 완료되었습니다!');
      } else {
        throw new Error(result.error || result.detail || result.message || '분석 실패');
      }
    } catch (error) {
      console.error('❌ 이미지 분석 오류:', error);
      if (error instanceof Error) {
        alert(`이미지 분석 중 오류가 발생했습니다:\n${error.message}`);
      } else {
        alert('이미지 분석 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsAnalyzing(false);
      console.log('🏁 분석 종료');
    }
  };


  // 식사 기록 저장
  const saveMealRecord = async () => {
    if (!analysisResult || !imagePreview) {
      alert('저장할 분석 결과가 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 백엔드 API로 식사 기록 저장
      const response = await fetch(`${apiEndpoint}/api/v1/meals/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 세션 쿠키 포함
        body: JSON.stringify({
          meal_type: mealType,
          image_url: imagePreview, // 실제로는 S3 등에 업로드한 URL 사용
          foods: [
            {
              food_id: analysisResult.foodId || `food_${Date.now()}`, // GPT Vision에서 반환한 food_id 사용
              food_name: analysisResult.foodName,
              portion_size_g: analysisResult.portionSize ? parseFloat(analysisResult.portionSize) : 100.0,
              calories: analysisResult.calories,
              protein: analysisResult.nutrients.protein,
              carbs: analysisResult.nutrients.carbs,
              fat: analysisResult.nutrients.fat,
              sodium: analysisResult.nutrients.sodium,
              fiber: analysisResult.nutrients.fiber || 0,
            },
          ],
          memo: memo || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ 식사 기록이 저장되었습니다!\n건강 점수: ${data.data[0].health_score || '계산중'}점`);
        router.push('/dashboard');
      } else {
        console.error('저장 실패:', data);
        alert(data.message || data.detail || '식사 기록 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 에러:', error);
      alert('식사 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">오늘의 식사 일기</h1>
          <p className="text-lg text-gray-600">음식 사진을 업로드하면 AI가 칼로리와 영양 정보를 분석해드립니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 이미지 업로드 섹션 */}
          <div className="space-y-6">
            {/* 업로드 영역 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">이미지 업로드</h2>
              
              {!imagePreview ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">음식 사진을 드래그하거나 클릭하여 업로드하세요</p>
                  <p className="text-sm text-gray-500 mb-4">JPG, PNG, GIF 파일 지원</p>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    파일 선택
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="업로드된 음식 이미지"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">파일명:</span> {uploadedImage?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">크기:</span> {(uploadedImage?.size! / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 분석 시작 버튼 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <button
                onClick={() => {
                  console.log('🖱️ 버튼 클릭됨!');
                  startAnalysis();
                }}
                disabled={!uploadedImage || isAnalyzing}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors flex items-center justify-center ${
                  !uploadedImage || isAnalyzing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    이미지 분석 시작
                  </>
                )}
              </button>
              
              {!uploadedImage && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  먼저 음식 이미지를 업로드해주세요
                </p>
              )}
              
              {/* 디버깅 정보 */}
              <div className="mt-2 text-xs text-gray-400 text-center">
                디버그: uploadedImage = {uploadedImage ? '있음' : '없음'}, isAnalyzing = {isAnalyzing ? 'true' : 'false'}
              </div>
            </div>
          </div>

          {/* 분석 결과 섹션 */}
          <div className="space-y-6">
            {analysisResult ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">분석 결과</h2>
                
                <div className="space-y-4">
                  {/* 음식명과 신뢰도 */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-1">인식된 음식</h3>
                    <p className="text-2xl font-bold text-green-900">{analysisResult.foodName}</p>
                    {analysisResult.description && (
                      <p className="text-sm text-green-700 mt-1">{analysisResult.description}</p>
                    )}
                    <p className="text-sm text-green-700 mt-1">
                      신뢰도: {(analysisResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* 주요 재료 */}
                  {analysisResult.ingredients && analysisResult.ingredients.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-2">주요 재료</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 칼로리 및 건강 점수 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-semibold text-orange-800 mb-1">칼로리</h3>
                      <p className="text-2xl font-bold text-orange-900">{analysisResult.calories} kcal</p>
                      {analysisResult.portionSize && (
                        <p className="text-xs text-orange-700 mt-1">{analysisResult.portionSize}</p>
                      )}
                    </div>
                    {analysisResult.healthScore !== undefined && (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h3 className="font-semibold text-indigo-800 mb-1">건강 점수</h3>
                        <p className="text-2xl font-bold text-indigo-900">{analysisResult.healthScore}점</p>
                        <p className="text-xs text-indigo-700 mt-1">
                          {analysisResult.healthScore >= 75 ? '우수' : analysisResult.healthScore >= 50 ? '보통' : '개선 필요'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 영양 성분 */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-3">영양 성분</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-sm text-blue-600">단백질</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.protein.toFixed(1)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-600">탄수화물</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.carbs.toFixed(1)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-600">지방</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.fat.toFixed(1)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-600">나트륨</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.sodium.toFixed(1)}mg</p>
                      </div>
                      {analysisResult.nutrients.fiber !== undefined && analysisResult.nutrients.fiber > 0 && (
                        <div className="text-center col-span-2">
                          <p className="text-sm text-blue-600">식이섬유</p>
                          <p className="font-bold text-blue-900">{analysisResult.nutrients.fiber.toFixed(1)}g</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 추천사항 */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">건강 팁</h3>
                    <ul className="space-y-1">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-purple-700 flex items-start">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 식사 유형 선택 */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">식사 유형</h3>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="아침">아침</option>
                      <option value="점심">점심</option>
                      <option value="저녁">저녁</option>
                      <option value="간식">간식</option>
                    </select>
                  </div>

                  {/* 메모 입력 */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">메모 (선택)</h3>
                    <textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="식사에 대한 메모를 입력하세요"
                      className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                  </div>

                  {/* 저장 버튼 */}
                  <button
                    onClick={saveMealRecord}
                    disabled={isSaving}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                      isSaving
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isSaving ? '저장 중...' : '식사 기록 저장'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">분석 결과</h3>
                  <p className="text-gray-500">
                    {isAnalyzing 
                      ? 'AI가 이미지를 분석하고 있습니다...' 
                      : '이미지를 업로드하고 분석을 시작하면 결과가 여기에 표시됩니다.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
