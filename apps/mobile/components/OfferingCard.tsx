import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "./Badge";
import { FundingBar } from "./FundingBar";
import { theme } from "../lib/theme";
import { assetUrl } from "../lib/api";
import { photoSource } from "../lib/photos";
import type { OfferingCard as OfferingCardType } from "../lib/types";

export function OfferingCard({
  offering,
  onPress,
}: {
  offering: OfferingCardType;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={offering.name}>
      <View style={styles.photoWrap}>
        <Image
          source={photoSource(offering.heroImageUrl) ?? { uri: assetUrl(offering.heroImageUrl) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={offering.heroImageAlt ?? offering.name}
        />
        <LinearGradient
          colors={[theme.color.overlayStart, theme.color.overlayEnd]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.photoCopy}>
          <View style={styles.badges}>
            {offering.residentOnly ? <Badge label="RI residents" /> : null}
            {offering.taxCredit.eligible ? <Badge label="Proposed tax credit" /> : null}
          </View>
          <Text style={styles.category}>{offering.category}</Text>
          <Text style={styles.name}>{offering.name}</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric label="Target return" value={offering.targetReturnLabel ?? "—"} />
        <Metric label="Minimum" value={offering.minInvestmentLabel} />
        <Metric
          label="Term"
          value={offering.targetTermMonths ? `${offering.targetTermMonths / 12} years` : "—"}
        />
      </View>
      <View style={styles.progress}>
        <FundingBar ratio={offering.fundingRatio} />
      </View>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photoWrap: {
    aspectRatio: 4 / 5,
    overflow: "hidden",
    backgroundColor: theme.color.navy,
  },
  photoCopy: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 24,
  },
  badges: { flexDirection: "row", gap: 8, marginBottom: 16 },
  category: {
    color: "rgba(255,255,255,0.78)",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  name: {
    color: theme.color.white,
    fontSize: 34,
    lineHeight: 38,
    marginTop: 8,
    fontFamily: "Newsreader_500Medium",
  },
  metrics: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: theme.color.hairline,
  },
  metric: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderColor: theme.color.hairline,
  },
  metricLabel: {
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  metricValue: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: theme.color.navy,
  },
  progress: { padding: 20 },
});
