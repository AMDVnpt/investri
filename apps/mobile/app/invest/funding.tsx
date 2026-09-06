import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";

export default function InvestFundingScreen() {
  const params = useLocalSearchParams<{
    offeringId: string;
    amount: string;
    potentialCredit: string;
    cashTransferredToday: string;
  }>();
  const router = useRouter();

  return (
    <OnboardingChrome title="Link a demo bank" kicker="Invest" step={4}>
      <Text style={s.body}>
        This demonstration links a mock funding source. We store a token only — never a routing or account
        number.
      </Text>
      <Pressable
        style={s.button}
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: "/invest/sign",
            params: { ...params, bankLinkToken: "bank_demo_token" },
          })
        }
      >
        <Text style={s.buttonText}>Link demo bank</Text>
      </Pressable>
    </OnboardingChrome>
  );
}
