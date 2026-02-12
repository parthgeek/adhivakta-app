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
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import api from "../../services/api";
import CaseDetailsStep from "../../components/cases/CaseDetailsStep";
import CourtInfoStep from "../../components/cases/CourtInfoStep";
import PartySectionStep from "../../components/cases/PartySectionStep";
import DocumentsStep from "../../components/cases/DocumentsStep";
import AssociatedPartiesStep from "../../components/cases/AssociatedPartiesStep";

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

// ========================
// Initial State
// ========================
const initialCaseData = {
    title: "",
    caseNumber: "",
    caseType: "",
    status: "active",
    filingDate: null as Date | null,
    nextHearingDate: null as Date | null,
    priority: "normal",
    caseStage: "filing",
    isUrgent: false,
    description: "",
    actSections: "",
    reliefSought: "",
    // Court
    courtState: "karnataka",
    district: "bengaluru_urban",
    courtType: "",
    bench: "",
    court: "",
    courtHall: "",
    courtComplex: "",
    notes: "",
    // Parties
    petitionerLabel: "Petitioner",
    respondentLabel: "Defendant",
    petitioners: [] as any[],
    respondents: [] as any[],
    // Associated People
    lawyers: [] as any[],
    advocates: [] as any[],
    clients: [] as any[],
    stakeholders: [] as any[],
};

export default function NewCaseScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [caseData, setCaseData] = useState(initialCaseData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLawyer, setIsLawyer] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
        {}
    );

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setIsLawyer(userData.role === "lawyer");
            }
        } catch (error) {
            console.error("Error loading user:", error);
        }
    };

    // ========================
    // Handler Functions
    // ========================
    const handleChange = (name: string, value: string) => {
        setCaseData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setCaseData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setCaseData((prev) => ({ ...prev, [name]: date }));
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setCaseData((prev) => ({ ...prev, [name]: checked }));
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
        } catch (error) {
            Alert.alert("Error", "Failed to pick documents");
        }
    };

    // ========================
    // Validation
    // ========================
    const validateStep = (stepIndex: number): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        switch (stepIndex) {
            case 0: // Details
                if (!caseData.title.trim()) errors.push("Case title is required");
                if (!caseData.caseNumber.trim()) errors.push("Case number is required");
                if (!caseData.caseType) errors.push("Case type is required");
                if (!caseData.status) errors.push("Status is required");
                break;
            case 1: // Court
                if (!caseData.court.trim()) errors.push("Court name is required");
                break;
            case 2: // Parties
                // No strict validation — parties are optional
                break;
            case 3: // Documents
                // No strict validation — documents are optional
                break;
            case 4: // Associated Parties
                // No strict validation
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
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    // ========================
    // Submit
    // ========================
    const handleSubmit = async () => {
        // Validate all steps
        for (let i = 0; i < STEPS.length; i++) {
            const validation = validateStep(i);
            if (!validation.valid) {
                setCurrentStep(i);
                Alert.alert(
                    `Fix errors in "${STEPS[i].title}"`,
                    validation.errors.join("\n")
                );
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Format the payload to match the web app's formattedData
            const formattedData: any = {
                title: caseData.title.trim(),
                caseNumber: caseData.caseNumber.trim(),
                caseType: caseData.caseType,
                status: caseData.status,
                priority: caseData.priority,
                caseStage: caseData.caseStage,
                isUrgent: caseData.isUrgent,
                description: caseData.description.trim(),
                actSections: caseData.actSections.trim(),
                reliefSought: caseData.reliefSought.trim(),
                // Court
                courtState: caseData.courtState,
                district: caseData.district,
                courtType: caseData.courtType,
                bench: caseData.bench,
                court: caseData.court.trim(),
                courtHall: caseData.courtHall.trim(),
                courtComplex: caseData.courtComplex.trim(),
                notes: caseData.notes.trim(),
            };

            // Dates
            if (caseData.filingDate) {
                formattedData.filingDate = caseData.filingDate;
            }
            if (caseData.nextHearingDate) {
                formattedData.nextHearingDate = caseData.nextHearingDate;
            }

            // Parties
            if (caseData.petitioners && caseData.petitioners.length > 0) {
                formattedData.petitioner = caseData.petitioners.map((p: any) => ({
                    name: p.name,
                    type: p.type || "Individual",
                    role: p.label || caseData.petitionerLabel || "petitioner",
                    email: p.email,
                    contact: p.contact,
                    address: p.address,
                }));
            }

            if (caseData.respondents && caseData.respondents.length > 0) {
                formattedData.respondent = caseData.respondents.map((r: any) => ({
                    name: r.name,
                    type: r.type || "Individual",
                    role: r.label || caseData.respondentLabel || "defendant",
                    email: r.email,
                    contact: r.contact,
                    address: r.address,
                }));
            }

            // Lawyers (from lawyer view)
            if (caseData.lawyers && caseData.lawyers.length > 0) {
                formattedData.lawyers = caseData.lawyers.map((l: any) => ({
                    name: l.name,
                    email: l.email,
                    contact: l.contact,
                    company: l.company,
                    gst: l.gst,
                    level: l.level,
                    chairPosition: l.chairPosition,
                    isPrimary: l.isPrimary,
                }));
            }

            // Advocates (from client view)
            if (caseData.advocates && caseData.advocates.length > 0) {
                formattedData.advocates = caseData.advocates.map((a: any) => ({
                    name: a.name,
                    email: a.email,
                    contact: a.contact,
                    company: a.company,
                    gst: a.gst,
                    poc: a.poc,
                    level: a.level,
                    chairPosition: a.chairPosition,
                    isLead: a.isLead,
                }));
            }

            // Clients
            if (caseData.clients && caseData.clients.length > 0) {
                formattedData.clients = caseData.clients.map((c: any) => ({
                    name: c.name,
                    email: c.email,
                    contact: c.contact,
                    address: c.address,
                }));
            }

            // Stakeholders
            if (caseData.stakeholders && caseData.stakeholders.length > 0) {
                formattedData.stakeholders = caseData.stakeholders.map((s: any) => ({
                    name: s.name,
                    email: s.email,
                    contact: s.contact,
                    address: s.address,
                    roleInCase: s.roleInCase,
                }));
            }

            console.log("Submitting case data:", JSON.stringify(formattedData, null, 2));

            const result = await api.cases.create(formattedData);

            if (result.error) {
                Alert.alert("Error", result.error);
                setIsSubmitting(false);
                return;
            }

            // Upload documents if any
            if (selectedFiles.length > 0 && result.data?._id) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", {
                        uri: file.uri,
                        name: file.name,
                        type: file.mimeType || "application/octet-stream",
                    } as any);

                    try {
                        await api.documents.uploadToCaseId(
                            result.data._id,
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
                        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
                    } catch (uploadError) {
                        console.error("Upload error for", file.name, uploadError);
                    }
                }
            }

            Alert.alert("Success", "Case created successfully!", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error: any) {
            console.error("Submit error:", error);
            Alert.alert("Error", error.message || "Failed to create case");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========================
    // Render Step Content
    // ========================
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
            {/* ========== Progress Bar ========== */}
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
                                    // Allow jumping to already completed or current steps
                                    if (index <= currentStep) {
                                        setCurrentStep(index);
                                    } else {
                                        // Validate current step before jumping forward
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

            {/* ========== Content ========== */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {renderStepContent()}
            </ScrollView>

            {/* ========== Bottom Navigation ========== */}
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
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                    <Text style={styles.submitButtonText}>Save Case</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
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
            android: {
                elevation: 8,
            },
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
