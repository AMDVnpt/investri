import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { theme } from "../../lib/theme";

type Credit = {
  id: string;
  offeringName: string;
  status: string;
  proposed: boolean;
  buckets: { estimated: string; certified: string; available: string; claimed: string; earned: string };
  copy: string;
};

function usd(value?: string) {
  return `$${(value ?? "0").split(".")[0]}`;
}

export default function TaxCenterScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Credit[]>([]);

  useEffect(() => {
    api<Credit[]>("/tax-credits").then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>Tax Center</Text>
      <Text style={styles.title}>Rhode Island tax credits</Text>
      <Text style={styles.body}>Proposed program. Credits are not cash and are not received until certified.</Text>
      {rows.map((row) => (
        <Pressable key={row.id} onPress={() => router.push(`/tax-credits/${row.id}`)} style={styles.card}>
          <Text style={styles.cardTitle}>{row.offeringName}</Text>
          <Text style={styles.body}>
            Status: {row.status.replace(/_/g, " ")} · Estimated {usd(row.buckets.estimated)} · Certified{" "}
            {usd(row.buckets.certified)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper, padding: 28, paddingTop: 64 },
  kicker: { letterSpacing: 1.4, textTransform: "uppercase", fontSize: 11, color: theme.color.muted, fontFamily: "Inter_500Medium" },
  title: { marginTop: 12, fontSize: 32, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  body: { marginTop: 12, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  card: { marginTop: 20, padding: 20, borderWidth: 1, borderColor: theme.color.hairline, backgroundColor: theme.color.card },
  cardTitle: { fontFamily: "Newsreader_500Medium", fontSize: 22, color: theme.color.navy },
  link: { color: theme.color.navy, fontFamily: "Inter_500Medium", marginBottom: 16 },
});
