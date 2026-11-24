// In-memory Admin Bearer token store (never persisted to localStorage or sessionStorage)
let adminBearerToken: string | null = null;

export function setAdminToken(token: string | null): void {
  adminBearerToken = token && token.trim() ? token.trim() : null;
}

export function getAdminToken(): string | null {
  return adminBearerToken;
}

export function hasAdminToken(): boolean {
  return Boolean(adminBearerToken);
}

export function getAdminAuthHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {};
  if (extra) {
    if (extra instanceof Headers) {
      extra.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(extra)) {
      for (const [k, v] of extra) headers[k] = v;
    } else {
      Object.assign(headers, extra);
    }
  }
  if (adminBearerToken) {
    headers["Authorization"] = `Bearer ${adminBearerToken}`;
  }
  return headers;
}

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: getAdminAuthHeaders(init?.headers)
  });
  if (res.status === 401 && adminBearerToken) {
    adminBearerToken = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yoouz-admin-unauthorized"));
    }
  }
  return res;
}

