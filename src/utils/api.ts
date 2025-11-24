export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LOCAL_BASE_URL = "http://localhost:8000";
declare global {
  // eslint-disable-next-line no-var
  var __fcv_api_fetch_patched__: boolean | undefined;
}

if (
  typeof globalThis !== "undefined" &&
  typeof globalThis.fetch === "function" &&
  !globalThis.__fcv_api_fetch_patched__
) {
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.__fcv_api_fetch_patched__ = true;

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let nextInput = input;

    if (typeof input === "string" && input.startsWith(LOCAL_BASE_URL)) {
      nextInput = input.replace(LOCAL_BASE_URL, API_BASE_URL);
    } else if (input instanceof URL && input.href.startsWith(LOCAL_BASE_URL)) {
      nextInput = new URL(input.href.replace(LOCAL_BASE_URL, API_BASE_URL));
    }

    return originalFetch(nextInput as RequestInfo | URL, init);
  };
}

export function apiFetch(
  path: string,
  options: RequestInit = {},
  opts?: { includeCredentials?: boolean }
) {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const includeCredentials = opts?.includeCredentials ?? true;
  return fetch(url, {
    credentials: includeCredentials ? "include" : options.credentials,
    ...options,
  });
}
