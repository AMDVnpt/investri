const API = process.env.NEXT_PUBLIC_API_URL ?? (process.env.VERCEL ? "" : "http://localhost:3001");

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Client": "web",
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
