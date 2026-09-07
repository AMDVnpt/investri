import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { api, session } from "../lib/api";
import { theme } from "../lib/theme";
import { Wordmark } from "../components/Wordmark";

export default function SignInScreen() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = Array.isArray(returnToParam) ? returnToParam[0] : returnToParam;
  const [email, setEmail] = useState("alex.smith@demo.investri.ri");
  const [password, setPassword] = useState("DemoPass123!");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const result = await api<{ accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await session.setTokens(result.accessToken, result.refreshToken);
      router.replace(returnTo || "/(tabs)/invest");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    }
  }

  return (
    <View style={styles.screen}>
      <Wordmark />
      <Text style={styles.title}>Sign in</Text>
      <TextInput style={styles.input} autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
      <Link href="/" style={styles.back}>
        Back
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper, padding: 28, paddingTop: 72 },
  title: {
    marginTop: 32,
    marginBottom: 24,
    fontSize: 36,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
    padding: 14,
    marginBottom: 12,
    fontFamily: "Inter_400Regular",
  },
  button: { backgroundColor: theme.color.navy, padding: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: theme.color.white, fontFamily: "Inter_500Medium" },
  error: { color: theme.color.risk, marginBottom: 8, fontFamily: "Inter_400Regular" },
  back: { marginTop: 24, color: theme.color.muted, fontFamily: "Inter_400Regular" },
});
