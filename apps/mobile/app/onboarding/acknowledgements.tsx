import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, isAuthFailure } from "../../lib/api";
import { onboardingSignInHref, resolveOfferingId, routeForOnboarding } from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import { theme } from "../../lib/theme";
import type { OnboardingStatusResponse } from "../../lib/types";

type Disclosure = { key: string; title: string; body: string; version: number };

export default function AcknowledgementsScreen() {
  const offeringId = resolveOfferingId(useLocalSearchParams<{ offeringId?: string; offering?: string }>());
  const router = useRouter();
  const [items, setItems] = useState<Disclosure[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const status = await api<OnboardingStatusResponse>("/onboarding/status");
        const keys = status.pendingKeys.length ? status.pendingKeys : status.requiredKeys;
        const loaded = await Promise.all(keys.map((key) => api<Disclosure>(`/disclosures/${key}`)));
        setItems(loaded);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load disclosures";
        setError(message);
        if (isAuthFailure(message)) {
          router.replace(onboardingSignInHref(offeringId));
        }
      }
    })();
  }, [offeringId, router]);

  async function submit() {
    setError(null);
    try {
      const status = await api<OnboardingStatusResponse>("/onboarding/acknowledgements", {
        method: "POST",
        body: JSON.stringify({
          keys: items.map((item) => item.key),
          ...(offeringId ? { offeringId } : {}),
        }),
      });
      router.replace(routeForOnboarding(status, offeringId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Acknowledgements failed";
      setError(message);
      if (isAuthFailure(message)) {
        router.replace(onboardingSignInHref(offeringId));
      }
    }
  }

  return (
    <OnboardingChrome title="Review and acknowledge" step={3}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Text style={s.body}>
          You are accepting the exact version shown here. Target returns are not guaranteed. Any tax credit
          is proposed and is not cash back.
        </Text>
        {items.map((item) => (
          <View
            key={item.key}
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTopWidth: 1,
              borderColor: theme.color.hairline,
            }}
          >
            <Text style={{ fontFamily: "Newsreader_500Medium", fontSize: 22, color: theme.color.navy }}>
              {item.title}
            </Text>
            <Text style={s.fine}>Version {item.version}</Text>
            <Text style={[s.body, { marginTop: 8 }]}>{item.body}</Text>
          </View>
        ))}
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.button} accessibilityRole="button" onPress={submit}>
          <Text style={s.buttonText}>I understand and accept</Text>
        </Pressable>
      </ScrollView>
    </OnboardingChrome>
  );
}
