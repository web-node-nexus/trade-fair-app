import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "tf_access_token";
const REFRESH_KEY = "tf_refresh_token";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function persistAuthTokens(
  accessToken?: string | null,
  refreshToken?: string | null
): Promise<void> {
  if (accessToken) await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function hasAccessToken(): Promise<boolean> {
  const t = await getAccessToken();
  return !!t;
}
