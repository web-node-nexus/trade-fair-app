import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { getApiBase } from "./authFetch";
import { getAccessToken } from "./authStorage";

export async function downloadAndShareAuthenticated(opts: {
  path: string;
  filename: string;
  mimeType?: string;
  dialogTitle?: string;
}): Promise<void> {
  const token = await getAccessToken();
  const url = `${getApiBase()}${opts.path}`;
  const filePath = `${FileSystem.cacheDirectory}${opts.filename}`;
  const result = await FileSystem.downloadAsync(url, filePath, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (result.status !== 200) throw new Error(`Download failed (${result.status})`);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: opts.mimeType ?? "application/octet-stream",
      dialogTitle: opts.dialogTitle ?? "Share file",
    });
  } else {
    Alert.alert("Saved", `File saved to ${result.uri}`);
  }
}

export async function shareTextAsFile(content: string, filename: string): Promise<void> {
  const filePath = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(filePath, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, { mimeType: "text/csv", dialogTitle: "Share CSV" });
  } else {
    Alert.alert("Saved", `File saved to ${filePath}`);
  }
}
