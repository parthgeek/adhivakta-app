import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import api from "../../../services/api";
import CaseDetailsStep from "../../../components/cases/CaseDetailsStep";
import CourtInfoStep from "../../../components/cases/CourtInfoStep";
import PartySectionStep from "../../../components/cases/PartySectionStep";
import DocumentsStep from "../../../components/cases/DocumentsStep";
import AssociatedPartiesStep from "../../../components/cases/AssociatedPartiesStep";
import { LAWYER_LEVELS } from "../../../constants/caseConstants";

// ========================
// Step Configuration
// ========================
const STEPS = [
    { key: "details", title: "Case Details", icon: "document-text-outline" },
    { key: "court", title: "Court Info", icon: "business-outline" },
    { key: "party", title: "Parties", icon: "people-outline" },
    { key: "documents", title: "Documents", icon: "folder-open-outline" },
    { key: "people", title: "People", icon: "people-circle-outline" },
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const LAWYER_LEVEL_VALUES = new Set(LAWYER_LEVELS.map((o) => o.value));

const normalizeText = (value: string | null | undefined) =>
    (value ?? "").trim();
const normalizeEmail = (value: string | null | undefined) =>
    normalizeText(value).toLowerCase();

const getValidDate = (value: Date | string | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getStartOfDay = (value: Date | string | null | undefined) => {
    const date = getValidDate(value);
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// ========================
// Map API response → form state
// ========================
const mapApiCaseToFormState = (apiCase: any, isLawyer: boolean) => {
    const petitioners = (apiCase.parties?.petitioner || []).map((p: any) => ({
        name: p.name || "",
        type: p.type || "Individual",
        label: p.role || "Petitioner",
        email: p.email || "",
        contact: p.contact || "",
        address: p.address || "",
    }));

    const respondents = (apiCase.parties?.respondent || []).map((r: any) => ({
        name: r.name || "",
        type: r.type || "Individual",
        label: r.role || "Respondent",
        email: r.email || "",
        contact: r.contact || "",
        address: r.address || "",
    }));

    const lawyers = (apiCase.lawyers || []).map((l: any) => ({
        name: l.name || "",
        email: l.email || "",
        contact: l.contact || "",
        company: l.company || "",
        gst: l.gst || "",
        level: l.level || "",
        chairPosition: l.chairPosition || "supporting",
        isPrimary: !!l.isPrimary,
    }));

    const advocates = (apiCase.advocates || []).map((a: any) => ({
        name: a.name || "",
        email: a.email || "",
        contact: a.contact || "",
        company: a.company || "",
        gst: a.gst || "",
        poc: a.poc || "",
        level: a.level || "",
        chairPosition: a.chairPosition || "supporting",
        isLead: !!a.isLead,
    }));

    const clients = (apiCase.clients || []).map((c: any) => ({
        name: c.name || "",
        email: c.email || "",
        contact: c.contact || "",
        address: c.address || "",
    }));

    const stakeholders = (apiCase.stakeholders || []).map((s: any) => ({
        name: s.name || "",
        email: s.email || "",
        contact: s.contact || "",
        address: s.address || "",
        roleInCase: s.roleInCase || "",
    }));

    return {
        title: apiCase.title || "",
        caseNumber: apiCase.caseNumber || "",
        caseType: apiCase.caseType || "",
        status: apiCase.status || "active",
        filingDate: getValidDate(apiCase.filingDate) || new Date(),
        nextHearingDate: getValidDate(apiCase.nextHearingDate),
        priority: apiCase.priority || "normal",
        caseStage: apiCase.caseStage || "filing",
        isUrgent: !!apiCase.isUrgent,
        description: apiCase.description || "",
        actSections: apiCase.actSections || "",
        reliefSought: apiCase.reliefSought || "",
        // Court
        courtState: apiCase.courtState || "karnataka",
        district: apiCase.district || "bengaluru_urban",
        courtType: apiCase.courtType || "district_court",
        bench: apiCase.bench || "",
        court: apiCase.court || "",
        courtHall: apiCase.courtHall || "",
        courtComplex: apiCase.courtComplex || "",
        notes: apiCase.notes || "",
        // Parties
        petitionerLabel: "Petitioner",
        respondentLabel: "Respondent",
        petitioners,
        respondents,
        // People
        lawyers,
        advocates,
        clients,
        stakeholders,
    };
};

export default function EditCaseScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(0);
    const [caseData, setCaseData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingCase, setLoadingCase] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [user, setUser] = useState<any>(null);
    const [isLawyer, setIsLawyer] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (id) fetchCase();
    }, [id]);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsLawyer(userData.role === "lawyer");
            }
        } catch {
            // ignore
        }
    };

    const fetchCase = async () => {
        try {
            setLoadError("");
            const response = await api.cases.get(id as string);
            if (response?.error) {
                setLoadError(response.error);
                return;
            }
            const apiCase =
                response?.data?.case || response?.data || response;
            const storedUser = await AsyncStorage.getItem("user");
            const userData = storedUser ? JSON.parse(storedUser) : null;
            const lawyerRole = userData?.role === "lawyer";
            setCaseData(mapApiCaseToFormState(apiCase, lawyerRole));
        } catch (err: any) {
            setLoadError(err.message || "Failed to load case");
        } finally {
            setLoadingCase(false);
        }
    };

    // ========================
    // Handlers
    // ========================
    const handleChange = (name: string, value: string) => {
        setCaseData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setCaseData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setCaseData((prev: any) => ({ ...prev, [name]: date }));
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setCaseData((prev: any) => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                multiple: true,
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets) {
                const newFiles = result.assets.map((asset) => ({
                    name: asset.name,
                    size: asset.size,
                    uri: asset.uri,
                    mimeType: asset.mimeType,
                }));
                setSelectedFiles((prev) => [...prev, ...newFiles]);
            }
        } catch {
            Alert.alert("Error", "Failed to pick documents");
        }
    };

    // ========================
    // Validation (relaxed for edit — hearing date need not be future)
    // ========================
    const validateStep = (stepIndex: number): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        const filingDate = getStartOfDay(caseData?.filingDate);
        const today = getStartOfDay(new Date());

        const validateEmail = (email: string | null | undefined, label: string) => {
            const e = normalizeEmail(email);
            if (e && !EMAIL_REGEX.test(e)) {
                errors.push(`${label} email is invalid`);
            }
        };

        const validateNamedPeople = (
            items: any[],
            label: string,
            options?: { requireEmail?: boolean; requireLevel?: boolean }
        ) => {
            items.forEach((item, index) => {
                const itemLabel = `${label} ${index + 1}`;
                if (!normalizeText(item?.name)) {
                    errors.push(`${itemLabel} name is required`);
                }
                const email = normalizeEmail(item?.email);
                if (options?.requireEmail && !email) {
                    errors.push(`${itemLabel} email is required`);
                }
                validateEmail(email, itemLabel);
                if (
                    options?.requireLevel &&
                    !LAWYER_LEVEL_VALUES.has(normalizeText(item?.level))
                ) {
                    errors.push(
                        `${itemLabel} level must be Senior, Junior, or Associate`
                    );
                }
            });
        };

        switch (stepIndex) {
            case 0:
                if (!normalizeText(caseData?.title)) errors.push("Case title is required");
                if (!normalizeText(caseData?.caseNumber)) errors.push("Case number is required");
                if (!caseData?.caseType) errors.push("Case type is required");
                if (!caseData?.status) errors.push("Status is required");
                if (!filingDate) errors.push("Filing date is required");
                if (filingDate && today && filingDate > today) {
                    errors.push("Filing date cannot be in the future");
                }
                if (!caseData?.nextHearingDate) {
                    errors.push("Next hearing date is required");
                }
                break;
            case 1:
                if (!normalizeText(caseData?.court)) errors.push("Court name is required");
                break;
            case 2:
                if ((caseData?.petitioners || []).length === 0) {
                    errors.push("Add at least one petitioner");
                }
                validateNamedPeople(caseData?.petitioners || [], "Petitioner");
                validateNamedPeople(caseData?.respondents || [], "Respondent");
                break;
            case 3:
                // Documents optional
                break;
            case 4:
                validateNamedPeople(caseData?.lawyers || [], "Lawyer", {
                    requireEmail: true,
                    requireLevel: true,
                });
                validateNamedPeople(caseData?.advocates || [], "Advocate", {
                    requireEmail: true,
                    requireLevel: true,
                });
                validateNamedPeople(caseData?.clients || [], "Client", {
                    requireEmail: true,
                });
                validateNamedPeople(caseData?.stakeholders || [], "Stakeholder");
                if (isLawyer && (caseData?.clients || []).length === 0) {
                    errors.push("Add at least one client to the case");
                }
                break;
        }

        return { valid: errors.length === 0, errors };
    };

    // ========================
    // Navigation
    // ========================
    const handleNext = () => {
        const validation = validateStep(currentStep);
        if (!validation.valid) {
            Alert.alert("Required Fields", validation.errors.join("\n"));
            return;
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    };

    // ========================
    // Submit
    // ========================
    const handleSubmit = async () => {
        for (let i = 0; i < STEPS.length; i++) {
            const validation = validateStep(i);
            if (!validation.valid) {
                setCurrentStep(i);
                Alert.alert(`Fix errors in "${STEPS[i].title}"`, validation.errors.join("\n"));
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const normalizedPetitioners = (caseData.petitioners || []).map((p: any) => ({
                name: normalizeText(p.name),
                type: p.type || "Individual",
                role: p.label || caseData.petitionerLabel || "Petitioner",
                email: normalizeEmail(p.email),
                contact: normalizeText(p.contact),
                address: normalizeText(p.address),
            }));

            const normalizedRespondents = (caseData.respondents || []).map((r: any) => ({
                name: normalizeText(r.name),
                type: r.type || "Individual",
                role: r.label || caseData.respondentLabel || "Respondent",
                email: normalizeEmail(r.email),
                contact: normalizeText(r.contact),
                address: normalizeText(r.address),
            }));

            const normalizedLawyers = (caseData.lawyers || []).map((l: any) => ({
                name: normalizeText(l.name),
                email: normalizeEmail(l.email),
                contact: normalizeText(l.contact),
                company: normalizeText(l.company),
                gst: normalizeText(l.gst),
                level: normalizeText(l.level),
                chairPosition: l.chairPosition || "supporting",
                isPrimary: !!l.isPrimary,
            }));

            const normalizedAdvocates = (caseData.advocates || []).map((a: any) => ({
                name: normalizeText(a.name),
                email: normalizeEmail(a.email),
                contact: normalizeText(a.contact),
                company: normalizeText(a.company),
                gst: normalizeText(a.gst),
                poc: normalizeText(a.poc),
                level: normalizeText(a.level),
                chairPosition: a.chairPosition || "supporting",
                isLead: !!a.isLead,
            }));

            const normalizedClients = (caseData.clients || []).map((c: any) => ({
                name: normalizeText(c.name),
                email: normalizeEmail(c.email),
                contact: normalizeText(c.contact),
                address: normalizeText(c.address),
            }));

            const derivedLawyersForBackend = isLawyer
                ? normalizedLawyers
                : normalizedAdvocates.map((a: any) => ({
                      name: a.name,
                      email: a.email,
                      contact: a.contact,
                      company: a.company,
                      gst: a.gst,
                      poc: a.poc,
                      level: a.level,
                      chairPosition: a.chairPosition,
                      isPrimary: a.isLead,
                  }));

            const formattedData: any = {
                title: normalizeText(caseData.title),
                caseNumber: normalizeText(caseData.caseNumber),
                caseType: caseData.caseType,
                status: caseData.status,
                priority: caseData.priority,
                caseStage: caseData.caseStage,
                isUrgent: caseData.isUrgent,
                description: normalizeText(caseData.description),
                actSections: normalizeText(caseData.actSections),
                reliefSought: normalizeText(caseData.reliefSought),
                courtState: caseData.courtState,
                district: caseData.district,
                courtType: caseData.courtType || "district_court",
                bench: caseData.bench,
                court: normalizeText(caseData.court),
                courtHall: normalizeText(caseData.courtHall),
                courtComplex: normalizeText(caseData.courtComplex),
                notes: normalizeText(caseData.notes),
                parties: {
                    petitioner: normalizedPetitioners,
                    respondent: normalizedRespondents,
                },
            };

            if (caseData.filingDate) {
                formattedData.filingDate = caseData.filingDate;
            }
            if (caseData.nextHearingDate) {
                formattedData.nextHearingDate = caseData.nextHearingDate;
            }
            if (derivedLawyersForBackend.length > 0) {
                formattedData.lawyers = derivedLawyersForBackend;
            }
            if (normalizedAdvocates.length > 0) {
                formattedData.advocates = normalizedAdvocates;
            }
            if (normalizedClients.length > 0) {
                formattedData.clients = normalizedClients;
            }
            if (caseData.stakeholders?.length > 0) {
                formattedData.stakeholders = caseData.stakeholders.map((s: any) => ({
                    name: normalizeText(s.name),
                    email: normalizeEmail(s.email),
                    contact: normalizeText(s.contact),
                    address: normalizeText(s.address),
                    roleInCase: normalizeText(s.roleInCase),
                }));
            }

            const result = await api.cases.update(id as string, formattedData);

            if (result.error) {
                Alert.alert("Error", result.error);
                setIsSubmitting(false);
                return;
            }

            // Upload any newly added documents
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", {
                        uri: file.uri,
                        name: file.name,
                        type: file.mimeType || "application/octet-stream",
                    } as any);
                    try {
                        await api.documents.uploadToCaseId(
                            id as string,
                            formData,
                            (event) => {
                                if (event.lengthComputable) {
                                    const percent = Math.round(
                                        (event.loaded / event.total) * 100
                                    );
                                    setUploadProgress((prev) => ({
                                        ...prev,
                                        [file.name]: percent,
                                    }));
                                }
                            }
                        );
                        setUploadProgress((prev) => ({
                            ...prev,
                            [file.name]: 100,
                        }));
                    } catch (uploadError) {
                        console.error("Upload error for", file.name, uploadError);
                    }
                }
            }

            Alert.alert("Success", "Case updated successfully!", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update case");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========================
    // Render
    // ========================
    if (loadingCase) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading case…</Text>
            </View>
        );
    }

    if (loadError || !caseData) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="alert-circle-outline" size={56} color="#d1d5db" />
                <Text style={styles.errorText}>{loadError || "Case not found"}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setLoadingCase(true);
                        fetchCase();
                    }}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <CaseDetailsStep
                        caseData={caseData}
                        handleChange={handleChange}
                        handleSelectChange={handleSelectChange}
                        handleDateChange={handleDateChange}
                        handleCheckboxChange={handleCheckboxChange}
                    />
                );
            case 1:
                return (
                    <CourtInfoStep
                        caseData={caseData}
                        handleChange={handleChange}
                        handleSelectChange={handleSelectChange}
                    />
                );
            case 2:
                return (
                    <PartySectionStep caseData={caseData} setCaseData={setCaseData} />
                );
            case 3:
                return (
                    <DocumentsStep
                        selectedFiles={selectedFiles}
                        uploadProgress={uploadProgress}
                        handleFileChange={handleFileChange}
                    />
                );
            case 4:
                return (
                    <AssociatedPartiesStep
                        caseData={caseData}
                        setCaseData={setCaseData}
                        isLawyer={isLawyer}
                        user={user}
                    />
                );
            default:
                return null;
        }
    };

    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={100}
        >
            {/* ── Progress Bar ── */}
            <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step.key}>
                            <TouchableOpacity
                                style={[
                                    styles.progressDot,
                                    index <= currentStep && styles.progressDotActive,
                                    index < currentStep && styles.progressDotCompleted,
                                ]}
                                onPress={() => {
                                    if (index <= currentStep) {
                                        setCurrentStep(index);
                                    } else {
                                        const validation = validateStep(currentStep);
                                        if (validation.valid) {
                                            setCurrentStep(index);
                                        } else {
                                            Alert.alert("Required Fields", validation.errors.join("\n"));
                                        }
                                    }
                                }}
                            >
                                {index < currentStep ? (
                                    <Ionicons name="checkmark" size={14} color="#fff" />
                                ) : (
                                    <Text
                                        style={[
                                            styles.progressDotText,
                                            index <= currentStep && styles.progressDotTextActive,
                                        ]}
                                    >
                                        {index + 1}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            {index < STEPS.length - 1 && (
                                <View
                                    style={[
                                        styles.progressLine,
                                        index < currentStep && styles.progressLineActive,
                                    ]}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </View>
                <View style={styles.progressLabels}>
                    {STEPS.map((step, index) => (
                        <Text
                            key={step.key}
                            style={[
                                styles.progressLabel,
                                index === currentStep && styles.progressLabelActive,
                            ]}
                            numberOfLines={1}
                        >
                            {step.title}
                        </Text>
                    ))}
                </View>
            </View>

            {/* ── Step Content ── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {renderStepContent()}
            </ScrollView>

            {/* ── Bottom Navigation ── */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.navButton, styles.cancelButton]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <View style={styles.navRight}>
                    {!isFirstStep && (
                        <TouchableOpacity
                            style={[styles.navButton, styles.backButton]}
                            onPress={handleBack}
                        >
                            <Ionicons name="arrow-back" size={18} color="#374151" />
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}

                    {isLastStep ? (
                        <TouchableOpacity
                            style={[
                                styles.navButton,
                                styles.submitButton,
                                isSubmitting && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={18}
                                        color="#fff"
                                    />
                                    <Text style={styles.submitButtonText}>Update Case</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navButton, styles.nextButton]}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#f5f5f5",
    },
    loadingText: {
        fontSize: 14,
        color: "#6b7280",
    },
    errorText: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        paddingHorizontal: 24,
    },
    retryButton: {
        backgroundColor: "#000",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    // Progress
    progressSection: {
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    progressBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
    },
    progressDotActive: {
        backgroundColor: "#000",
    },
    progressDotCompleted: {
        backgroundColor: "#22c55e",
    },
    progressDotText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#9ca3af",
    },
    progressDotTextActive: {
        color: "#fff",
    },
    progressLine: {
        height: 2,
        flex: 1,
        backgroundColor: "#e5e7eb",
        marginHorizontal: 4,
    },
    progressLineActive: {
        backgroundColor: "#22c55e",
    },
    progressLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    progressLabel: {
        fontSize: 10,
        color: "#9ca3af",
        fontWeight: "500",
        width: 56,
        textAlign: "center",
    },
    progressLabelActive: {
        color: "#000",
        fontWeight: "700",
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    // Bottom Nav
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                paddingBottom: 28,
            },
            android: { elevation: 8 },
        }),
    },
    navButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    navRight: {
        flexDirection: "row",
        gap: 10,
    },
    cancelButton: {
        backgroundColor: "#f3f4f6",
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6b7280",
    },
    backButton: {
        backgroundColor: "#f3f4f6",
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    nextButton: {
        backgroundColor: "#000",
    },
    nextButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    submitButton: {
        backgroundColor: "#000",
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
});
