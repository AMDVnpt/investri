import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { OfferingCard } from "../../components/OfferingCard";
import { theme } from "../../lib/theme";
import type { OfferingCard as Offering } from "../../lib/types";

export default function InvestScreen() {
  const router = useRouter();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Offering[]>("/offerings")
      .then(setOfferings)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Marketplace</Text>
      <Text style={styles.title}>Invest</Text>
      <Text style={styles.body}>
        One illustrative product in this proof of concept. Terms are configurable and not legal facts.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {offerings.map((offering) => (
        <View key={offering.id} style={styles.card}>
          <OfferingCard
            offering={offering}
            onPress={() => router.push(`/offerings/${offering.slug}`)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper },
  content: { paddingBottom: 48 },
  kicker: {
    marginTop: 72,
    marginHorizontal: 24,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  title: {
    marginHorizontal: 24,
    marginTop: 8,
    fontSize: 40,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
  },
  body: {
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 28,
    color: theme.color.navyMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.color.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.color.hairline,
  },
  error: { marginHorizontal: 24, color: theme.color.risk },
});
