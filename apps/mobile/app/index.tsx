import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Wordmark } from "../components/Wordmark";
import { theme } from "../lib/theme";
import { photoSource } from "../lib/photos";

export default function WelcomeScreen() {
  return (
    <View style={styles.screen}>
      <Image
        source={photoSource("/assets/photos/welcome-waterfront.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityLabel="Mohegan Bluffs coastline on Block Island, Rhode Island"
      />
      <LinearGradient
        colors={["rgba(11,31,51,0.15)", "rgba(11,31,51,0.82)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Wordmark light />
        <Text style={styles.headline}>Invest in Rhode Island. Own a stake in its future.</Text>
        <Text style={styles.note}>
          A demonstration marketplace. All offerings and tax-credit terms are illustrative.
        </Text>
        <Link href="/register" asChild>
          <Pressable style={styles.primary} accessibilityRole="button">
            <Text style={styles.primaryText}>Create account</Text>
          </Pressable>
        </Link>
        <Link href="/sign-in" asChild>
          <Pressable style={styles.secondary} accessibilityRole="button">
            <Text style={styles.secondaryText}>Sign in</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/invest" asChild>
          <Pressable accessibilityRole="link">
            <Text style={styles.explore}>Explore investments</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.navy },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 56,
  },
  headline: {
    marginTop: 28,
    color: theme.color.white,
    fontSize: 36,
    lineHeight: 42,
    fontFamily: "Newsreader_500Medium",
  },
  note: {
    marginTop: 16,
    marginBottom: 32,
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  primary: {
    backgroundColor: theme.color.white,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: {
    color: theme.color.navy,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.4,
  },
  secondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryText: {
    color: theme.color.white,
    fontFamily: "Inter_500Medium",
  },
  explore: {
    marginTop: 24,
    textAlign: "center",
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    textDecorationLine: "underline",
    fontFamily: "Inter_400Regular",
  },
});
