const API = process.env.NEXT_PUBLIC_API_URL ?? (process.env.VERCEL ? "" : "http://localhost:3001");
const ACCESS_KEY = "investri_admin_access";

function readAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(ACCESS_KEY);
}

export function storeAccessToken(token: string) {
  window.sessionStorage.setItem(ACCESS_KEY, token);
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(ACCESS_KEY);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = readAccessToken();
  const response = await fetch(`${API}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "web",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Request failed");
  }
  return data as T;
}

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
};
