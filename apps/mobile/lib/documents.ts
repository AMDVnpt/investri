import { Linking } from "react-native";
import { assetUrl } from "./api";

export async function openDocument(url?: string | null) {
  const href = assetUrl(url);
  if (!href) {
    return;
  }
  await Linking.openURL(href);
}
