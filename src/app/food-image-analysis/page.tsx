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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expire = sessionStorage.getItem('login_expire');
      const user = sessionStorage.getItem('user_name');
      
      if (expire && Date.now() < Number(expire)) {
        setIsLoggedIn(true);
        setUserName(user || '');
      }
    }
  }, []);

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
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      
      // 이미지 프리뷰 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // 이전 분석 결과 초기화
      setAnalysisResult(null);
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

  // AI 이미지 분석 시작
  const startAnalysis = async () => {
    if (!uploadedImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // FormData로 이미지 전송
      const formData = new FormData();
      formData.append('file', uploadedImage);

      // 백엔드 API 직접 호출 (YOLO 엔드포인트)
      const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiEndpoint}/api/v1/food/analysis-upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // 세션 쿠키 포함
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result.data.analysis);
      } else {
        throw new Error(result.error || '분석 실패');
      }
    } catch (error) {
      console.error('이미지 분석 오류:', error);
      alert('이미지 분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 파일을 Base64로 변환하는 헬퍼 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 식사 기록 저장
  const saveMealRecord = async () => {
    if (!analysisResult || !imagePreview) {
      alert('저장할 분석 결과가 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      // 백엔드 API로 식사 기록 저장
      const response = await fetch('http://localhost:8000/api/v1/meal-records', {
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
              food_id: 1, // 임시 ID (실제로는 food_nutrients 테이블의 ID)
              food_name: analysisResult.foodName,
              quantity: 1.0,
              calories: analysisResult.calories,
              protein: analysisResult.nutrients.protein,
              carbs: analysisResult.nutrients.carbs,
              fat: analysisResult.nutrients.fat,
            },
          ],
          memo: memo || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('식사 기록이 저장되었습니다!');
        router.push('/dashboard');
      } else {
        console.error('저장 실패:', data);
        alert(data.detail || '식사 기록 저장에 실패했습니다.');
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
                onClick={startAnalysis}
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
                    <p className="text-sm text-green-700">
                      신뢰도: {(analysisResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* 칼로리 정보 */}
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">칼로리 정보</h3>
                    <p className="text-3xl font-bold text-orange-900">{analysisResult.calories} kcal</p>
                  </div>

                  {/* 영양 성분 */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-3">영양 성분</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-sm text-blue-600">단백질</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.protein}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-600">탄수화물</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.carbs}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-600">지방</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.fat}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-600">나트륨</p>
                        <p className="font-bold text-blue-900">{analysisResult.nutrients.sodium}mg</p>
                      </div>
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
