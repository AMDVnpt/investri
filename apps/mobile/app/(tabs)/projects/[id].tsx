import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, assetUrl } from "../../../lib/api";
import { theme } from "../../../lib/theme";

type Detail = {
  name: string;
  municipality: string;
  status: string;
  description: string;
  useOfCapital: string | null;
  amountDeployed: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  imageAlt: string | null;
  milestones: { id: string; title: string; body: string }[];
  latestMilestone: { title: string } | null;
  capitalStack: { label: string; amount: string }[] | null;
  metrics: { id: string; label: string; value: string; verificationStatus: string; source: string; period: string }[];
  offerings: { id: string; name: string }[];
};

function whole(value?: string) {
  return Number((value ?? "0").split(".")[0]).toLocaleString("en-US");
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<Detail | null>(null);

  useEffect(() => {
    if (id) {
      api<Detail>(`/projects/${id}`).then(setRow).catch(() => setRow(null));
    }
  }, [id]);

  if (!row) {
    return (
      <View style={styles.screen}>
        <Text style={styles.body}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>{row.municipality} · {row.status}</Text>
      <Text style={styles.title}>{row.name}</Text>
      <Text style={styles.body}>{row.description}</Text>
      <View style={styles.pair}>
        <Image source={{ uri: assetUrl(row.beforeImageUrl) }} style={styles.photo} accessibilityLabel={row.imageAlt ?? "Before"} />
        <Image source={{ uri: assetUrl(row.afterImageUrl) }} style={styles.photo} accessibilityLabel="After, illustrative pair" />
      </View>
      <Text style={styles.body}>Use of capital: {row.useOfCapital}</Text>
      <Text style={styles.body}>Deployed ${whole(row.amountDeployed)}</Text>
      {row.capitalStack?.map((item) => (
        <Text key={item.label} style={styles.body}>
          {item.label}: ${whole(item.amount)}
        </Text>
      ))}
      <Text style={styles.kicker}>Milestones</Text>
      {row.milestones.map((item) => (
        <Text key={item.id} style={styles.body}>
          {item.title} — {item.body}
        </Text>
      ))}
      <Text style={styles.kicker}>Metrics</Text>
      {row.metrics.map((metric) => (
        <Text key={metric.id} style={styles.body}>
          {metric.label}: {whole(metric.value)} · {metric.verificationStatus.replace(/_/g, " ")} · {metric.source} ·{" "}
          {metric.period}
        </Text>
      ))}
      {row.offerings.map((offering) => (
        <Pressable key={offering.id} onPress={() => router.push(`/offerings/${offering.id}`)}>
          <Text style={styles.link}>{offering.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper, padding: 28, paddingTop: 64 },
  kicker: { letterSpacing: 1.4, textTransform: "uppercase", fontSize: 11, color: theme.color.muted, fontFamily: "Inter_500Medium", marginTop: 20 },
  title: { marginTop: 12, fontSize: 32, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  body: { marginTop: 12, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  link: { color: theme.color.navy, fontFamily: "Inter_500Medium", marginTop: 16 },
  pair: { flexDirection: "row", gap: 8, marginTop: 16 },
  photo: { flex: 1, height: 140, backgroundColor: theme.color.navy },
});
