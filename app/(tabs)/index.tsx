import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Types
type CaseItem = {
  id: string;
  title?: string;
  caseNumber?: string;
  number?: string;
  status?: string;
};

type Event = {
  id: string;
  title: string;
  start: string;
  type?: string;
};

type DashboardData = {
  cases: CaseItem[];
  events: Event[];
  stats: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    upcomingHearings: number;
  };
};

// Stats Card Component
const StatsCard = ({
  title,
  value,
  icon,
  iconColor,
  onPress,
}: {
  title: string;
  value: number;
  icon: any;
  iconColor: string;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.statsCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statsCardContent}>
        <View>
          <Text style={styles.statsTitle}>{title}</Text>
          <Text style={styles.statsValue}>{value}</Text>
        </View>
        <View style={[styles.statsIconContainer]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Case Item Component
const CaseItem = ({
  caseItem,
  onPress,
}: {
  caseItem: CaseItem;
  onPress?: () => void;
}) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { bg: "#dcfce7", text: "#166534" };
      case "closed":
        return { bg: "#f3f4f6", text: "#374151" };
      default:
        return { bg: "#dbeafe", text: "#1e40af" };
    }
  };

  const statusColors = getStatusColor(caseItem.status);

  return (
    <TouchableOpacity
      style={styles.caseItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.caseItemContent}>
        <View style={styles.caseItemLeft}>
          <Text style={styles.caseTitle} numberOfLines={1}>
            {caseItem.title || caseItem.caseNumber}
          </Text>
          <Text style={styles.caseNumber} numberOfLines={1}>
            {caseItem.caseNumber || caseItem.number}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
        >
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {caseItem.status || "Active"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Hearing Item Component
const HearingItem = ({ event }: { event: Event }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.hearingItem}>
      <View style={styles.hearingItemLeft}>
        <Text style={styles.hearingTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.hearingDate}>
          {formatDate(event.start)} at {formatTime(event.start)}
        </Text>
      </View>
      <View style={styles.hearingBadge}>
        <Text style={styles.hearingBadgeText}>{event.type || "Hearing"}</Text>
      </View>
    </View>
  );
};

// Quick Action Button Component
const QuickActionButton = ({
  icon,
  label,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: color + "20" }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.quickActionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// Main Dashboard Component
export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    cases: [],
    events: [],
    stats: {
      totalCases: 0,
      activeCases: 0,
      closedCases: 0,
      upcomingHearings: 0,
    },
  });

  useEffect(() => {
    loadUser();
    fetchDashboardData();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Simulate API call - replace with actual API later
      // const casesResponse = await api.cases.getAll();
      // const eventsResponse = await api.events.getAll();

      // Mock data for now
      const mockData = {
        cases: [
          {
            id: "1",
            title: "Smith vs. Johnson",
            caseNumber: "OS/123/2024",
            status: "active",
          },
          {
            id: "2",
            title: "Property Dispute",
            caseNumber: "WP/456/2024",
            status: "active",
          },
          {
            id: "3",
            title: "Contract Case",
            caseNumber: "CS/789/2024",
            status: "closed",
          },
        ],
        events: [
          {
            id: "1",
            title: "Court Hearing",
            start: new Date().toISOString(),
            type: "Hearing",
          },
          {
            id: "2",
            title: "Client Meeting",
            start: new Date(Date.now() + 86400000).toISOString(),
            type: "Meeting",
          },
        ],
        stats: {
          totalCases: 15,
          activeCases: 8,
          closedCases: 7,
          upcomingHearings: 5,
        },
      };

      setDashboardData(mockData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

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
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Welcome back, {user?.name || "User"}. Here's your legal practice
          overview.
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatsCard
          title="Active Cases"
          value={dashboardData.stats.activeCases}
          icon="document-text"
          iconColor="#2563eb"
          onPress={() => router.push("/cases?filter=active")}
        />
        <StatsCard
          title="Total Cases"
          value={dashboardData.stats.totalCases}
          icon="bar-chart"
          iconColor="#16a34a"
          onPress={() => router.push("/cases")}
        />
        <StatsCard
          title="Closed Cases"
          value={dashboardData.stats.closedCases}
          icon="checkmark-circle"
          iconColor="#9333ea"
          onPress={() => router.push("/cases?filter=closed")}
        />
        <StatsCard
          title="Upcoming Hearings"
          value={dashboardData.stats.upcomingHearings}
          icon="calendar"
          iconColor="#ea580c"
          onPress={() => router.push("/calendar")}
        />
      </View>

      {/* Recent Cases */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Cases</Text>
          <TouchableOpacity onPress={() => router.push("/cases")}>
            <Text style={styles.viewAllLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionContent}>
          {dashboardData.cases.length > 0 ? (
            dashboardData.cases
              .slice(0, 5)
              .map((caseItem) => (
                <CaseItem
                  key={caseItem.id}
                  caseItem={caseItem}
                  onPress={() => router.push(`/cases/${caseItem.id}`)}
                />
              ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#d1d5db"
              />
              <Text style={styles.emptyStateText}>No cases found</Text>
            </View>
          )}
        </View>
      </View>

      {/* Upcoming Hearings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Hearings</Text>
          <TouchableOpacity onPress={() => router.push("/calendar")}>
            <Text style={styles.viewAllLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionContent}>
          {dashboardData.events.length > 0 ? (
            dashboardData.events
              .slice(0, 5)
              .map((event) => <HearingItem key={event.id} event={event} />)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No upcoming hearings</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionButton
            icon="add-circle-outline"
            label="New Case"
            color="#2563eb"
            onPress={() => router.push("/cases/new")}
          />
          <QuickActionButton
            icon="document-attach-outline"
            label="Upload Doc"
            color="#16a34a"
            onPress={() => router.push("/documents")}
          />
          <QuickActionButton
            icon="calendar-outline"
            label="Schedule"
            color="#9333ea"
            onPress={() => router.push("/calendar")}
          />
          <QuickActionButton
            icon="people-outline"
            label="Add Client"
            color="#ea580c"
            onPress={() => router.push("/clients")}
          />
        </View>
      </View>

      {/* Priority Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="warning-outline" size={20} color="#dc2626" />
          <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
            Priority Alerts
          </Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.alertItem}>
            <View
              style={[styles.alertIndicator, { backgroundColor: "#dc2626" }]}
            />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                Document deadline approaching
              </Text>
              <Text style={styles.alertSubtitle}>
                OS/123/2024 - Response due in 2 days
              </Text>
            </View>
          </View>
          <View style={styles.alertItem}>
            <View
              style={[styles.alertIndicator, { backgroundColor: "#eab308" }]}
            />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Fee payment pending</Text>
              <Text style={styles.alertSubtitle}>
                3 clients have pending payments
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.section, { marginBottom: 20 }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color="#111" />
          <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
            Recent Activity
          </Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <Text style={styles.activityTitle}>Document uploaded</Text>
              <Text style={styles.activitySubtitle}>
                OS/123/2024 - Evidence file
              </Text>
            </View>
            <Text style={styles.activityTime}>2h ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <Text style={styles.activityTitle}>Hearing scheduled</Text>
              <Text style={styles.activitySubtitle}>
                WP/456/2024 - Jan 18, 2024
              </Text>
            </View>
            <Text style={styles.activityTime}>4h ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityLeft}>
              <Text style={styles.activityTitle}>Client meeting</Text>
              <Text style={styles.activitySubtitle}>
                Kumar Family consultation
              </Text>
            </View>
            <Text style={styles.activityTime}>1d ago</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statsCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  viewAllLink: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  sectionContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  caseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  caseItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  caseItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
    marginBottom: 4,
  },
  caseNumber: {
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  hearingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  hearingItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  hearingTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
    marginBottom: 4,
  },
  hearingDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  hearingBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hearingBadgeText: {
    fontSize: 12,
    color: "#1e40af",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: "47%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  alertItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  alertIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  activityLeft: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  activityTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 12,
  },
});
