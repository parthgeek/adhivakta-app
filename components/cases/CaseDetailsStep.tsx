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
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    STATUSES,
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

const formatDateForInput = (date: Date | null | undefined) => {
    if (!date) return "";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "";

    const year = parsedDate.getFullYear();
    const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
    const day = `${parsedDate.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const YEAR_OPTIONS = Array.from({ length: 51 }, (_, index) => {
    const year = new Date().getFullYear() - index;
    return { value: String(year), label: String(year) };
});

const MONTH_OPTIONS = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
];

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

const DateInputField = ({
    label,
    required,
    value,
    onChange,
    hint,
}: {
    label: string;
    required?: boolean;
    value: Date | null | undefined;
    onChange: (date: Date | null) => void;
    hint: string;
}) => {
    const [visible, setVisible] = React.useState(false);
    const [tempDate, setTempDate] = React.useState<Date>(
        value ? new Date(value) : new Date()
    );

    React.useEffect(() => {
        setTempDate(value ? new Date(value) : new Date());
    }, [value]);

    const selectedYear = String(tempDate.getFullYear());
    const selectedMonth = String(tempDate.getMonth());
    const daysInMonth = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth() + 1,
        0
    ).getDate();
    const dayOptions = Array.from({ length: daysInMonth }, (_, index) => ({
        value: String(index + 1),
        label: String(index + 1).padStart(2, "0"),
    }));

    const updateTempDate = (parts: Partial<{ year: number; month: number; day: number }>) => {
        const nextYear = parts.year ?? tempDate.getFullYear();
        const nextMonth = parts.month ?? tempDate.getMonth();
        const maxDay = new Date(nextYear, nextMonth + 1, 0).getDate();
        const nextDay = Math.min(parts.day ?? tempDate.getDate(), maxDay);
        setTempDate(new Date(nextYear, nextMonth, nextDay));
    };

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TouchableOpacity
                style={styles.dateInputWrapper}
                onPress={() => setVisible(true)}
            >
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                <Text
                    style={[
                        styles.dateInput,
                        !value && styles.pickerPlaceholder,
                    ]}
                >
                    {value ? formatDateForInput(value) : "Select date"}
                </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>{hint}</Text>
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Ionicons name="close" size={22} color="#111" />
                            </TouchableOpacity>
                        </View>

                        <PickerField
                            label="Year"
                            options={YEAR_OPTIONS}
                            value={selectedYear}
                            onSelect={(year) => updateTempDate({ year: Number(year) })}
                            required
                        />
                        <PickerField
                            label="Month"
                            options={MONTH_OPTIONS}
                            value={selectedMonth}
                            onSelect={(month) => updateTempDate({ month: Number(month) })}
                            required
                        />
                        <PickerField
                            label="Day"
                            options={dayOptions}
                            value={String(tempDate.getDate())}
                            onSelect={(day) => updateTempDate({ day: Number(day) })}
                            required
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => {
                                    onChange(null);
                                    setVisible(false);
                                }}
                            >
                                <Text style={styles.modalButtonSecondaryText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={() => {
                                    onChange(tempDate);
                                    setVisible(false);
                                }}
                            >
                                <Text style={styles.modalButtonPrimaryText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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

            {/* Generated Case Number */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Case Number <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.readOnlyField}>
                    <Text
                        style={[
                            styles.readOnlyValue,
                            !caseData.caseNumber && styles.pickerPlaceholder,
                        ]}
                    >
                        {caseData.caseNumber || "Select court and case type first"}
                    </Text>
                </View>
                <Text style={styles.hint}>
                    This is auto-generated from the selected case type, filing number, and year.
                </Text>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Filing Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={caseData.caseNumberMiddle}
                    onChangeText={(text) => handleChange("caseNumberMiddle", text)}
                    placeholder="Enter filing number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                />
            </View>

            <PickerField
                label="Case Year"
                options={YEAR_OPTIONS}
                value={caseData.caseYear}
                onSelect={(v) => handleSelectChange("caseYear", v)}
                required
            />

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    CNR Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={caseData.cnrNumber}
                    onChangeText={(text) => handleChange("cnrNumber", text)}
                    placeholder="e.g., MHAU019999992015"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                />
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Case Type <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.readOnlyField}>
                    <Text
                        style={[
                            styles.readOnlyValue,
                            !caseData.caseSubType && styles.pickerPlaceholder,
                        ]}
                    >
                        {caseData.caseSubType || "Select in Court Information"}
                    </Text>
                </View>
            </View>

            {/* Status */}
            <PickerField
                label="Status"
                options={STATUSES}
                value={caseData.status}
                onSelect={(v) => handleSelectChange("status", v)}
                required
            />

            {/* Filing Date */}
            <DateInputField
                label="Filing Date"
                required
                value={caseData.filingDate}
                onChange={(date) => handleDateChange("filingDate", date)}
                hint="Use selectors to choose the filing date."
            />

            {/* Next Hearing Date */}
            <DateInputField
                label="First Hearing Date"
                required
                value={caseData.nextHearingDate}
                onChange={(date) => handleDateChange("nextHearingDate", date)}
                hint="This must be after the filing date."
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
                <Text style={styles.label}>
                    Case Description <Text style={styles.required}>*</Text>
                </Text>
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
                <Text style={styles.label}>
                    Act & Sections <Text style={styles.required}>*</Text>
                </Text>
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
                <Text style={styles.label}>
                    Relief Sought <Text style={styles.required}>*</Text>
                </Text>
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
    readOnlyField: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    readOnlyValue: {
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
    dateInputWrapper: {
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
    dateInput: {
        flex: 1,
        fontSize: 15,
        color: "#111",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(17, 24, 39, 0.45)",
        justifyContent: "flex-end",
    },
    modalCard: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 32,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
    },
    modalButton: {
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    modalButtonSecondary: {
        backgroundColor: "#f3f4f6",
    },
    modalButtonPrimary: {
        backgroundColor: "#000",
    },
    modalButtonSecondaryText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    modalButtonPrimaryText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
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
