import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, API_URL, session } from "../../lib/api";
import { theme } from "../../lib/theme";

type Detail = {
  offeringName: string;
  status: string;
  copy: string;
  buckets: { estimated: string; earned: string; certified: string; available: string; claimed: string };
  vesting: { yearIndex: number; amount: string; vestsOn: string; status: string }[];
  certificates: { number: string; taxYear: number }[];
  nextVestingDate: string | null;
};

function usd(value?: string) {
  return `$${(value ?? "0").split(".")[0]}`;
}

export default function TaxCreditDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<Detail | null>(null);

  useEffect(() => {
    if (id) {
      api<Detail>(`/tax-credits/${id}`).then(setRow).catch(() => setRow(null));
    }
  }, [id]);

  if (!row) {
    return (
      <ScrollView style={styles.screen}>
        <Text style={styles.body}>Loading…</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>Proposed tax credit</Text>
      <Text style={styles.title}>{row.offeringName}</Text>
      <Text style={styles.body}>{row.copy}</Text>
      <Text style={styles.body}>Estimated {usd(row.buckets.estimated)}</Text>
      <Text style={styles.body}>Earned {usd(row.buckets.earned)}</Text>
      <Text style={styles.body}>Certified {usd(row.buckets.certified)}</Text>
      <Text style={styles.body}>Available to claim {usd(row.buckets.available)}</Text>
      <Text style={styles.body}>Claimed {usd(row.buckets.claimed)}</Text>
      {row.nextVestingDate ? <Text style={styles.body}>Next vesting {new Date(row.nextVestingDate).toLocaleDateString()}</Text> : null}
      {row.certificates.map((cert) => (
        <Pressable
          key={cert.number}
          onPress={async () => {
            const access = await session.getAccess();
            const response = await fetch(`${API_URL}/api/v1/tax-credits/${id}/certificate`, {
              headers: access ? { Authorization: `Bearer ${access}` } : {},
            });
            const text = await response.text();
            Alert.alert(`Certificate ${cert.number}`, text.slice(0, 280));
          }}
        >
          <Text style={styles.link}>Certificate {cert.number} · {cert.taxYear}</Text>
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
  link: { color: theme.color.navy, fontFamily: "Inter_500Medium", marginBottom: 16 },
});
