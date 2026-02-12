import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    STATES,
    DISTRICTS,
    COURT_TYPES,
    BENCHES,
} from "../../constants/caseConstants";

type PickerOption = { value: string; label: string };

type Props = {
    caseData: any;
    handleChange: (name: string, value: string) => void;
    handleSelectChange: (name: string, value: string) => void;
};

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

export default function CourtInfoStep({
    caseData,
    handleChange,
    handleSelectChange,
}: Props) {
    // Get districts for the selected state
    const districtOptions = DISTRICTS[caseData.courtState] || [];

    // Show bench picker only for Karnataka High Court
    const showBench =
        caseData.courtType === "high_court" && caseData.courtState === "karnataka";

    return (
        <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={22} color="#000" />
                <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Court Information</Text>
                    <Text style={styles.sectionSubtitle}>
                        Enter details about the court where the case is filed
                    </Text>
                </View>
            </View>

            {/* State */}
            <PickerField
                label="State"
                options={STATES}
                value={caseData.courtState}
                onSelect={(v) => handleSelectChange("courtState", v)}
            />

            {/* District */}
            <PickerField
                label="District"
                options={districtOptions}
                value={caseData.district}
                onSelect={(v) => handleSelectChange("district", v)}
            />

            {/* Court Type */}
            <PickerField
                label="Court Type"
                options={COURT_TYPES}
                value={caseData.courtType}
                onSelect={(v) => handleSelectChange("courtType", v)}
            />

            {/* Bench (conditional) */}
            {showBench && (
                <PickerField
                    label="Bench"
                    options={BENCHES}
                    value={caseData.bench}
                    onSelect={(v) => handleSelectChange("bench", v)}
                />
            )}

            {/* Court Name */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Court Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={caseData.court}
                    onChangeText={(text) => handleChange("court", text)}
                    placeholder="Enter court name"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Court Hall */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Court Hall Number</Text>
                <TextInput
                    style={styles.input}
                    value={caseData.courtHall}
                    onChangeText={(text) => handleChange("courtHall", text)}
                    placeholder="e.g., Hall 5"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Court Complex */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Court Complex</Text>
                <TextInput
                    style={styles.input}
                    value={caseData.courtComplex}
                    onChangeText={(text) => handleChange("courtComplex", text)}
                    placeholder="e.g., City Civil Court Complex"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Notes */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Additional Notes</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={caseData.notes}
                    onChangeText={(text) => handleChange("notes", text)}
                    placeholder="Any additional notes about the court or proceedings"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
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
    sectionHeaderText: { flex: 1 },
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
    required: { color: "#ef4444" },
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
        minHeight: 80,
        paddingTop: 12,
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
    pickerPlaceholder: { color: "#9ca3af" },
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
            android: { elevation: 4 },
        }),
    },
    pickerScrollView: { maxHeight: 200 },
    pickerOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    pickerOptionSelected: { backgroundColor: "#f3f4f6" },
    pickerOptionText: { fontSize: 15, color: "#374151" },
    pickerOptionTextSelected: { fontWeight: "600", color: "#000" },
});
