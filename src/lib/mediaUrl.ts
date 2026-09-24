import { getApiBaseUrl } from "@/api/client";

/** True when the string can load as an image (not a bare hostname like "www.example.com"). */
export function isUsableMediaUrl(url: string | null | undefined): boolean {
  const t = String(url ?? "").trim();
  if (!t) return false;
  if (/^data:image\//i.test(t)) return true;
  if (/^(file|content|ph|assets-library):/i.test(t)) return true;
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      return Boolean(u.hostname) && (u.pathname.length > 1 || Boolean(u.search));
    } catch {
      return false;
    }
  }
  if (t.startsWith("/") && t.length > 1) return true;
  // Relative storage keys e.g. uploads/profiles/...
  if (/^uploads\//i.test(t) || /^profiles\//i.test(t)) return true;
  return false;
}

/** Resolve relative upload paths from the API to absolute URLs for Image components. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!isUsableMediaUrl(url)) return null;
  const u = url!.trim();
  if (
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("data:") ||
    /^(file|content|ph|assets-library):/i.test(u)
  ) {
    return u;
  }
  const base = getApiBaseUrl().replace(/\/api(\/v1)?\/?$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

/** First usable cover among cover + gallery URLs. */
export function resolveEventCoverUrl(
  coverImageUrl?: string | null,
  imageUrls?: Array<string | null | undefined> | null
): string | null {
  const candidates = [coverImageUrl, ...(imageUrls ?? [])];
  for (const c of candidates) {
    const resolved = resolveMediaUrl(c);
    if (resolved) return resolved;
  }
  return null;
}
