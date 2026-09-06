import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";

export default function InvestConfirmationScreen() {
  const { amount, positionId } = useLocalSearchParams<{ amount?: string; positionId?: string }>();
  const router = useRouter();

  return (
    <OnboardingChrome title="Subscription settled" kicker="Invest" step={4}>
      <Text style={s.body}>
        Your ${amount?.split(".")[0] ?? "1,000"} demonstration position is open. The proposed Rhode Island tax
        credit is pending Commerce certification — you have not received a credit.
      </Text>
      <Pressable
        style={s.button}
        accessibilityRole="button"
        onPress={() => router.replace(positionId ? `/positions/${positionId}` : "/(tabs)/portfolio")}
      >
        <Text style={s.buttonText}>View position</Text>
      </Pressable>
      <Text style={s.fine}>No real money moved. This is an illustrative POC settlement.</Text>
    </OnboardingChrome>
  );
}
