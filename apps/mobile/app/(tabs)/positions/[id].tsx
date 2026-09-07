import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../../lib/api";
import { theme } from "../../../lib/theme";
import { DocumentRow } from "../../../components/DocumentRow";
import { ValueChart } from "../../../components/ValueChart";
import { signedUsd, usd } from "../../../lib/format";

type PositionDetail = {
  offeringId: string;
  offeringName: string;
  settledAmount: string;
  currentValue: string;
  totals: {
    unrealizedGainLoss: string;
    totalDistributions: string;
    realizedGainLoss?: string;
    totalReturn?: string;
  };
  taxCredit: {
    entitlementId?: string | null;
    potentialCredit: string;
    certifiedPreview: string;
    buckets?: { estimated: string; earned: string; certified: string; available: string; claimed: string };
    copy: string;
  };
  documents: { id: string; title: string; category?: string; url?: string }[];
  activity: { id: string; title: string }[];
  latestUpdate: { title: string } | null;
  distributions: { id: string; amount: string; paidAt: string; periodLabel: string }[];
  valueSeries: { asOf: string; value: string }[];
};

export default function PositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [position, setPosition] = useState<PositionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<PositionDetail>(`/portfolio/positions/${id}`)
      .then(setPosition)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error || !position) {
    return (
      <View style={styles.screen}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.body}>{error ?? "Loading…"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>Position</Text>
      <Text style={styles.title}>{position.offeringName}</Text>
      <Text style={styles.body}>
        Value {usd(position.currentValue)} · Invested {usd(position.settledAmount)} · Unrealized{" "}
        {signedUsd(position.totals.unrealizedGainLoss)}
      </Text>
      <Text style={styles.body}>
        Distributions {usd(position.totals.totalDistributions)}
        {position.totals.totalReturn ? ` · Total return ${signedUsd(position.totals.totalReturn)}` : ""}
      </Text>
      <Text style={styles.kicker}>Value over time</Text>
      <ValueChart series={position.valueSeries ?? []} />
      <Text style={styles.kicker}>Distributions</Text>
      {position.distributions?.length ? (
        position.distributions.map((row) => (
          <Text key={row.id} style={styles.body}>
            {usd(row.amount)} · {row.periodLabel} · {new Date(row.paidAt).toLocaleDateString()}
          </Text>
        ))
      ) : (
        <Text style={styles.body}>No distributions posted yet.</Text>
      )}
      <View style={styles.card}>
        <Text style={styles.kicker}>Tax credit</Text>
        <Text style={styles.body}>
          Estimated {usd(position.taxCredit.buckets?.estimated ?? position.taxCredit.potentialCredit)} ·
          Earned {usd(position.taxCredit.buckets?.earned)} · Certified{" "}
          {usd(position.taxCredit.buckets?.certified ?? position.taxCredit.certifiedPreview)}
        </Text>
        <Text style={styles.body}>
          Available to claim {usd(position.taxCredit.buckets?.available)} · Claimed{" "}
          {usd(position.taxCredit.buckets?.claimed)}
        </Text>
        <Text style={styles.body}>{position.taxCredit.copy}</Text>
        {position.taxCredit.entitlementId ? (
          <Pressable onPress={() => router.push(`/tax-credits/${position.taxCredit.entitlementId}`)}>
            <Text style={styles.link}>Open Tax Center</Text>
          </Pressable>
        ) : null}
      </View>
      {position.latestUpdate ? <Text style={styles.body}>{position.latestUpdate.title}</Text> : null}
      <Text style={styles.kicker}>Documents</Text>
      {position.documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          title={doc.title}
          category={doc.category}
          url={doc.url}
          offeringId={position.offeringId}
          documentId={doc.id}
        />
      ))}
      <Text style={styles.kicker}>Activity</Text>
      {position.activity.map((item) => (
        <Text key={item.id} style={styles.body}>
          {item.title}
        </Text>
      ))}
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
  body: { marginTop: 12, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  card: {
    marginTop: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
  },
  link: { color: theme.color.navy, fontFamily: "Inter_500Medium" },
});
