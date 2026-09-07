import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../lib/theme";
import { ONBOARDING_STEPS } from "../lib/onboarding";

export function OnboardingChrome({
  title,
  kicker,
  step,
  children,
}: {
  title: string;
  kicker?: string;
  step: number;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.back}>Back</Text>
      </Pressable>
      <Text style={styles.kicker}>{kicker ?? "Investor onboarding"}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.steps} accessibilityRole="summary">
        {ONBOARDING_STEPS.map((label, index) => (
          <View key={label} style={styles.step}>
            <View style={[styles.dot, index <= step ? styles.dotOn : null]} />
            <Text style={[styles.stepLabel, index === step ? styles.stepCurrent : null]}>{label}</Text>
          </View>
        ))}
      </View>
      {children}
    </ScrollView>
  );
}

export const onboardingStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
    padding: 14,
    marginBottom: 12,
    fontFamily: "Inter_400Regular",
    color: theme.color.navy,
  },
  button: { backgroundColor: theme.color.navy, padding: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: theme.color.white, fontFamily: "Inter_500Medium" },
  error: { color: theme.color.risk, marginBottom: 12, fontFamily: "Inter_400Regular" },
  body: { fontSize: 16, lineHeight: 26, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  fine: { marginTop: 12, fontSize: 13, lineHeight: 20, color: theme.color.muted, fontFamily: "Inter_400Regular" },
  sectionKicker: {
    marginTop: 28,
    marginBottom: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  check: {
    borderWidth: 1,
    borderColor: theme.color.hairline,
    padding: 14,
    marginBottom: 12,
    backgroundColor: theme.color.card,
  },
  checkOn: { borderColor: theme.color.navy },
  checkLabel: { fontFamily: "Inter_400Regular", color: theme.color.navy, lineHeight: 22 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper },
  content: { padding: 28, paddingTop: 64, paddingBottom: 64 },
  back: { color: theme.color.muted, fontFamily: "Inter_500Medium", marginBottom: 24 },
  kicker: {
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  title: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 32,
    lineHeight: 38,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
  },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  step: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.color.hairlineStrong,
    backgroundColor: "transparent",
  },
  dotOn: { backgroundColor: theme.color.navy, borderColor: theme.color.navy },
  stepLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  stepCurrent: { color: theme.color.navy },
});
