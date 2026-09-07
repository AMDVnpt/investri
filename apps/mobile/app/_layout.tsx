import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Newsreader_500Medium } from "@expo-google-fonts/newsreader";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { theme } from "../lib/theme";

export default function RootLayout() {
  useFonts({
    Newsreader_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    ...Ionicons.font,
  });

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.paper },
        }}
      />
    </>
  );
}
