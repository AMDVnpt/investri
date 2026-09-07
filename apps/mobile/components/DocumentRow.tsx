import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../lib/theme";

export function DocumentRow({
  title,
  category,
  url,
  offeringId,
  documentId,
}: {
  title: string;
  category?: string;
  url?: string | null;
  offeringId?: string;
  documentId?: string;
}) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${title}`}
      onPress={() =>
        router.push({
          pathname: "/documents/view",
          params: {
            title,
            category: category ?? "",
            url: url ?? "",
            offeringId: offeringId ?? "",
            documentId: documentId ?? "",
          },
        })
      }
      style={styles.row}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{category ? `${category} · View` : "View document"}</Text>
      </View>
      <Text style={styles.action}>View</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: theme.color.hairline,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: { flex: 1 },
  title: { fontFamily: "Inter_500Medium", color: theme.color.navy, fontSize: 15 },
  meta: { marginTop: 4, fontFamily: "Inter_400Regular", color: theme.color.muted, fontSize: 13 },
  action: { fontFamily: "Inter_500Medium", color: theme.color.ocean },
});
