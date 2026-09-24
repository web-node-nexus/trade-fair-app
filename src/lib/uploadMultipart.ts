import { getAccessToken } from "./authStorage";
import { getApiBase } from "./authFetch";

export async function uploadMultipart(
  path: string,
  fields: Record<string, string>,
  file: { uri: string; name: string; type: string },
  fileField = "file"
): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  form.append(fileField, file as unknown as Blob);
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { message?: string };
  if (!res.ok) throw new Error(String(data.message ?? `Upload failed (${res.status})`));
  return data;
}
