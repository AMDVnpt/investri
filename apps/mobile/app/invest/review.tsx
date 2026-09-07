import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OnboardingChrome, onboardingStyles as s } from "../../components/OnboardingChrome";
import { DocumentRow } from "../../components/DocumentRow";
import { api } from "../../lib/api";
import { usd } from "../../lib/format";
import type { OfferingDetail } from "../../lib/types";

export default function InvestReviewScreen() {
  const params = useLocalSearchParams<{
    offeringId: string;
    amount: string;
    potentialCredit: string;
    cashTransferredToday: string;
  }>();
  const router = useRouter();
  const [documents, setDocuments] = useState<OfferingDetail["documents"]>([]);

  useEffect(() => {
    if (!params.offeringId) {
      return;
    }
    api<OfferingDetail>(`/offerings/${params.offeringId}`)
      .then((offering) => setDocuments(offering.documents))
      .catch(() => setDocuments([]));
  }, [params.offeringId]);

  return (
    <OnboardingChrome title="Review this subscription" kicker="Invest" step={4}>
      <Text style={s.body}>Investment {usd(params.amount)}</Text>
      <Text style={s.body}>Potential RI tax credit {usd(params.potentialCredit)} (proposed)</Text>
      <Text style={s.body}>Cash transferred today {usd(params.cashTransferredToday)}</Text>
      <Text style={s.fine}>
        The credit is not cash back and is not received until Commerce certifies it. Target returns are not
        guaranteed.
      </Text>
      <Text style={s.sectionKicker}>Diligence documents</Text>
      <Text style={s.body}>
        Open the PPM, subscription agreement, fact sheet, and disclosures before you sign.
      </Text>
      {documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          title={doc.title}
          category={doc.category}
          url={doc.url}
          offeringId={params.offeringId}
          documentId={doc.id}
        />
      ))}
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
