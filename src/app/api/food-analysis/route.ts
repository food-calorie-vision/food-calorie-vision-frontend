import { NextRequest, NextResponse } from 'next/server';

// 음식 이미지 분석 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, fileName, fileSize, fileType } = body;

    // FastAPI 백엔드 연동 시 사용할 구조
    const apiEndpoint = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    // 백엔드로 전송할 데이터 구조
    const requestData = {
      imageData,
      fileName,
      fileSize,
      fileType,
      timestamp: new Date().toISOString(),
      userId: 'user' // 실제로는 인증된 사용자 ID
    };

    // FastAPI 백엔드 호출 (현재는 목업 응답)
    // const response = await fetch(`${apiEndpoint}/api/analyze-food-image`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(requestData),
    // });
    
    // const analysisResult = await response.json();

    // 임시 목업 응답 (실제 AI 분석 결과로 대체될 부분)
    await new Promise(resolve => setTimeout(resolve, 1500)); // 분석 시간 시뮬레이션

    const mockAnalysisResult = generateMockAnalysisResult(fileName);

    return NextResponse.json({
      success: true,
      data: {
        analysis: mockAnalysisResult,
        timestamp: new Date().toISOString(),
        processingTime: 1500
      }
    });

  } catch (error) {
    console.error('Food analysis API error:', error);
    return NextResponse.json(
      { success: false, error: '음식 이미지 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateMockAnalysisResult(fileName: string) {
  const lowerFileName = fileName.toLowerCase();
  let foodName = '알 수 없는 음식';
  let calories = 0;
  let nutrients = { protein: 0, carbs: 0, fat: 0, sodium: 0 };
  let suggestions = ['다양한 음식을 섭취하여 균형 잡힌 식단을 유지하세요.'];

  if (lowerFileName.includes('pizza')) {
    foodName = '피자';
    calories = 800;
    nutrients = { protein: 30, carbs: 80, fat: 40, sodium: 1500 };
    suggestions = ['피자는 칼로리가 높으니 적당히 섭취하세요.', '채소를 추가하여 영양 균형을 맞추세요.'];
  } else if (lowerFileName.includes('salad')) {
    foodName = '샐러드';
    calories = 250;
    nutrients = { protein: 15, carbs: 20, fat: 10, sodium: 300 };
    suggestions = ['신선한 채소와 단백질이 풍부한 샐러드입니다.', '드레싱 양을 조절하여 칼로리를 낮출 수 있습니다.'];
  } else if (lowerFileName.includes('burger')) {
    foodName = '햄버거';
    calories = 600;
    nutrients = { protein: 25, carbs: 50, fat: 35, sodium: 1000 };
    suggestions = ['햄버거는 지방 함량이 높을 수 있습니다.', '탄산음료 대신 물을 마시는 것이 좋습니다.'];
  } else if (lowerFileName.includes('rice')) {
    foodName = '밥';
    calories = 300;
    nutrients = { protein: 5, carbs: 60, fat: 1, sodium: 5 };
    suggestions = ['탄수화물 섭취의 좋은 원천입니다.', '다양한 반찬과 함께 균형 잡힌 식사를 하세요.'];
  } else if (lowerFileName.includes('chicken')) {
    foodName = '치킨';
    calories = 700;
    nutrients = { protein: 40, carbs: 30, fat: 50, sodium: 1200 };
    suggestions = ['단백질이 풍부하지만 튀긴 치킨은 지방 함량이 높습니다.', '구운 치킨이나 닭가슴살을 선택하는 것이 좋습니다.'];
  } else if (lowerFileName.includes('kimchi')) {
    foodName = '김치찌개';
    calories = 250;
    nutrients = { protein: 12, carbs: 20, fat: 8, sodium: 800 };
    suggestions = ['균형 잡힌 영양소를 포함하고 있습니다.', '적당한 양으로 섭취하시기 바랍니다.', '채소와 함께 드시면 더욱 좋습니다.'];
  }

  return {
    foodName,
    calories,
    nutrients,
    confidence: 0.87, // 임의의 신뢰도
    suggestions
  };
}
