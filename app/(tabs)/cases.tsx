import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  formatCaseTypeLabel,
  formatDisplayCaseNumber,
  getCaseIdentifier,
} from "../../lib/caseTypeUtils";
import { getCasePriority } from "../../lib/casePriority";

// Types
type CaseItem = {
  id: string;
  title: string;
  number: string;
  identifier: string;
  type: string;
  client?: string;
  court: string;
  status: string;
  priority: string;
  nextHearing?: string;
};

type ApiCase = {
  _id: string;
  title?: string;
  caseNumber?: string;
  caseType?: string;
  client?: { name?: string } | string | null;
  clients?: { name?: string; isPrimary?: boolean }[];
  court?: string;
  status?: string;
  nextHearingDate?: string;
};

const formatCaseStatus = (value?: string) => {
  if (!value) return "Active";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const getClientName = (caseItem: ApiCase) => {
  if (typeof caseItem.client === "string") return caseItem.client;
  if (caseItem.client?.name) return caseItem.client.name;

  if (Array.isArray(caseItem.clients) && caseItem.clients.length > 0) {
    const primaryClient = caseItem.clients.find((client) => client.isPrimary);
    return primaryClient?.name || caseItem.clients[0]?.name;
  }

  return undefined;
};

const mapCaseFromApi = (caseItem: ApiCase): CaseItem => ({
  id: caseItem._id,
  title: caseItem.title || "Untitled Case",
  number:
    formatDisplayCaseNumber({
      caseNumber: caseItem.caseNumber || "",
      caseTypeName: (caseItem as any).caseSubType || (caseItem as any).eCourt?.caseTypeName || "",
      caseTypeCode: (caseItem as any).eCourt?.caseTypeCode || (caseItem as any).caseCode || "",
    }) || "N/A",
  identifier: getCaseIdentifier(caseItem as any),
  type: formatCaseTypeLabel((caseItem as any).caseSubType || caseItem.caseType || "other"),
  client: getClientName(caseItem),
  court: caseItem.court || "N/A",
  status: formatCaseStatus(caseItem.status),
  priority: getCasePriority(caseItem as any),
  nextHearing: caseItem.nextHearingDate,
});

const formatHearingDate = (value?: string) => {
  if (!value) return "No hearing listed";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "No hearing listed";
  }
};

// Case Row Component
const CaseRow = ({
  caseItem,
  isLawyer,
  onPress,
}: {
  caseItem: CaseItem;
  isLawyer: boolean;
  onPress: () => void;
}) => {
  const getStatusColor = (status: string) => {
    return status.toLowerCase() === "active"
      ? { bg: "#dcfce7", text: "#166534" }
      : { bg: "#f3f4f6", text: "#374151" };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return { bg: "#fef2f2", text: "#dc2626" };
      case "high":
        return { bg: "#fff7ed", text: "#c2410c" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const statusColors = getStatusColor(caseItem.status);
  const priorityColors = getPriorityColor(caseItem.priority);
  const hasPriority = caseItem.priority !== "normal";

  return (
    <TouchableOpacity
      style={styles.caseRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.caseAccent,
          hasPriority
            ? { backgroundColor: priorityColors.text }
            : { backgroundColor: "#cbd5e1" },
        ]}
      />
      <View style={styles.caseRowContent}>
        <View style={styles.caseTopRow}>
          <View style={styles.caseMainInfo}>
            <Text style={styles.caseTitle} numberOfLines={1}>
              {caseItem.title}
            </Text>
            <Text style={styles.caseNumber} numberOfLines={1}>
              {caseItem.number}
            </Text>
            {caseItem.identifier && caseItem.identifier !== caseItem.number ? (
              <Text style={styles.caseIdentifier} numberOfLines={1}>
                {caseItem.identifier}
              </Text>
            ) : null}
          </View>

          <View style={styles.topBadges}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
            >
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {caseItem.status}
              </Text>
            </View>
            {hasPriority ? (
              <View
                style={[styles.statusBadge, { backgroundColor: priorityColors.bg }]}
              >
                <Text style={[styles.statusText, { color: priorityColors.text }]}>
                  {caseItem.priority.charAt(0).toUpperCase() + caseItem.priority.slice(1)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaPill}>
            <Ionicons name="folder-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{caseItem.type}</Text>
          </View>
          {isLawyer && caseItem.client && (
            <View style={styles.metaPill}>
              <Ionicons name="person-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>{caseItem.client}</Text>
            </View>
          )}
          <View style={styles.metaPill}>
            <Ionicons name="business-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText} numberOfLines={1}>
              {caseItem.court}
            </Text>
          </View>
        </View>

        <View style={styles.caseFooter}>
          <View style={styles.hearingInfo}>
            <Ionicons name="calendar-outline" size={15} color="#64748b" />
            <Text style={styles.hearingLabel}>Next hearing</Text>
          </View>
          <Text style={styles.hearingText}>
            {formatHearingDate(caseItem.nextHearing)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

// Main Cases Screen
export default function CasesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isLawyer = user?.role === "lawyer";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setErrorMessage("");
      const response = await api.cases.getAll({ page: "1", limit: "100" });

      if (response?.error) {
        setErrorMessage(response.error);
        setCases([]);
        return;
      }

      const apiCases = Array.isArray(response?.data) ? response.data : [];
      setCases(apiCases.map(mapCaseFromApi));
    } catch (error) {
      console.error("Error fetching cases:", error);
      setErrorMessage("Failed to load cases. Please try again.");
      setCases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.court.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      caseItem.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const summary = useMemo(() => {
    const active = cases.filter((item) => item.status.toLowerCase() === "active").length;
    const urgent = cases.filter((item) => item.priority === "urgent").length;
    const upcoming = cases.filter((item) => Boolean(item.nextHearing)).length;

    return [
      { label: "Total", value: String(cases.length) },
      { label: "Active", value: String(active) },
      { label: "Urgent", value: String(urgent) },
      { label: "Listed", value: String(upcoming) },
    ];
  }, [cases]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f2d5c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.controlsCard}>
          <View style={styles.toolbar}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#64748b"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search title, number, court..."
                placeholderTextColor="#94a3b8"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            <TouchableOpacity
              style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons
                name={showFilters ? "close" : "options-outline"}
                size={18}
                color={showFilters ? "#fff" : "#0f172a"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterButtons}
          >
            {["All", "Active", "Closed"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {showFilters ? (
            <View style={styles.filterHint}>
              <Text style={styles.filterHintText}>
                Search matches title, case number, identifier, and court.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="layers-outline" size={14} color="#c7d2fe" />
            <Text style={styles.heroBadgeText}>Case workspace</Text>
          </View>

          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>
                {isLawyer ? "All Cases" : "My Cases"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {filteredCases.length}{" "}
                {filteredCases.length === 1 ? "case" : "cases"} in view
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addCaseButton}
              onPress={() => router.push("/cases/new")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#0f172a" />
              <Text style={styles.addCaseButtonText}>New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            {summary.map((item) => (
              <View key={item.label} style={styles.summaryPill}>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Case List</Text>
          <Text style={styles.listSubtitle}>
            {statusFilter === "All" ? "All statuses" : statusFilter} • {filteredCases.length} shown
          </Text>
        </View>

        {filteredCases.length > 0 ? (
          filteredCases.map((caseItem) => (
            <CaseRow
              key={caseItem.id}
              caseItem={caseItem}
              isLawyer={isLawyer}
              onPress={() => router.push(`/cases/${caseItem.id}`)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open-outline" size={34} color="#94a3b8" />
            </View>
            <Text style={styles.emptyStateTitle}>No cases found</Text>
            <Text style={styles.emptyStateText}>
              {errorMessage
                ? errorMessage
                : searchTerm
                  ? "Try adjusting your search or filters"
                  : "Add your first case to get started"}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push("/cases/new")}
            >
              <Text style={styles.emptyStateButtonText}>Add New Case</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/cases/new")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  controlsCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  heroCard: {
    backgroundColor: "#0f2d5c",
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    overflow: "hidden",
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
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dbeafe",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.7,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#d7e6ff",
    marginTop: 4,
  },
  addCaseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addCaseButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
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
    color: "#ffffff",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#c7d8f8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
  filterToggle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  filterToggleActive: {
    backgroundColor: "#0f2d5c",
    borderColor: "#0f2d5c",
  },
  filterButtons: {
    gap: 8,
    paddingRight: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  filterChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  filterHint: {
    marginTop: 10,
    paddingHorizontal: 2,
  },
  filterHintText: {
    fontSize: 12,
    color: "#64748b",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 96,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  listSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  caseRow: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    shadowColor: "#8da2bf",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  caseAccent: {
    width: 4,
    borderRadius: 999,
    marginRight: 14,
  },
  caseRowContent: {
    flex: 1,
  },
  caseTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  caseMainInfo: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  caseNumber: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  caseIdentifier: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 3,
  },
  topBadges: {
    alignItems: "flex-end",
    gap: 6,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaText: {
    fontSize: 12,
    color: "#475569",
    maxWidth: 210,
  },
  caseFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  hearingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hearingLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  hearingText: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  emptyIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 999,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
