import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    ActivityIndicator,
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
    courtDirectoryOptions?: {
        states?: { code: string; name: string }[];
        districts?: { code: string; name: string }[];
        complexes?: { code: string; name: string }[];
        courts?: { code: string; name: string }[];
        caseTypes?: { code: string; name: string }[];
    };
    courtDirectoryLoading?: {
        states?: boolean;
        districts?: boolean;
        complexes?: boolean;
        courts?: boolean;
        caseTypes?: boolean;
    };
    courtSource?: string;
    handleCourtTypeChange?: (source: string) => void;
};

const COURT_SOURCE_OPTIONS = [
    {
        source: "ecourts",
        label: "District Court",
        description: "District and subordinate courts",
        icon: "business-outline" as const,
    },
    {
        source: "highcourts",
        label: "High Court",
        description: "High Courts and benches",
        icon: "library-outline" as const,
    },
    {
        source: "supremecourt",
        label: "Supreme Court",
        description: "Supreme Court of India",
        icon: "shield-checkmark-outline" as const,
    },
];

const HIGH_COURT_STATE_LABELS: Record<string, string> = {
    "1": "Maharashtra",
    "8": "Bihar",
    "10": "Tamil Nadu",
    "16": "West Bengal",
    "22": "Punjab and Haryana",
    "23": "Madhya Pradesh",
};

const getHighCourtStateLabel = (option: { code: string; name: string }) =>
    HIGH_COURT_STATE_LABELS[String(option.code)] || option.name;

const StaticPickerField = ({
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

const DirectoryPickerField = ({
    label,
    options,
    value,
    onSelect,
    required,
    disabled,
    loading,
    placeholder,
    renderOptionLabel,
}: {
    label: string;
    options: { code: string; name: string }[];
    value: string;
    onSelect: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    placeholder: string;
    renderOptionLabel?: (option: { code: string; name: string }) => string;
}) => {
    const [showPicker, setShowPicker] = React.useState(false);
    const selectedOption = options.find((option) => option.code === value);
    const selectedLabel = selectedOption
        ? renderOptionLabel?.(selectedOption) || selectedOption.name
        : placeholder;

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TouchableOpacity
                style={[
                    styles.pickerButton,
                    disabled && styles.pickerButtonDisabled,
                ]}
                onPress={() => {
                    if (!disabled && !loading) {
                        setShowPicker((prev) => !prev);
                    }
                }}
                disabled={disabled || loading}
            >
                <Text
                    style={[
                        styles.pickerButtonText,
                        !value && styles.pickerPlaceholder,
                        disabled && styles.pickerButtonTextDisabled,
                    ]}
                >
                    {loading ? "Loading..." : selectedLabel}
                </Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                ) : (
                    <Ionicons
                        name={showPicker ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#6b7280"
                    />
                )}
            </TouchableOpacity>
            {showPicker && !disabled && (
                <View style={styles.pickerDropdown}>
                    <ScrollView
                        style={styles.pickerScrollView}
                        nestedScrollEnabled={true}
                    >
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.code}
                                style={[
                                    styles.pickerOption,
                                    value === option.code && styles.pickerOptionSelected,
                                ]}
                                onPress={() => {
                                    onSelect(option.code);
                                    setShowPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        value === option.code && styles.pickerOptionTextSelected,
                                    ]}
                                >
                                    {renderOptionLabel?.(option) || option.name}
                                </Text>
                                {value === option.code && (
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
    courtDirectoryOptions,
    courtDirectoryLoading,
    courtSource = "ecourts",
    handleCourtTypeChange,
}: Props) {
    const selectedEcourt = caseData.eCourt || {};
    const districtOptions = DISTRICTS[caseData.courtState] || [];
    const showBench =
        caseData.courtType === "high_court" && caseData.courtState === "karnataka";
    const enableCourtDirectory = !!handleCourtTypeChange;

    const states = courtDirectoryOptions?.states || [];
    const districts = courtDirectoryOptions?.districts || [];
    const complexes = courtDirectoryOptions?.complexes || [];
    const courts = courtDirectoryOptions?.courts || [];
    const caseTypes = courtDirectoryOptions?.caseTypes || [];

    return (
        <View>
            <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={22} color="#000" />
                <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Court Information</Text>
                    <Text style={styles.sectionSubtitle}>
                        Enter details about the court where the case is filed
                    </Text>
                </View>
            </View>

            {enableCourtDirectory ? (
                <>
                    <View style={styles.courtSourceGrid}>
                        {COURT_SOURCE_OPTIONS.map((option) => {
                            const selected = courtSource === option.source;

                            return (
                                <TouchableOpacity
                                    key={option.source}
                                    style={[
                                        styles.sourceCard,
                                        selected && styles.sourceCardSelected,
                                    ]}
                                    onPress={() => handleCourtTypeChange(option.source)}
                                >
                                    <View style={styles.sourceCardHeader}>
                                        <Ionicons
                                            name={option.icon}
                                            size={20}
                                            color={selected ? "#000" : "#6b7280"}
                                        />
                                        {selected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color="#000"
                                            />
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            styles.sourceCardTitle,
                                            selected && styles.sourceCardTitleSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    <Text style={styles.sourceCardDescription}>
                                        {option.description}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {courtSource === "ecourts" && (
                        <>
                            <DirectoryPickerField
                                label="State"
                                required
                                options={states}
                                value={selectedEcourt.stateCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtState", value)}
                                loading={courtDirectoryLoading?.states}
                                placeholder="Select state"
                            />
                            <DirectoryPickerField
                                label="District"
                                required
                                options={districts}
                                value={selectedEcourt.districtCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtDistrict", value)}
                                loading={courtDirectoryLoading?.districts}
                                disabled={!selectedEcourt.stateCode}
                                placeholder={
                                    selectedEcourt.stateCode
                                        ? "Select district"
                                        : "Select state first"
                                }
                            />
                            <DirectoryPickerField
                                label="Court Complex"
                                required
                                options={complexes}
                                value={selectedEcourt.complexCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtComplex", value)}
                                loading={courtDirectoryLoading?.complexes}
                                disabled={!selectedEcourt.districtCode}
                                placeholder={
                                    selectedEcourt.districtCode
                                        ? "Select court complex"
                                        : "Select district first"
                                }
                            />
                            <DirectoryPickerField
                                label="Court / Establishment"
                                required
                                options={courts}
                                value={selectedEcourt.courtCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtCourt", value)}
                                loading={courtDirectoryLoading?.courts}
                                disabled={!selectedEcourt.complexCode}
                                placeholder={
                                    selectedEcourt.complexCode
                                        ? "Select court"
                                        : "Select court complex first"
                                }
                            />
                            <DirectoryPickerField
                                label="Case Type"
                                required
                                options={caseTypes}
                                value={selectedEcourt.caseTypeCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtCaseType", value)}
                                loading={courtDirectoryLoading?.caseTypes}
                                disabled={!selectedEcourt.courtCode}
                                placeholder={
                                    selectedEcourt.courtCode
                                        ? "Select case type"
                                        : "Select court first"
                                }
                            />
                        </>
                    )}

                    {courtSource === "highcourts" && (
                        <>
                            <DirectoryPickerField
                                label="State"
                                required
                                options={states}
                                value={selectedEcourt.stateCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtState", value)}
                                loading={courtDirectoryLoading?.states}
                                placeholder="Select state"
                                renderOptionLabel={getHighCourtStateLabel}
                            />
                            <DirectoryPickerField
                                label="High Court"
                                required
                                options={districts}
                                value={selectedEcourt.districtCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtDistrict", value)}
                                loading={courtDirectoryLoading?.districts}
                                disabled={!selectedEcourt.stateCode}
                                placeholder={
                                    selectedEcourt.stateCode
                                        ? "Select High Court"
                                        : "Select state first"
                                }
                            />
                            <DirectoryPickerField
                                label="Bench"
                                required
                                options={complexes}
                                value={selectedEcourt.complexCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtComplex", value)}
                                loading={courtDirectoryLoading?.complexes}
                                disabled={!selectedEcourt.districtCode}
                                placeholder={
                                    selectedEcourt.districtCode
                                        ? "Select bench"
                                        : "Select High Court first"
                                }
                            />
                            {courts.length > 1 && (
                                <DirectoryPickerField
                                    label="Court / Division"
                                    required
                                    options={courts}
                                    value={selectedEcourt.courtCode || ""}
                                    onSelect={(value) => handleSelectChange("ecourtCourt", value)}
                                    loading={courtDirectoryLoading?.courts}
                                    disabled={!selectedEcourt.complexCode}
                                    placeholder={
                                        selectedEcourt.complexCode
                                            ? "Select court"
                                            : "Select bench first"
                                    }
                                />
                            )}
                            <DirectoryPickerField
                                label="Case Type"
                                required
                                options={caseTypes}
                                value={selectedEcourt.caseTypeCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtCaseType", value)}
                                loading={courtDirectoryLoading?.caseTypes}
                                disabled={!selectedEcourt.courtCode}
                                placeholder={
                                    selectedEcourt.courtCode
                                        ? "Select case type"
                                        : "Select bench first"
                                }
                            />
                        </>
                    )}

                    {courtSource === "supremecourt" && (
                        <>
                            <View style={styles.summaryBox}>
                                <Ionicons
                                    name="shield-checkmark-outline"
                                    size={20}
                                    color="#6b7280"
                                />
                                <View style={styles.summaryBoxText}>
                                    <Text style={styles.summaryBoxTitle}>
                                        Supreme Court of India
                                    </Text>
                                    <Text style={styles.summaryBoxSubtitle}>
                                        Principal Bench, New Delhi
                                    </Text>
                                </View>
                            </View>
                            <DirectoryPickerField
                                label="Case Type"
                                required
                                options={caseTypes}
                                value={selectedEcourt.caseTypeCode || ""}
                                onSelect={(value) => handleSelectChange("ecourtCaseType", value)}
                                loading={courtDirectoryLoading?.caseTypes}
                                placeholder="Select case type"
                            />
                        </>
                    )}

                    <View style={styles.summaryBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
                        <View style={styles.summaryBoxText}>
                            <Text style={styles.summaryBoxTitle}>Selected Court</Text>
                            <Text style={styles.summaryBoxSubtitle}>
                                {caseData.court || "Complete the selection above"}
                            </Text>
                        </View>
                    </View>
                </>
            ) : (
                <>
                    <StaticPickerField
                        label="State"
                        options={STATES}
                        value={caseData.courtState}
                        onSelect={(v) => handleSelectChange("courtState", v)}
                    />

                    <StaticPickerField
                        label="District"
                        options={districtOptions}
                        value={caseData.district}
                        onSelect={(v) => handleSelectChange("district", v)}
                    />

                    <StaticPickerField
                        label="Court Type"
                        options={COURT_TYPES}
                        value={caseData.courtType}
                        onSelect={(v) => handleSelectChange("courtType", v)}
                    />

                    {showBench && (
                        <StaticPickerField
                            label="Bench"
                            options={BENCHES}
                            value={caseData.bench}
                            onSelect={(v) => handleSelectChange("bench", v)}
                        />
                    )}

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
                </>
            )}

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
    pickerButtonDisabled: {
        backgroundColor: "#f9fafb",
    },
    pickerButtonText: {
        fontSize: 15,
        color: "#111",
        flex: 1,
        paddingRight: 12,
    },
    pickerButtonTextDisabled: {
        color: "#9ca3af",
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
    pickerOptionText: { fontSize: 15, color: "#374151", flex: 1, paddingRight: 12 },
    pickerOptionTextSelected: { fontWeight: "600", color: "#000" },
    courtSourceGrid: {
        gap: 12,
        marginBottom: 20,
    },
    sourceCard: {
        borderWidth: 1.5,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#fff",
    },
    sourceCardSelected: {
        borderColor: "#111",
        backgroundColor: "#f9fafb",
    },
    sourceCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sourceCardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111",
        marginBottom: 4,
    },
    sourceCardTitleSelected: {
        color: "#000",
    },
    sourceCardDescription: {
        fontSize: 12,
        lineHeight: 18,
        color: "#6b7280",
    },
    summaryBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    summaryBoxText: {
        flex: 1,
    },
    summaryBoxTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111",
    },
    summaryBoxSubtitle: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
        lineHeight: 18,
    },
});
