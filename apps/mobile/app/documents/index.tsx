import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { theme } from "../../lib/theme";

type Doc = { id: string; title: string; category: string; taxYear: number | null };

export default function DocumentsScreen() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [category, setCategory] = useState<string | undefined>();

  useEffect(() => {
    const query = category ? `?category=${category}` : "";
    api<Doc[]>(`/documents${query}`).then(setDocs).catch(() => setDocs([]));
  }, [category]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>Statements</Text>
      <Text style={styles.title}>Document center</Text>
      <View style={styles.row}>
        {["STATEMENT", "FEDERAL_TAX", "OFFERING", "LEGAL_NOTICE"].map((key) => (
          <Pressable key={key} onPress={() => setCategory(key)}>
            <Text style={styles.filter}>{key.replace("_", " ")}</Text>
          </Pressable>
        ))}
      </View>
      {docs.map((doc) => (
        <Text key={doc.id} style={styles.body}>
          {doc.title}
          {doc.taxYear ? ` · ${doc.taxYear}` : ""}
        </Text>
      ))}
      <Text style={styles.body}>Rhode Island tax-credit certificate — Available after Commerce certification.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper, padding: 28, paddingTop: 64 },
  kicker: {
    marginTop: 24,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  title: { marginTop: 12, fontSize: 32, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  filter: { color: theme.color.navy, fontFamily: "Inter_500Medium", fontSize: 12 },
  body: { marginTop: 16, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  link: { color: theme.color.navy, fontFamily: "Inter_500Medium" },
});
