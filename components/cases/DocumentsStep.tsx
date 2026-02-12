import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    selectedFiles: any[];
    uploadProgress: Record<string, number>;
    handleFileChange: () => void;
};

export default function DocumentsStep({
    selectedFiles,
    uploadProgress,
    handleFileChange,
}: Props) {
    const requiredDocs = [
        { id: "doc1", label: "Petition/Complaint" },
        { id: "doc2", label: "Affidavit" },
        { id: "doc3", label: "Power of Attorney" },
        { id: "doc4", label: "Evidence Documents" },
        { id: "doc5", label: "Court Fee Receipt" },
    ];

    const [checkedDocs, setCheckedDocs] = React.useState<Record<string, boolean>>(
        {}
    );

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="folder-open-outline" size={22} color="#000" />
                <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Case Documents</Text>
                    <Text style={styles.sectionSubtitle}>
                        Upload and manage documents related to this case
                    </Text>
                </View>
            </View>

            {/* Upload Area */}
            <TouchableOpacity style={styles.uploadArea} onPress={handleFileChange}>
                <View style={styles.uploadIcon}>
                    <Ionicons name="cloud-upload-outline" size={36} color="#9ca3af" />
                </View>
                <Text style={styles.uploadTitle}>Tap to select files</Text>
                <Text style={styles.uploadSubtitle}>
                    PDF, DOC, DOCX, JPG, PNG supported
                </Text>
            </TouchableOpacity>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <View style={styles.filesSection}>
                    <Text style={styles.filesSectionTitle}>
                        Selected Files ({selectedFiles.length})
                    </Text>
                    {selectedFiles.map((file, index) => {
                        const progress = uploadProgress[file.name] || 0;
                        const isUploaded = progress === 100;
                        const isUploading = progress > 0 && progress < 100;

                        return (
                            <View key={index} style={styles.fileItem}>
                                <View style={styles.fileInfo}>
                                    <Ionicons
                                        name={isUploaded ? "checkmark-circle" : "document-outline"}
                                        size={20}
                                        color={isUploaded ? "#22c55e" : "#6b7280"}
                                    />
                                    <View style={styles.fileDetails}>
                                        <Text style={styles.fileName} numberOfLines={1}>
                                            {file.name}
                                        </Text>
                                        <Text style={styles.fileSize}>
                                            {formatFileSize(file.size || 0)}
                                        </Text>
                                    </View>
                                </View>
                                {isUploading && (
                                    <View style={styles.progressContainer}>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[styles.progressFill, { width: `${progress}%` }]}
                                            />
                                        </View>
                                        <Text style={styles.progressText}>{progress}%</Text>
                                    </View>
                                )}
                                {isUploaded && (
                                    <Text style={styles.uploadedText}>Uploaded</Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Required Documents Checklist */}
            <View style={styles.checklistSection}>
                <Text style={styles.checklistTitle}>Required Documents</Text>
                <Text style={styles.checklistSubtitle}>
                    Check off documents as you prepare them
                </Text>
                {requiredDocs.map((doc) => (
                    <TouchableOpacity
                        key={doc.id}
                        style={styles.checklistItem}
                        onPress={() =>
                            setCheckedDocs((prev) => ({
                                ...prev,
                                [doc.id]: !prev[doc.id],
                            }))
                        }
                    >
                        <View
                            style={[
                                styles.checkbox,
                                checkedDocs[doc.id] && styles.checkboxChecked,
                            ]}
                        >
                            {checkedDocs[doc.id] && (
                                <Ionicons name="checkmark" size={14} color="#fff" />
                            )}
                        </View>
                        <Text
                            style={[
                                styles.checklistLabel,
                                checkedDocs[doc.id] && styles.checklistLabelChecked,
                            ]}
                        >
                            {doc.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    sectionHeaderText: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
    sectionSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
    uploadArea: {
        borderWidth: 2,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
        borderRadius: 16,
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        backgroundColor: "#fafafa",
    },
    uploadIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#f3f4f6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    uploadTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 4,
    },
    uploadSubtitle: {
        fontSize: 13,
        color: "#9ca3af",
    },
    filesSection: {
        marginBottom: 24,
    },
    filesSectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111",
        marginBottom: 12,
    },
    fileItem: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    fileInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    fileDetails: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#111",
    },
    fileSize: {
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: "#e5e7eb",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#000",
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "500",
        width: 36,
        textAlign: "right",
    },
    uploadedText: {
        fontSize: 12,
        color: "#22c55e",
        fontWeight: "500",
        marginTop: 4,
        textAlign: "right",
    },
    checklistSection: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
    },
    checklistTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111",
        marginBottom: 4,
    },
    checklistSubtitle: {
        fontSize: 12,
        color: "#9ca3af",
        marginBottom: 16,
    },
    checklistItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#d1d5db",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    checkboxChecked: {
        backgroundColor: "#000",
        borderColor: "#000",
    },
    checklistLabel: {
        fontSize: 14,
        color: "#374151",
    },
    checklistLabelChecked: {
        color: "#9ca3af",
        textDecorationLine: "line-through",
    },
});
