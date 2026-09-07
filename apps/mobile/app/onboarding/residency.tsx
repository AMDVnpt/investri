import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, isAuthFailure } from "../../lib/api";
import { onboardingSignInHref, resolveOfferingId, routeForOnboarding } from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import type { OnboardingStatusResponse } from "../../lib/types";

export default function ResidencyScreen() {
  const offeringId = resolveOfferingId(useLocalSearchParams<{ offeringId?: string; offering?: string }>());
  const router = useRouter();
  const [street, setStreet] = useState("12 Benefit Street");
  const [city, setCity] = useState("Providence");
  const [state, setState] = useState("RI");
  const [postalCode, setPostalCode] = useState("02903");
  const [attested, setAttested] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const status = await api<OnboardingStatusResponse>("/onboarding/residency", {
        method: "POST",
        body: JSON.stringify({
          street,
          city,
          state,
          postalCode,
          attestedRiResident: attested,
        }),
      });
      router.replace(routeForOnboarding(status, offeringId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Residency check failed";
      setError(message);
      if (isAuthFailure(message)) {
        router.replace(onboardingSignInHref(offeringId));
      }
    }
  }

  return (
    <OnboardingChrome title="Rhode Island residency" step={1}>
      <ScrollView>
        <Text style={s.body}>
          Growth Fund I is limited to Rhode Island residents in this demonstration. Addresses outside Rhode
          Island will not verify.
        </Text>
        <TextInput style={s.input} placeholder="Street" value={street} onChangeText={setStreet} />
        <TextInput style={s.input} placeholder="City" value={city} onChangeText={setCity} />
        <TextInput style={s.input} placeholder="State" autoCapitalize="characters" value={state} onChangeText={setState} maxLength={2} />
        <TextInput style={s.input} placeholder="Postal code" value={postalCode} onChangeText={setPostalCode} />
        <Pressable
          style={[s.check, attested ? s.checkOn : null]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: attested }}
          onPress={() => setAttested((value) => !value)}
        >
          <Text style={s.checkLabel}>
            {attested ? "Attested" : "Not attested"} — I am a Rhode Island resident for this offering.
          </Text>
        </Pressable>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.button} accessibilityRole="button" onPress={submit}>
          <Text style={s.buttonText}>Verify residency</Text>
        </Pressable>
      </ScrollView>
    </OnboardingChrome>
  );
}
