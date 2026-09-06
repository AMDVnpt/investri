import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";

function dollars(value: string) {
  const [whole] = value.split(".");
  return `$${Number(whole).toLocaleString("en-US")}`;
}

export default function InvestReviewScreen() {
  const params = useLocalSearchParams<{
    offeringId: string;
    amount: string;
    potentialCredit: string;
    cashTransferredToday: string;
  }>();
  const router = useRouter();

  return (
    <OnboardingChrome title="Review this subscription" kicker="Invest" step={4}>
      <Text style={s.body}>Investment {dollars(params.amount ?? "0")}</Text>
      <Text style={s.body}>Potential RI tax credit {dollars(params.potentialCredit ?? "0")} (proposed)</Text>
      <Text style={s.body}>Cash transferred today {dollars(params.cashTransferredToday ?? "0")}</Text>
      <Text style={s.fine}>
        The credit is not cash back and is not received until Commerce certifies it. Target returns are not
        guaranteed.
      </Text>
      <Pressable
        style={s.button}
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: "/invest/funding",
            params,
          })
        }
      >
        <Text style={s.buttonText}>Continue to funding</Text>
      </Pressable>
    </OnboardingChrome>
  );
}
