import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import api from "../../services/api";
import {
  formatDisplayCaseNumber,
  formatCaseTypeLabel,
  getCaseIdentifier,
} from "../../lib/caseTypeUtils";

type ApiCase = {
  _id: string;
  title?: string;
  caseNumber?: string;
  caseType?: string;
  caseSubType?: string;
  caseCode?: string;
  court?: string;
  client?: { name?: string } | string | null;
  clients?: { name?: string; isPrimary?: boolean }[];
  eCourt?: {
    caseTypeName?: string;
    caseTypeCode?: string;
  };
};

type CaseItem = {
  id: string;
  title: string;
  number: string;
  identifier: string;
  type: string;
  court: string;
  clientName?: string;
};

type ApiDocument = {
  _id: string;
  name?: string;
  originalName?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  category?: string;
  status?: string;
  approvalStatus?: string;
  createdAt?: string;
  case?: {
    _id?: string;
    title?: string;
    caseNumber?: string;
    caseSubType?: string;
    caseType?: string;
    eCourt?: {
      caseTypeName?: string;
      caseTypeCode?: string;
    };
  } | string | null;
  caseTitle?: string;
};

type RecentDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  status: string;
  createdAt: string;
  caseId?: string;
  caseTitle?: string;
  caseNumber?: string;
  caseIdentifier?: string;
};

type SelectedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

type CategoryOption = {
  value: string;
  label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "pleading", label: "Pleadings" },
  { value: "evidence", label: "Evidence" },
  { value: "order", label: "Orders" },
  { value: "correspondence", label: "Correspondence" },
  { value: "other", label: "Other" },
];

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
      caseTypeName:
        caseItem.caseSubType || caseItem.eCourt?.caseTypeName || "",
      caseTypeCode: caseItem.eCourt?.caseTypeCode || caseItem.caseCode || "",
    }) || "N/A",
  identifier: getCaseIdentifier(caseItem as any),
  type: formatCaseTypeLabel(caseItem.caseSubType || caseItem.caseType || "other"),
  court: caseItem.court || "Court not specified",
  clientName: getClientName(caseItem),
});

const normalizeCategory = (category?: string) => {
  const value = (category || "").toLowerCase();

  if (value === "pleading" || value === "affidavit") return "pleading";
  if (value === "evidence" || value === "report") return "evidence";
  if (value === "order" || value === "judgment") return "order";
  if (value === "correspondence" || value === "notice" || value === "memo") {
    return "correspondence";
  }

  return "other";
};

const getCategoryLabel = (category?: string) => {
  const normalized = normalizeCategory(category);
  return (
    CATEGORY_OPTIONS.find((option) => option.value === normalized)?.label ||
    "Other"
  );
};

const normalizeStatus = (status?: string, approvalStatus?: string) => {
  const value = (approvalStatus || status || "").toLowerCase();

  if (value === "approved" || value === "active") return "approved";
  if (value === "pending" || value === "draft") return "pending";
  if (value === "rejected" || value === "archived" || value === "deleted") {
    return "rejected";
  }

  return "pending";
};

const getStatusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const getStatusColors = (status: string) => {
  switch (status) {
    case "approved":
      return { bg: "#dcfce7", text: "#166534" };
    case "rejected":
      return { bg: "#fef2f2", text: "#b91c1c" };
    default:
      return { bg: "#fef3c7", text: "#854d0e" };
  }
};

const getCategoryColors = (category: string) => {
  switch (category) {
    case "pleading":
      return { bg: "#dbeafe", text: "#1d4ed8" };
    case "evidence":
      return { bg: "#dcfce7", text: "#166534" };
    case "order":
      return { bg: "#ede9fe", text: "#6d28d9" };
    case "correspondence":
      return { bg: "#ffedd5", text: "#c2410c" };
    default:
      return { bg: "#f3f4f6", text: "#4b5563" };
  }
};

const getFileIcon = (type: string) => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("pdf")) return "document-text";
  if (normalizedType.includes("image")) return "image";
  if (normalizedType.includes("word")) return "document";
  return "document-outline";
};

const getFileIconColor = (type: string) => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("pdf")) return "#ef4444";
  if (normalizedType.includes("image")) return "#10b981";
  if (normalizedType.includes("word")) return "#2563eb";
  return "#6b7280";
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDocumentDate = (value?: string) => {
  if (!value) return "Just now";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Just now";
  }
};

const mapDocumentFromApi = (documentItem: ApiDocument): RecentDocument => {
  const caseData =
    documentItem.case && typeof documentItem.case === "object"
      ? documentItem.case
      : null;

  const normalizedCategory = normalizeCategory(documentItem.category);
  const normalizedStatus = normalizeStatus(
    documentItem.status,
    documentItem.approvalStatus
  );

  return {
    id: documentItem._id,
    name:
      documentItem.name || documentItem.originalName || "Untitled Document",
    type:
      documentItem.mimeType ||
      documentItem.type ||
      "application/octet-stream",
    size: documentItem.size || 0,
    category: normalizedCategory,
    status: normalizedStatus,
    createdAt: documentItem.createdAt || "",
    caseId: caseData?._id,
    caseTitle: caseData?.title || documentItem.caseTitle || "Case document",
    caseNumber:
      formatDisplayCaseNumber({
        caseNumber: caseData?.caseNumber || "",
        caseTypeName:
          caseData?.caseSubType || caseData?.eCourt?.caseTypeName || "",
        caseTypeCode: caseData?.eCourt?.caseTypeCode || "",
      }) || undefined,
    caseIdentifier: caseData ? getCaseIdentifier(caseData as any) : undefined,
  };
};

const CaseSelectionModal = ({
  visible,
  cases,
  onSelect,
  onClose,
}: {
  visible: boolean;
  cases: CaseItem[];
  onSelect: (caseItem: CaseItem) => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Case</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={cases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.caseItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View style={styles.caseIconWrap}>
                <Ionicons name="folder-open-outline" size={20} color="#0f2d5c" />
              </View>
              <View style={styles.caseItemText}>
                <Text style={styles.caseItemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.caseItemNumber} numberOfLines={1}>
                  {item.number}
                </Text>
                {item.clientName ? (
                  <Text style={styles.caseItemSubtitle} numberOfLines={1}>
                    {item.clientName}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={44} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>No cases found</Text>
              <Text style={styles.emptyStateText}>
                Create a case first to upload documents against it.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  </Modal>
);

const CategoryModal = ({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (category: string) => void;
  onClose: () => void;
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={CATEGORY_OPTIONS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
            >
              <Text style={styles.categoryItemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

export default function UploadScreen() {
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);

  const loadDocuments = useCallback(
    async (targetCaseId?: string) => {
      const response = await api.documents.getAll({
        page: "1",
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(targetCaseId ? { caseId: targetCaseId } : {}),
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      const apiDocuments = Array.isArray(response?.data) ? response.data : [];
      setRecentDocuments(apiDocuments.map(mapDocumentFromApi));
    },
    []
  );

  const loadPageData = useCallback(async () => {
    try {
      setErrorMessage("");

      const [casesResponse, documentsResponse] = await Promise.all([
        api.cases.getAll({ page: "1", limit: "100" }),
        api.documents.getAll({
          page: "1",
          limit: "10",
          sortBy: "createdAt",
          sortOrder: "desc",
          ...(caseId ? { caseId } : {}),
        }),
      ]);

      if (casesResponse?.error) {
        throw new Error(casesResponse.error);
      }

      if (documentsResponse?.error) {
        throw new Error(documentsResponse.error);
      }

      const apiCases: ApiCase[] = Array.isArray(casesResponse?.data)
        ? casesResponse.data
        : [];
      const mappedCases = apiCases.map(mapCaseFromApi);
      setCases(mappedCases);

      if (caseId) {
        const preselectedCase = mappedCases.find((item) => item.id === caseId);
        setSelectedCase(preselectedCase || null);
      }

      const apiDocuments: ApiDocument[] = Array.isArray(documentsResponse?.data)
        ? documentsResponse.data
        : [];
      setRecentDocuments(apiDocuments.map(mapDocumentFromApi));
    } catch (error: any) {
      console.error("Error loading upload page:", error);
      setErrorMessage(error.message || "Failed to load documents.");
      setCases([]);
      setRecentDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (loading) return;

    loadDocuments(selectedCase?.id).catch((error: any) => {
      console.error("Error refreshing documents:", error);
      setErrorMessage(error.message || "Failed to load documents.");
    });
  }, [loadDocuments, loading, selectedCase?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPageData();
  };

  const selectedCategoryLabel = useMemo(
    () => getCategoryLabel(category),
    [category]
  );

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || "application/octet-stream",
          size: asset.size || 0,
        });
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const scanDocument = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ImagePicker = require("expo-image-picker");
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to scan documents."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: `scan_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          size: asset.fileSize || 0,
        });
      }
    } catch (error) {
      console.error("Error scanning document:", error);
      Alert.alert(
        "Scanner Unavailable",
        "Document scanning requires a development build. Use Choose File instead."
      );
    }
  };

  const handleUpload = async () => {
    if (!selectedCase) {
      Alert.alert("Missing Case", "Select the case this document belongs to.");
      return;
    }

    if (!selectedFile) {
      Alert.alert("Missing File", "Choose the document you want to upload.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      } as any);
      formData.append("caseId", selectedCase.id);
      formData.append("name", selectedFile.name);
      formData.append(
        "description",
        description.trim() || `Document for case ${selectedCase.title}`
      );
      formData.append("category", category);

      if (tags.trim()) {
        formData.append("tags", tags.trim());
      }

      const response = await api.documents.uploadToCaseId(
        selectedCase.id,
        formData,
        (event) => {
          if (!event.lengthComputable || !event.total) return;
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      );

      if (response?.error) {
        throw new Error(response.error);
      }

      Alert.alert("Success", "Document uploaded successfully.");
      setSelectedFile(null);
      setDescription("");
      setTags("");
      setCategory("other");
      setUploadProgress(0);
      await loadDocuments(caseId || selectedCase.id);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      Alert.alert("Error", error.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f2d5c" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Ionicons name="folder-open-outline" size={14} color="#c7d2fe" />
          <Text style={styles.headerBadgeText}>Case-linked uploads</Text>
        </View>
        <Text style={styles.headerTitle}>Upload documents to cases</Text>
        <Text style={styles.headerSubtitle}>
          Every document is attached to a real case, with category and recent
          history matching the web flow.
        </Text>
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.uploadCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>New Document</Text>
          <Text style={styles.cardSubtitle}>
            Select a case, choose a file, and upload it with the right category.
          </Text>
        </View>

        <View style={styles.pickerRow}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={pickDocument}
            disabled={uploading}
          >
            <Ionicons name="folder-open-outline" size={28} color="#0f2d5c" />
            <Text style={styles.pickerButtonText}>Choose File</Text>
            <Text style={styles.pickerButtonSubtext}>PDF, DOC, images</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={scanDocument}
            disabled={uploading}
          >
            <Ionicons name="scan-outline" size={28} color="#0f2d5c" />
            <Text style={styles.pickerButtonText}>Scan Document</Text>
            <Text style={styles.pickerButtonSubtext}>Use camera</Text>
          </TouchableOpacity>
        </View>

        {selectedFile ? (
          <View style={styles.selectedFileCard}>
            <View style={styles.selectedFileIcon}>
              <Ionicons
                name={getFileIcon(selectedFile.mimeType) as any}
                size={20}
                color={getFileIconColor(selectedFile.mimeType)}
              />
            </View>
            <View style={styles.selectedFileContent}>
              <Text style={styles.selectedFileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={styles.selectedFileMeta}>
                {formatFileSize(selectedFile.size)} • {selectedFile.mimeType}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Case *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCaseModal(true)}
            disabled={uploading}
          >
            <View style={styles.selectButtonContent}>
              <Text
                style={[
                  styles.selectButtonText,
                  !selectedCase && styles.selectButtonPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedCase ? selectedCase.title : "Select a case"}
              </Text>
              {selectedCase ? (
                <Text style={styles.selectButtonMeta} numberOfLines={1}>
                  {selectedCase.number}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
          {cases.length === 0 ? (
            <Text style={styles.errorText}>
              No cases available. Create a case before uploading documents.
            </Text>
          ) : null}
        </View>

        {selectedCase ? (
          <View style={styles.caseSummaryCard}>
            <View style={styles.caseSummaryRow}>
              <Text style={styles.caseSummaryLabel}>Case Number</Text>
              <Text style={styles.caseSummaryValue} numberOfLines={1}>
                {selectedCase.number}
              </Text>
            </View>
            <View style={styles.caseSummaryRow}>
              <Text style={styles.caseSummaryLabel}>Case Type</Text>
              <Text style={styles.caseSummaryValue}>{selectedCase.type}</Text>
            </View>
            <View style={styles.caseSummaryRow}>
              <Text style={styles.caseSummaryLabel}>Court</Text>
              <Text style={styles.caseSummaryValue} numberOfLines={1}>
                {selectedCase.court}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
            disabled={uploading}
          >
            <Text style={styles.selectButtonText}>{selectedCategoryLabel}</Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            placeholder="draft, evidence, hearing"
            placeholderTextColor="#94a3b8"
            value={tags}
            onChangeText={setTags}
            editable={!uploading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add context for this case document"
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!uploading}
          />
        </View>

        {uploading ? (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(uploadProgress, 8)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>Uploading {uploadProgress}%</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedFile || !selectedCase || uploading || cases.length === 0) &&
              styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedFile || !selectedCase || uploading || cases.length === 0}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload Document</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedCase ? "Case Documents" : "Recent Uploads"}
          </Text>
          {selectedCase ? (
            <Text style={styles.sectionHint} numberOfLines={1}>
              {selectedCase.title}
            </Text>
          ) : null}
        </View>

        {recentDocuments.length > 0 ? (
          recentDocuments.map((doc) => {
            const statusColors = getStatusColors(doc.status);
            const categoryColors = getCategoryColors(doc.category);

            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (doc.caseId) {
                    router.push(`/cases/${doc.caseId}` as any);
                  }
                }}
              >
                <View style={styles.documentIconContainer}>
                  <Ionicons
                    name={getFileIcon(doc.type) as any}
                    size={28}
                    color={getFileIconColor(doc.type)}
                  />
                </View>

                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.documentCaseTitle} numberOfLines={1}>
                    {doc.caseTitle}
                  </Text>
                  {doc.caseIdentifier ? (
                    <Text style={styles.documentCaseNumber} numberOfLines={1}>
                      {doc.caseIdentifier}
                    </Text>
                  ) : doc.caseNumber ? (
                    <Text style={styles.documentCaseNumber} numberOfLines={1}>
                      {doc.caseNumber}
                    </Text>
                  ) : null}
                  <Text style={styles.documentMeta}>
                    {formatFileSize(doc.size)} • {formatDocumentDate(doc.createdAt)}
                  </Text>
                  <View style={styles.documentBadgeRow}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: categoryColors.bg },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: categoryColors.text }]}
                      >
                        {getCategoryLabel(doc.category)}
                      </Text>
                    </View>
                    <View
                      style={[styles.badge, { backgroundColor: statusColors.bg }]}
                    >
                      <Text
                        style={[styles.badgeText, { color: statusColors.text }]}
                      >
                        {getStatusLabel(doc.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {doc.caseId ? (
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                ) : null}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyRecentState}>
            <Ionicons name="document-outline" size={42} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No documents yet</Text>
            <Text style={styles.emptyStateText}>
              Uploaded files for your cases will appear here.
            </Text>
          </View>
        )}
      </View>

      <CaseSelectionModal
        visible={showCaseModal}
        cases={cases}
        onSelect={setSelectedCase}
        onClose={() => setShowCaseModal(false)}
      />
      <CategoryModal
        visible={showCategoryModal}
        onSelect={setCategory}
        onClose={() => setShowCategoryModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff4fb",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eff4fb",
  },
  header: {
    backgroundColor: "#0f2d5c",
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    overflow: "hidden",
  },
  headerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dbeafe",
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#dbe7ff",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#991b1b",
  },
  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  cardHeader: {
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: "#f8fbff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d6e3f3",
    paddingVertical: 18,
    alignItems: "center",
    gap: 6,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  pickerButtonSubtext: {
    fontSize: 12,
    color: "#64748b",
  },
  selectedFileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 16,
  },
  selectedFileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedFileContent: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  selectedFileMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d7e0ec",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
    gap: 12,
  },
  selectButtonContent: {
    flex: 1,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  selectButtonMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
  selectButtonPlaceholder: {
    color: "#94a3b8",
  },
  caseSummaryCard: {
    backgroundColor: "#f8fbff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dce7f5",
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  caseSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  caseSummaryLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  caseSummaryValue: {
    flex: 1.4,
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d7e0ec",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#dc2626",
  },
  progressSection: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0f2d5c",
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f2d5c",
    borderRadius: 16,
    paddingVertical: 15,
  },
  uploadButtonDisabled: {
    opacity: 0.45,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  recentSection: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionHint: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "#64748b",
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    padding: 14,
    marginBottom: 10,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  documentCaseTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 2,
  },
  documentCaseNumber: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },
  documentBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyRecentState: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "72%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  caseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  caseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  caseItemText: {
    flex: 1,
  },
  caseItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  caseItemNumber: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 2,
  },
  caseItemSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  categoryItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
    textAlign: "center",
  },
});
