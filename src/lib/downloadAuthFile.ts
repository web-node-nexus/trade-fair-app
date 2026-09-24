import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { getApiBase } from "@/lib/authFetch";
import { getAccessToken } from "@/lib/authStorage";

export async function downloadAuthenticatedFile(
  path: string,
  filename: string,
  mimeType = "text/csv"
): Promise<void> {
  const token = await getAccessToken();
  const url = `${getApiBase()}${path}`;
  const localPath = `${FileSystem.cacheDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(url, localPath, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (result.status !== 200) throw new Error(`Download failed (${result.status})`);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType, dialogTitle: "Share file" });
  } else {
    Alert.alert("Saved", `File saved to ${result.uri}`);
  }
}
