import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api, session } from "../../lib/api";
import { theme } from "../../lib/theme";
import { AllocationChart } from "../../components/AllocationChart";

type PortfolioSummary = {
  empty: boolean;
  totals: { currentValue: string; totalContributions: string; totalDistributions: string; unrealizedGainLoss: string };
  valueSeries: { asOf: string; value: string }[];
  cashFlows: { id: string; type: string; amount: string }[];
  allocations: { key: string; label: string; percentage: string }[];
  positions: { id: string; offeringName: string; currentValue: string }[];
};

function usd(value?: string) {
  const whole = (value ?? "0").split(".")[0];
  return `$${Number(whole).toLocaleString("en-US")}`;
}

export default function PortfolioScreen() {
  const router = useRouter();
  const [data, setData] = useState<PortfolioSummary | null>(null);

  useEffect(() => {
    (async () => {
      if (!(await session.getAccess())) {
        return;
      }
      try {
        setData(await api<PortfolioSummary>("/portfolio"));
      } catch {
        setData(null);
      }
    })();
  }, []);

  if (!data || data.empty) {
    return (
      <View style={styles.screen}>
        <Text style={styles.kicker}>Portfolio</Text>
        <Text style={styles.title}>No positions yet</Text>
        <Text style={styles.body}>When an investment settles, value and distributions will appear here. Tax credits stay off the performance chart.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Text style={styles.kicker}>Portfolio</Text>
      <Text style={styles.title}>{usd(data.totals.currentValue)}</Text>
      <Text style={styles.body}>
        Invested {usd(data.totals.totalContributions)} · Distributed {usd(data.totals.totalDistributions)} ·
        Unrealized {usd(data.totals.unrealizedGainLoss)}
      </Text>
      <Text style={styles.kicker}>Value over time</Text>
      {data.valueSeries.map((point) => (
        <Text key={point.asOf} style={styles.body}>
          {new Date(point.asOf).toLocaleDateString()} · {usd(point.value)}
        </Text>
      ))}
      <Text style={styles.kicker}>Cash flows</Text>
      {data.cashFlows.map((flow) => (
        <Text key={flow.id} style={styles.body}>
          {flow.type} · {usd(flow.amount)}
        </Text>
      ))}
      {data.allocations.length ? (
        <>
          <Text style={styles.kicker}>Allocation</Text>
          <AllocationChart allocations={data.allocations} />
        </>
      ) : null}
      <Text style={styles.kicker}>Positions</Text>
      {data.positions.map((position) => (
        <Pressable key={position.id} onPress={() => router.push(`/positions/${position.id}`)}>
          <Text style={styles.link}>
            {position.offeringName} · {usd(position.currentValue)}
          </Text>
        </Pressable>
      ))}
      <Pressable onPress={() => router.push("/tax-credits")}>
        <Text style={styles.link}>Tax Center</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/documents")}>
        <Text style={styles.link}>Statements</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper, padding: 28, paddingTop: 72 },
  kicker: {
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
    marginTop: 24,
  },
  title: { marginTop: 12, fontSize: 34, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  body: { marginTop: 12, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  link: { marginTop: 16, color: theme.color.navy, fontFamily: "Inter_500Medium" },
});
