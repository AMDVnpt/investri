import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import {
  PlaidLinkSheet,
  type LinkedBankAccount,
  type PlaidLinkSession,
} from "../../components/PlaidLinkSheet";
import { api } from "../../lib/api";
import { usd } from "../../lib/format";

export default function InvestFundingScreen() {
  const params = useLocalSearchParams<{
    offeringId: string;
    amount: string;
    potentialCredit: string;
    cashTransferredToday: string;
  }>();
  const router = useRouter();
  const [session, setSession] = useState<PlaidLinkSession | null>(null);
  const [account, setAccount] = useState<LinkedBankAccount | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PlaidLinkSession>("/investments/funding/plaid/link-token", { method: "POST", body: "{}" })
      .then(setSession)
      .catch(() =>
        setSession({
          mode: "plaid_sandbox_mock",
          linkToken: "link-sandbox-mock-local",
          expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          institutions: [
            {
              id: "ins_citizens",
              name: "Citizens Bank",
              accountName: "Plaid Checking",
              accountType: "checking",
              mask: "4412",
            },
            {
              id: "ins_bankri",
              name: "BankRI",
              accountName: "Everyday Checking",
              accountType: "checking",
              mask: "9088",
            },
          ],
        }),
      );
  }, []);

  async function connect(input: { publicToken: string; institutionId: string }) {
    setBusy(true);
    setError(null);
    try {
      const linked = await api<LinkedBankAccount>("/investments/funding/plaid/exchange", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setAccount(linked);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect that bank");
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingChrome title="Connect a bank with Plaid" kicker="Invest" step={4}>
      <Text style={s.body}>
        Fund {usd(params.amount)} through Plaid. This demonstration stores a bank-link token only — never a
        routing or account number. No real money moves.
      </Text>
      {account ? (
        <View style={s.check}>
          <Text style={s.checkLabel}>
            {account.institutionName} · {account.accountName} · •••• {account.mask}
          </Text>
        </View>
      ) : (
        <Pressable style={s.button} accessibilityRole="button" onPress={() => setOpen(true)}>
          <Text style={s.buttonText}>Connect with Plaid</Text>
        </Pressable>
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}
      {account ? (
        <Pressable
          style={s.button}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/invest/sign",
              params: {
                ...params,
                bankLinkToken: account.bankLinkToken ?? account.linkToken,
                institutionName: account.institutionName,
                accountType: account.accountType,
                mask: account.mask,
              },
            })
          }
        >
          <Text style={s.buttonText}>Continue to sign</Text>
        </Pressable>
      ) : null}
      <Text style={s.fine}>
        {session?.mode === "plaid"
          ? "Live Plaid Link sandbox is configured and will open when available."
          : "Plaid Link sandbox mock — same settlement APIs as a live bank connection."}
      </Text>
      <PlaidLinkSheet
        visible={open}
        session={session}
        busy={busy}
        error={error}
        onClose={() => setOpen(false)}
        onConnected={connect}
      />
    </OnboardingChrome>
  );
}
