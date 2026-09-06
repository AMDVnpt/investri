import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { offeringQuery } from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import type { OnboardingStatusResponse } from "../../lib/types";

export default function ActionRequiredScreen() {
  const { offeringId } = useLocalSearchParams<{ offeringId?: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);

  useEffect(() => {
    api<OnboardingStatusResponse>("/onboarding/status").then(setStatus).catch(() => undefined);
  }, []);

  const reason = status?.blockers[0] ?? "A required check did not pass.";
  const retry =
    status?.status === "RESIDENCY_FAILED"
      ? `/onboarding/residency${offeringQuery(offeringId)}`
      : status?.status === "ELIGIBILITY_FAILED"
        ? `/onboarding/profile${offeringQuery(offeringId)}`
        : `/onboarding/identity${offeringQuery(offeringId)}`;

  return (
    <OnboardingChrome title="Action required" kicker="Not eligible yet" step={status ? 0 : 0}>
      <Text style={s.body}>{reason}</Text>
      <Text style={s.fine}>
        Failed checks stay visible. You can correct the information and try again. Support can help if a mock
        verification keeps failing.
      </Text>
      <Pressable style={s.button} accessibilityRole="button" onPress={() => router.replace(retry)}>
        <Text style={s.buttonText}>Review and retry</Text>
      </Pressable>
    </OnboardingChrome>
  );
}
