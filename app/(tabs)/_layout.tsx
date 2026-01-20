import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

export default function TabLayout() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } else {
        router.replace("/login"); // Fixed path based on earlier conversation summaries
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#fff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
          color: "#111",
        },
        headerLeft: () => route.name !== 'profile' ? (
          <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginLeft: 15 }}>
            <Ionicons name="person-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        ) : null,
        headerRight: () => route.name !== 'notifications' ? (
          <TouchableOpacity onPress={() => router.push('/notifications')} style={{ marginRight: 15 }}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
        ) : null
      })}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Cases */}
      <Tabs.Screen
        name="cases"
        options={{
          title: "Cases",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Upload - Center Tab (Special Style) */}
      <Tabs.Screen
        name="upload"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#000",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="cloud-upload-outline" size={28} color="#fff" />
            </View>
          ),
        }}
      />

      {/* Messages */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
          tabBarBadge: undefined, // Add badge count from API later
        }}
      />

      {/* Calendar */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          tabBarBadge: undefined, // Add badge count from API later
        }}
      />

      {/* Hidden screens - accessible via navigation but not in tab bar */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
});
