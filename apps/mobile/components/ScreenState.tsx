import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry">
          <Text style={styles.link}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Skeleton() {
  return (
    <View style={styles.block}>
      <View style={styles.bar} />
      <View style={[styles.bar, { width: "70%" }]} />
      <View style={[styles.bar, { width: "40%" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 24 },
  title: { fontFamily: "Newsreader_500Medium", fontSize: 28, color: theme.color.navy },
  body: { marginTop: 12, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  link: { marginTop: 16, color: theme.color.navy, fontFamily: "Inter_500Medium" },
  bar: { height: 14, backgroundColor: theme.color.hairline, marginBottom: 12 },
});
