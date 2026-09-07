import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, isAuthFailure, session } from "../../lib/api";
import {
  onboardingSignInHref,
  resolveOfferingId,
  routeForOnboarding,
  stepIndex,
} from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import type { OnboardingStatusResponse } from "../../lib/types";

export default function OnboardingIndex() {
  const params = useLocalSearchParams<{ offeringId?: string; offering?: string }>();
  const offeringId = resolveOfferingId(params);
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const signInHref = onboardingSignInHref(offeringId);

  const load = useCallback(async () => {
    setError(null);
    setNeedsSignIn(false);
    const [access, refresh] = await Promise.all([session.getAccess(), session.getRefresh()]);
    if (!access && !refresh) {
      setNeedsSignIn(true);
      router.replace(signInHref);
      return;
    }
    try {
      const result = await api<OnboardingStatusResponse>("/onboarding/status");
      setStatus(result);
      router.replace(routeForOnboarding(result, offeringId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load onboarding";
      setError(message);
      if (isAuthFailure(message)) {
        setNeedsSignIn(true);
        await session.clear();
        router.replace(signInHref);
      }
    }
  }, [offeringId, router, signInHref]);

  useEffect(() => {
    void load();
  }, [load]);

  const label = needsSignIn ? "Sign in" : status ? "Continue" : error ? "Retry" : "Loading…";
  const canPress = needsSignIn || Boolean(status) || Boolean(error);

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
          accessibilityState={{ disabled: !canPress }}
          disabled={!canPress}
          onPress={() => {
            if (needsSignIn) {
              router.replace(signInHref);
              return;
            }
            if (status) {
              router.push(routeForOnboarding(status, offeringId));
              return;
            }
            if (error) {
              void load();
            }
          }}
        >
          <Text style={s.buttonText}>{label}</Text>
        </Pressable>
      </ScrollView>
    </OnboardingChrome>
  );
}
