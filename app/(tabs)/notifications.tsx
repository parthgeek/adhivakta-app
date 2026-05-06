import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

type NotificationItem = {
  _id: string;
  type: string;
  message: string;
  link?: string;
  read?: boolean;
  createdAt: string;
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "case_invitation":
    case "case_update":
      return { name: "briefcase-outline", color: "#007AFF" };
    case "event_reminder":
      return { name: "calendar-outline", color: "#FF9500" };
    case "document_upload":
      return { name: "document-text-outline", color: "#34C759" };
    default:
      return { name: "notifications-outline", color: "#5856D6" };
  }
};

const getRelativeTime = (dateString: string) => {
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

const formatNotificationTitle = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await api.notifications.getAll();

      if (result?.error) {
        setErrorMessage(result.error);
        setNotifications([]);
        return;
      }

      const list = Array.isArray(result?.data) ? result.data : [];
      setNotifications(list);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setErrorMessage("Failed to load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationPress = async (item: NotificationItem) => {
    if (item.read) return;

    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === item._id ? { ...notification, read: true } : notification
      )
    );

    const result = await api.notifications.markAsRead(item._id);
    if (result?.error) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === item._id ? { ...notification, read: false } : notification
        )
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name as any} color={icon.color} size={24} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{formatNotificationTitle(item.type)}</Text>
            <Text style={styles.time}>{getRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!!errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.heroCard}>
              <View style={styles.heroBadge}>
                <Ionicons name="notifications-outline" color="#c7d2fe" size={14} />
                <Text style={styles.heroBadgeText}>Alerts workspace</Text>
              </View>

              <Text style={styles.heroTitle}>Notifications</Text>
              <Text style={styles.heroSubtitle}>
                {notifications.length} update{notifications.length === 1 ? "" : "s"} in your
                feed
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryValue}>{unreadCount}</Text>
                  <Text style={styles.summaryLabel}>Unread</Text>
                </View>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryValue}>
                    {notifications.length - unreadCount}
                  </Text>
                  <Text style={styles.summaryLabel}>Read</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.sectionHint}>Tap to mark read</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" color="#C7C7CC" size={64} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>Updates and reminders will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4fb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef4fb",
  },
  listHeader: {
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: "#0f2d5c",
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dbeafe",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#dbe7ff",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#c7d8f8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionHint: {
    fontSize: 12,
    color: "#64748b",
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    padding: 12,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    marginBottom: 10,
    shadowColor: "#8da2bf",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  unreadItem: {
    backgroundColor: "#f8fbff",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  time: {
    fontSize: 12,
    color: "#94a3b8",
  },
  message: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0f2d5c",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    paddingVertical: 56,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});
