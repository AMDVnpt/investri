import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
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
  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "Request failed");
  }
  return data as T;
}

export function assetUrl(path?: string | null) {
  if (!path) {
    return undefined;
  }
  if (path.startsWith("http")) {
    return path;
  }
  return `${API_URL}${path}`;
}
