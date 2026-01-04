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
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Types
type CaseItem = {
  id: string;
  title: string;
  number: string;
  type: string;
  client?: string;
  court: string;
  status: string;
  nextHearing?: string;
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

  const statusColors = getStatusColor(caseItem.status);

  return (
    <TouchableOpacity
      style={styles.caseRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.caseRowContent}>
        {/* Title & Number */}
        <View style={styles.caseMainInfo}>
          <Text style={styles.caseTitle} numberOfLines={1}>
            {caseItem.title}
          </Text>
          <Text style={styles.caseNumber}>{caseItem.number}</Text>
        </View>

        {/* Type & Client */}
        <View style={styles.caseMetaInfo}>
          <View style={styles.metaRow}>
            <Ionicons name="folder-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{caseItem.type}</Text>
          </View>
          {isLawyer && caseItem.client && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={14} color="#6b7280" />
              <Text style={styles.metaText}>{caseItem.client}</Text>
            </View>
          )}
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={14} color="#6b7280" />
            <Text style={styles.metaText} numberOfLines={1}>
              {caseItem.court}
            </Text>
          </View>
        </View>

        {/* Status & Next Hearing */}
        <View style={styles.caseFooter}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {caseItem.status}
            </Text>
          </View>
          {caseItem.nextHearing && (
            <View style={styles.hearingInfo}>
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text style={styles.hearingText}>
                {new Date(caseItem.nextHearing).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
};

// Main Cases Screen
export default function CasesScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLawyer, setIsLawyer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUser();
    fetchCases();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLawyer(userData.role === "lawyer");
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const fetchCases = async () => {
    try {
      // Replace with actual API call
      // const response = await api.cases.getAll();

      // Mock data for now
      const mockCases = isLawyer ? lawyerCases : clientCases;
      setCases(mockCases);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.court.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      caseItem.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>
              {isLawyer ? "All Cases" : "My Cases"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {filteredCases.length}{" "}
              {filteredCases.length === 1 ? "case" : "cases"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/cases/new")}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cases..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name={showFilters ? "close" : "filter-outline"}
              size={20}
              color="#111"
            />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterButtons}>
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
            </View>
          </View>
        )}
      </View>

      {/* Cases List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
            <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No cases found</Text>
            <Text style={styles.emptyStateText}>
              {searchTerm
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
    </View>
  );
}

// Mock Data
const lawyerCases: CaseItem[] = [
  {
    id: "case-1",
    title: "Smith v. Johnson",
    number: "CV-2023-1234",
    type: "Civil Litigation",
    client: "John Smith",
    status: "Active",
    court: "Bangalore Urban District Court",
    nextHearing: "2023-12-15",
  },
  {
    id: "case-2",
    title: "Estate of Williams",
    number: "PR-2023-5678",
    type: "Probate",
    client: "Sarah Williams",
    status: "Active",
    court: "Karnataka High Court",
  },
  {
    id: "case-3",
    title: "Brown LLC v. Davis Corp",
    number: "CV-2023-9012",
    type: "Corporate",
    client: "Brown LLC",
    status: "Active",
    court: "Commercial Court",
    nextHearing: "2023-12-20",
  },
];

const clientCases: CaseItem[] = [
  {
    id: "case-1",
    title: "Property Dispute",
    number: "CV-2023-4567",
    type: "Civil",
    status: "Active",
    court: "Bangalore Urban District Court",
    nextHearing: "2023-06-15",
  },
  {
    id: "case-2",
    title: "Insurance Claim",
    number: "CC-2023-7890",
    type: "Consumer",
    status: "Active",
    court: "Consumer Court",
    nextHearing: "2023-06-22",
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111",
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  caseRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  caseRowContent: {
    flex: 1,
  },
  caseMainInfo: {
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  caseNumber: {
    fontSize: 13,
    color: "#6b7280",
  },
  caseMetaInfo: {
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#6b7280",
    flex: 1,
  },
  caseFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  hearingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hearingText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
