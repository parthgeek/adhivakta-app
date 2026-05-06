import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_TITLES: Record<string, string> = {
  index: "Dashboard",
  cases: "Cases",
  upload: "Upload",
  messages: "Messages",
  hearings: "Hearings",
  calendar: "Calendar",
  profile: "Profile",
  documents: "Documents",
  notifications: "Notifications",
  settings: "Settings",
  explore: "Explore",
};

const TAB_LABELS: Record<string, string> = {
  index: "Dashboard",
  cases: "Cases",
  upload: "Upload",
  messages: "Inbox",
  calendar: "Calendar",
};

const PageTitle = ({ title }: { title: string }) => (
  <View style={styles.headerTitleWrap}>
    <Text style={styles.headerKicker}>Adhivakta</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const HeaderIconButton = ({
  icon,
  onPress,
  edge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  edge: "left" | "right";
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.headerIconButton,
      edge === "left" ? styles.headerLeftButton : styles.headerRightButton,
    ]}
    activeOpacity={0.85}
  >
    <Ionicons name={icon} size={20} color="#0f172a" />
  </TouchableOpacity>
);

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 48 + insets.bottom;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#0f2d5c",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#dbe4f0",
          height: tabBarHeight,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
          paddingHorizontal: 16,
          borderRadius: 0,
          shadowColor: "#8ea4c4",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
        sceneStyle: {
          backgroundColor: "#eef4fb",
        },
        headerStyle: {
          backgroundColor: "#eef4fb",
        },
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTitle: () => (
          <PageTitle title={HEADER_TITLES[route.name] || route.name} />
        ),
        headerLeft: () =>
          route.name !== "profile" ? (
            <HeaderIconButton
              icon="person-circle-outline"
              onPress={() => router.push("/profile")}
              edge="left"
            />
          ) : null,
        headerRight: () =>
          route.name !== "notifications" ? (
            <HeaderIconButton
              icon="notifications-outline"
              onPress={() => router.push("/notifications")}
              edge="right"
            />
          ) : null,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "upload") {
            return (
              <View style={styles.uploadTabOuter}>
                <View style={styles.uploadTabInner}>
                  <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
                </View>
              </View>
            );
          }

          const iconName =
            route.name === "index"
              ? focused
                ? "grid"
                : "grid-outline"
              : route.name === "cases"
                ? focused
                  ? "document-text"
                  : "document-text-outline"
                : route.name === "messages"
                  ? focused
                    ? "chatbubble"
                    : "chatbubble-outline"
                  : route.name === "calendar"
                    ? focused
                      ? "calendar"
                      : "calendar-outline"
                    : "ellipse-outline";

          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons name={iconName} size={size} color={focused ? "#0f2d5c" : color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: TAB_LABELS.index,
        }}
      />

      <Tabs.Screen
        name="cases"
        options={{
          title: TAB_LABELS.cases,
        }}
      />

      <Tabs.Screen
        name="upload"
        options={{
          title: TAB_LABELS.upload,
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: TAB_LABELS.messages,
          tabBarBadge: undefined,
        }}
      />

      <Tabs.Screen
        name="hearings"
        options={{
          href: null,
          title: "Hearings",
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: TAB_LABELS.calendar,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
          title: "Documents",
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: "Notifications",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "Settings",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: "Explore",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: "#0f172a",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeftButton: {
    marginLeft: 16,
  },
  headerRightButton: {
    marginRight: 16,
  },
  tabBarItem: {
    paddingTop: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 0,
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: {
    backgroundColor: "#e7f0fb",
  },
  uploadTabOuter: {
    marginTop: -14,
  },
  uploadTabInner: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "#0f2d5c",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f2d5c",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 10,
  },
});
