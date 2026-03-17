import React from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    PARTY_TYPES,
    PETITIONER_ROLES,
    RESPONDENT_ROLES,
} from "../../constants/caseConstants";

type PickerOption = { value: string; label: string };

type Props = {
    caseData: any;
    setCaseData: React.Dispatch<React.SetStateAction<any>>;
};

const InlinePicker = ({
    options,
    value,
    onSelect,
}: {
    options: PickerOption[];
    value: string;
    onSelect: (value: string) => void;
}) => {
    const [show, setShow] = React.useState(false);
    const selectedLabel = options.find((o) => o.value === value)?.label || value;

    return (
        <View>
            <TouchableOpacity
                style={styles.inlinePickerButton}
                onPress={() => setShow(!show)}
            >
                <Text style={styles.inlinePickerText}>{selectedLabel}</Text>
                <Ionicons name={show ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
            </TouchableOpacity>
            {show && (
                <View style={styles.miniDropdown}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.miniOption,
                                value === option.value && styles.miniOptionSelected,
                            ]}
                            onPress={() => {
                                onSelect(option.value);
                                setShow(false);
                            }}
                        >
                            <Text style={styles.miniOptionText}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const PartyCard = ({
    party,
    index,
    label,
    onUpdate,
    onRemove,
}: {
    party: any;
    index: number;
    label: string;
    onUpdate: (field: string, value: string) => void;
    onRemove: () => void;
}) => {
    return (
        <View style={styles.partyCard}>
            <View style={styles.partyCardHeader}>
                <View style={styles.partyCardTitle}>
                    <Ionicons name="person-outline" size={16} color="#6b7280" />
                    <Text style={styles.partyCardName}>
                        {label} {index + 1}
                    </Text>
                </View>
                <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={party.name}
                    onChangeText={(text) => onUpdate("name", text)}
                    placeholder="Full name"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Type</Text>
                <InlinePicker
                    options={PARTY_TYPES}
                    value={party.type || "Individual"}
                    onSelect={(val) => onUpdate("type", val)}
                />
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={party.email}
                    onChangeText={(text) => onUpdate("email", text)}
                    placeholder="email@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                    style={styles.input}
                    value={party.contact}
                    onChangeText={(text) => onUpdate("contact", text)}
                    placeholder="+91 XXXXXXXXXX"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={[styles.input, { minHeight: 60, paddingTop: 12 }]}
                    value={party.address}
                    onChangeText={(text) => onUpdate("address", text)}
                    placeholder="Full address"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                />
            </View>
        </View>
    );
};

export default function PartySectionStep({ caseData, setCaseData }: Props) {
    const updatePetitioner = (idx: number, field: string, value: string) => {
        const arr = [...(caseData.petitioners || [])];
        arr[idx] = { ...arr[idx], [field]: value };
        setCaseData((prev: any) => ({ ...prev, petitioners: arr }));
    };

    const removePetitioner = (idx: number) => {
        setCaseData((prev: any) => ({
            ...prev,
            petitioners: prev.petitioners.filter((_: any, i: number) => i !== idx),
        }));
    };

    const addPetitioner = () => {
        setCaseData((prev: any) => ({
            ...prev,
            petitioners: [
                ...(prev.petitioners || []),
                {
                    label: prev.petitionerLabel || "Petitioner",
                    type: "Individual",
                    name: "",
                    email: "",
                    contact: "",
                    address: "",
                },
            ],
        }));
    };

    const updateRespondent = (idx: number, field: string, value: string) => {
        const arr = [...(caseData.respondents || [])];
        arr[idx] = { ...arr[idx], [field]: value };
        setCaseData((prev: any) => ({ ...prev, respondents: arr }));
    };

    const removeRespondent = (idx: number) => {
        setCaseData((prev: any) => ({
            ...prev,
            respondents: prev.respondents.filter((_: any, i: number) => i !== idx),
        }));
    };

    const addRespondent = () => {
        setCaseData((prev: any) => ({
            ...prev,
            respondents: [
                ...(prev.respondents || []),
                {
                    label: prev.respondentLabel || "Defendant",
                    type: "Individual",
                    name: "",
                    email: "",
                    contact: "",
                    address: "",
                },
            ],
        }));
    };

    return (
        <View>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={22} color="#000" />
                <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Party Section</Text>
                    <Text style={styles.sectionSubtitle}>
                        Enter details for both legal sides
                    </Text>
                </View>
            </View>

            {/* ========== Petitioner Section ========== */}
            <View style={styles.partySectionContainer}>
                <View style={styles.partyHeader}>
                    <InlinePicker
                        options={PETITIONER_ROLES}
                        value={caseData.petitionerLabel || "Petitioner"}
                        onSelect={(val) =>
                            setCaseData((prev: any) => ({
                                ...prev,
                                petitionerLabel: val,
                            }))
                        }
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addPetitioner}>
                        <Ionicons name="add-circle-outline" size={18} color="#000" />
                        <Text style={styles.addButtonText}>
                            Add {caseData.petitionerLabel || "Petitioner"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {(caseData.petitioners || []).map((p: any, idx: number) => (
                    <PartyCard
                        key={`petitioner-${idx}`}
                        party={p}
                        index={idx}
                        label={p.label || caseData.petitionerLabel || "Petitioner"}
                        onUpdate={(field, value) => updatePetitioner(idx, field, value)}
                        onRemove={() => removePetitioner(idx)}
                    />
                ))}

                {(!caseData.petitioners || caseData.petitioners.length === 0) && (
                    <View style={styles.emptyState}>
                        <Ionicons name="person-add-outline" size={24} color="#d1d5db" />
                        <Text style={styles.emptyStateText}>
                            No {(caseData.petitionerLabel || "Petitioner").toLowerCase()}s
                            added yet
                        </Text>
                    </View>
                )}
            </View>

            {/* Divider */}
            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>VS</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* ========== Respondent Section ========== */}
            <View style={styles.partySectionContainer}>
                <View style={styles.partyHeader}>
                    <InlinePicker
                        options={RESPONDENT_ROLES}
                        value={caseData.respondentLabel || "Defendant"}
                        onSelect={(val) =>
                            setCaseData((prev: any) => ({
                                ...prev,
                                respondentLabel: val,
                            }))
                        }
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addRespondent}>
                        <Ionicons name="add-circle-outline" size={18} color="#000" />
                        <Text style={styles.addButtonText}>
                            Add {caseData.respondentLabel || "Defendant"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {(caseData.respondents || []).map((r: any, idx: number) => (
                    <PartyCard
                        key={`respondent-${idx}`}
                        party={r}
                        index={idx}
                        label={r.label || caseData.respondentLabel || "Defendant"}
                        onUpdate={(field, value) => updateRespondent(idx, field, value)}
                        onRemove={() => removeRespondent(idx)}
                    />
                ))}

                {(!caseData.respondents || caseData.respondents.length === 0) && (
                    <View style={styles.emptyState}>
                        <Ionicons name="person-add-outline" size={24} color="#d1d5db" />
                        <Text style={styles.emptyStateText}>
                            No {(caseData.respondentLabel || "Defendant").toLowerCase()}s
                            added yet
                        </Text>
                    </View>
                )}
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
    partySectionContainer: {
        marginBottom: 12,
    },
    partyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111",
    },
    partyCard: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    partyCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    partyCardTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    partyCardName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111",
    },
    removeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    removeButtonText: {
        fontSize: 13,
        color: "#ef4444",
        fontWeight: "500",
    },
    fieldContainer: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },
    required: {
        color: "#ef4444",
    },
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
    inlinePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    inlinePickerText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111",
    },
    miniDropdown: {
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
    miniOption: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    miniOptionSelected: {
        backgroundColor: "#f3f4f6",
    },
    miniOptionText: {
        fontSize: 14,
        color: "#374151",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#e5e7eb",
    },
    dividerText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#9ca3af",
        letterSpacing: 1,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 24,
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
    },
    emptyStateText: {
        fontSize: 13,
        color: "#9ca3af",
        marginTop: 8,
    },
});
