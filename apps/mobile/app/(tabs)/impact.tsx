import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import { theme } from "../../lib/theme";
import { RhodeIslandMap } from "../../components/RhodeIslandMap";

type Impact = {
  totals: {
    dollarsDeployed: string;
    projectsSupported: number;
    housingUnits: string;
    jobs: string;
    businesses: string;
    historicBuildings: string;
    municipalities: number;
  };
  includesSelfReported: boolean;
  personalized: { copy: string } | null;
  map: { pins: { id: string; name: string; municipality: string; statewide: boolean }[] };
  projects: { id: string; name: string; municipality: string; amountDeployed: string }[];
};

function whole(value?: string) {
  return Number((value ?? "0").split(".")[0]).toLocaleString("en-US");
}

export default function ImpactScreen() {
  const router = useRouter();
  const [data, setData] = useState<Impact | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setData(await api<Impact>("/impact"));
      } catch {
        setData(null);
      }
    })();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 64 }}>
      <Text style={styles.kicker}>Impact</Text>
      <Text style={styles.title}>Your money at work in Rhode Island</Text>
      {data?.personalized ? <Text style={styles.body}>{data.personalized.copy}</Text> : (
        <Text style={styles.body}>
          Statewide totals for the illustrative Growth Fund I portfolio. Sign in to see how your
          subscription sits inside the fund.
        </Text>
      )}
      {data ? (
        <>
          <Text style={styles.meta}>
            ${whole(data.totals.dollarsDeployed)} deployed · {data.totals.projectsSupported} projects ·{" "}
            {whole(data.totals.housingUnits)} units · {whole(data.totals.jobs)} jobs ·{" "}
            {whole(data.totals.businesses)} businesses · {data.totals.municipalities} municipalities
          </Text>
          {data.includesSelfReported ? (
            <Text style={styles.fine}>Includes self-reported figures pending Commerce verification.</Text>
          ) : (
            <Text style={styles.fine}>Verified outcomes only. Figures are illustrative.</Text>
          )}
          <RhodeIslandMap pins={data.map.pins} onPress={(id) => router.push(`/projects/${id}`)} />
          {data.projects.map((project) => (
            <Pressable key={project.id} onPress={() => router.push(`/projects/${project.id}`)}>
              <Text style={styles.link}>
                {project.name} · {project.municipality} · ${whole(project.amountDeployed)}
              </Text>
            </Pressable>
          ))}
        </>
      ) : (
        <Text style={styles.body}>Loading statewide impact…</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.paper, padding: 28, paddingTop: 72 },
  kicker: {
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
    color: theme.color.muted,
    fontFamily: "Inter_500Medium",
  },
  title: { marginTop: 12, fontSize: 34, fontFamily: "Newsreader_500Medium", color: theme.color.navy },
  body: { marginTop: 16, lineHeight: 24, color: theme.color.navyMuted, fontFamily: "Inter_400Regular" },
  meta: { marginTop: 16, color: theme.color.navy, fontFamily: "Inter_500Medium" },
  fine: { marginTop: 8, color: theme.color.muted, fontFamily: "Inter_400Regular", fontSize: 13 },
  link: { marginTop: 16, color: theme.color.navy, fontFamily: "Inter_500Medium" },
});
