import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { bundledPhotoUri } from "./photos";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

async function read(key: string) {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string | null) {
  if (Platform.OS === "web") {
    if (value == null) {
      globalThis.localStorage?.removeItem(key);
    } else {
      globalThis.localStorage?.setItem(key, value);
    }
    return;
  }
  if (value == null) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export const session = {
  getAccess: () => read("investri_access"),
  getRefresh: () => read("investri_refresh"),
  setTokens: async (access: string, refresh: string) => {
    await write("investri_access", access);
    await write("investri_refresh", refresh);
  },
  clear: async () => {
    await write("investri_access", null);
    await write("investri_refresh", null);
  },
};

function readApiError(data: unknown, fallback = "Request failed") {
  const raw = (data as { message?: string | string[] } | null)?.message;
  if (Array.isArray(raw)) {
    return raw.filter(Boolean).join(", ") || fallback;
  }
  return raw || fallback;
}

export function isAuthFailure(message: string) {
  return message === "Session expired" || message === "Sign in required" || message === "Unauthorized";
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    const refreshToken = await session.getRefresh();
    if (!refreshToken) {
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!response.ok || !data.accessToken || !data.refreshToken) {
        await session.clear();
        return false;
      }
      await session.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function request(path: string, init?: RequestInit) {
  const access = await session.getAccess();
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const first = await request(path, init);
  if (first.response.ok) {
    return first.data as T;
  }

  const message = readApiError(first.data);
  const canRefresh = first.response.status === 401 && isAuthFailure(message) && !path.startsWith("/auth/");
  if (canRefresh && (await refreshSession())) {
    const retry = await request(path, init);
    if (retry.response.ok) {
      return retry.data as T;
    }
    const retryMessage = readApiError(retry.data);
    if (isAuthFailure(retryMessage)) {
      await session.clear();
    }
    throw new Error(retryMessage);
  }
  if (canRefresh) {
    await session.clear();
  }
  throw new Error(message);
}

export function assetUrl(path?: string | null) {
  if (!path) {
    return undefined;
  }
  if (path.startsWith("http")) {
    return path;
  }
  return bundledPhotoUri(path) ?? `${API_URL}${path}`;
}
