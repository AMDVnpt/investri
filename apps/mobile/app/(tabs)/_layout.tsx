import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { theme } from "../../lib/theme";

const hidden = { href: null } as const;

function tabIcon(name: keyof typeof Ionicons.glyphMap, focusedName: keyof typeof Ionicons.glyphMap) {
  return function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
  };
}

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
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: tabIcon("home-outline", "home") }}
      />
      <Tabs.Screen
        name="invest"
        options={{ title: "Invest", tabBarIcon: tabIcon("stats-chart-outline", "stats-chart") }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{ title: "Portfolio", tabBarIcon: tabIcon("briefcase-outline", "briefcase") }}
      />
      <Tabs.Screen
        name="impact"
        options={{ title: "Impact", tabBarIcon: tabIcon("map-outline", "map") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: tabIcon("person-outline", "person") }}
      />
      <Tabs.Screen name="offerings/[id]" options={hidden} />
      <Tabs.Screen name="projects/[id]" options={hidden} />
      <Tabs.Screen name="positions/[id]" options={hidden} />
      <Tabs.Screen name="tax-credits/index" options={hidden} />
      <Tabs.Screen name="tax-credits/[id]" options={hidden} />
      <Tabs.Screen name="documents/index" options={hidden} />
      <Tabs.Screen name="documents/view" options={hidden} />
      <Tabs.Screen name="notifications" options={hidden} />
    </Tabs>
  );
}
