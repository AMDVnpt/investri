import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, isAuthFailure } from "../../lib/api";
import { onboardingSignInHref, resolveOfferingId, routeForOnboarding } from "../../lib/onboarding";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import type { OnboardingStatusResponse } from "../../lib/types";

export default function ProfileScreen() {
  const offeringId = resolveOfferingId(useLocalSearchParams<{ offeringId?: string; offering?: string }>());
  const router = useRouter();
  const [citizenship, setCitizenship] = useState("US");
  const [employmentStatus, setEmploymentStatus] = useState("employed");
  const [experienceBand, setExperienceBand] = useState("some");
  const [incomeRange, setIncomeRange] = useState("50k-100k");
  const [netWorthRange, setNetWorthRange] = useState("50k-250k");
  const [trustedContactName, setTrustedContactName] = useState("Casey Smith");
  const [trustedContactPhone, setTrustedContactPhone] = useState("401-555-0199");
  const [canBearLoss, setCanBearLoss] = useState(true);
  const [acceptsIlliquidity, setAcceptsIlliquidity] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const status = await api<OnboardingStatusResponse>("/investor-profile", {
        method: "POST",
        body: JSON.stringify({
          citizenship,
          employmentStatus,
          experienceBand,
          incomeRange,
          netWorthRange,
          trustedContactName,
          trustedContactPhone,
          canBearLoss,
          acceptsIlliquidity,
          accredited: false,
        }),
      });
      router.replace(routeForOnboarding(status, offeringId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Profile could not be saved";
      setError(message);
      if (isAuthFailure(message)) {
        router.replace(onboardingSignInHref(offeringId));
      }
    }
  }

  return (
    <OnboardingChrome title="Investor profile" step={2}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Text style={s.body}>
          Tell us about your experience and whether you can bear a loss of principal. We do not make
          personalized recommendations.
        </Text>
        <TextInput style={s.input} placeholder="Citizenship" value={citizenship} onChangeText={setCitizenship} />
        <TextInput style={s.input} placeholder="Employment" value={employmentStatus} onChangeText={setEmploymentStatus} />
        <TextInput style={s.input} placeholder="Investing experience" value={experienceBand} onChangeText={setExperienceBand} />
        <TextInput style={s.input} placeholder="Income range" value={incomeRange} onChangeText={setIncomeRange} />
        <TextInput style={s.input} placeholder="Net-worth range" value={netWorthRange} onChangeText={setNetWorthRange} />
        <TextInput style={s.input} placeholder="Trusted contact name" value={trustedContactName} onChangeText={setTrustedContactName} />
        <TextInput style={s.input} placeholder="Trusted contact phone" value={trustedContactPhone} onChangeText={setTrustedContactPhone} />
        <Pressable
          style={[s.check, canBearLoss ? s.checkOn : null]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: canBearLoss }}
          onPress={() => setCanBearLoss((value) => !value)}
        >
          <Text style={s.checkLabel}>
            {canBearLoss ? "Attested" : "Not attested"} — I can bear a loss of principal.
          </Text>
        </Pressable>
        <Pressable
          style={[s.check, acceptsIlliquidity ? s.checkOn : null]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptsIlliquidity }}
          onPress={() => setAcceptsIlliquidity((value) => !value)}
        >
          <Text style={s.checkLabel}>
            {acceptsIlliquidity ? "Attested" : "Not attested"} — I accept that this investment is illiquid.
          </Text>
        </Pressable>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.button} accessibilityRole="button" onPress={submit}>
          <Text style={s.buttonText}>Save profile</Text>
        </Pressable>
      </ScrollView>
    </OnboardingChrome>
  );
}
