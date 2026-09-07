import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, assetUrl } from "../../../lib/api";
import { theme } from "../../../lib/theme";

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    url?: string;
    category?: string;
    offeringId?: string;
    documentId?: string;
  }>();
  const [body, setBody] = useState("Loading…");
  const title = params.title ?? "Document";
  const href = assetUrl(params.url);
  const isPdf = (params.url ?? "").toLowerCase().endsWith(".pdf");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (params.offeringId && params.documentId) {
        try {
          const doc = await api<{ body: string; contentType?: string }>(
            `/offerings/${params.offeringId}/documents/${params.documentId}`,
          );
          if (!cancelled && doc.body && !doc.body.includes("could not be loaded from disk")) {
            setBody(doc.body);
            return;
          }
        } catch {
          // Fall through to the static asset.
        }
      }
      if (!href) {
        if (!cancelled) {
          setBody("This illustrative document is not available.");
        }
        return;
      }
      if (isPdf) {
        if (!cancelled) {
          setBody("This diligence PDF is illustrative. Open it to download or view the file.");
        }
        return;
      }
      try {
        const response = await fetch(href);
        const text = await response.text();
        if (!cancelled) {
          setBody(text || "This illustrative document is empty.");
        }
      } catch {
        if (!cancelled) {
          setBody("Unable to load this document. Try again from a signed-in session.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [href, isPdf, params.documentId, params.offeringId, params.url]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.link}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>{params.category ?? "Diligence"}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {href ? (
        <Pressable
          style={styles.button}
          accessibilityRole="link"
          accessibilityLabel={isPdf ? "Open PDF" : "Open original file"}
          onPress={() => Linking.openURL(href)}
        >
          <Text style={styles.buttonText}>{isPdf ? "Open PDF" : "Open original file"}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.fine}>Illustrative / fictional. This is not an offering of securities.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper },
  content: { padding: 28, paddingTop: 64, paddingBottom: 64 },
  link: { color: theme.color.navy, fontFamily: "Inter_500Medium" },
  kicker: {
    marginTop: 24,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  title: { marginTop: 12, fontSize: 32, lineHeight: 38, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  body: {
    marginTop: 20,
    fontSize: 16,
    lineHeight: 26,
    color: theme.color.navyMuted,
    fontFamily: "Inter_400Regular",
  },
  fine: { marginTop: 24, fontSize: 13, lineHeight: 20, color: theme.color.muted, fontFamily: "Inter_400Regular" },
  button: { marginTop: 24, backgroundColor: theme.color.navy, padding: 16, alignItems: "center" },
  buttonText: { color: theme.color.white, fontFamily: "Inter_500Medium" },
});
