import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

export function AllocationChart({
  allocations,
}: {
  allocations: { key: string; label: string; percentage: string }[];
}) {
  return (
    <View>
      <View style={styles.bar}>
        {allocations.map((row) => {
          const color =
            theme.allocation.find((item) => item.key === row.key)?.color ?? theme.color.ocean;
          const width = `${Number(row.percentage) * 100}%` as `${number}%`;
          return <View key={row.key} style={{ width, backgroundColor: color, height: 8 }} />;
        })}
      </View>
      <View style={styles.legend}>
        {allocations.map((row) => (
          <View key={row.key} style={styles.legendRow}>
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor:
                    theme.allocation.find((item) => item.key === row.key)?.color ?? theme.color.ocean,
                },
              ]}
            />
            <Text style={styles.legendLabel}>{row.label}</Text>
            <Text style={styles.legendValue}>{Math.round(Number(row.percentage) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    height: 8,
    overflow: "hidden",
  },
  legend: { marginTop: 20, gap: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  swatch: { width: 10, height: 2 },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: theme.color.navy,
    fontFamily: "Inter_400Regular",
  },
  legendValue: {
    fontSize: 13,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
});
