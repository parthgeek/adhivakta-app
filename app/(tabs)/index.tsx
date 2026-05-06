import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Sparkles,
  TrendingUp,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Scale,
  BellRing,
  Users,
} from "lucide-react-native";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  formatCaseTypeLabel,
  formatDisplayCaseNumber,
} from "../../lib/caseTypeUtils";
import { getCasePriority } from "../../lib/casePriority";

type DashboardCase = {
  id: string;
  title?: string;
  caseNumber?: string;
  status?: string;
  urgent?: boolean;
  court?: string;
  caseType?: string;
  caseSubType?: string;
  nextHearingDate?: string;
  priority?: string;
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
  meta?: {
    priority?: string;
  };
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
  court?: string;
  caseType?: string;
  caseSubType?: string;
  nextHearingDate?: string;
  hearingDate?: string;
  eCourt?: {
    caseTypeName?: string;
    caseTypeCode?: string;
  };
  caseCode?: string;
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

const BRAND = "#03234b";

const resolveArrayResponse = <T,>(response: unknown): T[] => {
  const typedResponse = response as { data?: unknown } | undefined;
  if (Array.isArray(response)) return response as T[];
  if (Array.isArray(typedResponse?.data)) return typedResponse.data as T[];
  return [];
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

const getEventTimestamp = (dateString?: string) => {
  const timestamp = new Date(dateString || "").getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

const formatEventTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getPriorityTone = (priority?: string) => {
  switch ((priority || "normal").toLowerCase()) {
    case "urgent":
      return { bg: "#fef2f2", text: "#dc2626" };
    case "high":
      return { bg: "#fff7ed", text: "#c2410c" };
    default:
      return { bg: "#f3f4f6", text: "#6b7280" };
  }
};

const getStatusTone = (status?: string) => {
  switch ((status || "active").toLowerCase()) {
    case "active":
      return { bg: "#dcfce7", text: "#166534" };
    case "closed":
      return { bg: "#f3f4f6", text: "#374151" };
    default:
      return { bg: "#dbeafe", text: "#1e40af" };
  }
};

const StatsRailCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  onPress,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.statsRailCard}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <View style={styles.statsRailTop}>
      <View style={[styles.statsRailIconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <TrendingUp size={14} color="#16a34a" />
    </View>
    <Text style={styles.statsRailLabel}>{title}</Text>
    <Text style={styles.statsRailValue}>{value}</Text>
    <Text style={styles.statsRailMeta}>{subtitle}</Text>
  </TouchableOpacity>
);

const MiniBarRow = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const ratio = total > 0 ? Math.max(value / total, 0.04) : 0;

  return (
    <View style={styles.miniBarRow}>
      <View style={styles.miniBarHeader}>
        <Text style={styles.miniBarLabel}>{label}</Text>
        <Text style={styles.miniBarValue}>{value}</Text>
      </View>
      <View style={styles.miniBarTrack}>
        <View
          style={[
            styles.miniBarFill,
            {
              backgroundColor: color,
              width: `${Math.min(ratio * 100, 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
};

const DashboardCaseCard = ({
  caseItem,
  onPress,
}: {
  caseItem: DashboardCase;
  onPress?: () => void;
}) => {
  const statusTone = getStatusTone(caseItem.status);
  const priorityTone = getPriorityTone(caseItem.priority);

  return (
    <TouchableOpacity
      style={styles.dashboardCaseCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.dashboardCaseCardTop}>
        <View style={styles.dashboardCaseCardTitleWrap}>
          <Text style={styles.dashboardCaseTitle} numberOfLines={2}>
            {caseItem.title || caseItem.caseNumber || "Untitled Case"}
          </Text>
          <Text style={styles.dashboardCaseNumber} numberOfLines={1}>
            {caseItem.caseNumber || "No number"}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: statusTone.bg }]}>
          <Text style={[styles.pillText, { color: statusTone.text }]}>
            {caseItem.status || "Active"}
          </Text>
        </View>
      </View>

      <View style={styles.dashboardCaseMeta}>
        <View style={styles.inlineMetaRow}>
          <Scale size={14} color="#64748b" />
          <Text style={styles.inlineMetaText} numberOfLines={1}>
            {caseItem.caseType || "General"}
          </Text>
        </View>
        <View style={styles.inlineMetaRow}>
          <Ionicons name="business-outline" size={14} color="#64748b" />
          <Text style={styles.inlineMetaText} numberOfLines={1}>
            {caseItem.court || "Court not set"}
          </Text>
        </View>
      </View>

      <View style={styles.dashboardCaseFooter}>
        {caseItem.priority && caseItem.priority !== "normal" ? (
          <View style={[styles.pill, { backgroundColor: priorityTone.bg }]}>
            <Text style={[styles.pillText, { color: priorityTone.text }]}>
              {caseItem.priority.charAt(0).toUpperCase() + caseItem.priority.slice(1)}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
};

const HearingRow = ({
  event,
  onPress,
}: {
  event: DashboardEvent;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.hearingRow}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={styles.hearingRowDateBadge}>
      <Text style={styles.hearingRowDateDay}>
        {new Date(event.start).toLocaleDateString("en-US", { day: "2-digit" })}
      </Text>
      <Text style={styles.hearingRowDateMonth}>
        {new Date(event.start).toLocaleDateString("en-US", { month: "short" })}
      </Text>
    </View>
    <View style={styles.hearingRowBody}>
      <Text style={styles.hearingRowTitle} numberOfLines={1}>
        {event.title}
      </Text>
      <Text style={styles.hearingRowSubtitle} numberOfLines={1}>
        {(event.case ? `${event.case} • ` : "") + formatEventTime(event.start)}
      </Text>
    </View>
    <View style={styles.hearingRowTag}>
      <Text style={styles.hearingRowTagText}>{event.type || "Hearing"}</Text>
    </View>
  </TouchableOpacity>
);

const ActivityRow = ({ item }: { item: DashboardActivity }) => (
  <View style={styles.activityRow}>
    <View style={styles.activityIconWrap}>
      <Clock3 size={16} color={BRAND} />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityRowTitle}>{item.title}</Text>
      <Text style={styles.activityRowSubtitle}>{item.subtitle}</Text>
    </View>
    <Text style={styles.activityRowTime}>{item.time}</Text>
  </View>
);

const EmptyStateBlock = ({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) => (
  <View style={styles.emptyStateBlock}>
    <Ionicons name={icon} size={34} color="#cbd5e1" />
    <Text style={styles.emptyStateBlockText}>{title}</Text>
  </View>
);

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

      const [
        summaryResponse,
        recentCasesResponse,
        upcomingEventsResponse,
        notificationsResponse,
        profileResponse,
      ] = await Promise.all([
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
        (caseItem) => {
          const caseNumber = formatDisplayCaseNumber({
            caseNumber: caseItem.caseNumber || caseItem.number || "",
            caseTypeName:
              caseItem.caseSubType || caseItem.eCourt?.caseTypeName || caseItem.caseType || "",
            caseTypeCode: caseItem.eCourt?.caseTypeCode || caseItem.caseCode || "",
          });

          return {
            id: caseItem.id || caseItem._id || "",
            title: caseItem.title,
            caseNumber,
            status: caseItem.status
              ? caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)
              : "Active",
            urgent: Boolean(caseItem.urgent || caseItem.isUrgent),
            court: caseItem.court,
            caseType: formatCaseTypeLabel(
              caseItem.caseSubType || caseItem.caseType || "other"
            ),
            caseSubType: caseItem.caseSubType,
            nextHearingDate: caseItem.nextHearingDate || caseItem.hearingDate,
            priority: getCasePriority({
              status: caseItem.status,
              nextHearingDate: caseItem.nextHearingDate || caseItem.hearingDate,
            }),
          };
        }
      );

      const normalizedEvents = resolveArrayResponse<ApiUpcomingEvent>(
        upcomingEventsResponse
      )
        .map((event) => ({
          id: event.id || event._id || "",
          title: event.title || "Event",
          start: event.start || event.date || new Date().toISOString(),
          type: event.type ? String(event.type) : undefined,
          case: event.case,
        }))
        .sort((a, b) => getEventTimestamp(a.start) - getEventTimestamp(b.start));

      const notifications = resolveArrayResponse<ApiNotification>(notificationsResponse);
      const now = Date.now();

      const upcomingCriticalAlerts: DashboardAlert[] = normalizedEvents
        .filter((event) => {
          const eventTime = new Date(event.start).getTime();
          if (Number.isNaN(eventTime)) return false;
          const diff = eventTime - now;
          return diff >= 0 && diff <= 48 * 60 * 60 * 1000;
        })
        .slice(0, 3)
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
        .filter((caseItem) => caseItem.priority === "urgent" || caseItem.urgent)
        .slice(0, 2)
        .map((caseItem) => ({
          id: `case-${caseItem.id}`,
          title: "Urgent case needs attention",
          subtitle: `${caseItem.caseNumber || caseItem.title || "Case"} is approaching hearing`,
          color: "#ea580c",
        }));

      setAlerts([...upcomingCriticalAlerts, ...urgentCaseAlerts].slice(0, 4));

      setRecentActivity(
        notifications.slice(0, 5).map((notification) => ({
          id: notification._id || Math.random().toString(36).slice(2),
          title: getNotificationTitle(notification.type),
          subtitle: notification.message || "Activity update",
          time: getRelativeTime(notification.createdAt),
        }))
      );

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

  const displayName = profileData?.name || user?.name || "User";
  const firstName = displayName.split(" ")[0] || "User";
  const displayRole = profileData?.role || user?.role || "member";
  const roleLabel =
    displayRole.charAt(0).toUpperCase() + displayRole.slice(1).toLowerCase();
  const todayString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const todayHearings = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    return dashboardData.events.filter((event) => {
      const d = new Date(event.start);
      return d >= todayStart && d < todayEnd;
    }).length;
  }, [dashboardData.events]);

  const unreadActivityCount = recentActivity.length;

  const statusBreakdown = useMemo(
    () => [
      {
        label: "Active",
        value: dashboardData.stats.activeCases,
        color: "#3b82f6",
      },
      {
        label: "Closed",
        value: dashboardData.stats.closedCases,
        color: "#64748b",
      },
      {
        label: "Open hearings",
        value: dashboardData.stats.upcomingHearings,
        color: "#f59e0b",
      },
    ],
    [dashboardData.stats]
  );

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    dashboardData.cases.forEach((caseItem) => {
      const label = caseItem.caseType || "Other";
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([label, value], index) => ({
        label,
        value,
        color: ["#0f766e", "#7c3aed", "#c2410c", "#2563eb", "#be123c"][index % 5],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [dashboardData.cases]);

  const quickActions = [
    {
      icon: "add-circle-outline" as const,
      label: "New case",
      color: "#2563eb",
      onPress: () => router.push("/cases/new"),
    },
    {
      icon: "cloud-upload-outline" as const,
      label: "Upload",
      color: "#0f766e",
      onPress: () => router.push("/upload"),
    },
    {
      icon: "calendar-outline" as const,
      label: "Hearings",
      color: "#7c3aed",
      onPress: () => router.push("/hearings"),
    },
    {
      icon:
        displayRole === "lawyer" || displayRole === "admin"
          ? ("chatbubble-ellipses-outline" as const)
          : ("notifications-outline" as const),
      label: displayRole === "lawyer" || displayRole === "admin" ? "Messages" : "Alerts",
      color: "#c2410c",
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
        <ActivityIndicator size="large" color={BRAND} />
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
      <View style={styles.heroCard}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroTopRow}>
          <View style={styles.heroEyebrowWrap}>
            <Sparkles size={14} color="#93c5fd" />
            <Text style={styles.heroEyebrow}>Advocate workspace</Text>
          </View>
          <View style={styles.heroDatePill}>
            <CalendarDays size={14} color="#bfdbfe" />
            <Text style={styles.heroDateText}>{todayString}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>
          {getGreeting()}, {firstName}
        </Text>
        <Text style={styles.heroSubtitle}>
          You have {todayHearings} hearing{todayHearings !== 1 ? "s" : ""} today and{" "}
          {alerts.length} priority item{alerts.length !== 1 ? "s" : ""} needing attention.
        </Text>
        <View style={styles.heroFooterRow}>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue}>{dashboardData.stats.totalCases}</Text>
            <Text style={styles.heroMetricLabel}>total cases</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue}>{roleLabel}</Text>
            <Text style={styles.heroMetricLabel}>
              {profileData?.specialization || "practice dashboard"}
            </Text>
          </View>
        </View>
      </View>

      {!!errorMessage && (
        <View style={styles.errorCard}>
          <AlertTriangle size={16} color="#991b1b" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRail}
      >
        <StatsRailCard
          title="Active cases"
          value={dashboardData.stats.activeCases}
          subtitle="Live matters in progress"
          icon={<Briefcase size={18} color="#2563eb" />}
          iconBg="#dbeafe"
          onPress={() => router.push("/cases")}
        />
        <StatsRailCard
          title="Total cases"
          value={dashboardData.stats.totalCases}
          subtitle="Across your workspace"
          icon={<Scale size={18} color="#0f766e" />}
          iconBg="#ccfbf1"
          onPress={() => router.push("/cases")}
        />
        <StatsRailCard
          title="Closed"
          value={dashboardData.stats.closedCases}
          subtitle="Resolved and archived"
          icon={<CheckCircle2 size={18} color="#7c3aed" />}
          iconBg="#ede9fe"
          onPress={() => router.push("/cases")}
        />
        <StatsRailCard
          title="Hearings"
          value={dashboardData.stats.upcomingHearings}
          subtitle="Upcoming calendar items"
          icon={<CalendarDays size={18} color="#c2410c" />}
          iconBg="#ffedd5"
          onPress={() => router.push("/hearings")}
        />
        <StatsRailCard
          title="Activity"
          value={unreadActivityCount}
          subtitle="Recent system updates"
          icon={<BellRing size={18} color="#be123c" />}
          iconBg="#ffe4e6"
          onPress={() => router.push("/notifications")}
        />
      </ScrollView>

      <View style={styles.panelCard}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Upcoming hearings</Text>
            <Text style={styles.panelSubtitle}>Next scheduled across your matters</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/hearings")}>
            <Text style={styles.panelLink}>View all</Text>
          </TouchableOpacity>
        </View>
        {dashboardData.events.length > 0 ? (
          dashboardData.events.slice(0, 4).map((event) => (
            <HearingRow
              key={event.id}
              event={event}
              onPress={() => router.push("/hearings")}
            />
          ))
        ) : (
          <EmptyStateBlock icon="calendar-outline" title="No upcoming hearings" />
        )}
      </View>

      <View style={styles.twoUpGrid}>
        <View style={[styles.panelCard, styles.halfPanel]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Cases by status</Text>
              <Text style={styles.panelSubtitle}>Current workload mix</Text>
            </View>
          </View>
          {statusBreakdown.map((item) => (
            <MiniBarRow
              key={item.label}
              label={item.label}
              value={item.value}
              total={dashboardData.stats.totalCases || 1}
              color={item.color}
            />
          ))}
        </View>

        <View style={[styles.panelCard, styles.halfPanel]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Case categories</Text>
              <Text style={styles.panelSubtitle}>Recent matter distribution</Text>
            </View>
          </View>
          {categoryBreakdown.length > 0 ? (
            categoryBreakdown.map((item) => (
              <MiniBarRow
                key={item.label}
                label={item.label}
                value={item.value}
                total={dashboardData.cases.length || 1}
                color={item.color}
              />
            ))
          ) : (
            <EmptyStateBlock icon="layers-outline" title="No category data yet" />
          )}
        </View>
      </View>

      <View style={styles.panelCard}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Recent cases</Text>
            <Text style={styles.panelSubtitle}>Fast access to active matters</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/cases")}>
            <Text style={styles.panelLink}>Open list</Text>
          </TouchableOpacity>
        </View>
        {dashboardData.cases.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.caseCarousel}
          >
            {dashboardData.cases.slice(0, 5).map((caseItem) => (
              <DashboardCaseCard
                key={caseItem.id}
                caseItem={caseItem}
                onPress={() => router.push(`/cases/${caseItem.id}` as any)}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyStateBlock icon="document-text-outline" title="No cases found" />
        )}
      </View>

      <View style={styles.panelCard}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Quick actions</Text>
            <Text style={styles.panelSubtitle}>Common actions from the web dashboard</Text>
          </View>
        </View>
        <View style={styles.quickActionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickActionCard, { backgroundColor: `${action.color}14` }]}
              activeOpacity={0.82}
              onPress={action.onPress}
            >
              <View
                style={[styles.quickActionIconWrap, { backgroundColor: `${action.color}22` }]}
              >
                <Ionicons name={action.icon} size={18} color={action.color} />
              </View>
              <Text style={[styles.quickActionText, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.twoUpGrid}>
        <View style={[styles.panelCard, styles.halfPanel]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Priority alerts</Text>
              <Text style={styles.panelSubtitle}>Items needing attention first</Text>
            </View>
          </View>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.alertRow}>
                <View
                  style={[styles.alertDot, { backgroundColor: alert.color }]}
                />
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertSubtitle}>{alert.subtitle}</Text>
                </View>
              </View>
            ))
          ) : (
            <EmptyStateBlock
              icon="shield-checkmark-outline"
              title="No priority alerts"
            />
          )}
        </View>

        <View style={[styles.panelCard, styles.halfPanel]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Tasks and team</Text>
              <Text style={styles.panelSubtitle}>A compact dashboard snapshot</Text>
            </View>
          </View>
          <View style={styles.teamMetricGrid}>
            <View style={[styles.teamMetricTile, { backgroundColor: "#fff7ed" }]}>
              <Text style={[styles.teamMetricValue, { color: "#c2410c" }]}>
                {alerts.length}
              </Text>
              <Text style={styles.teamMetricLabel}>Overdue</Text>
            </View>
            <View style={[styles.teamMetricTile, { backgroundColor: "#eff6ff" }]}>
              <Text style={[styles.teamMetricValue, { color: "#1d4ed8" }]}>
                {todayHearings}
              </Text>
              <Text style={styles.teamMetricLabel}>Today</Text>
            </View>
            <View style={[styles.teamMetricTile, { backgroundColor: "#f0fdf4" }]}>
              <Text style={[styles.teamMetricValue, { color: "#15803d" }]}>
                {dashboardData.stats.activeCases}
              </Text>
              <Text style={styles.teamMetricLabel}>Live</Text>
            </View>
          </View>
          <View style={styles.teamProfileRow}>
            <View style={styles.teamAvatar}>
              <Users size={16} color={BRAND} />
            </View>
            <View style={styles.teamProfileCopy}>
              <Text style={styles.teamProfileTitle}>{displayName}</Text>
              <Text style={styles.teamProfileSubtitle}>
                {roleLabel}
                {profileData?.specialization ? ` • ${profileData.specialization}` : ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.panelCard, styles.lastPanel]}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Recent activity</Text>
            <Text style={styles.panelSubtitle}>Latest notifications and updates</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Text style={styles.panelLink}>All activity</Text>
          </TouchableOpacity>
        </View>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <ActivityRow key={activity.id} item={activity} />
          ))
        ) : (
          <EmptyStateBlock icon="time-outline" title="No recent activity" />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f6fb",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    padding: 20,
    backgroundColor: BRAND,
  },
  heroGlowOne: {
    position: "absolute",
    top: -48,
    right: -32,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -40,
    right: 70,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  heroEyebrowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  heroEyebrow: {
    color: "#bfdbfe",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroDatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: "100%",
    flexShrink: 1,
  },
  heroDateText: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "#dbeafe",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: "88%",
    marginBottom: 18,
  },
  heroFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  heroMetric: {
    flex: 1,
  },
  heroMetricValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  heroMetricLabel: {
    color: "#bfdbfe",
    fontSize: 12,
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 12,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  statsRail: {
    paddingRight: 6,
    gap: 12,
  },
  statsRailCard: {
    width: 170,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5edf7",
    shadowColor: "#03234b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  statsRailTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statsRailIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRailLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  statsRailValue: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  statsRailMeta: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 4,
  },
  panelCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5edf7",
    shadowColor: "#03234b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  panelTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  panelSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  panelLink: {
    color: BRAND,
    fontSize: 13,
    fontWeight: "700",
  },
  hearingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  hearingRowDateBadge: {
    width: 54,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  hearingRowDateDay: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
  },
  hearingRowDateMonth: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  hearingRowBody: {
    flex: 1,
  },
  hearingRowTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  hearingRowSubtitle: {
    color: "#64748b",
    fontSize: 12,
  },
  hearingRowTag: {
    borderRadius: 999,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hearingRowTagText: {
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "700",
  },
  twoUpGrid: {
    gap: 16,
  },
  halfPanel: {
    minHeight: 180,
  },
  miniBarRow: {
    marginBottom: 12,
  },
  miniBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  miniBarLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  miniBarValue: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
  },
  miniBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  caseCarousel: {
    paddingRight: 6,
    gap: 12,
  },
  dashboardCaseCard: {
    width: 260,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dashboardCaseCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  dashboardCaseCardTitleWrap: {
    flex: 1,
  },
  dashboardCaseTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 4,
  },
  dashboardCaseNumber: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
  dashboardCaseMeta: {
    gap: 8,
    marginBottom: 14,
  },
  inlineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  inlineMetaText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
  },
  dashboardCaseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  quickActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: "48%",
    borderRadius: 18,
    padding: 14,
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  alertSubtitle: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
  },
  teamMetricGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  teamMetricTile: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  teamMetricValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  teamMetricLabel: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
  },
  teamProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 2,
  },
  teamAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#e0ecfb",
    alignItems: "center",
    justifyContent: "center",
  },
  teamProfileCopy: {
    flex: 1,
  },
  teamProfileTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
  },
  teamProfileSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  activityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#eaf2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityRowTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  activityRowSubtitle: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
  },
  activityRowTime: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyStateBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  emptyStateBlockText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  lastPanel: {
    marginBottom: 8,
  },
});
