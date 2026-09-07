import { StyleSheet, View } from "react-native";

/** Original InvestRI compass mark — a ring with a four-point rose. Not a third-party logo. */
export function BrandMark({ color, size = 28 }: { color: string; size?: number }) {
  const stroke = Math.max(1.5, size * 0.07);
  const nsW = Math.max(2.6, size * 0.15);
  const nsH = size * 0.56;
  const ewW = size * 0.56;
  const ewH = Math.max(2, size * 0.09);
  const diamond = size * 0.3;

  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="image"
      accessibilityLabel="InvestRI"
    >
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: color,
        }}
      />
      <View style={{ width: nsW, height: nsH, backgroundColor: color }} />
      <View style={[styles.center, { width: ewW, height: ewH, backgroundColor: color }]} />
      <View
        style={[
          styles.center,
          {
            width: diamond,
            height: diamond,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
  },
});
