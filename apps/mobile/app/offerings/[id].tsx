import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, assetUrl, session } from "../../lib/api";
import { AllocationChart } from "../../components/AllocationChart";
import { Badge } from "../../components/Badge";
import { DocumentRow } from "../../components/DocumentRow";
import { theme } from "../../lib/theme";
import type { MeResponse, OfferingDetail } from "../../lib/types";

export default function OfferingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [offering, setOffering] = useState<OfferingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    api<OfferingDetail>(`/offerings/${id}`)
      .then(setOffering)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <View style={styles.padded}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!offering) {
    return (
      <View style={styles.padded}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <View style={styles.hero}>
        <Image
          source={{ uri: assetUrl(offering.heroImageUrl) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={offering.heroImageAlt ?? offering.name}
        />
        <LinearGradient
          colors={[theme.color.overlayStart, theme.color.overlayEnd]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.heroCopy}>
          <View style={styles.badges}>
            <Badge label={offering.status} />
            {offering.residentOnly ? <Badge label="RI residents" /> : null}
            {offering.taxCredit.eligible ? <Badge label="Proposed tax credit" /> : null}
          </View>
          <Text style={styles.heroCategory}>{offering.category}</Text>
          <Text style={styles.heroName}>{offering.name}</Text>
          <Text style={styles.heroMeta}>{offering.managerName} · Fictional / illustrative</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.kicker}>Thesis</Text>
        <Text style={styles.body}>{offering.thesis}</Text>
      </View>

      {offering.taxCreditIllustration ? (
        <View style={[styles.section, styles.inset]}>
          <Text style={styles.kicker}>Rhode Island tax credit</Text>
          <Text style={styles.insetTitle}>
            A $1,000 investment could be eligible for up to $200
          </Text>
          <Text style={styles.body}>{offering.taxCreditIllustration.disclaimer}</Text>
          <Text style={styles.fine}>
            Status: {offering.taxCreditIllustration.programStatus}. You have not received a credit.
            Cash transferred today would still be $1,000.
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.kicker}>Portfolio allocation</Text>
        <AllocationChart allocations={offering.allocations} />
      </View>

      <View style={styles.section}>
        <Text style={styles.kicker}>Rhode Island projects</Text>
        {offering.projects.map((project) => (
          <Pressable key={project.id} onPress={() => router.push(`/projects/${project.id}`)} style={styles.project}>
            <View style={styles.projectPhoto}>
              <Image
                source={{ uri: assetUrl(project.heroImageUrl) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessibilityLabel={project.imageAlt ?? project.name}
              />
              <LinearGradient
                colors={[theme.color.overlayStart, theme.color.overlayEnd]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.projectCopy}>
                <Text style={styles.projectPlace}>{project.municipality}</Text>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectMeta}>
                  {project.amountDeployedLabel} · {project.metrics[0]?.label}{" "}
                  {Number(project.metrics[0]?.value ?? 0).toFixed(0)}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.section, styles.risk]}>
        <Text style={styles.kicker}>Risks</Text>
        {offering.risks.map((risk) => (
          <View key={risk.title} style={styles.riskItem}>
            <Text style={styles.riskTitle}>{risk.title}</Text>
            <Text style={styles.body}>{risk.summary}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.kicker}>Diligence documents</Text>
        <Text style={styles.body}>
          Review the illustrative diligence pack before you invest. Open or download each file.
        </Text>
        {offering.documents.filter((doc) => doc.category === "Diligence").length === 0 ? (
          <Text style={styles.fine}>Sign in to read the full diligence set.</Text>
        ) : (
          offering.documents
            .filter((doc) => doc.category === "Diligence")
            .map((doc) => (
              <DocumentRow
                key={doc.id}
                title={doc.title}
                category={doc.category}
                url={doc.url}
                offeringId={offering.id}
                documentId={doc.id}
              />
            ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.kicker}>Offering documents</Text>
        {offering.documents.filter((doc) => doc.category !== "Diligence").length === 0 ? (
          <Text style={styles.body}>Sign in to read the full offering documents.</Text>
        ) : (
          offering.documents
            .filter((doc) => doc.category !== "Diligence")
            .map((doc) => (
              <DocumentRow
                key={doc.id}
                title={doc.title}
                category={doc.category}
                url={doc.url}
                offeringId={offering.id}
                documentId={doc.id}
              />
            ))
        )}
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.cta}
          accessibilityRole="button"
          onPress={async () => {
            const dest = `/onboarding?offeringId=${offering.id}`;
            const access = await session.getAccess();
            if (!access) {
              router.push(`/sign-in?returnTo=${encodeURIComponent(dest)}`);
              return;
            }
            try {
              const me = await api<MeResponse>("/me");
              if (me.eligibleToInvest) {
                router.push(`/invest/amount?offeringId=${offering.id}`);
                return;
              }
            } catch {
              // Fall through to onboarding if session is stale.
            }
            router.push(dest);
          }}
        >
          <Text style={styles.ctaText}>Start investment</Text>
        </Pressable>
        <Text style={styles.fine}>
          Complete eligibility first. Funding is a later step. No real money moves.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper },
  padded: { flex: 1, padding: 28, paddingTop: 72, backgroundColor: theme.color.paper },
  hero: { height: 420, backgroundColor: theme.color.navy, justifyContent: "flex-end" },
  back: { position: "absolute", top: 56, left: 20, zIndex: 2 },
  backText: { color: theme.color.white, fontFamily: "Inter_500Medium" },
  heroCopy: { padding: 24 },
  badges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  heroCategory: {
    marginTop: 16,
    color: "rgba(255,255,255,0.74)",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  heroName: {
    marginTop: 8,
    color: theme.color.white,
    fontSize: 36,
    lineHeight: 40,
    fontFamily: "Newsreader_500Medium",
  },
  heroMeta: {
    marginTop: 8,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  section: { paddingHorizontal: 24, paddingTop: 32 },
  inset: {
    marginHorizontal: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.color.hairline,
    backgroundColor: theme.color.card,
  },
  kicker: {
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    marginBottom: 12,
    fontFamily: "Inter_500Medium",
  },
  insetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
    marginBottom: 12,
  },
  body: { fontSize: 16, lineHeight: 26, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  fine: { marginTop: 12, fontSize: 13, lineHeight: 20, color: theme.color.muted, fontFamily: "Inter_400Regular" },
  project: { marginBottom: 16 },
  projectPhoto: { height: 220, backgroundColor: theme.color.navy, justifyContent: "flex-end" },
  projectCopy: { padding: 16 },
  projectPlace: {
    color: "rgba(255,255,255,0.74)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  projectName: {
    color: theme.color.white,
    fontSize: 24,
    marginTop: 6,
    fontFamily: "Newsreader_500Medium",
  },
  projectMeta: { color: "rgba(255,255,255,0.8)", marginTop: 6, fontFamily: "Inter_400Regular" },
  risk: { backgroundColor: theme.color.wash, marginTop: 24, paddingBottom: 24 },
  riskItem: { marginBottom: 16 },
  riskTitle: {
    fontSize: 20,
    fontFamily: "Newsreader_500Medium",
    color: theme.color.navy,
    marginBottom: 6,
  },
  doc: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: theme.color.hairline,
    fontFamily: "Inter_400Regular",
    color: theme.color.navy,
  },
  cta: { backgroundColor: theme.color.navy, padding: 16, alignItems: "center" },
  ctaText: { color: theme.color.white, fontFamily: "Inter_500Medium" },
  error: { color: theme.color.risk, fontFamily: "Inter_400Regular" },
  muted: { color: theme.color.muted, fontFamily: "Inter_400Regular" },
});
