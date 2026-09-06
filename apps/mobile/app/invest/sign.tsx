import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";

export default function InvestSignScreen() {
  const params = useLocalSearchParams<{
    offeringId: string;
    amount: string;
    bankLinkToken?: string;
  }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const result = await api<{ order: { id: string }; position: { id: string } }>("/investments", {
        method: "POST",
        body: JSON.stringify({
          offeringId: params.offeringId,
          amount: params.amount?.replace(/\.0+$/, "") ?? params.amount,
          idempotencyKey: `mobile-${params.offeringId}-${Date.now()}`,
          bankLinkToken: params.bankLinkToken,
        }),
      });
      router.replace({
        pathname: "/invest/confirmation",
        params: {
          orderId: result.order.id,
          positionId: result.position.id,
          amount: params.amount,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Subscription failed");
    }
  }

  return (
    <OnboardingChrome title="Sign the subscription" kicker="Invest" step={4}>
      <Text style={s.body}>
        Mock e-signature for the subscription agreement and the risk acknowledgements you already accepted.
      </Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Pressable style={s.button} accessibilityRole="button" onPress={submit}>
        <Text style={s.buttonText}>Accept and submit</Text>
      </Pressable>
    </OnboardingChrome>
  );
}
