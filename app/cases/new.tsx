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
import { LAWYER_LEVELS } from "../../constants/caseConstants";

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
const LAWYER_LEVEL_VALUES = new Set(
    LAWYER_LEVELS.map((option) => option.value)
);

const normalizeText = (value: string | null | undefined) => (value ?? "").trim();
const normalizeEmail = (value: string | null | undefined) =>
    normalizeText(value).toLowerCase();

const getValidDate = (value: Date | string | null | undefined) => {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getStartOfDay = (value: Date | string | null | undefined) => {
    const date = getValidDate(value);

    if (!date) return null;

    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const normalizeCaseNumber = (value: string | null | undefined) =>
    normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

const DEFAULT_ECOURT_SELECTION = {
    source: "ecourts",
    stateCode: "",
    state: "",
    districtCode: "",
    district: "",
    complexCode: "",
    complex: "",
    courtCode: "",
    court: "",
    caseTypeCode: "",
    caseTypeName: "",
    requiresEstablishment: false,
};

const EMPTY_COURT_DIRECTORY_OPTIONS = {
    states: [] as any[],
    districts: [] as any[],
    complexes: [] as any[],
    courts: [] as any[],
    caseTypes: [] as any[],
};

const EMPTY_COURT_DIRECTORY_LOADING = {
    states: false,
    districts: false,
    complexes: false,
    courts: false,
    caseTypes: false,
};

const SUPREME_COURT_ECOURT = {
    source: "supremecourt",
    stateCode: "IND",
    state: "India",
    districtCode: "SCI",
    district: "Supreme Court of India",
    complexCode: "SCI_PRINCIPAL_BENCH",
    complex: "Principal Bench, New Delhi",
    courtCode: "SCI_MAIN",
    court: "Supreme Court of India",
    caseTypeCode: "",
    caseTypeName: "",
    requiresEstablishment: false,
};

// ========================
// Initial State
// ========================
const createInitialCaseData = () => ({
    title: "",
    caseNumber: "",
    caseType: "",
    caseSubType: "",
    status: "active",
    filingDate: new Date(),
    nextHearingDate: null as Date | null,
    priority: "normal",
    caseStage: "filing",
    isUrgent: false,
    description: "",
    actSections: "",
    reliefSought: "",
    // Court
    courtState: "",
    district: "",
    courtType: "district_court",
    bench: "",
    court: "",
    courtHall: "",
    courtComplex: "",
    notes: "",
    eCourt: { ...DEFAULT_ECOURT_SELECTION },
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
});

export default function NewCaseScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [caseData, setCaseData] = useState(createInitialCaseData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLawyer, setIsLawyer] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
        {}
    );
    const [courtSource, setCourtSource] = useState("ecourts");
    const [courtDirectoryOptions, setCourtDirectoryOptions] = useState(
        EMPTY_COURT_DIRECTORY_OPTIONS
    );
    const [courtDirectoryLoading, setCourtDirectoryLoading] = useState(
        EMPTY_COURT_DIRECTORY_LOADING
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

    useEffect(() => {
        const initializeCourtDirectory = async () => {
            setCourtLookupLoading("states", true);
            try {
                const states = await api.courtDirectory.getStates("ecourts");
                setCourtDirectoryOptions((prev) => ({ ...prev, states }));
            } catch (error) {
                console.error("Failed to load states", error);
            } finally {
                setCourtLookupLoading("states", false);
            }
        };

        initializeCourtDirectory();
    }, []);

    // ========================
    // Handler Functions
    // ========================
    const handleChange = (name: string, value: string) => {
        setCaseData((prev) => ({ ...prev, [name]: value }));
    };

    const setCourtLookupLoading = (
        key: keyof typeof EMPTY_COURT_DIRECTORY_LOADING,
        value: boolean
    ) => {
        setCourtDirectoryLoading((prev) => ({ ...prev, [key]: value }));
    };

    const loadStates = async (source = "ecourts") => {
        setCourtLookupLoading("states", true);

        try {
            const states = await api.courtDirectory.getStates(source);
            setCourtDirectoryOptions((prev) => ({ ...prev, states }));
        } catch (error) {
            console.error("Failed to load states", error);
        } finally {
            setCourtLookupLoading("states", false);
        }
    };

    const loadDistricts = async (stateCode: string, source = "ecourts") => {
        if (!stateCode) return [];

        setCourtLookupLoading("districts", true);

        try {
            const districts = await api.courtDirectory.getDistricts(stateCode, source);
            setCourtDirectoryOptions((prev) => ({
                ...prev,
                districts,
                complexes: [],
                courts: [],
                caseTypes: [],
            }));
            return districts;
        } catch (error) {
            console.error("Failed to load districts", error);
            setCourtDirectoryOptions((prev) => ({
                ...prev,
                districts: [],
                complexes: [],
                courts: [],
                caseTypes: [],
            }));
            return [];
        } finally {
            setCourtLookupLoading("districts", false);
        }
    };

    const loadComplexes = async (
        stateCode: string,
        districtCode: string,
        source = "ecourts"
    ) => {
        if (!stateCode || !districtCode) return [];

        setCourtLookupLoading("complexes", true);

        try {
            const complexes = await api.courtDirectory.getComplexes(
                stateCode,
                districtCode,
                source
            );
            setCourtDirectoryOptions((prev) => ({
                ...prev,
                complexes,
                courts: [],
                caseTypes: [],
            }));
            return complexes;
        } catch (error) {
            console.error("Failed to load complexes", error);
            setCourtDirectoryOptions((prev) => ({
                ...prev,
                complexes: [],
                courts: [],
                caseTypes: [],
            }));
            return [];
        } finally {
            setCourtLookupLoading("complexes", false);
        }
    };

    const loadCourts = async (
        stateCode: string,
        districtCode: string,
        complexCode: string,
        source = "ecourts"
    ) => {
        if (!stateCode || !districtCode || !complexCode) return [];

        setCourtLookupLoading("courts", true);

        try {
            const courts = await api.courtDirectory.getCourts(
                stateCode,
                districtCode,
                complexCode,
                source
            );
            setCourtDirectoryOptions((prev) => ({
                ...prev,
                courts,
                caseTypes: [],
            }));
            return courts;
        } catch (error) {
            console.error("Failed to load courts", error);
            setCourtDirectoryOptions((prev) => ({
                ...prev,
                courts: [],
                caseTypes: [],
            }));
            return [];
        } finally {
            setCourtLookupLoading("courts", false);
        }
    };

    const loadCaseTypes = async (
        stateCode: string,
        districtCode: string,
        complexCode: string,
        courtCode: string,
        source = "ecourts"
    ) => {
        if (!stateCode || !districtCode || !complexCode || !courtCode) {
            return [];
        }

        setCourtLookupLoading("caseTypes", true);

        try {
            const payload = await api.courtDirectory.getCaseTypes(
                stateCode,
                districtCode,
                complexCode,
                courtCode,
                source
            );
            const caseTypes = payload?.caseTypes || [];
            setCourtDirectoryOptions((prev) => ({ ...prev, caseTypes }));
            return caseTypes;
        } catch (error) {
            console.error("Failed to load case types", error);
            setCourtDirectoryOptions((prev) => ({ ...prev, caseTypes: [] }));
            return [];
        } finally {
            setCourtLookupLoading("caseTypes", false);
        }
    };

    const handleCourtTypeChange = async (newSource: string) => {
        const courtTypeMap: Record<string, string> = {
            ecourts: "district_court",
            highcourts: "high_court",
            supremecourt: "supreme_court",
        };

        setCourtSource(newSource);
        setCourtDirectoryOptions(EMPTY_COURT_DIRECTORY_OPTIONS);

        if (newSource === "supremecourt") {
            setCaseData((prev) => ({
                ...prev,
                courtType: "supreme_court",
                courtState: SUPREME_COURT_ECOURT.state,
                district: SUPREME_COURT_ECOURT.district,
                bench: "",
                court: SUPREME_COURT_ECOURT.court,
                courtComplex: SUPREME_COURT_ECOURT.complex,
                caseSubType: "",
                eCourt: { ...SUPREME_COURT_ECOURT },
            }));

            await loadCaseTypes(
                SUPREME_COURT_ECOURT.stateCode,
                SUPREME_COURT_ECOURT.districtCode,
                SUPREME_COURT_ECOURT.complexCode,
                SUPREME_COURT_ECOURT.courtCode,
                "supremecourt"
            );
            return;
        }

        setCaseData((prev) => ({
            ...prev,
            courtType: courtTypeMap[newSource] || "district_court",
            courtState: "",
            district: "",
            bench: "",
            court: "",
            courtComplex: "",
            caseSubType: "",
            eCourt: {
                ...DEFAULT_ECOURT_SELECTION,
                source: newSource,
            },
        }));

        await loadStates(newSource);
    };

    const handleSelectChange = async (name: string, value: string) => {
        if (name === "ecourtState") {
            const selectedState = courtDirectoryOptions.states.find(
                (state: any) => state.code === value
            );

            setCaseData((prev) => ({
                ...prev,
                courtState: selectedState?.name || "",
                district: "",
                bench: "",
                court: "",
                courtComplex: "",
                caseSubType: "",
                eCourt: {
                    ...DEFAULT_ECOURT_SELECTION,
                    source: courtSource,
                    stateCode: value,
                    state: selectedState?.name || "",
                },
            }));

            setCourtDirectoryOptions((prev) => ({
                ...prev,
                districts: [],
                complexes: [],
                courts: [],
                caseTypes: [],
            }));

            await loadDistricts(value, courtSource);
            return;
        }

        if (name === "ecourtDistrict") {
            const selectedDistrict = courtDirectoryOptions.districts.find(
                (district: any) => district.code === value
            );
            const stateCode = caseData.eCourt?.stateCode || "";

            setCaseData((prev) => ({
                ...prev,
                district: selectedDistrict?.name || "",
                bench: courtSource === "highcourts" ? selectedDistrict?.name || "" : "",
                court: "",
                courtComplex: "",
                caseSubType: "",
                eCourt: {
                    ...prev.eCourt,
                    districtCode: value,
                    district: selectedDistrict?.name || "",
                    complexCode: "",
                    complex: "",
                    courtCode: "",
                    court: "",
                    caseTypeCode: "",
                    caseTypeName: "",
                    requiresEstablishment: false,
                },
            }));

            setCourtDirectoryOptions((prev) => ({
                ...prev,
                complexes: [],
                courts: [],
                caseTypes: [],
            }));

            await loadComplexes(stateCode, value, courtSource);
            return;
        }

        if (name === "ecourtComplex") {
            const selectedComplex = courtDirectoryOptions.complexes.find(
                (complex: any) => complex.code === value
            );
            const stateCode = caseData.eCourt?.stateCode || "";
            const districtCode = caseData.eCourt?.districtCode || "";

            setCaseData((prev) => ({
                ...prev,
                courtComplex: selectedComplex?.name || "",
                bench: courtSource === "highcourts" ? selectedComplex?.name || "" : prev.bench,
                court: "",
                caseSubType: "",
                eCourt: {
                    ...prev.eCourt,
                    complexCode: value,
                    complex: selectedComplex?.name || "",
                    courtCode: "",
                    court: "",
                    caseTypeCode: "",
                    caseTypeName: "",
                    requiresEstablishment: false,
                },
            }));

            setCourtDirectoryOptions((prev) => ({
                ...prev,
                courts: [],
                caseTypes: [],
            }));

            const courts = await loadCourts(stateCode, districtCode, value, courtSource);

            if (courts.length === 1) {
                const selectedCourt = courts[0];

                setCaseData((prev) => ({
                    ...prev,
                    court: selectedCourt.name,
                    eCourt: {
                        ...prev.eCourt,
                        courtCode: selectedCourt.code,
                        court: selectedCourt.name,
                        caseTypeCode: "",
                        caseTypeName: "",
                    },
                }));

                const caseTypes = await loadCaseTypes(
                    stateCode,
                    districtCode,
                    value,
                    selectedCourt.code,
                    courtSource
                );

                if (caseTypes.length === 1) {
                    setCaseData((prev) => ({
                        ...prev,
                        caseSubType: caseTypes[0].name,
                        eCourt: {
                            ...prev.eCourt,
                            courtCode: selectedCourt.code,
                            court: selectedCourt.name,
                            caseTypeCode: caseTypes[0].code,
                            caseTypeName: caseTypes[0].name,
                        },
                    }));
                }
            }
            return;
        }

        if (name === "ecourtCourt") {
            const selectedCourt = courtDirectoryOptions.courts.find(
                (court: any) => court.code === value
            );
            const stateCode = caseData.eCourt?.stateCode || "";
            const districtCode = caseData.eCourt?.districtCode || "";
            const complexCode = caseData.eCourt?.complexCode || "";

            setCaseData((prev) => ({
                ...prev,
                court: selectedCourt?.name || "",
                caseSubType: "",
                eCourt: {
                    ...prev.eCourt,
                    courtCode: value,
                    court: selectedCourt?.name || "",
                    caseTypeCode: "",
                    caseTypeName: "",
                },
            }));

            setCourtDirectoryOptions((prev) => ({
                ...prev,
                caseTypes: [],
            }));

            const caseTypes = await loadCaseTypes(
                stateCode,
                districtCode,
                complexCode,
                value,
                courtSource
            );

            if (caseTypes.length === 1) {
                setCaseData((prev) => ({
                    ...prev,
                    caseSubType: caseTypes[0].name,
                    eCourt: {
                        ...prev.eCourt,
                        courtCode: value,
                        court: selectedCourt?.name || prev.eCourt?.court || "",
                        caseTypeCode: caseTypes[0].code,
                        caseTypeName: caseTypes[0].name,
                    },
                }));
            }
            return;
        }

        if (name === "ecourtCaseType") {
            const selectedCaseType = courtDirectoryOptions.caseTypes.find(
                (caseType: any) => caseType.code === value
            );

            setCaseData((prev) => ({
                ...prev,
                caseSubType: selectedCaseType?.name || "",
                eCourt: {
                    ...prev.eCourt,
                    caseTypeCode: value,
                    caseTypeName: selectedCaseType?.name || "",
                },
            }));
            return;
        }

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
        } catch {
            Alert.alert("Error", "Failed to pick documents");
        }
    };

    // ========================
    // Validation
    // ========================
    const validateStep = (stepIndex: number): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        const filingDate = getStartOfDay(caseData.filingDate);
        const nextHearingDate = getStartOfDay(caseData.nextHearingDate);
        const today = getStartOfDay(new Date());

        const validateEmail = (email: string | null | undefined, label: string) => {
            const normalizedEmail = normalizeEmail(email);

            if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
                errors.push(`${label} email is invalid`);
            }
        };

        const validateNamedPeople = (
            items: any[],
            label: string,
            options?: {
                requireEmail?: boolean;
                requireLevel?: boolean;
            }
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
            case 0: // Details
                if (!normalizeText(caseData.title)) errors.push("Case title is required");
                if (!normalizeText(caseData.caseNumber)) {
                    errors.push("Case number is required");
                }
                if (!caseData.caseType) errors.push("Case type is required");
                if (!caseData.status) errors.push("Status is required");

                if (!filingDate) {
                    errors.push("Filing date is required");
                }

                if (filingDate && today && filingDate > today) {
                    errors.push("Filing date cannot be in the future");
                }

                if (!nextHearingDate) {
                    errors.push("First hearing date is required");
                }

                if (nextHearingDate && today && nextHearingDate <= today) {
                    errors.push("First hearing date must be in the future");
                }

                if (filingDate && nextHearingDate && nextHearingDate <= filingDate) {
                    errors.push("First hearing date must be after filing date");
                }
                break;
            case 1: // Court
                if (courtSource === "supremecourt") {
                    if (!normalizeText(caseData.eCourt?.caseTypeCode)) {
                        errors.push("Case type is required");
                    }
                } else {
                    if (!normalizeText(caseData.eCourt?.stateCode)) {
                        errors.push("State is required");
                    }
                    if (!normalizeText(caseData.eCourt?.districtCode)) {
                        errors.push(
                            courtSource === "highcourts"
                                ? "High Court is required"
                                : "District is required"
                        );
                    }
                    if (!normalizeText(caseData.eCourt?.complexCode)) {
                        errors.push(
                            courtSource === "highcourts"
                                ? "Bench is required"
                                : "Court complex is required"
                        );
                    }
                    if (!normalizeText(caseData.eCourt?.courtCode)) {
                        errors.push("Court selection is required");
                    }
                    if (!normalizeText(caseData.eCourt?.caseTypeCode)) {
                        errors.push("Case type is required");
                    }
                }
                break;
            case 2: // Parties
                if ((caseData.petitioners || []).length === 0) {
                    errors.push("Add at least one petitioner");
                }

                validateNamedPeople(caseData.petitioners || [], "Petitioner");
                validateNamedPeople(caseData.respondents || [], "Respondent");
                break;
            case 3: // Documents
                // No strict validation — documents are optional
                break;
            case 4: // Associated Parties
                validateNamedPeople(caseData.lawyers || [], "Lawyer", {
                    requireEmail: true,
                    requireLevel: true,
                });
                validateNamedPeople(caseData.advocates || [], "Advocate", {
                    requireEmail: true,
                    requireLevel: true,
                });
                validateNamedPeople(caseData.clients || [], "Client", {
                    requireEmail: true,
                });
                validateNamedPeople(caseData.stakeholders || [], "Stakeholder");

                if (isLawyer && (caseData.clients || []).length === 0) {
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
                : normalizedAdvocates.map((advocate: any) => ({
                      name: advocate.name,
                      email: advocate.email,
                      contact: advocate.contact,
                      company: advocate.company,
                      gst: advocate.gst,
                      poc: advocate.poc,
                      level: advocate.level,
                      chairPosition: advocate.chairPosition,
                      isPrimary: advocate.isLead,
                  }));

            // Format the payload to match the web app's formattedData
            const formattedData: any = {
                title: normalizeText(caseData.title),
                caseNumber: normalizeCaseNumber(caseData.caseNumber),
                caseType: caseData.caseType,
                caseSubType: normalizeText(
                    caseData.eCourt?.caseTypeName || caseData.caseSubType
                ),
                status: caseData.status,
                priority: caseData.priority,
                caseStage: caseData.caseStage,
                isUrgent: caseData.isUrgent,
                description: normalizeText(caseData.description),
                actSections: normalizeText(caseData.actSections),
                reliefSought: normalizeText(caseData.reliefSought),
                // Court
                courtState: normalizeText(
                    caseData.eCourt?.state || caseData.courtState
                ),
                district: normalizeText(
                    caseData.eCourt?.district || caseData.district
                ),
                courtType: caseData.courtType || "district_court",
                bench: caseData.bench,
                court: normalizeText(caseData.eCourt?.court || caseData.court),
                courtHall: normalizeText(caseData.courtHall),
                courtComplex: normalizeText(
                    caseData.eCourt?.complex || caseData.courtComplex
                ),
                notes: normalizeText(caseData.notes),
                parties: {
                    petitioner: normalizedPetitioners,
                    respondent: normalizedRespondents,
                },
            };

            if (normalizeText(caseData.eCourt?.stateCode)) {
                formattedData.eCourt = {
                    ...caseData.eCourt,
                    state: normalizeText(caseData.eCourt.state),
                    district: normalizeText(caseData.eCourt.district),
                    complex: normalizeText(caseData.eCourt.complex),
                    court: normalizeText(caseData.eCourt.court),
                    caseTypeName: normalizeText(caseData.eCourt.caseTypeName),
                };
            }

            // Dates
            if (caseData.filingDate) {
                formattedData.filingDate = caseData.filingDate;
            }
            if (caseData.nextHearingDate) {
                formattedData.nextHearingDate = caseData.nextHearingDate;
            }

            // Lawyers (from lawyer view)
            if (derivedLawyersForBackend.length > 0) {
                formattedData.lawyers = derivedLawyersForBackend;
            }

            // Advocates (from client view)
            if (normalizedAdvocates.length > 0) {
                formattedData.advocates = normalizedAdvocates;
            }

            // Clients
            if (normalizedClients.length > 0) {
                formattedData.clients = normalizedClients;
            }

            // Stakeholders
            if (caseData.stakeholders && caseData.stakeholders.length > 0) {
                formattedData.stakeholders = caseData.stakeholders.map((s: any) => ({
                    name: normalizeText(s.name),
                    email: normalizeEmail(s.email),
                    contact: normalizeText(s.contact),
                    address: normalizeText(s.address),
                    roleInCase: normalizeText(s.roleInCase),
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
            const createdCaseId = result.data?.case?._id || result.data?._id;

            if (selectedFiles.length > 0 && createdCaseId) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", {
                        uri: file.uri,
                        name: file.name,
                        type: file.mimeType || "application/octet-stream",
                    } as any);

                    try {
                        await api.documents.uploadToCaseId(
                            createdCaseId,
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
                        courtDirectoryOptions={courtDirectoryOptions}
                        courtDirectoryLoading={courtDirectoryLoading}
                        courtSource={courtSource}
                        handleCourtTypeChange={handleCourtTypeChange}
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
