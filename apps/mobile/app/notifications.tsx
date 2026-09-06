import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/api";
import { theme } from "../lib/theme";
import { EmptyState, ErrorState, Skeleton } from "../components/ScreenState";

type Row = {
  id: string;
  type: string;
  title: string;
  body: string;
  entityId: string | null;
  readAt: string | null;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await api<Row[]>("/notifications"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.link}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>Inbox</Text>
      <Text style={styles.title}>Notifications</Text>
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!rows && !error ? <Skeleton /> : null}
      {rows && rows.length === 0 ? (
        <EmptyState title="No notifications" body="Settlement, statements, and tax-credit notices will appear here." />
      ) : null}
      {rows?.map((row) => (
        <Pressable
          key={row.id}
          onPress={async () => {
            await api(`/notifications/${row.id}/read`, { method: "POST" }).catch(() => undefined);
            if (row.type === "tax_credit_certified") {
              router.push("/tax-credits");
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={row.title}
        >
          <Text style={styles.cardTitle}>{row.title}</Text>
          <Text style={styles.body}>{row.body}</Text>
          <Text style={styles.meta}>{row.readAt ? "Read" : "Unread"}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper, padding: 28, paddingTop: 64 },
  kicker: { letterSpacing: 1.4, textTransform: "uppercase", fontSize: 11, color: theme.color.muted, fontFamily: "Inter_500Medium" },
  title: { marginTop: 12, fontSize: 32, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  body: { marginTop: 8, lineHeight: 22, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  meta: { marginTop: 6, fontSize: 12, color: theme.color.muted, fontFamily: "Inter_500Medium" },
  cardTitle: { marginTop: 24, fontFamily: "Newsreader_500Medium", fontSize: 22, color: theme.color.navy },
  link: { color: theme.color.navy, fontFamily: "Inter_500Medium", marginBottom: 16 },
});
