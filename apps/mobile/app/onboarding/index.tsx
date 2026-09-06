import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, session } from "../../lib/api";
import { offeringQuery, routeForOnboarding, stepIndex } from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import type { OnboardingStatusResponse } from "../../lib/types";

export default function OnboardingIndex() {
  const { offeringId } = useLocalSearchParams<{ offeringId?: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const access = await session.getAccess();
      if (!access) {
        router.replace(`/sign-in?returnTo=${encodeURIComponent(`/onboarding${offeringQuery(offeringId)}`)}`);
        return;
      }
      try {
        const result = await api<OnboardingStatusResponse>("/onboarding/status");
        setStatus(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load onboarding");
      }
    })();
  }, [offeringId, router]);

  return (
    <OnboardingChrome title="Become eligible to invest" step={stepIndex(status?.status ?? "NOT_STARTED")}>
      <ScrollView>
        <Text style={s.body}>
          Rhode Island residents complete a short identity, residency, and suitability check. No real money
          moves in this demonstration.
        </Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
        {status?.blockers.map((blocker) => (
          <Text key={blocker} style={s.error}>
            {blocker}
          </Text>
        ))}
        <Pressable
          style={s.button}
          accessibilityRole="button"
          onPress={() => {
            if (!status) {
              return;
            }
            router.push(routeForOnboarding(status, offeringId));
          }}
        >
          <Text style={s.buttonText}>{status ? "Continue" : "Loading…"}</Text>
        </Pressable>
      </ScrollView>
    </OnboardingChrome>
  );
}
