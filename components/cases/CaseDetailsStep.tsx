import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    ScrollView,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    CASE_TYPES,
    STATUSES,
    PRIORITIES,
    CASE_STAGES,
} from "../../constants/caseConstants";

type PickerOption = { value: string; label: string };

type Props = {
    caseData: any;
    handleChange: (name: string, value: string) => void;
    handleSelectChange: (name: string, value: string) => void;
    handleDateChange: (name: string, date: Date | null) => void;
    handleCheckboxChange: (name: string, checked: boolean) => void;
};

// Simple picker modal component
const PickerField = ({
    label,
    options,
    value,
    onSelect,
    required,
}: {
    label: string;
    options: PickerOption[];
    value: string;
    onSelect: (value: string) => void;
    required?: boolean;
}) => {
    const [showPicker, setShowPicker] = React.useState(false);
    const selectedLabel = options.find((o) => o.value === value)?.label || "Select...";

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPicker(!showPicker)}
            >
                <Text
                    style={[
                        styles.pickerButtonText,
                        !value && styles.pickerPlaceholder,
                    ]}
                >
                    {value ? selectedLabel : "Select..."}
                </Text>
                <Ionicons
                    name={showPicker ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#6b7280"
                />
            </TouchableOpacity>
            {showPicker && (
                <View style={styles.pickerDropdown}>
                    <ScrollView
                        style={styles.pickerScrollView}
                        nestedScrollEnabled={true}
                    >
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.pickerOption,
                                    value === option.value && styles.pickerOptionSelected,
                                ]}
                                onPress={() => {
                                    onSelect(option.value);
                                    setShowPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        value === option.value && styles.pickerOptionTextSelected,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {value === option.value && (
                                    <Ionicons name="checkmark" size={18} color="#000" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

export default function CaseDetailsStep({
    caseData,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleCheckboxChange,
}: Props) {
    const formatDate = (date: Date | null | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={22} color="#000" />
                <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Case Information</Text>
                    <Text style={styles.sectionSubtitle}>
                        Enter the basic details about the case
                    </Text>
                </View>
            </View>

            {/* Case Title */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Case Title <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={caseData.title}
                    onChangeText={(text) => handleChange("title", text)}
                    placeholder="Enter case title"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Case Number */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Case Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={caseData.caseNumber}
                    onChangeText={(text) => handleChange("caseNumber", text)}
                    placeholder="e.g., CRL/123/2023"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Case Type */}
            <PickerField
                label="Case Type"
                options={CASE_TYPES}
                value={caseData.caseType}
                onSelect={(v) => handleSelectChange("caseType", v)}
                required
            />

            {/* Status */}
            <PickerField
                label="Status"
                options={STATUSES}
                value={caseData.status}
                onSelect={(v) => handleSelectChange("status", v)}
                required
            />

            {/* Filing Date */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Filing Date</Text>
                <TouchableOpacity style={styles.dateButton}>
                    <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                    <Text style={styles.dateText}>
                        {formatDate(caseData.filingDate) || "Select date"}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.hint}>
                    Default: Today. Tap to change (date picker coming soon).
                </Text>
            </View>

            {/* Next Hearing Date */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    First Hearing Date <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={
                        caseData.nextHearingDate
                            ? formatDate(caseData.nextHearingDate)
                            : ""
                    }
                    onChangeText={(text) => {
                        // Accept date as YYYY-MM-DD or DD-MM-YYYY
                        const parts = text.split(/[-/]/);
                        if (parts.length === 3) {
                            const date = new Date(text);
                            if (!isNaN(date.getTime())) {
                                handleDateChange("nextHearingDate", date);
                            }
                        }
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                />
                <Text style={styles.hint}>Enter date in YYYY-MM-DD format</Text>
            </View>

            {/* Priority */}
            <PickerField
                label="Priority"
                options={PRIORITIES}
                value={caseData.priority}
                onSelect={(v) => handleSelectChange("priority", v)}
            />

            {/* Case Stage */}
            <PickerField
                label="Case Stage"
                options={CASE_STAGES}
                value={caseData.caseStage}
                onSelect={(v) => handleSelectChange("caseStage", v)}
            />

            {/* Urgent Toggle */}
            <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                    <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                    <Text style={styles.switchText}>Mark as urgent case</Text>
                </View>
                <Switch
                    value={caseData.isUrgent}
                    onValueChange={(val) => handleCheckboxChange("isUrgent", val)}
                    trackColor={{ false: "#e5e7eb", true: "#000" }}
                    thumbColor="#fff"
                />
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Case Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={caseData.description}
                    onChangeText={(text) => handleChange("description", text)}
                    placeholder="Describe the case..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            {/* Act & Sections */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Act & Sections</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { minHeight: 60 }]}
                    value={caseData.actSections}
                    onChangeText={(text) => handleChange("actSections", text)}
                    placeholder="e.g., IPC Section 302, CrPC Section 161"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                />
            </View>

            {/* Relief Sought */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Relief Sought</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { minHeight: 60 }]}
                    value={caseData.reliefSought}
                    onChangeText={(text) => handleChange("reliefSought", text)}
                    placeholder="Describe the relief sought in this case"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                />
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
    sectionHeaderText: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
    },
    sectionSubtitle: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2,
    },
    fieldContainer: {
        marginBottom: 20,
        zIndex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111",
        marginBottom: 8,
    },
    required: {
        color: "#ef4444",
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#111",
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    hint: {
        fontSize: 12,
        color: "#9ca3af",
        marginTop: 4,
    },
    pickerButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    pickerButtonText: {
        fontSize: 15,
        color: "#111",
    },
    pickerPlaceholder: {
        color: "#9ca3af",
    },
    pickerDropdown: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        marginTop: 4,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    pickerScrollView: {
        maxHeight: 200,
    },
    pickerOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    pickerOptionSelected: {
        backgroundColor: "#f3f4f6",
    },
    pickerOptionText: {
        fontSize: 15,
        color: "#374151",
    },
    pickerOptionTextSelected: {
        fontWeight: "600",
        color: "#000",
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dateText: {
        fontSize: 15,
        color: "#111",
    },
    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
    },
    switchLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    switchText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
    },
});
