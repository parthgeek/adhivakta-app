import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    LAWYER_LEVELS,
    CHAIR_POSITIONS,
} from "../../constants/caseConstants";

type PickerOption = { value: string; label: string };

type Props = {
    caseData: any;
    setCaseData: React.Dispatch<React.SetStateAction<any>>;
    isLawyer: boolean;
    user: any;
};

const InlinePicker = ({
    label,
    options,
    value,
    onSelect,
}: {
    label: string;
    options: PickerOption[];
    value: string;
    onSelect: (value: string) => void;
}) => {
    const [show, setShow] = React.useState(false);
    const selectedLabel = options.find((o) => o.value === value)?.label || "Select...";

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShow(!show)}
            >
                <Text style={[styles.pickerText, !value && { color: "#9ca3af" }]}>
                    {value ? selectedLabel : "Select..."}
                </Text>
                <Ionicons name={show ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
            </TouchableOpacity>
            {show && (
                <View style={styles.dropdown}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.dropdownOption,
                                    value === option.value && styles.dropdownOptionSelected,
                                ]}
                                onPress={() => {
                                    onSelect(option.value);
                                    setShow(false);
                                }}
                            >
                                <Text style={styles.dropdownOptionText}>{option.label}</Text>
                                {value === option.value && (
                                    <Ionicons name="checkmark" size={16} color="#000" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

// ========================
// Lawyer Card (for lawyer users adding other lawyers)
// ========================
const LawyerCard = ({
    lawyer,
    index,
    onUpdate,
    onRemove,
    onTogglePrimary,
}: any) => (
    <View style={styles.personCard}>
        <View style={styles.personCardHeader}>
            <View style={styles.personTitle}>
                <Ionicons name="briefcase-outline" size={16} color="#6b7280" />
                <Text style={styles.personTitleText}>Lawyer {index + 1}</Text>
            </View>
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={lawyer.name || ""}
                onChangeText={(t) => onUpdate("name", t)}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={lawyer.email || ""}
                onChangeText={(t) => onUpdate("email", t)}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Contact Number</Text>
            <TextInput
                style={styles.input}
                value={lawyer.contact || ""}
                onChangeText={(t) => onUpdate("contact", t)}
                placeholder="+91 XXXXXXXXXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Law Firm</Text>
            <TextInput
                style={styles.input}
                value={lawyer.company || ""}
                onChangeText={(t) => onUpdate("company", t)}
                placeholder="Law Firm Name"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>GST Number</Text>
            <TextInput
                style={styles.input}
                value={lawyer.gst || ""}
                onChangeText={(t) => onUpdate("gst", t)}
                placeholder="22AAAAA0000A1Z5"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <InlinePicker
            label="Level"
            options={LAWYER_LEVELS}
            value={lawyer.level || ""}
            onSelect={(v) => onUpdate("level", v)}
        />

        <InlinePicker
            label="Chair Position"
            options={CHAIR_POSITIONS}
            value={lawyer.chairPosition || "supporting"}
            onSelect={(v) => onUpdate("chairPosition", v)}
        />

        <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set as Primary Lawyer</Text>
            <Switch
                value={!!lawyer.isPrimary}
                onValueChange={(val) => onTogglePrimary(val)}
                trackColor={{ false: "#e5e7eb", true: "#000" }}
                thumbColor="#fff"
            />
        </View>
        <Text style={styles.hint}>
            The primary lawyer will be the main point of contact.
        </Text>
    </View>
);

// ========================
// Advocate Card (for client users adding advocates)
// ========================
const AdvocateCard = ({
    advocate,
    index,
    onUpdate,
    onRemove,
    onToggleLead,
}: any) => (
    <View style={styles.personCard}>
        <View style={styles.personCardHeader}>
            <View style={styles.personTitle}>
                <Ionicons name="person-outline" size={16} color="#6b7280" />
                <Text style={styles.personTitleText}>Advocate {index + 1}</Text>
            </View>
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={advocate.name || ""}
                onChangeText={(t) => onUpdate("name", t)}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={advocate.email || ""}
                onChangeText={(t) => onUpdate("email", t)}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Contact Number</Text>
            <TextInput
                style={styles.input}
                value={advocate.contact || ""}
                onChangeText={(t) => onUpdate("contact", t)}
                placeholder="+91 XXXXXXXXXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Law Firm</Text>
            <TextInput
                style={styles.input}
                value={advocate.company || ""}
                onChangeText={(t) => onUpdate("company", t)}
                placeholder="Law Firm Name"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>GST Number</Text>
            <TextInput
                style={styles.input}
                value={advocate.gst || ""}
                onChangeText={(t) => onUpdate("gst", t)}
                placeholder="22AAAAA0000A1Z5"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Point of Contact</Text>
            <TextInput
                style={styles.input}
                value={advocate.poc || ""}
                onChangeText={(t) => onUpdate("poc", t)}
                placeholder="Point of Contact"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <InlinePicker
            label="Level"
            options={LAWYER_LEVELS}
            value={advocate.level || ""}
            onSelect={(v) => onUpdate("level", v)}
        />

        <InlinePicker
            label="Chair Position"
            options={CHAIR_POSITIONS}
            value={advocate.chairPosition || "supporting"}
            onSelect={(v) => onUpdate("chairPosition", v)}
        />

        <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set as Lead Advocate</Text>
            <Switch
                value={!!advocate.isLead}
                onValueChange={(val) => onToggleLead(val)}
                trackColor={{ false: "#e5e7eb", true: "#000" }}
                thumbColor="#fff"
            />
        </View>
        <Text style={styles.hint}>
            The lead advocate will be the main point of contact for this case.
        </Text>
    </View>
);

// ========================
// Client Card
// ========================
const ClientCard = ({ client, index, onUpdate, onRemove }: any) => (
    <View style={styles.personCard}>
        <View style={styles.personCardHeader}>
            <View style={styles.personTitle}>
                <Ionicons name="person-circle-outline" size={16} color="#6b7280" />
                <Text style={styles.personTitleText}>Client {index + 1}</Text>
            </View>
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={client.name || ""}
                onChangeText={(t) => onUpdate("name", t)}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={client.email || ""}
                onChangeText={(t) => onUpdate("email", t)}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Contact Number</Text>
            <TextInput
                style={styles.input}
                value={client.contact || ""}
                onChangeText={(t) => onUpdate("contact", t)}
                placeholder="+91 XXXXXXXXXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
                style={[styles.input, { minHeight: 60, paddingTop: 12 }]}
                value={client.address || ""}
                onChangeText={(t) => onUpdate("address", t)}
                placeholder="Full Address"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
            />
        </View>
    </View>
);

// ========================
// Stakeholder Card
// ========================
const StakeholderCard = ({
    stakeholder,
    index,
    onUpdate,
    onRemove,
}: any) => (
    <View style={styles.personCard}>
        <View style={styles.personCardHeader}>
            <View style={styles.personTitle}>
                <Ionicons name="people-outline" size={16} color="#6b7280" />
                <Text style={styles.personTitleText}>Stakeholder {index + 1}</Text>
            </View>
            <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={stakeholder.name || ""}
                onChangeText={(t) => onUpdate("name", t)}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Role/Relation in Case</Text>
            <TextInput
                style={styles.input}
                value={stakeholder.roleInCase || ""}
                onChangeText={(t) => onUpdate("roleInCase", t)}
                placeholder="e.g., Witness, Expert"
                placeholderTextColor="#9ca3af"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
                style={styles.input}
                value={stakeholder.email || ""}
                onChangeText={(t) => onUpdate("email", t)}
                placeholder="email@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Contact Number</Text>
            <TextInput
                style={styles.input}
                value={stakeholder.contact || ""}
                onChangeText={(t) => onUpdate("contact", t)}
                placeholder="+91 XXXXXXXXXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
            />
        </View>

        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
                style={[styles.input, { minHeight: 60, paddingTop: 12 }]}
                value={stakeholder.address || ""}
                onChangeText={(t) => onUpdate("address", t)}
                placeholder="Full Address"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
            />
        </View>
    </View>
);

// ========================
// Main Component
// ========================
export default function AssociatedPartiesStep({
    caseData,
    setCaseData,
    isLawyer,
    user,
}: Props) {
    // ---- Lawyer helpers ----
    const addLawyer = () => {
        setCaseData((prev: any) => ({
            ...prev,
            lawyers: [
                ...(prev.lawyers || []),
                {
                    name: "",
                    email: "",
                    contact: "",
                    company: "",
                    gst: "",
                    level: "Associate",
                    chairPosition: "supporting",
                    isPrimary: (prev.lawyers || []).length === 0,
                    addedBy: user?._id,
                },
            ],
        }));
    };

    const updateLawyer = (idx: number, field: string, value: string) => {
        const arr = [...(caseData.lawyers || [])];
        arr[idx] = { ...arr[idx], [field]: value };
        setCaseData((prev: any) => ({ ...prev, lawyers: arr }));
    };

    const removeLawyer = (idx: number) => {
        setCaseData((prev: any) => ({
            ...prev,
            lawyers: prev.lawyers.filter((_: any, i: number) => i !== idx),
        }));
    };

    const toggleLawyerPrimary = (idx: number, val: boolean) => {
        const arr = [...(caseData.lawyers || [])];
        arr.forEach((_, i) => {
            arr[i] = { ...arr[i], isPrimary: i === idx ? val : false };
        });
        setCaseData((prev: any) => ({ ...prev, lawyers: arr }));
    };

    // ---- Advocate helpers (client view) ----
    const addAdvocate = () => {
        setCaseData((prev: any) => ({
            ...prev,
            advocates: [
                ...(prev.advocates || []),
                {
                    name: "",
                    email: "",
                    contact: "",
                    company: "",
                    gst: "",
                    poc: "",
                    level: "Senior",
                    chairPosition: "first_chair",
                    isLead: (prev.advocates || []).length === 0,
                },
            ],
        }));
    };

    const updateAdvocate = (idx: number, field: string, value: string) => {
        const arr = [...(caseData.advocates || [])];
        arr[idx] = { ...arr[idx], [field]: value };
        setCaseData((prev: any) => ({ ...prev, advocates: arr }));
    };

    const removeAdvocate = (idx: number) => {
        setCaseData((prev: any) => ({
            ...prev,
            advocates: prev.advocates.filter((_: any, i: number) => i !== idx),
        }));
    };

    const toggleAdvocateLead = (idx: number, val: boolean) => {
        const arr = [...(caseData.advocates || [])];
        arr.forEach((_, i) => {
            arr[i] = { ...arr[i], isLead: i === idx ? val : false };
        });
        setCaseData((prev: any) => ({ ...prev, advocates: arr }));
    };

    // ---- Client helpers ----
    const addClient = () => {
        setCaseData((prev: any) => ({
            ...prev,
            clients: [
                ...(prev.clients || []),
                { name: "", email: "", contact: "", address: "" },
            ],
        }));
    };

    const updateClient = (idx: number, field: string, value: string) => {
        const arr = [...(caseData.clients || [])];
        arr[idx] = { ...arr[idx], [field]: value };
        setCaseData((prev: any) => ({ ...prev, clients: arr }));
    };

    const removeClient = (idx: number) => {
        setCaseData((prev: any) => ({
            ...prev,
            clients: prev.clients.filter((_: any, i: number) => i !== idx),
        }));
    };

    // ---- Stakeholder helpers ----
    const addStakeholder = () => {
        setCaseData((prev: any) => ({
            ...prev,
            stakeholders: [
                ...(prev.stakeholders || []),
                { name: "", roleInCase: "", email: "", contact: "", address: "" },
            ],
        }));
    };

    const updateStakeholder = (idx: number, field: string, value: string) => {
        const arr = [...(caseData.stakeholders || [])];
        arr[idx] = { ...arr[idx], [field]: value };
        setCaseData((prev: any) => ({ ...prev, stakeholders: arr }));
    };

    const removeStakeholder = (idx: number) => {
        setCaseData((prev: any) => ({
            ...prev,
            stakeholders: prev.stakeholders.filter((_: any, i: number) => i !== idx),
        }));
    };

    return (
        <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="people-circle-outline" size={22} color="#000" />
                <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Associated Parties</Text>
                    <Text style={styles.sectionSubtitle}>
                        {isLawyer
                            ? "Add lawyers and clients for this case"
                            : "Add your legal team for this case"}
                    </Text>
                </View>
            </View>

            {/* ========== LAWYER VIEW ========== */}
            {isLawyer && (
                <>
                    {/* Other Lawyers */}
                    <View style={styles.subsection}>
                        <View style={styles.subsectionHeader}>
                            <Text style={styles.subsectionTitle}>Legal Team</Text>
                            <Text style={styles.subsectionSubtitle}>
                                Add other lawyers working on this case (optional)
                            </Text>
                        </View>

                        {(caseData.lawyers || []).map((lawyer: any, idx: number) => (
                            <LawyerCard
                                key={`lawyer-${idx}`}
                                lawyer={lawyer}
                                index={idx}
                                onUpdate={(f: string, v: string) => updateLawyer(idx, f, v)}
                                onRemove={() => removeLawyer(idx)}
                                onTogglePrimary={(v: boolean) => toggleLawyerPrimary(idx, v)}
                            />
                        ))}

                        <TouchableOpacity style={styles.addPersonButton} onPress={addLawyer}>
                            <Ionicons name="add-circle-outline" size={18} color="#000" />
                            <Text style={styles.addPersonText}>Add Lawyer to Case</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Clients */}
                    <View style={[styles.subsection, styles.subsectionBorder]}>
                        <View style={styles.subsectionHeader}>
                            <Text style={styles.subsectionTitle}>Associated Clients</Text>
                            <Text style={styles.subsectionSubtitle}>
                                Add clients associated with this case
                            </Text>
                        </View>

                        {(caseData.clients || []).map((client: any, idx: number) => (
                            <ClientCard
                                key={`client-${idx}`}
                                client={client}
                                index={idx}
                                onUpdate={(f: string, v: string) => updateClient(idx, f, v)}
                                onRemove={() => removeClient(idx)}
                            />
                        ))}

                        <TouchableOpacity style={styles.addPersonButton} onPress={addClient}>
                            <Ionicons name="add-circle-outline" size={18} color="#000" />
                            <Text style={styles.addPersonText}>Add Client</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* ========== CLIENT VIEW ========== */}
            {!isLawyer && (
                <View style={styles.subsection}>
                    <View style={styles.subsectionHeader}>
                        <Text style={styles.subsectionTitle}>Legal Team</Text>
                        <Text style={styles.subsectionSubtitle}>
                            Add your lead and associate advocates for this case
                        </Text>
                    </View>

                    {(caseData.advocates || []).map((advocate: any, idx: number) => (
                        <AdvocateCard
                            key={`advocate-${idx}`}
                            advocate={advocate}
                            index={idx}
                            onUpdate={(f: string, v: string) => updateAdvocate(idx, f, v)}
                            onRemove={() => removeAdvocate(idx)}
                            onToggleLead={(v: boolean) => toggleAdvocateLead(idx, v)}
                        />
                    ))}

                    <TouchableOpacity style={styles.addPersonButton} onPress={addAdvocate}>
                        <Ionicons name="add-circle-outline" size={18} color="#000" />
                        <Text style={styles.addPersonText}>Add Advocate to Case</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ========== STAKEHOLDERS (both views) ========== */}
            <View style={[styles.subsection, styles.subsectionBorder]}>
                <View style={styles.subsectionHeader}>
                    <Text style={styles.subsectionTitle}>Stakeholders</Text>
                    <Text style={styles.subsectionSubtitle}>
                        Add other parties involved (e.g., witnesses, experts, beneficiaries)
                    </Text>
                </View>

                {(caseData.stakeholders || []).map((s: any, idx: number) => (
                    <StakeholderCard
                        key={`stakeholder-${idx}`}
                        stakeholder={s}
                        index={idx}
                        onUpdate={(f: string, v: string) => updateStakeholder(idx, f, v)}
                        onRemove={() => removeStakeholder(idx)}
                    />
                ))}

                <TouchableOpacity style={styles.addPersonButton} onPress={addStakeholder}>
                    <Ionicons name="add-circle-outline" size={18} color="#000" />
                    <Text style={styles.addPersonText}>Add Stakeholder</Text>
                </TouchableOpacity>
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
    subsection: { marginBottom: 24 },
    subsectionBorder: {
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 24,
    },
    subsectionHeader: { marginBottom: 16 },
    subsectionTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
    subsectionSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
    personCard: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    personCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    personTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    personTitleText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111",
    },
    removeBtn: {
        padding: 4,
    },
    fieldContainer: { marginBottom: 14 },
    fieldLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },
    required: { color: "#ef4444" },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#111",
    },
    pickerButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    pickerText: { fontSize: 14, color: "#111" },
    dropdown: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        marginTop: 4,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
            },
            android: { elevation: 3 },
        }),
    },
    dropdownScroll: { maxHeight: 160 },
    dropdownOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    dropdownOptionSelected: { backgroundColor: "#f3f4f6" },
    dropdownOptionText: { fontSize: 14, color: "#374151" },
    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
    },
    hint: {
        fontSize: 12,
        color: "#9ca3af",
        marginBottom: 8,
    },
    addPersonButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderStyle: "dashed",
        borderRadius: 10,
        paddingVertical: 14,
        marginTop: 4,
    },
    addPersonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111",
    },
});
