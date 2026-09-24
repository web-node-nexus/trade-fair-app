import { clearAuthTokens, getAccessToken, getRefreshToken, persistAuthTokens } from "./authStorage";
import { getResolvedApiBase } from "./apiBase";

const API_BASE = getResolvedApiBase();

export function getApiBase(): string {
  return API_BASE;
}

type JsonErr = { error?: string; message?: string };

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSessionOnce(): Promise<boolean> {
  const rt = await getRefreshToken();
  if (!rt) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          accessToken?: string;
          refreshToken?: string;
        };
        if (!res.ok || !data.accessToken || !data.refreshToken) {
          await clearAuthTokens();
          return false;
        }
        await persistAuthTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function authHeaders(): Promise<Record<string, string>> {
  const t = await getAccessToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

function pickErrorMessage(status: number, data: JsonErr): string {
  return data.message ?? data.error ?? `HTTP ${status}`;
}

export async function apiJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();

  async function mergeHeaders(): Promise<Record<string, string>> {
    const h = { ...(await authHeaders()), ...(init?.headers as Record<string, string>) };
    if (method === "GET" || method === "HEAD") delete h["Content-Type"];
    return h;
  }

  async function doFetch(): Promise<Response> {
    return fetch(url, { ...init, headers: await mergeHeaders() });
  }

  let res = await doFetch();
  if (res.status === 401) {
    const ok = await refreshSessionOnce();
    if (ok) res = await doFetch();
  }

  const data = (await res.json().catch(() => ({}))) as T & JsonErr;
  if (!res.ok) throw new Error(pickErrorMessage(res.status, data));
  return data;
}

export async function publicJson<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const data = (await res.json().catch(() => ({}))) as T & JsonErr;
  if (!res.ok) throw new Error(pickErrorMessage(res.status, data));
  return data;
}
