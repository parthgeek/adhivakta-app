import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

// ========================
// Helpers
// ========================
const formatLabel = (value?: string) => {
    if (!value) return "—";
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (value?: string | Date | null) => {
    if (!value) return "—";
    try {
        return new Date(value as string).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
};

const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
        case "urgent": return { bg: "#fef2f2", text: "#dc2626" };
        case "high": return { bg: "#fff7ed", text: "#c2410c" };
        case "low": return { bg: "#f0fdf4", text: "#16a34a" };
        default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
};

// ========================
// Sub-components
// ========================
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionBody}>{children}</View>
    </View>
);

const InfoRow = ({
    icon,
    label,
    value,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
}) => (
    <View style={styles.infoRow}>
        <Ionicons name={icon} size={15} color="#6b7280" style={styles.infoIcon} />
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || "—"}</Text>
        </View>
    </View>
);

const TextBlock = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
        <View style={styles.textBlock}>
            <Text style={styles.textBlockLabel}>{label}</Text>
            <Text style={styles.textBlockValue}>{value}</Text>
        </View>
    );
};

const PartyCard = ({ party }: { party: any }) => (
    <View style={styles.personCard}>
        <View style={styles.personHeader}>
            <Text style={styles.personName}>{party.name}</Text>
            {party.role ? (
                <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{party.role}</Text>
                </View>
            ) : null}
        </View>
        {party.type && party.type !== "Individual" ? (
            <Text style={styles.personMeta}>{party.type}</Text>
        ) : null}
        {party.email ? <Text style={styles.personMeta}>{party.email}</Text> : null}
        {party.contact ? <Text style={styles.personMeta}>{party.contact}</Text> : null}
        {party.address ? <Text style={styles.personMeta}>{party.address}</Text> : null}
    </View>
);

const PersonCard = ({ person }: { person: any }) => (
    <View style={styles.personCard}>
        <View style={styles.personHeader}>
            <Text style={styles.personName}>{person.name}</Text>
            <View style={styles.personBadges}>
                {person.level ? (
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>{person.level}</Text>
                    </View>
                ) : null}
                {person.isPrimary || person.isLead ? (
                    <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                ) : null}
            </View>
        </View>
        {person.email ? <Text style={styles.personMeta}>{person.email}</Text> : null}
        {person.contact ? <Text style={styles.personMeta}>{person.contact}</Text> : null}
        {person.roleInCase ? (
            <Text style={styles.personMeta}>{person.roleInCase}</Text>
        ) : null}
    </View>
);

// ========================
// Main Screen
// ========================
export default function CaseDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const isLawyer = user?.role === "lawyer";

    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchCase = useCallback(async () => {
        if (!id) return;
        try {
            setError("");
            const response = await api.cases.get(id as string);
            if (response?.error) {
                setError(response.error);
                return;
            }
            const caseObj =
                response?.data?.case || response?.data || response;
            setCaseData(caseObj);
        } catch (err: any) {
            setError(err.message || "Failed to load case");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCase();
    }, [fetchCase]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCase();
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (error || !caseData) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={56} color="#d1d5db" />
                <Text style={styles.errorTitle}>Failed to load case</Text>
                <Text style={styles.errorText}>{error || "Case not found"}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setLoading(true);
                        fetchCase();
                    }}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const petitioners = caseData.parties?.petitioner || [];
    const respondents = caseData.parties?.respondent || [];
    const lawyers = caseData.lawyers || [];
    const advocates = caseData.advocates || [];
    const clients = caseData.clients || [];
    const stakeholders = caseData.stakeholders || [];

    const statusColors =
        caseData.status?.toLowerCase() === "active"
            ? { bg: "#dcfce7", text: "#166534" }
            : { bg: "#f3f4f6", text: "#374151" };

    const priorityColors = getPriorityColor(caseData.priority);

    return (
        <>
            <Stack.Screen
                options={{
                    title: caseData.caseNumber || "Case Details",
                    headerRight: () => (
                        <TouchableOpacity
                            style={styles.headerEditBtn}
                            onPress={() => router.push(`/cases/${id}/edit` as any)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="create-outline" size={22} color="#000" />
                        </TouchableOpacity>
                    ),
                    headerShown: true,
                    headerStyle: { backgroundColor: "#fff" },
                    headerTitleStyle: {
                        fontWeight: "600",
                        fontSize: 16,
                        color: "#111",
                    },
                    headerTintColor: "#000",
                    headerShadowVisible: false,
                    headerBackTitle: "Cases",
                }}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* ── Header Card ── */}
                <View style={styles.headerCard}>
                    <View style={styles.titleRow}>
                        <Text style={styles.caseTitle} numberOfLines={3}>
                            {caseData.title || "Untitled Case"}
                        </Text>
                        {caseData.isUrgent && (
                            <View style={styles.urgentBadge}>
                                <Ionicons name="flash" size={11} color="#dc2626" />
                                <Text style={styles.urgentText}>Urgent</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.caseNumber}>{caseData.caseNumber}</Text>

                    <View style={styles.badgeRow}>
                        <View
                            style={[
                                styles.badge,
                                { backgroundColor: statusColors.bg },
                            ]}
                        >
                            <Text style={[styles.badgeText, { color: statusColors.text }]}>
                                {formatLabel(caseData.status)}
                            </Text>
                        </View>

                        {caseData.caseType && (
                            <View style={[styles.badge, { backgroundColor: "#eff6ff" }]}>
                                <Text style={[styles.badgeText, { color: "#1d4ed8" }]}>
                                    {formatLabel(caseData.caseType)}
                                </Text>
                            </View>
                        )}

                        {caseData.priority && caseData.priority !== "normal" && (
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: priorityColors.bg },
                                ]}
                            >
                                <Text
                                    style={[styles.badgeText, { color: priorityColors.text }]}
                                >
                                    {formatLabel(caseData.priority)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Case Information ── */}
                <Section title="Case Information">
                    <InfoRow
                        icon="layers-outline"
                        label="Case Stage"
                        value={formatLabel(caseData.caseStage)}
                    />
                    <InfoRow
                        icon="calendar-outline"
                        label="Filing Date"
                        value={formatDate(caseData.filingDate)}
                    />
                    <InfoRow
                        icon="calendar-number-outline"
                        label="Next Hearing"
                        value={formatDate(caseData.nextHearingDate)}
                    />
                    <TextBlock label="Description" value={caseData.description} />
                    <TextBlock label="Act / Sections" value={caseData.actSections} />
                    <TextBlock label="Relief Sought" value={caseData.reliefSought} />
                </Section>

                {/* ── Court Information ── */}
                <Section title="Court Information">
                    <InfoRow
                        icon="business-outline"
                        label="Court"
                        value={caseData.court}
                    />
                    <InfoRow
                        icon="grid-outline"
                        label="Court Type"
                        value={formatLabel(caseData.courtType)}
                    />
                    <InfoRow
                        icon="location-outline"
                        label="State"
                        value={formatLabel(caseData.courtState)}
                    />
                    <InfoRow
                        icon="map-outline"
                        label="District"
                        value={formatLabel(caseData.district)}
                    />
                    {caseData.bench ? (
                        <InfoRow
                            icon="people-outline"
                            label="Bench"
                            value={formatLabel(caseData.bench)}
                        />
                    ) : null}
                    {caseData.courtHall ? (
                        <InfoRow
                            icon="home-outline"
                            label="Court Hall"
                            value={caseData.courtHall}
                        />
                    ) : null}
                    {caseData.courtComplex ? (
                        <InfoRow
                            icon="storefront-outline"
                            label="Court Complex"
                            value={caseData.courtComplex}
                        />
                    ) : null}
                    <TextBlock label="Notes" value={caseData.notes} />
                </Section>

                {/* ── Parties ── */}
                {(petitioners.length > 0 || respondents.length > 0) && (
                    <Section title="Parties">
                        {petitioners.length > 0 && (
                            <>
                                <Text style={styles.groupLabel}>Petitioners</Text>
                                {petitioners.map((p: any, i: number) => (
                                    <PartyCard key={i} party={p} />
                                ))}
                            </>
                        )}
                        {respondents.length > 0 && (
                            <>
                                <Text
                                    style={[
                                        styles.groupLabel,
                                        petitioners.length > 0 && { marginTop: 12 },
                                    ]}
                                >
                                    Respondents
                                </Text>
                                {respondents.map((r: any, i: number) => (
                                    <PartyCard key={i} party={r} />
                                ))}
                            </>
                        )}
                    </Section>
                )}

                {/* ── Associated People ── */}
                {(lawyers.length > 0 ||
                    advocates.length > 0 ||
                    clients.length > 0 ||
                    stakeholders.length > 0) && (
                    <Section title="Associated People">
                        {lawyers.length > 0 && (
                            <>
                                <Text style={styles.groupLabel}>Lawyers</Text>
                                {lawyers.map((l: any, i: number) => (
                                    <PersonCard key={i} person={l} />
                                ))}
                            </>
                        )}
                        {advocates.length > 0 && (
                            <>
                                <Text
                                    style={[
                                        styles.groupLabel,
                                        lawyers.length > 0 && { marginTop: 12 },
                                    ]}
                                >
                                    Advocates
                                </Text>
                                {advocates.map((a: any, i: number) => (
                                    <PersonCard key={i} person={a} />
                                ))}
                            </>
                        )}
                        {isLawyer && clients.length > 0 && (
                            <>
                                <Text
                                    style={[
                                        styles.groupLabel,
                                        (lawyers.length > 0 || advocates.length > 0) && {
                                            marginTop: 12,
                                        },
                                    ]}
                                >
                                    Clients
                                </Text>
                                {clients.map((c: any, i: number) => (
                                    <PersonCard key={i} person={c} />
                                ))}
                            </>
                        )}
                        {stakeholders.length > 0 && (
                            <>
                                <Text style={[styles.groupLabel, { marginTop: 12 }]}>
                                    Stakeholders
                                </Text>
                                {stakeholders.map((s: any, i: number) => (
                                    <PersonCard key={i} person={s} />
                                ))}
                            </>
                        )}
                    </Section>
                )}

                {/* ── Edit Button ── */}
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push(`/cases/${id}/edit` as any)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                    <Text style={styles.editButtonText}>Edit Case</Text>
                </TouchableOpacity>
            </ScrollView>
        </>
    );
}

// ========================
// Styles
// ========================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        backgroundColor: "#f5f5f5",
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: "#000",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    // Header edit button
    headerEditBtn: {
        padding: 4,
        marginRight: 4,
    },

    // Header card
    headerCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
            },
            android: { elevation: 2 },
        }),
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 4,
    },
    caseTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        lineHeight: 24,
    },
    caseNumber: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "500",
    },
    urgentBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: "#fef2f2",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    urgentText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#dc2626",
    },

    // Section
    section: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
            },
            android: { elevation: 2 },
        }),
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    sectionBody: {
        gap: 10,
    },

    // Info row
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    infoIcon: {
        marginTop: 2,
        width: 18,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        color: "#9ca3af",
        fontWeight: "500",
        marginBottom: 1,
    },
    infoValue: {
        fontSize: 14,
        color: "#111",
        fontWeight: "500",
    },

    // Text block (description, notes)
    textBlock: {
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        marginTop: 4,
    },
    textBlockLabel: {
        fontSize: 11,
        color: "#9ca3af",
        fontWeight: "500",
        marginBottom: 4,
    },
    textBlockValue: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
    },

    // Group label (Petitioners, Lawyers, etc.)
    groupLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // Person / Party card
    personCard: {
        backgroundColor: "#f9fafb",
        borderRadius: 10,
        padding: 12,
        gap: 3,
    },
    personHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 2,
    },
    personName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111",
        flex: 1,
    },
    personBadges: {
        flexDirection: "row",
        gap: 4,
    },
    personMeta: {
        fontSize: 13,
        color: "#6b7280",
    },
    roleBadge: {
        backgroundColor: "#eff6ff",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    roleBadgeText: {
        fontSize: 11,
        color: "#1d4ed8",
        fontWeight: "500",
    },
    levelBadge: {
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    levelBadgeText: {
        fontSize: 11,
        color: "#374151",
        fontWeight: "500",
    },
    primaryBadge: {
        backgroundColor: "#dcfce7",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    primaryBadgeText: {
        fontSize: 11,
        color: "#166534",
        fontWeight: "500",
    },

    // Edit button at bottom
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#000",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 4,
        marginBottom: 8,
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});
