import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api, session } from "../../lib/api";
import { theme } from "../../lib/theme";
import type { MeResponse } from "../../lib/types";

function eligibilityLabel(me: MeResponse | null) {
  if (!me) {
    return { text: "Not signed in", color: theme.color.muted };
  }
  if (me.eligibleToInvest) {
    return { text: "Eligible to invest", color: theme.color.green };
  }
  if (me.onboardingStatus?.endsWith("_FAILED")) {
    return { text: me.onboardingStatus.replace(/_/g, " ").toLowerCase(), color: theme.color.risk };
  }
  return { text: "Onboarding in progress", color: theme.color.navy };
}

type Prefs = { pushEnabled: boolean; emailEnabled: boolean; smsEnabled: boolean };
type Disclosure = { key: string; name: string };

export default function ProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);

  useEffect(() => {
    (async () => {
      const access = await session.getAccess();
      if (!access) {
        return;
      }
      try {
        setMe(await api<MeResponse>("/me"));
        setPrefs(await api<Prefs>("/notifications/preferences"));
        const rows = await api<(Disclosure & { versions?: { title: string }[] })[]>("/disclosures");
        setDisclosures(rows);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  const badge = eligibilityLabel(me);

  async function patchPrefs(next: Partial<Prefs>) {
    const updated = await api<Prefs>("/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(next),
    });
    setPrefs(updated);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.title}>{me ? `${me.firstName} ${me.lastName}` : "Account"}</Text>
      <View style={[styles.badge, { borderColor: badge.color }]} accessibilityRole="text">
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
      </View>
      {me ? <Text style={styles.meta}>{me.email}</Text> : (
        <Pressable onPress={() => router.push("/sign-in")}>
          <Text style={styles.link}>Sign in</Text>
        </Pressable>
      )}
      <Pressable onPress={() => router.push("/onboarding")} accessibilityRole="button">
        <Text style={styles.link}>Eligibility</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/tax-credits")} accessibilityRole="button">
        <Text style={styles.link}>Tax Center</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/notifications")} accessibilityRole="button" accessibilityLabel="Notifications">
        <Text style={styles.link}>Notifications</Text>
      </Pressable>
      {prefs ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Notification preferences</Text>
          <Row label="In-app / push" value={prefs.pushEnabled} onChange={(pushEnabled) => patchPrefs({ pushEnabled })} />
          <Row label="Email (mock log)" value={prefs.emailEnabled} onChange={(emailEnabled) => patchPrefs({ emailEnabled })} />
          <Row label="SMS (not sent in POC)" value={prefs.smsEnabled} onChange={(smsEnabled) => patchPrefs({ smsEnabled })} />
          <Text style={styles.meta}>SMS is preference-only. This demonstration never sends text messages.</Text>
        </View>
      ) : null}
      <Text style={styles.kicker}>Disclosures</Text>
      {disclosures.map((item) => (
        <Text key={item.key} style={styles.meta}>
          {item.name}
        </Text>
      ))}
      <Text style={styles.kicker}>Support</Text>
      <Text style={styles.meta}>
        This is a demonstration. For questions about the walkthrough, email the presenter.
      </Text>
      <Pressable onPress={() => Linking.openURL("mailto:hello@demo.investri.ri")} accessibilityRole="link">
        <Text style={styles.link}>Email support</Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await session.clear();
          router.replace("/");
        }}
      >
        <Text style={styles.link}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.meta}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
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
  badge: {
    marginTop: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
  meta: { marginTop: 12, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  link: { marginTop: 28, color: theme.color.navy, fontFamily: "Inter_500Medium" },
  card: { marginTop: 24, padding: 16, borderWidth: 1, borderColor: theme.color.hairline, backgroundColor: theme.color.card },
  row: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
