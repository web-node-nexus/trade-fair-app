const LIVE_API_BASE = "https://tradefairwala.com/api/v1";

function isNonPublicHost(url: string): boolean {
  return /localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+/i.test(
    url
  );
}

/** Ensure production/dev bases resolve to `/api/v1` (Express mounts routes there). */
export function normalizeApiBase(base: string): string {
  const trimmed = base.trim().replace(/\/$/, "");
  if (!trimmed) return LIVE_API_BASE;
  // Release / client APK must never hit LAN or localhost
  if (isNonPublicHost(trimmed)) return LIVE_API_BASE;
  if (trimmed.endsWith("/api/v1")) return trimmed;
  if (trimmed.endsWith("/api")) return `${trimmed}/v1`;
  return trimmed;
}

export function getResolvedApiBase(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? LIVE_API_BASE;
  return normalizeApiBase(raw);
}
