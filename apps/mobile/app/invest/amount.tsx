import { useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { offeringQuery } from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";

type Quote = {
  amount: string;
  potentialCredit: string;
  cashTransferredToday: string;
  disclaimers: string[];
};

export default function InvestAmountScreen() {
  const { offeringId } = useLocalSearchParams<{ offeringId: string }>();
  const router = useRouter();
  const [amount, setAmount] = useState("1000");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const quote = await api<Quote>("/investments/quote", {
        method: "POST",
        body: JSON.stringify({ offeringId, amount }),
      });
      router.push({
        pathname: "/invest/review",
        params: {
          offeringId,
          amount: quote.amount,
          potentialCredit: quote.potentialCredit,
          cashTransferredToday: quote.cashTransferredToday,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Amount is not allowed");
    }
  }

  return (
    <OnboardingChrome title="Enter an amount" kicker="Invest" step={4}>
      <Text style={s.body}>Minimum $100. Default $1,000 for this demonstration. No real money moves.</Text>
      <TextInput
        style={s.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        accessibilityLabel="Investment amount"
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Pressable style={s.button} accessibilityRole="button" onPress={submit}>
        <Text style={s.buttonText}>Review quote</Text>
      </Pressable>
      <Pressable onPress={() => router.replace(`/onboarding/eligible${offeringQuery(offeringId)}`)}>
        <Text style={s.fine}>Back to eligibility</Text>
      </Pressable>
    </OnboardingChrome>
  );
}
