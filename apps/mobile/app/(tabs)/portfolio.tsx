import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api, session } from "../../lib/api";
import { theme } from "../../lib/theme";
import { AllocationChart } from "../../components/AllocationChart";
import { ValueChart } from "../../components/ValueChart";
import { pct, signedUsd, usd } from "../../lib/format";

type PortfolioSummary = {
  empty: boolean;
  totals: {
    currentValue: string;
    totalContributions: string;
    totalDistributions: string;
    unrealizedGainLoss: string;
    realizedGainLoss: string;
    totalReturn: string;
    totalReturnPercent: string;
  };
  valueSeries: { asOf: string; value: string }[];
  distributions: {
    id: string;
    offeringName: string;
    amount: string;
    paidAt: string;
    periodLabel: string;
    positionId: string;
  }[];
  allocations: { key: string; label: string; percentage: string }[];
  positions: {
    id: string;
    offeringName: string;
    currentValue: string;
    settledAmount: string;
    totalDistributions: string;
  }[];
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export default function PortfolioScreen() {
  const router = useRouter();
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      if (!(await session.getAccess())) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      try {
        setData(await api<PortfolioSummary>("/portfolio"));
      } catch {
        setData(null);
      }
    })();
  }, []);

  if (signedIn === false) {
    return (
      <View style={styles.screen}>
        <Text style={styles.kicker}>Portfolio</Text>
        <Text style={styles.title}>Your positions</Text>
        <Text style={styles.body}>
          Sign in to see invested amount, current value, returns, and distributions. Tax credits stay in Tax
          Center — they are not part of performance.
        </Text>
        <Pressable onPress={() => router.push("/sign-in?returnTo=/(tabs)/portfolio")}>
          <Text style={styles.link}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (!data || data.empty) {
    return (
      <View style={styles.screen}>
        <Text style={styles.kicker}>Portfolio</Text>
        <Text style={styles.title}>No positions yet</Text>
        <Text style={styles.body}>
          When an investment settles, value and distributions will appear here. Tax credits stay off the
          performance chart.
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/invest")}>
          <Text style={styles.link}>Browse investments</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Text style={styles.kicker}>Your portfolio</Text>
      <Text style={styles.title}>{usd(data.totals.currentValue)}</Text>
      <Text style={styles.meta}>Current value · investment performance only</Text>

      <View style={styles.grid}>
        <Stat label="Invested" value={usd(data.totals.totalContributions)} />
        <Stat label="Current value" value={usd(data.totals.currentValue)} />
        <Stat
          label="Total return"
          value={signedUsd(data.totals.totalReturn)}
          hint={`${pct(data.totals.totalReturnPercent)} incl. distributions`}
        />
        <Stat label="Distributions" value={usd(data.totals.totalDistributions)} hint="Cash received" />
      </View>
      <Text style={styles.body}>
        Unrealized {signedUsd(data.totals.unrealizedGainLoss)} · Realized from distributions{" "}
        {signedUsd(data.totals.realizedGainLoss)}. Proposed tax credits are not included.
      </Text>

      <Text style={styles.kicker}>Value over time</Text>
      <ValueChart series={data.valueSeries} />

      <Text style={styles.kicker}>Distributions</Text>
      {data.distributions.length === 0 ? (
        <Text style={styles.body}>No distributions yet. They will appear here when paid.</Text>
      ) : (
        data.distributions.map((row) => (
          <Pressable key={row.id} onPress={() => router.push(`/positions/${row.positionId}`)}>
            <Text style={styles.rowTitle}>
              {usd(row.amount)} · {row.periodLabel}
            </Text>
            <Text style={styles.body}>
              {row.offeringName} · {new Date(row.paidAt).toLocaleDateString()}
            </Text>
          </Pressable>
        ))
      )}

      {data.allocations.length ? (
        <>
          <Text style={styles.kicker}>Allocation</Text>
          <AllocationChart allocations={data.allocations} />
        </>
      ) : null}

      <Text style={styles.kicker}>Positions</Text>
      {data.positions.map((position) => (
        <Pressable key={position.id} onPress={() => router.push(`/positions/${position.id}`)} style={styles.card}>
          <Text style={styles.rowTitle}>{position.offeringName}</Text>
          <Text style={styles.body}>
            Value {usd(position.currentValue)} · Invested {usd(position.settledAmount)} · Distributed{" "}
            {usd(position.totalDistributions)}
          </Text>
        </Pressable>
      ))}

      <Pressable onPress={() => router.push("/tax-credits")}>
        <Text style={styles.link}>Tax Center — credits are tracked separately</Text>
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
  meta: { marginTop: 8, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  body: { marginTop: 12, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  link: { marginTop: 20, color: theme.color.navy, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  stat: {
    width: "47%",
    padding: 16,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
  },
  statLabel: {
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  statValue: { marginTop: 8, fontSize: 22, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  statHint: { marginTop: 6, fontSize: 12, color: theme.color.muted, fontFamily: "Inter_400Regular" },
  rowTitle: { marginTop: 16, fontFamily: "Inter_500Medium", color: theme.color.navy, fontSize: 16 },
  card: {
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
  },
});
