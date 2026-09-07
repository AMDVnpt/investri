import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "../lib/theme";

export type PlaidInstitution = {
  id: string;
  name: string;
  accountName: string;
  accountType: string;
  mask: string;
};

export type PlaidLinkSession = {
  mode: "plaid" | "plaid_sandbox_mock";
  linkToken: string;
  expiration: string;
  institutions: PlaidInstitution[];
};

export type LinkedBankAccount = {
  institutionId?: string;
  institutionName: string;
  accountId?: string;
  accountName: string;
  accountType: string;
  mask: string;
  linkToken?: string;
  bankLinkToken?: string;
};

type Step = "intro" | "institutions" | "login" | "account";

function tryOpenPlaidJs(
  linkToken: string,
  onSuccess: (publicToken: string) => void,
  onExit: () => void,
) {
  if (typeof document === "undefined") {
    return false;
  }
  const start = () => {
    const Plaid = (
      globalThis as {
        Plaid?: { create: (config: Record<string, unknown>) => { open: () => void } };
      }
    ).Plaid;
    if (!Plaid) {
      onExit();
      return;
    }
    Plaid.create({
      token: linkToken,
      onSuccess: (publicToken: string) => onSuccess(publicToken),
      onExit,
    }).open();
  };
  const existing = (globalThis as { Plaid?: unknown }).Plaid;
  if (existing) {
    start();
    return true;
  }
  const script = document.createElement("script");
  script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
  script.async = true;
  script.onload = start;
  script.onerror = onExit;
  document.head.appendChild(script);
  return true;
}

export function PlaidLinkSheet({
  visible,
  session,
  busy,
  error,
  onClose,
  onConnected,
}: {
  visible: boolean;
  session: PlaidLinkSession | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConnected: (input: { publicToken: string; institutionId: string }) => Promise<void> | void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [query, setQuery] = useState("");
  const [institution, setInstitution] = useState<PlaidInstitution | null>(null);
  const [username, setUsername] = useState("user_good");
  const [password, setPassword] = useState("pass_good");
  const institutions = session?.institutions ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return institutions;
    }
    return institutions.filter((row) => row.name.toLowerCase().includes(needle));
  }, [institutions, query]);

  function reset() {
    setStep("intro");
    setQuery("");
    setInstitution(null);
    setUsername("user_good");
    setPassword("pass_good");
  }

  function close() {
    reset();
    onClose();
  }

  async function finish(selected: PlaidInstitution) {
    await onConnected({
      publicToken: `public-sandbox-mock-${selected.id}`,
      institutionId: selected.id,
    });
    reset();
  }

  function continueFromIntro() {
    if (session?.mode === "plaid" && session.linkToken) {
      const opened = tryOpenPlaidJs(
        session.linkToken,
        (publicToken) => {
          void onConnected({
            publicToken,
            institutionId: institutions[0]?.id ?? "ins_citizens",
          });
          reset();
        },
        () => setStep("institutions"),
      );
      if (opened) {
        return;
      }
    }
    setStep("institutions");
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.brand}>Plaid</Text>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close Plaid">
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {step === "intro" ? (
              <>
                <Text style={styles.title}>InvestRI uses Plaid to connect your bank</Text>
                <Text style={styles.body}>
                  Plaid lets you securely select a funding account. InvestRI stores a token only — never a
                  routing or account number.
                </Text>
                <Pressable style={styles.primary} onPress={continueFromIntro} accessibilityRole="button">
                  <Text style={styles.primaryText}>Continue</Text>
                </Pressable>
              </>
            ) : null}
            {step === "institutions" ? (
              <>
                <Text style={styles.title}>Select your bank</Text>
                <TextInput
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search"
                  accessibilityLabel="Search banks"
                />
                {filtered.map((row) => (
                  <Pressable
                    key={row.id}
                    style={styles.bank}
                    onPress={() => {
                      setInstitution(row);
                      setStep("login");
                    }}
                    accessibilityRole="button"
                  >
                    <View style={styles.mark}>
                      <Text style={styles.markText}>{row.name.slice(0, 1)}</Text>
                    </View>
                    <Text style={styles.bankName}>{row.name}</Text>
                  </Pressable>
                ))}
              </>
            ) : null}
            {step === "login" && institution ? (
              <>
                <Text style={styles.title}>Sign in to {institution.name}</Text>
                <Text style={styles.body}>
                  Plaid sandbox credentials work here: user_good / pass_good. Any values are accepted in this
                  demonstration.
                </Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  accessibilityLabel="Bank username"
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  accessibilityLabel="Bank password"
                />
                <Pressable
                  style={styles.primary}
                  onPress={() => setStep("account")}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryText}>Submit</Text>
                </Pressable>
              </>
            ) : null}
            {step === "account" && institution ? (
              <>
                <Text style={styles.title}>Choose an account</Text>
                <Pressable
                  style={styles.bank}
                  onPress={() => finish(institution)}
                  accessibilityRole="button"
                >
                  <View>
                    <Text style={styles.bankName}>{institution.accountName}</Text>
                    <Text style={styles.meta}>
                      {institution.accountType} · •••• {institution.mask}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.primary}
                  onPress={() => finish(institution)}
                  accessibilityRole="button"
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>{busy ? "Connecting…" : "Connect account"}</Text>
                </Pressable>
              </>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.secure}>Securely connected with Plaid. No real money moves.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 20, 0.56)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.color.white,
    padding: 24,
    maxHeight: "92%",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: {
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontSize: 12,
    color: theme.color.navy,
  },
  close: { color: theme.color.muted, fontFamily: "Inter_500Medium" },
  title: {
    marginTop: 20,
    fontSize: 26,
    lineHeight: 32,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
  },
  body: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
    color: theme.color.navyMuted,
    fontFamily: "Inter_400Regular",
  },
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    padding: 14,
    fontFamily: "Inter_400Regular",
    color: theme.color.navy,
  },
  bank: {
    marginTop: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: theme.color.hairline,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.color.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: theme.color.white, fontFamily: "Inter_500Medium" },
  bankName: { fontFamily: "Inter_500Medium", color: theme.color.navy, fontSize: 16 },
  meta: { marginTop: 4, color: theme.color.muted, fontFamily: "Inter_400Regular" },
  primary: { backgroundColor: "#111111", padding: 16, alignItems: "center", marginTop: 20 },
  primaryText: { color: theme.color.white, fontFamily: "Inter_500Medium" },
  error: { marginTop: 16, color: theme.color.risk, fontFamily: "Inter_400Regular" },
  secure: {
    marginTop: 20,
    fontSize: 12,
    color: theme.color.muted,
    fontFamily: "Inter_400Regular",
  },
});
