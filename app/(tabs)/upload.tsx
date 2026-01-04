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
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

// Types
type CaseItem = {
  id: string;
  _id?: string;
  title: string;
  client?: { name: string };
};

type Document = {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  status: string;
  createdAt: string;
};

// Document categories
const DOCUMENT_CATEGORIES = [
  "Pleadings",
  "Evidence",
  "Contracts",
  "Agreements",
  "Court Orders",
  "Statements",
  "Correspondence",
  "Legal Research",
  "Billing",
];

// Get file icon based on type
const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return "document-text";
  if (type.includes("image")) return "image";
  if (type.includes("word")) return "document";
  return "document-outline";
};

// Get file icon color
const getFileIconColor = (type: string) => {
  if (type.includes("pdf")) return "#ef4444";
  if (type.includes("image")) return "#10b981";
  if (type.includes("word")) return "#3b82f6";
  return "#6b7280";
};

// Case Selection Modal
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
}) => {
  return (
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
            keyExtractor={(item) => item.id || item._id || ""}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.caseItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Ionicons name="folder-outline" size={20} color="#6b7280" />
                <View style={styles.caseItemText}>
                  <Text style={styles.caseItemTitle}>{item.title}</Text>
                  {item.client && (
                    <Text style={styles.caseItemSubtitle}>
                      Client: {item.client.name}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="folder-open-outline"
                  size={48}
                  color="#d1d5db"
                />
                <Text style={styles.emptyStateText}>No cases found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

// Category Selection Modal
const CategoryModal = ({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (category: string) => void;
  onClose: () => void;
}) => {
  return (
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
            data={DOCUMENT_CATEGORIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.categoryItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

export default function UploadScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(true);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);

  useEffect(() => {
    loadUser();
    fetchCases();
    fetchRecentDocuments();
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

  const fetchCases = async () => {
    try {
      // Replace with actual API call
      // const response = await api.cases.getAll();

      // Mock data
      const mockCases: CaseItem[] = [
        { id: "1", title: "Smith v. Johnson", client: { name: "John Smith" } },
        {
          id: "2",
          title: "Estate of Williams",
          client: { name: "Sarah Williams" },
        },
      ];

      setCases(mockCases);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setCasesLoading(false);
    }
  };

  const fetchRecentDocuments = async () => {
    try {
      // Replace with actual API call
      // const response = await api.documents.getRecent();

      // Mock data
      const mockDocs: Document[] = [
        {
          id: "1",
          name: "Contract.pdf",
          type: "application/pdf",
          size: 245000,
          category: "Contracts",
          status: "Approved",
          createdAt: new Date().toISOString(),
        },
      ];

      setRecentDocuments(mockDocs);
    } catch (error) {
      console.error("Error fetching recent documents:", error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setSelectedFile(result);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCase) {
      Alert.alert("Missing Information", "Please select a file and case");
      return;
    }

    setLoading(true);
    try {
      // Replace with actual API call
      // const formData = new FormData();
      // formData.append('file', selectedFile);
      // formData.append('caseId', selectedCase.id);
      // formData.append('category', category);
      // formData.append('description', description);
      // formData.append('tags', tags);
      // await api.documents.upload(formData);

      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert("Success", "Document uploaded successfully");

      // Reset form
      setSelectedFile(null);
      setSelectedCase(null);
      setCategory("");
      setDescription("");
      setTags("");

      // Refresh recent documents
      fetchRecentDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      Alert.alert("Error", "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (casesLoading) {
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
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Document</Text>
        <Text style={styles.headerSubtitle}>
          Upload and manage case documents
        </Text>
      </View>

      {/* Upload Form */}
      <View style={styles.uploadCard}>
        {/* File Picker */}
        <TouchableOpacity
          style={styles.filePickerButton}
          onPress={pickDocument}
          disabled={loading}
        >
          <View style={styles.filePickerContent}>
            <Ionicons name="cloud-upload-outline" size={48} color="#6b7280" />
            {selectedFile ? (
              <>
                <Text style={styles.filePickerTextBold}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.filePickerTextSmall}>
                  {formatFileSize(selectedFile.size)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.filePickerText}>Tap to select a file</Text>
                <Text style={styles.filePickerTextSmall}>
                  PDF, DOC, DOCX, Images, etc.
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Case Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Case *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCaseModal(true)}
            disabled={loading}
          >
            <Text
              style={[
                styles.selectButtonText,
                !selectedCase && styles.selectButtonPlaceholder,
              ]}
            >
              {selectedCase ? selectedCase.title : "Select a case"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
          {cases.length === 0 && (
            <Text style={styles.errorText}>No cases available</Text>
          )}
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
            disabled={loading}
          >
            <Text
              style={[
                styles.selectButtonText,
                !category && styles.selectButtonPlaceholder,
              ]}
            >
              {category || "Select a category"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="important, court-filing, etc."
            placeholderTextColor="#9ca3af"
            value={tags}
            onChangeText={setTags}
            editable={!loading}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Document description"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedFile || !selectedCase || loading) &&
              styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedFile || !selectedCase || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload Document</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Uploads</Text>
          {recentDocuments.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <View style={styles.documentIconContainer}>
                <Ionicons
                  name={getFileIcon(doc.type) as any}
                  size={32}
                  color={getFileIconColor(doc.type)}
                />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {doc.name}
                </Text>
                <Text style={styles.documentMeta}>
                  {doc.category} • {formatFileSize(doc.size)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  doc.status === "Approved"
                    ? styles.statusApproved
                    : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    doc.status === "Approved"
                      ? styles.statusTextApproved
                      : styles.statusTextPending,
                  ]}
                >
                  {doc.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Modals */}
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filePickerButton: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    marginBottom: 20,
    backgroundColor: "#f9fafb",
  },
  filePickerContent: {
    alignItems: "center",
  },
  filePickerText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
  },
  filePickerTextBold: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginTop: 12,
  },
  filePickerTextSmall: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: "#111",
  },
  selectButtonPlaceholder: {
    color: "#9ca3af",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: "#dcfce7",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusTextApproved: {
    color: "#166534",
  },
  statusTextPending: {
    color: "#854d0e",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  caseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  caseItemText: {
    flex: 1,
    marginLeft: 12,
  },
  caseItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
    marginBottom: 4,
  },
  caseItemSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryItemText: {
    fontSize: 16,
    color: "#111",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 12,
  },
});
