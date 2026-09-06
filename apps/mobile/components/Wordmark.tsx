import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

export function Wordmark({ light = false }: { light?: boolean }) {
  const color = light ? theme.color.white : theme.color.navy;
  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={[styles.coast, { borderColor: color }]} />
      <Text style={[styles.word, { color }]}>InvestRI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  coast: {
    width: 14,
    height: 22,
    borderWidth: 1.25,
    borderRadius: 8,
  },
  word: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 28,
    letterSpacing: 0.6,
  },
});
