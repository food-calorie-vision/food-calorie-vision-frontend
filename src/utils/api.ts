// 배포 및 개발 환경 모두에서 상대 경로(/api/v1)를 사용하면
// Next.js Rewrites(개발) 또는 Nginx Proxy(배포)가 알아서 백엔드로 연결해줍니다.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export function apiFetch(
  path: string,
  options: RequestInit = {},
  opts?: { includeCredentials?: boolean }
) {
  // path가 이미 http로 시작하면 그대로 사용, 아니면 API_BASE_URL과 결합
  // path가 '/'로 시작하지 않으면 '/' 추가
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    
  const includeCredentials = opts?.includeCredentials ?? true;
  
  return fetch(url, {
    // 상대 경로 사용 시 credentials: 'include'가 없어도 쿠키가 잘 전송되지만,
    // 명시적으로 설정하는 것이 안전합니다.
    credentials: includeCredentials ? "include" : options.credentials,
    ...options,
  });
}