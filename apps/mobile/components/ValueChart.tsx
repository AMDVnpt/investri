import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";
import { usd } from "../lib/format";

export function ValueChart({
  series,
}: {
  series: { asOf: string; value: string }[];
}) {
  if (series.length === 0) {
    return <Text style={styles.empty}>Value history will appear after the first valuation.</Text>;
  }
  const values = series.map((point) => Number(point.value));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);

  return (
    <View>
      <View style={styles.chart} accessibilityRole="image" accessibilityLabel="Investment value over time">
        {series.map((point) => {
          const height = 16 + ((Number(point.value) - min) / range) * 88;
          return (
            <View key={point.asOf} style={styles.col}>
              <View style={[styles.bar, { height }]} />
              <Text style={styles.tick}>
                {new Date(point.asOf).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
              <Text style={styles.tickValue}>{usd(point.value)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.note}>
        Investment value only. Proposed tax credits are excluded from performance.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    minHeight: 148,
    marginTop: 8,
  },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%", backgroundColor: theme.color.navy, minHeight: 8 },
  tick: {
    marginTop: 8,
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  tickValue: {
    marginTop: 2,
    fontSize: 11,
    color: theme.color.navy,
    fontFamily: "Inter_400Regular",
  },
  note: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: theme.color.muted,
    fontFamily: "Inter_400Regular",
  },
  empty: { marginTop: 8, color: theme.color.muted, fontFamily: "Inter_400Regular" },
});
