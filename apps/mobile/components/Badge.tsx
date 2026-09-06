import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

export function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    color: theme.color.white,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Inter_500Medium",
  },
});
