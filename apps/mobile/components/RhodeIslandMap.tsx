import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

const ANCHORS: Record<string, { top: `${number}%`; left: `${number}%` }> = {
  Pawtucket: { top: "22%", left: "58%" },
  Providence: { top: "36%", left: "46%" },
  Newport: { top: "72%", left: "62%" },
};

type Pin = {
  id: string;
  name: string;
  municipality: string;
  statewide: boolean;
};

export function RhodeIslandMap({
  pins,
  onPress,
}: {
  pins: Pin[];
  onPress: (id: string) => void;
}) {
  const cityPins = pins.filter((pin) => !pin.statewide);
  const statewide = pins.find((pin) => pin.statewide);

  return (
    <View style={styles.frame} accessibilityRole="image" accessibilityLabel="Rhode Island project map">
      <View style={styles.outline} />
      {cityPins.map((pin) => {
        const anchor = ANCHORS[pin.municipality] ?? { top: "50%", left: "50%" };
        return (
          <Pressable
            key={pin.id}
            onPress={() => onPress(pin.id)}
            style={[styles.pin, { top: anchor.top, left: anchor.left }]}
            accessibilityRole="button"
            accessibilityLabel={`${pin.name} in ${pin.municipality}`}
          >
            <View style={styles.dot} />
            <Text style={styles.pinLabel}>{pin.municipality}</Text>
          </Pressable>
        );
      })}
      {statewide ? (
        <Pressable
          onPress={() => onPress(statewide.id)}
          style={styles.band}
          accessibilityRole="button"
          accessibilityLabel={statewide.name}
        >
          <Text style={styles.bandText}>Statewide · {statewide.name}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 280,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
    overflow: "hidden",
  },
  outline: {
    position: "absolute",
    top: 28,
    left: 36,
    width: 88,
    height: 168,
    borderWidth: 1.5,
    borderColor: theme.color.navy,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 18,
  },
  pin: { position: "absolute", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.color.navy },
  pinLabel: { marginTop: 4, fontSize: 11, fontFamily: "Inter_500Medium", color: theme.color.navy },
  band: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    padding: 8,
    backgroundColor: theme.color.paper,
  },
  bandText: { fontSize: 12, fontFamily: "Inter_500Medium", color: theme.color.navy },
});
