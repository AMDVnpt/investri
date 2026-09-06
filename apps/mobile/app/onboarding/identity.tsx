import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../lib/api";
import { routeForOnboarding } from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import type { OnboardingStatusResponse } from "../../lib/types";

export default function IdentityScreen() {
  const { offeringId } = useLocalSearchParams<{ offeringId?: string }>();
  const router = useRouter();
  const [legalFirstName, setLegalFirstName] = useState("Pat");
  const [legalLastName, setLegalLastName] = useState("Citizen");
  const [dateOfBirth, setDateOfBirth] = useState("1988-04-12");
  const [phone, setPhone] = useState("401-555-0101");
  const [ssnLastFour, setSsnLastFour] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const status = await api<OnboardingStatusResponse>("/onboarding/identity", {
        method: "POST",
        body: JSON.stringify({
          legalFirstName,
          legalLastName,
          dateOfBirth,
          phone,
          ...(ssnLastFour ? { ssnLastFour } : {}),
        }),
      });
      router.replace(routeForOnboarding(status, offeringId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identity check failed");
    }
  }

  return (
    <OnboardingChrome title="Confirm your identity" step={0}>
      <ScrollView>
        <Text style={s.body}>
          This demonstration uses a mock identity check. Enter any last four except 0000. We never store a
          full Social Security number.
        </Text>
        <TextInput style={s.input} placeholder="Legal first name" value={legalFirstName} onChangeText={setLegalFirstName} />
        <TextInput style={s.input} placeholder="Legal last name" value={legalLastName} onChangeText={setLegalLastName} />
        <TextInput style={s.input} placeholder="Date of birth YYYY-MM-DD" value={dateOfBirth} onChangeText={setDateOfBirth} />
        <TextInput style={s.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput
          style={s.input}
          placeholder="Last four (optional)"
          value={ssnLastFour}
          onChangeText={setSsnLastFour}
          keyboardType="number-pad"
          maxLength={4}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.button} accessibilityRole="button" onPress={submit}>
          <Text style={s.buttonText}>Verify identity</Text>
        </Pressable>
      </ScrollView>
    </OnboardingChrome>
  );
}
