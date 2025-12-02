// 배포 및 개발 환경 설정을 위한 유틸리티
// 기존에 "/api/v1"이 기본값이었으나, 이중 중복(/api/v1/api/v1) 문제를 막기 위해
// 기본값을 빈 문자열로 변경합니다.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function apiFetch(
  path: string,
  options: RequestInit = {},
  opts?: { includeCredentials?: boolean }
) {
  let url = path;

  // http로 시작하면 그대로 사용 (외부 링크 등)
  if (path.startsWith("http")) {
    url = path;
  } else {
    // 1. API_BASE_URL (예: "http://localhost:8000" 또는 "")
    let base = API_BASE_URL;
    
    // 2. path가 '/api/v1'을 이미 포함하고 있는지 체크
    const pathHasPrefix = path.startsWith("/api/v1") || path.startsWith("api/v1");
    // 3. base URL 자체에 '/api/v1'이 포함되어 있는지 체크
    const baseHasPrefix = base.endsWith("/api/v1") || base.endsWith("/api/v1/");

    // "접두어가 둘 다 없을 때만" 자동으로 /api/v1을 붙여줌
    if (!pathHasPrefix && !baseHasPrefix) {
        // 슬래시 정리
        const separator = (base && !base.endsWith("/")) ? "/" : "";
        const cleanPath = path.startsWith("/") ? path.slice(1) : path;
        
        // 예: "" + "/api/v1/" + "auth/login"  -> "/api/v1/auth/login"
        // 예: "http://localhost:8000" + "/" + "api/v1/" + "auth/login"
        url = `${base}${separator}api/v1/${cleanPath}`;
    } else {
        // 이미 prefix가 있거나 base에 포함된 경우 단순 결합
        const separator = (base && !base.endsWith("/") && !path.startsWith("/")) ? "/" : "";
        url = `${base}${separator}${path}`;
    }
  }
    
  const includeCredentials = opts?.includeCredentials ?? true;
  
  return fetch(url, {
    credentials: includeCredentials ? "include" : options.credentials,
    ...options,
  });
}