import { Tabs } from "expo-router";
import { theme } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.navy,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: {
          backgroundColor: theme.color.paper,
          borderTopColor: theme.color.hairline,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="invest" options={{ title: "Invest" }} />
      <Tabs.Screen name="portfolio" options={{ title: "Portfolio" }} />
      <Tabs.Screen name="impact" options={{ title: "Impact" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
