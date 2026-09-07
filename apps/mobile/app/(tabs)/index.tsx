import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { api, session } from "../../lib/api";
import { theme } from "../../lib/theme";
import { Wordmark } from "../../components/Wordmark";
import { WelcomeHero } from "../../components/WelcomeHero";

type PortfolioSummary = {
  empty: boolean;
  totals: {
    currentValue: string;
    totalContributions: string;
    totalDistributions: string;
  };
  taxCredit: {
    potentialCredit: string;
    certifiedPreview: string;
    buckets?: { estimated: string; certified: string };
    copy: string;
  };
  impact: { projectsSupported: number; dollarsInRi: string };
  featuredOffering: { id: string; name: string } | null;
  activity: { id: string; title: string; body: string | null }[];
  latestUpdate: { title: string; body: string } | null;
};

function usd(value?: string) {
  const whole = (value ?? "0").split(".")[0];
  return `$${Number(whole).toLocaleString("en-US")}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      if (!(await session.getAccess())) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      try {
        setPortfolio(await api<PortfolioSummary>("/portfolio"));
        const notes = await api<{ readAt: string | null }[]>("/notifications");
        setUnread(notes.filter((row) => !row.readAt).length);
      } catch {
        setPortfolio(null);
      }
    })();
  }, []);

  if (signedIn !== true) {
    if (signedIn === false) {
      return <WelcomeHero />;
    }
    return <View style={styles.boot} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Wordmark />
      <Pressable onPress={() => router.push("/notifications")} accessibilityRole="button" accessibilityLabel={`Notifications, ${unread} unread`}>
        <Text style={styles.link}>Inbox{unread ? ` · ${unread}` : ""}</Text>
      </Pressable>
      <Text style={styles.kicker}>Home</Text>
      <Text style={styles.title}>
        {portfolio && !portfolio.empty ? usd(portfolio.totals.currentValue) : "Your Rhode Island stake"}
      </Text>
      {portfolio && !portfolio.empty ? (
        <>
          <Text style={styles.meta}>
            Invested {usd(portfolio.totals.totalContributions)} · Distributions{" "}
            {usd(portfolio.totals.totalDistributions)}
          </Text>
          <View style={styles.card}>
            <Text style={styles.kicker}>Tax credit</Text>
            <Text style={styles.cardTitle}>
              Estimated {usd(portfolio.taxCredit.buckets?.estimated ?? portfolio.taxCredit.potentialCredit)} ·
              Certified {usd(portfolio.taxCredit.buckets?.certified ?? portfolio.taxCredit.certifiedPreview)}
            </Text>
            <Text style={styles.body}>{portfolio.taxCredit.copy}</Text>
            <Pressable onPress={() => router.push("/tax-credits")}>
              <Text style={styles.link}>Tax Center</Text>
            </Pressable>
          </View>
          {portfolio.featuredOffering ? (
            <Pressable onPress={() => router.push(`/offerings/${portfolio.featuredOffering!.id}`)}>
              <Text style={styles.link}>{portfolio.featuredOffering.name}</Text>
            </Pressable>
          ) : null}
          <Text style={styles.kicker}>Recent activity</Text>
          {portfolio.activity.slice(0, 3).map((item) => (
            <Text key={item.id} style={styles.body}>
              {item.title}
            </Text>
          ))}
          <Pressable onPress={() => router.push("/(tabs)/impact")}>
            <Text style={styles.link}>
              Your Rhode Island impact · {portfolio.impact.projectsSupported} projects
            </Text>
          </Pressable>
          {portfolio.latestUpdate ? (
            <Text style={styles.body}>{portfolio.latestUpdate.title}</Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.body}>
            Browse a professionally managed, illustrative offering. Investment economics and any proposed
            state tax incentive are always shown separately.
          </Text>
          <Link href="/(tabs)/invest" style={styles.link}>
            View investments
          </Link>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: theme.color.navy },
  screen: { flex: 1, backgroundColor: theme.color.paper },
  content: { padding: 28, paddingTop: 72, paddingBottom: 64 },
  kicker: {
    marginTop: 28,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  title: {
    marginTop: 12,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
  },
  meta: { marginTop: 8, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  body: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 26,
    color: theme.color.navyMuted,
    fontFamily: "Inter_400Regular",
  },
  card: {
    marginTop: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 22,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
  },
  link: {
    marginTop: 20,
    fontFamily: "Inter_500Medium",
    color: theme.color.navy,
    textDecorationLine: "underline",
  },
});
