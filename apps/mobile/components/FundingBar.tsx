import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

export function FundingBar({ ratio }: { ratio: string }) {
  const percent = Math.min(100, Math.round(Number(ratio) * 100));
  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.label}>{percent}% of target raise</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 2,
    backgroundColor: "rgba(11,31,51,0.12)",
    width: "100%",
  },
  fill: {
    height: 2,
    backgroundColor: theme.color.navy,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: theme.color.muted,
    fontFamily: "Inter_400Regular",
  },
});
