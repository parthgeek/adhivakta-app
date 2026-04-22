import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// Types
type DashboardCase = {
  id: string;
  title?: string;
  caseNumber?: string;
  status?: string;
  urgent?: boolean;
};

type DashboardEvent = {
  id: string;
  title: string;
  start: string;
  type?: string;
  case?: string;
};

type DashboardData = {
  cases: DashboardCase[];
  events: DashboardEvent[];
  stats: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    upcomingHearings: number;
  };
};

type ProfileData = {
  name?: string;
  role?: string;
  specialization?: string;
  phone?: string;
};

type DashboardAlert = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
};

type DashboardActivity = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
};

type ApiNotification = {
  _id?: string;
  type?: string;
  message?: string;
  createdAt?: string;
  read?: boolean;
};

type ApiRecentCase = {
  id?: string;
  _id?: string;
  title?: string;
  caseNumber?: string;
  number?: string;
  status?: string;
  urgent?: boolean;
  isUrgent?: boolean;
};

type ApiUpcomingEvent = {
  id?: string;
  _id?: string;
  title?: string;
  start?: string;
  date?: string;
  type?: string;
  case?: string;
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
      <View style={styles.statsCardHeader}>
        <Text style={styles.statsTitle}>{title}</Text>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.statsValue}>{value}</Text>
    </TouchableOpacity>
  );
};

// Case Item Component
const CaseRow = ({
  caseItem,
  onPress,
}: {
  caseItem: DashboardCase;
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
            {caseItem.caseNumber}
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
const HearingItem = ({ event }: { event: DashboardEvent }) => {
  return (
    <View style={styles.hearingItem}>
      <View style={styles.hearingItemLeft}>
        <Text style={styles.hearingTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.hearingDate}>
          {event.case ? `${event.case} • ` : ""}
          {formatEventDate(event.start)} at {formatEventTime(event.start)}
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

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return "Recently";

  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getNotificationTitle = (type?: string) => {
  switch (type) {
    case "case_invitation":
      return "Case invitation";
    case "case_update":
      return "Case updated";
    case "event_reminder":
      return "Event reminder";
    case "document_upload":
      return "Document uploaded";
    default:
      return "Notification";
  }
};

const resolveArrayResponse = <T,>(response: unknown): T[] => {
  const typedResponse = response as { data?: unknown } | undefined;
  if (Array.isArray(response)) return response as T[];
  if (Array.isArray(typedResponse?.data)) return typedResponse.data as T[];
  return [];
};

const getEventTimestamp = (dateString?: string) => {
  const timestamp = new Date(dateString || "").getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatEventTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Main Dashboard Component
export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
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

  const fetchDashboardData = useCallback(async () => {
    try {
      setErrorMessage("");

      const [summaryResponse, recentCasesResponse, upcomingEventsResponse, notificationsResponse, profileResponse] =
        await Promise.all([
          api.dashboard.getSummary(),
          api.dashboard.getRecentCases(),
          api.dashboard.getUpcomingEvents(),
          api.notifications.getAll(),
          api.profile.get(),
        ]);

      if (summaryResponse?.error) {
        setErrorMessage(summaryResponse.error);
      }

      const summary = summaryResponse?.data || {};
      setProfileData(profileResponse?.data || null);

      const normalizedCases = resolveArrayResponse<ApiRecentCase>(recentCasesResponse).map(
        (caseItem) => ({
          id: caseItem.id || caseItem._id || "",
          title: caseItem.title,
          caseNumber: caseItem.caseNumber || caseItem.number,
          status: caseItem.status,
          urgent: Boolean(caseItem.urgent || caseItem.isUrgent),
        })
      );

      const normalizedEvents = resolveArrayResponse<ApiUpcomingEvent>(upcomingEventsResponse).map(
        (event) => ({
          id: event.id || event._id || "",
          title: event.title || "Event",
          start: event.start || event.date || new Date().toISOString(),
          type: event.type ? String(event.type) : undefined,
          case: event.case,
        })
      ).sort((a, b) => getEventTimestamp(a.start) - getEventTimestamp(b.start));

      const notifications = resolveArrayResponse<ApiNotification>(notificationsResponse);
      const now = Date.now();

      const upcomingCriticalAlerts: DashboardAlert[] = normalizedEvents
        .filter((event) => {
          const eventTime = new Date(event.start).getTime();
          if (Number.isNaN(eventTime)) return false;
          const diff = eventTime - now;
          return diff >= 0 && diff <= 48 * 60 * 60 * 1000;
        })
        .slice(0, 2)
        .map((event) => ({
          id: `event-${event.id}`,
          title: `${event.type || "Hearing"} due soon`,
          subtitle: `${event.title} on ${new Date(event.start).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          )}`,
          color: "#dc2626",
        }));

      const urgentCaseAlerts: DashboardAlert[] = normalizedCases
        .filter((caseItem) => caseItem.urgent)
        .slice(0, 2)
        .map((caseItem) => ({
          id: `case-${caseItem.id}`,
          title: "Urgent case needs attention",
          subtitle: `${caseItem.caseNumber || caseItem.title || "Case"} is marked urgent`,
          color: "#eab308",
        }));

      const liveAlerts = [...upcomingCriticalAlerts, ...urgentCaseAlerts].slice(
        0,
        4
      );
      setAlerts(liveAlerts);

      const liveActivity: DashboardActivity[] = notifications
        .slice(0, 5)
        .map((notification) => ({
          id: notification._id || Math.random().toString(36).slice(2),
          title: getNotificationTitle(notification.type),
          subtitle: notification.message || "Activity update",
          time: getRelativeTime(notification.createdAt),
        }));
      setRecentActivity(liveActivity);

      setDashboardData({
        cases: normalizedCases,
        events: normalizedEvents,
        stats: {
          totalCases: Number(summary.totalCases || 0),
          activeCases: Number(summary.activeCases || 0),
          closedCases: Number(summary.closedCases || 0),
          upcomingHearings: Number(summary.upcomingHearings || 0),
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setErrorMessage("Failed to load dashboard data. Pull to refresh.");
      setDashboardData({
        cases: [],
        events: [],
        stats: {
          totalCases: 0,
          activeCases: 0,
          closedCases: 0,
          upcomingHearings: 0,
        },
      });
      setAlerts([]);
      setRecentActivity([]);
      setProfileData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const featuredHearing = dashboardData.events[0];
  const displayName = profileData?.name || user?.name || "User";
  const displayRole = profileData?.role || user?.role || "member";
  const roleLabel =
    displayRole.charAt(0).toUpperCase() + displayRole.slice(1);
  const quickActions = [
    {
      icon: "add-circle-outline" as const,
      label: "New Case",
      color: "#2563eb",
      onPress: () => router.push("/cases/new"),
    },
    {
      icon: "cloud-upload-outline" as const,
      label: "Upload",
      color: "#16a34a",
      onPress: () => router.push("/upload"),
    },
    {
      icon: "calendar-outline" as const,
      label: "Hearings",
      color: "#9333ea",
      onPress: () => router.push("/hearings"),
    },
    {
      icon: displayRole === "lawyer" || displayRole === "admin"
        ? "chatbubble-ellipses-outline"
        : "notifications-outline",
      label: displayRole === "lawyer" || displayRole === "admin" ? "Messages" : "Alerts",
      color: "#ea580c",
      onPress: () =>
        router.push(
          (displayRole === "lawyer" || displayRole === "admin"
            ? "/messages"
            : "/notifications") as any
        ),
    },
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
          Welcome back, {displayName}. Here is your {roleLabel.toLowerCase()}{" "}
          overview{profileData?.specialization ? ` for ${profileData.specialization}` : ""}.
        </Text>
      </View>

      {!!errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatsCard
          title="Active Cases"
          value={dashboardData.stats.activeCases}
          icon="document-text"
          iconColor="#2563eb"
          onPress={() => router.push("/(tabs)/cases")}
        />
        <StatsCard
          title="Total Cases"
          value={dashboardData.stats.totalCases}
          icon="bar-chart"
          iconColor="#16a34a"
          onPress={() => router.push("/(tabs)/cases")}
        />
        <StatsCard
          title="Closed Cases"
          value={dashboardData.stats.closedCases}
          icon="checkmark-circle"
          iconColor="#9333ea"
          onPress={() => router.push("/(tabs)/cases")}
        />
        <StatsCard
          title="Hearings"
          value={dashboardData.stats.upcomingHearings}
          icon="calendar"
          iconColor="#ea580c"
          onPress={() => router.push("/(tabs)/hearings")}
        />
      </View>

      <TouchableOpacity
        style={styles.hearingSpotlight}
        onPress={() => router.push("/(tabs)/hearings")}
        activeOpacity={0.85}
      >
        <View style={styles.hearingSpotlightHeader}>
          <View style={styles.hearingSpotlightIcon}>
            <Ionicons name="calendar-outline" size={20} color="#c2410c" />
          </View>
          <View style={styles.hearingSpotlightCopy}>
            <Text style={styles.hearingSpotlightEyebrow}>Upcoming hearing</Text>
            <Text style={styles.hearingSpotlightTitle} numberOfLines={1}>
              {featuredHearing ? featuredHearing.title : "Manage your hearings"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9a3412" />
        </View>

        {featuredHearing ? (
          <>
            <Text style={styles.hearingSpotlightDescription} numberOfLines={1}>
              {featuredHearing.case || "Court schedule"}
            </Text>
            <View style={styles.hearingSpotlightMetaRow}>
              <View style={styles.hearingSpotlightMetaPill}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={14}
                  color="#9a3412"
                />
                <Text style={styles.hearingSpotlightMetaText}>
                  {formatEventDate(featuredHearing.start)}
                </Text>
              </View>
              <View style={styles.hearingSpotlightMetaPill}>
                <Ionicons name="time-outline" size={14} color="#9a3412" />
                <Text style={styles.hearingSpotlightMetaText}>
                  {formatEventTime(featuredHearing.start)}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.hearingSpotlightEmpty}>
            Keep hearings easy to reach from the dashboard while Calendar stays
            in the footer.
          </Text>
        )}
      </TouchableOpacity>

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
                <CaseRow
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

      {/* Hearings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Hearings</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/hearings")}>
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
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              color={action.color}
              onPress={action.onPress}
            />
          ))}
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
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View
                  style={[styles.alertIndicator, { backgroundColor: alert.color }]}
                />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertSubtitle}>{alert.subtitle}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No priority alerts</Text>
            </View>
          )}
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
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={40} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No recent activity</Text>
            </View>
          )}
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
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "500",
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
  statsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
  },
  hearingSpotlight: {
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fdba74",
  },
  hearingSpotlightHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  hearingSpotlightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ffedd5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  hearingSpotlightCopy: {
    flex: 1,
    marginRight: 12,
  },
  hearingSpotlightEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9a3412",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hearingSpotlightTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7c2d12",
  },
  hearingSpotlightDescription: {
    fontSize: 14,
    color: "#9a3412",
    marginTop: 12,
    marginBottom: 12,
  },
  hearingSpotlightMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hearingSpotlightMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffedd5",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hearingSpotlightMetaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9a3412",
  },
  hearingSpotlightEmpty: {
    fontSize: 14,
    lineHeight: 20,
    color: "#9a3412",
    marginTop: 12,
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
