import { createElement } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { theme } from "../lib/theme";

const COASTLINE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120">
      <path d="M28 8 C34 10 40 14 42 22 C44 30 40 36 44 44 C48 52 58 54 62 62 C66 70 60 78 56 86 C52 94 54 102 48 108 C40 114 30 112 24 104 C18 96 20 86 18 76 C16 66 10 58 12 48 C14 38 20 32 22 24 C24 16 24 10 28 8 Z" fill="#E8E2D6" stroke="#0B1F33" stroke-width="1.4" stroke-linejoin="round"/>
    </svg>`,
  );

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

function Coastline() {
  if (Platform.OS === "web") {
    return createElement("img", {
      src: COASTLINE,
      alt: "",
      "aria-hidden": true,
      style: {
        position: "absolute",
        top: "4%",
        left: "12%",
        width: "76%",
        height: "78%",
        objectFit: "contain",
        pointerEvents: "none",
      },
    });
  }
  return <Image source={{ uri: COASTLINE }} style={styles.coastline} contentFit="contain" />;
}

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
      <Coastline />
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
  coastline: {
    position: "absolute",
    top: 12,
    left: 28,
    right: 28,
    bottom: 52,
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
