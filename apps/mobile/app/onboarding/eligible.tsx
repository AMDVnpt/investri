import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";

export default function EligibleScreen() {
  const { offeringId } = useLocalSearchParams<{ offeringId?: string }>();
  const router = useRouter();

  return (
    <OnboardingChrome title="Eligible to invest" kicker="You’re ready" step={4}>
      <Text style={s.body}>
        Your identity, Rhode Island residency, and suitability checks are complete. Next you can enter an
        amount. No real money moves.
      </Text>
      <Pressable
        style={s.button}
        accessibilityRole="button"
        onPress={() =>
          router.replace(offeringId ? `/invest/amount?offeringId=${offeringId}` : "/(tabs)/invest")
        }
      >
        <Text style={s.buttonText}>{offeringId ? "Enter amount" : "Browse offerings"}</Text>
      </Pressable>
      <Text style={s.fine}>A proposed tax credit is not cash received.</Text>
    </OnboardingChrome>
  );
}
