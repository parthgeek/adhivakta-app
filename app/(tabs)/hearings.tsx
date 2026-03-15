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
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

type Hearing = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  case: string;
};

type ApiEvent = {
  _id: string;
  title?: string;
  date?: string;
  time?: string;
  type?: string;
  location?: string;
  description?: string;
  case?: string | { title?: string };
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isUpcoming = (dateStr: string) => {
  return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
};

export default function HearingsScreen() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHearings = async () => {
    try {
      const data = await api.events.getAll({ type: "hearing" });
      const events: ApiEvent[] = Array.isArray(data)
        ? data
        : data?.events ?? data?.data ?? [];

      const mapped: Hearing[] = events
        .filter((e) => e.type === "hearing")
        .map((e) => ({
          id: e._id,
          title: e.title ?? "Court Hearing",
          date: e.date ?? "",
          time: e.time ?? "",
          location: e.location ?? "",
          description: e.description ?? "",
          case:
            typeof e.case === "string"
              ? e.case
              : e.case?.title ?? "",
        }));

      setHearings(mapped);
    } catch (error) {
      console.error("Error fetching hearings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHearings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHearings();
  }, []);

  const upcoming = hearings.filter((h) => h.date && isUpcoming(h.date));
  const past = hearings.filter((h) => h.date && !isUpcoming(h.date));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {hearings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No hearings found</Text>
        </View>
      ) : (
        <>
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcoming.map((h) => (
                <HearingCard key={h.id} hearing={h} />
              ))}
            </View>
          )}
          {past.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past</Text>
              {past.map((h) => (
                <HearingCard key={h.id} hearing={h} />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function HearingCard({ hearing }: { hearing: Hearing }) {
  const upcoming = hearing.date && isUpcoming(hearing.date);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={[styles.cardAccent, { backgroundColor: upcoming ? "#2563eb" : "#9ca3af" }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{hearing.title}</Text>
        {hearing.case ? (
          <Text style={styles.cardCase}>{hearing.case}</Text>
        ) : null}
        <View style={styles.cardMeta}>
          {hearing.date ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color="#6b7280" />
              <Text style={styles.metaText}>{formatDate(hearing.date)}</Text>
            </View>
          ) : null}
          {hearing.time ? (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color="#6b7280" />
              <Text style={styles.metaText}>{hearing.time}</Text>
            </View>
          ) : null}
          {hearing.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color="#6b7280" />
              <Text style={styles.metaText}>{hearing.location}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#9ca3af",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: "hidden",
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  cardCase: {
    fontSize: 13,
    color: "#2563eb",
    marginBottom: 8,
  },
  cardMeta: {
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
  },
});
