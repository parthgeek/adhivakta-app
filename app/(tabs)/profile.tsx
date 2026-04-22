import { useRouter, type RelativePathString } from "expo-router";
import {
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  User,
} from "lucide-react-native";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

type ProfileData = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  address?: string;
  bio?: string;
  barCouncilNumber?: string;
  specialization?: string;
  yearsOfExperience?: number | string;
  createdAt?: string;
  profileImage?: string;
};

type ProfileStats = {
  cases: number;
  hearings: number;
  notifications: number;
};

const getInitials = (name?: string) => {
  const value = (name || "").trim();
  if (!value) return "U";

  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatRole = (role?: string) => {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const formatMemberSince = (dateString?: string) => {
  if (!dateString) return "Not available";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    cases: 0,
    hearings: 0,
    notifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const [profileResponse, summaryResponse, notificationsResponse] = await Promise.all([
        api.profile.get(),
        api.dashboard.getSummary(),
        api.notifications.getAll(),
      ]);

      if (profileResponse?.error) {
        throw new Error(profileResponse.error);
      }

      const profileData = profileResponse?.data || {};
      const summary = summaryResponse?.data || {};
      const notifications = Array.isArray(notificationsResponse?.data)
        ? notificationsResponse.data
        : Array.isArray(notificationsResponse)
          ? notificationsResponse
          : [];

      setProfile(profileData);
      setStats({
        cases: Number(summary.totalCases || 0),
        hearings: Number(summary.upcomingHearings || 0),
        notifications: notifications.filter((item: any) => !item?.read).length,
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      setErrorMessage(error?.message || "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login" as RelativePathString);
        },
      },
    ]);
  };

  const displayProfile = useMemo(
    () => ({
      name: profile?.name || user?.name || "User",
      email: profile?.email || user?.email || "",
      role: profile?.role || user?.role || "",
      phone: profile?.phone || "Not provided",
      address: profile?.address || "Not provided",
      bio: profile?.bio || "",
      barCouncilNumber: profile?.barCouncilNumber || "",
      specialization: profile?.specialization || "",
      yearsOfExperience:
        profile?.yearsOfExperience !== undefined &&
        profile?.yearsOfExperience !== null &&
        String(profile.yearsOfExperience).trim() !== ""
          ? `${profile.yearsOfExperience} years`
          : "Not provided",
      createdAt: profile?.createdAt,
    }),
    [profile, user]
  );

  const menuItems = [
    { icon: Settings, title: "Settings", route: "/settings" as RelativePathString },
    { icon: Bell, title: "Notifications", route: "/notifications" as RelativePathString },
    { icon: FileText, title: "Uploads", route: "/upload" as RelativePathString },
    { icon: Calendar, title: "Hearings", route: "/hearings" as RelativePathString },
    { icon: Shield, title: "Cases", route: "/cases" as RelativePathString },
    { icon: HelpCircle, title: "Messages", route: "/messages" as RelativePathString },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProfile(true)}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayProfile.name)}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.name}>{displayProfile.name}</Text>
            <Text style={styles.email}>{displayProfile.email}</Text>
            <Text style={styles.role}>{formatRole(displayProfile.role)}</Text>
          </View>
        </View>
      </View>

      {!!errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.notifications}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.hearings}</Text>
          <Text style={styles.statLabel}>Hearings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.cases}</Text>
          <Text style={styles.statLabel}>Cases</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Information</Text>

        <View style={styles.detailRow}>
          <User color="#6b7280" size={18} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{displayProfile.name}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Mail color="#6b7280" size={18} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{displayProfile.email || "Not provided"}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Phone color="#6b7280" size={18} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{displayProfile.phone}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MapPin color="#6b7280" size={18} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{displayProfile.address}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Calendar color="#6b7280" size={18} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Member Since</Text>
            <Text style={styles.detailValue}>
              {formatMemberSince(displayProfile.createdAt)}
            </Text>
          </View>
        </View>

        {displayProfile.role === "lawyer" || displayProfile.role === "admin" ? (
          <>
            <View style={styles.detailRow}>
              <Shield color="#6b7280" size={18} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Bar Council Number</Text>
                <Text style={styles.detailValue}>
                  {displayProfile.barCouncilNumber || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <FileText color="#6b7280" size={18} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Specialization</Text>
                <Text style={styles.detailValue}>
                  {displayProfile.specialization || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Calendar color="#6b7280" size={18} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Experience</Text>
                <Text style={styles.detailValue}>
                  {displayProfile.yearsOfExperience}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {!!displayProfile.bio && (
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <HelpCircle color="#6b7280" size={18} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailValue}>{displayProfile.bio}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <item.icon color="#007AFF" size={20} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <ChevronRight color="#C7C7CC" size={20} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color="#FF3B30" size={20} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  profileDetails: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  role: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 8,
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "500",
  },
  stats: {
    flexDirection: "row",
    backgroundColor: "white",
    marginTop: 1,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E5EA",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 21,
  },
  menu: {
    backgroundColor: "white",
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0f0f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: "#111827",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
});
