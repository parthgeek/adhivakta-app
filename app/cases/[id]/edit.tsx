import React, { useEffect, useState } from "react";
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
import {
    buildCaseNumber,
    getBackendCaseType,
    getEcourtCaseTypeReference,
    normalizeCaseNumber,
    normalizeFormattedCaseNumber,
    parseCaseNumberParts,
} from "../../../lib/caseTypeUtils";
import { getCasePriority } from "../../../lib/casePriority";

const STEPS = [
    { key: "court", title: "Court Info", icon: "business-outline" },
    { key: "details", title: "Case Details", icon: "document-text-outline" },
    { key: "party", title: "Parties", icon: "people-outline" },
    { key: "documents", title: "Documents", icon: "folder-open-outline" },
    { key: "people", title: "People", icon: "people-circle-outline" },
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const CNR_NUMBER_PATTERN = /^[A-Z]{4}\d{12}$/;
const DEFAULT_CASE_YEAR = String(new Date().getFullYear());

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

const syncDerivedCaseFields = (caseInfo: any = {}) => {
    const caseYear = caseInfo.caseYear || DEFAULT_CASE_YEAR;
    const caseTypeName = caseInfo.eCourt?.caseTypeName || "";
    const ecourtTypeCode = caseInfo.eCourt?.caseTypeCode || "";
    const caseTypeReference = getEcourtCaseTypeReference({
        caseTypeName,
        caseTypeCode: ecourtTypeCode,
    });

    return {
        ...caseInfo,
        caseYear,
        caseCode: caseTypeReference.caseCode,
        caseType: getBackendCaseType(caseTypeReference.category),
        caseSubType: normalizeText(caseTypeName),
        caseNumber: buildCaseNumber({
            caseCode: caseTypeReference.caseCode,
            caseNumberMiddle: caseInfo.caseNumberMiddle,
            caseYear,
        }),
    };
};

const determineCourtSource = (apiCase: any) => {
    if (apiCase?.eCourt?.source) {
        return apiCase.eCourt.source;
    }
    if (apiCase?.courtType === "supreme_court") {
        return "supremecourt";
    }
    if (apiCase?.courtType === "high_court") {
        return "highcourts";
    }
    return "ecourts";
};

const mapApiCaseToFormState = (apiCase: any) => {
    const ecourtCaseTypeName = apiCase.eCourt?.caseTypeName || apiCase.caseSubType || "";
    const ecourtCaseTypeCode = apiCase.eCourt?.caseTypeCode || apiCase.caseCode || "";
    const parsedCaseNumber = parseCaseNumberParts({
        caseNumber: apiCase.caseNumber || "",
        caseTypeName: ecourtCaseTypeName,
        caseTypeCode: ecourtCaseTypeCode,
    });
    const courtSource = determineCourtSource(apiCase);
    const baseEcourt =
        courtSource === "supremecourt"
            ? { ...SUPREME_COURT_ECOURT }
            : { ...DEFAULT_ECOURT_SELECTION, source: courtSource };

    return syncDerivedCaseFields({
        _id: apiCase._id,
        title: apiCase.title || "",
        cnrNumber: apiCase.cnrNumber || "",
        caseNumberMiddle: parsedCaseNumber.caseNumberMiddle || "",
        caseYear: parsedCaseNumber.caseYear || DEFAULT_CASE_YEAR,
        caseCode: parsedCaseNumber.caseCode || ecourtCaseTypeCode || "",
        caseType: apiCase.caseType || "",
        caseSubType: ecourtCaseTypeName || "",
        status: apiCase.status || "active",
        filingDate: getValidDate(apiCase.filingDate) || new Date(),
        nextHearingDate: getValidDate(apiCase.nextHearingDate),
        priority: getCasePriority({
            status: apiCase.status,
            nextHearingDate: apiCase.nextHearingDate || apiCase.hearingDate,
        }),
        caseStage: apiCase.caseStage || "filing",
        isUrgent: !!apiCase.isUrgent,
        description: apiCase.description || "",
        actSections: apiCase.actSections || "",
        reliefSought: apiCase.reliefSought || "",
        courtState: apiCase.courtState || "",
        district: apiCase.district || "",
        courtType:
            apiCase.courtType ||
            (courtSource === "supremecourt"
                ? "supreme_court"
                : courtSource === "highcourts"
                  ? "high_court"
                  : "district_court"),
        bench: apiCase.bench || "",
        court: apiCase.court || "",
        courtHall: apiCase.courtHall || "",
        courtComplex: apiCase.courtComplex || "",
        notes: apiCase.notes || "",
        eCourt: {
            ...baseEcourt,
            ...(apiCase.eCourt || {}),
            source: courtSource,
            state: apiCase.eCourt?.state || apiCase.courtState || baseEcourt.state,
            district: apiCase.eCourt?.district || apiCase.district || baseEcourt.district,
            complex: apiCase.eCourt?.complex || apiCase.courtComplex || baseEcourt.complex,
            court: apiCase.eCourt?.court || apiCase.court || baseEcourt.court,
            caseTypeName: ecourtCaseTypeName,
            caseTypeCode: ecourtCaseTypeCode,
        },
        petitionerLabel: "Petitioner",
        respondentLabel: "Defendant",
        petitioners: (apiCase.parties?.petitioner || []).map((p: any) => ({
            name: p.name || "",
            type: p.type || "Individual",
            label: p.role || "Petitioner",
            email: p.email || "",
            contact: p.contact || "",
            address: p.address || "",
        })),
        respondents: (apiCase.parties?.respondent || []).map((r: any) => ({
            name: r.name || "",
            type: r.type || "Individual",
            label: r.role || "Respondent",
            email: r.email || "",
            contact: r.contact || "",
            address: r.address || "",
        })),
        lawyers: (apiCase.lawyers || []).map((l: any) => ({
            name: l.name || "",
            email: l.email || "",
            contact: l.contact || "",
            company: l.company || "",
            gst: l.gst || "",
            level: l.level || "",
            chairPosition: l.chairPosition || "supporting",
            isPrimary: !!l.isPrimary,
        })),
        advocates: (apiCase.advocates || []).map((a: any) => ({
            name: a.name || "",
            email: a.email || "",
            contact: a.contact || "",
            company: a.company || "",
            gst: a.gst || "",
            poc: a.poc || "",
            level: a.level || "",
            chairPosition: a.chairPosition || "supporting",
            isLead: !!a.isLead,
        })),
        clients: (apiCase.clients || []).map((c: any) => ({
            name: c.name || "",
            email: c.email || "",
            contact: c.contact || "",
            address: c.address || "",
        })),
        stakeholders: (apiCase.stakeholders || []).map((s: any) => ({
            name: s.name || "",
            email: s.email || "",
            contact: s.contact || "",
            address: s.address || "",
            roleInCase: s.roleInCase || "",
        })),
    });
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
    const [courtSource, setCourtSource] = useState("ecourts");
    const [courtDirectoryOptions, setCourtDirectoryOptions] = useState(
        EMPTY_COURT_DIRECTORY_OPTIONS
    );
    const [courtDirectoryLoading, setCourtDirectoryLoading] = useState(
        EMPTY_COURT_DIRECTORY_LOADING
    );

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
            return states;
        } catch (error) {
            console.error("Failed to load states", error);
            return [];
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
        if (!stateCode || !districtCode || !complexCode || !courtCode) return [];
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

    const hydrateCourtDirectory = async (formState: any, source: string) => {
        setCourtDirectoryOptions(EMPTY_COURT_DIRECTORY_OPTIONS);

        if (source === "supremecourt") {
            await loadCaseTypes(
                SUPREME_COURT_ECOURT.stateCode,
                SUPREME_COURT_ECOURT.districtCode,
                SUPREME_COURT_ECOURT.complexCode,
                SUPREME_COURT_ECOURT.courtCode,
                "supremecourt"
            );
            return;
        }

        await loadStates(source);

        const stateCode = formState.eCourt?.stateCode || "";
        const districtCode = formState.eCourt?.districtCode || "";
        const complexCode = formState.eCourt?.complexCode || "";
        const courtCode = formState.eCourt?.courtCode || "";

        if (!stateCode) return;
        await loadDistricts(stateCode, source);
        if (!districtCode) return;
        await loadComplexes(stateCode, districtCode, source);
        if (!complexCode) return;
        await loadCourts(stateCode, districtCode, complexCode, source);
        if (!courtCode) return;
        await loadCaseTypes(stateCode, districtCode, complexCode, courtCode, source);
    };

    async function fetchCase() {
        try {
            setLoadError("");
            const response = await api.cases.get(id as string);
            if (response?.error) {
                setLoadError(response.error);
                return;
            }
            const apiCase = response?.data?.case || response?.data || response;
            const formState = mapApiCaseToFormState(apiCase);
            const source = determineCourtSource(apiCase);
            setCourtSource(source);
            setCaseData(formState);
            await hydrateCourtDirectory(formState, source);
        } catch (err: any) {
            setLoadError(err.message || "Failed to load case");
        } finally {
            setLoadingCase(false);
        }
    }

    useEffect(() => {
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

        loadUser();
    }, []);

    useEffect(() => {
        if (!id) return;

        const loadInitialCase = async () => {
            try {
                setLoadError("");
                const response = await api.cases.get(id as string);
                if (response?.error) {
                    setLoadError(response.error);
                    return;
                }
                const apiCase = response?.data?.case || response?.data || response;
                const formState = mapApiCaseToFormState(apiCase);
                const source = determineCourtSource(apiCase);
                setCourtSource(source);
                setCaseData(formState);

                setCourtDirectoryOptions(EMPTY_COURT_DIRECTORY_OPTIONS);

                if (source === "supremecourt") {
                    await loadCaseTypes(
                        SUPREME_COURT_ECOURT.stateCode,
                        SUPREME_COURT_ECOURT.districtCode,
                        SUPREME_COURT_ECOURT.complexCode,
                        SUPREME_COURT_ECOURT.courtCode,
                        "supremecourt"
                    );
                } else {
                    await loadStates(source);

                    const stateCode = formState.eCourt?.stateCode || "";
                    const districtCode = formState.eCourt?.districtCode || "";
                    const complexCode = formState.eCourt?.complexCode || "";
                    const courtCode = formState.eCourt?.courtCode || "";

                    if (stateCode) {
                        await loadDistricts(stateCode, source);
                    }
                    if (stateCode && districtCode) {
                        await loadComplexes(stateCode, districtCode, source);
                    }
                    if (stateCode && districtCode && complexCode) {
                        await loadCourts(stateCode, districtCode, complexCode, source);
                    }
                    if (stateCode && districtCode && complexCode && courtCode) {
                        await loadCaseTypes(
                            stateCode,
                            districtCode,
                            complexCode,
                            courtCode,
                            source
                        );
                    }
                }
            } catch (err: any) {
                setLoadError(err.message || "Failed to load case");
            } finally {
                setLoadingCase(false);
            }
        };

        loadInitialCase();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (name: string, value: string) => {
        if (name === "caseNumberMiddle") {
            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    caseNumberMiddle: normalizeCaseNumber(value),
                })
            );
            return;
        }

        if (name === "cnrNumber") {
            setCaseData((prev: any) => ({
                ...prev,
                cnrNumber: value.toUpperCase(),
            }));
            return;
        }

        setCaseData((prev: any) => ({ ...prev, [name]: value }));
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
            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    courtType: "supreme_court",
                    courtState: SUPREME_COURT_ECOURT.state,
                    district: SUPREME_COURT_ECOURT.district,
                    bench: "",
                    court: SUPREME_COURT_ECOURT.court,
                    courtComplex: SUPREME_COURT_ECOURT.complex,
                    eCourt: { ...SUPREME_COURT_ECOURT },
                })
            );

            await loadCaseTypes(
                SUPREME_COURT_ECOURT.stateCode,
                SUPREME_COURT_ECOURT.districtCode,
                SUPREME_COURT_ECOURT.complexCode,
                SUPREME_COURT_ECOURT.courtCode,
                "supremecourt"
            );
            return;
        }

        setCaseData((prev: any) =>
            syncDerivedCaseFields({
                ...prev,
                courtType: courtTypeMap[newSource] || "district_court",
                courtState: "",
                district: "",
                bench: "",
                court: "",
                courtComplex: "",
                eCourt: {
                    ...DEFAULT_ECOURT_SELECTION,
                    source: newSource,
                },
            })
        );

        await loadStates(newSource);
    };

    const handleSelectChange = async (name: string, value: string) => {
        if (name === "caseYear") {
            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    caseYear: value,
                })
            );
            return;
        }

        if (name === "ecourtState") {
            const selectedState = courtDirectoryOptions.states.find(
                (state: any) => state.code === value
            );

            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    courtState: selectedState?.name || "",
                    district: "",
                    bench: "",
                    court: "",
                    courtComplex: "",
                    eCourt: {
                        ...DEFAULT_ECOURT_SELECTION,
                        source: courtSource,
                        stateCode: value,
                        state: selectedState?.name || "",
                    },
                })
            );

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

            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    district: selectedDistrict?.name || "",
                    bench: courtSource === "highcourts" ? selectedDistrict?.name || "" : "",
                    court: "",
                    courtComplex: "",
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
                })
            );

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

            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    courtComplex: selectedComplex?.name || "",
                    bench: courtSource === "highcourts" ? selectedComplex?.name || "" : prev.bench,
                    court: "",
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
                })
            );

            setCourtDirectoryOptions((prev) => ({
                ...prev,
                courts: [],
                caseTypes: [],
            }));

            const courts = await loadCourts(stateCode, districtCode, value, courtSource);

            if (courts.length === 1) {
                const selectedCourt = courts[0];

                setCaseData((prev: any) =>
                    syncDerivedCaseFields({
                        ...prev,
                        court: selectedCourt.name,
                        eCourt: {
                            ...prev.eCourt,
                            courtCode: selectedCourt.code,
                            court: selectedCourt.name,
                            caseTypeCode: "",
                            caseTypeName: "",
                        },
                    })
                );

                const caseTypes = await loadCaseTypes(
                    stateCode,
                    districtCode,
                    value,
                    selectedCourt.code,
                    courtSource
                );

                if (caseTypes.length === 1) {
                    setCaseData((prev: any) =>
                        syncDerivedCaseFields({
                            ...prev,
                            eCourt: {
                                ...prev.eCourt,
                                courtCode: selectedCourt.code,
                                court: selectedCourt.name,
                                caseTypeCode: caseTypes[0].code,
                                caseTypeName: caseTypes[0].name,
                            },
                        })
                    );
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

            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    court: selectedCourt?.name || "",
                    eCourt: {
                        ...prev.eCourt,
                        courtCode: value,
                        court: selectedCourt?.name || "",
                        caseTypeCode: "",
                        caseTypeName: "",
                    },
                })
            );

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
                setCaseData((prev: any) =>
                    syncDerivedCaseFields({
                        ...prev,
                        eCourt: {
                            ...prev.eCourt,
                            courtCode: value,
                            court: selectedCourt?.name || prev.eCourt?.court || "",
                            caseTypeCode: caseTypes[0].code,
                            caseTypeName: caseTypes[0].name,
                        },
                    })
                );
            }
            return;
        }

        if (name === "ecourtCaseType") {
            const selectedCaseType = courtDirectoryOptions.caseTypes.find(
                (caseType: any) => caseType.code === value
            );

            setCaseData((prev: any) =>
                syncDerivedCaseFields({
                    ...prev,
                    eCourt: {
                        ...prev.eCourt,
                        caseTypeCode: value,
                        caseTypeName: selectedCaseType?.name || "",
                    },
                })
            );
            return;
        }

        setCaseData((prev: any) =>
            syncDerivedCaseFields({ ...prev, [name]: value })
        );
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setCaseData((prev: any) => {
            const newData = { ...prev, [name]: date };

            if (name === "nextHearingDate" && newData.filingDate && date) {
                if (new Date(date) <= new Date(newData.filingDate)) {
                    Alert.alert(
                        "Validation Error",
                        "First hearing date must be after the filing date"
                    );
                    return prev;
                }
            }

            if (name === "filingDate" && date) {
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (new Date(date) > today) {
                    Alert.alert(
                        "Validation Error",
                        "Filing date cannot be in the future"
                    );
                    return prev;
                }
            }

            return newData;
        });
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

    const validateStep = (stepIndex: number): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        const filingDate = getStartOfDay(caseData?.filingDate);
        const nextHearingDate = getStartOfDay(caseData?.nextHearingDate);
        const today = getStartOfDay(new Date());

        const validateEmail = (email: string | null | undefined, label: string) => {
            const normalized = normalizeEmail(email);
            if (normalized && !EMAIL_REGEX.test(normalized)) {
                errors.push(`${label} email is invalid`);
            }
        };

        const validateNamedPeople = (
            items: any[],
            label: string,
            options?: {
                requireEmail?: boolean;
                requireCompany?: boolean;
                requireContact?: boolean;
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
                if (options?.requireCompany && !normalizeText(item?.company)) {
                    errors.push(`${itemLabel} law firm is required`);
                }
                if (options?.requireContact && !normalizeText(item?.contact)) {
                    errors.push(`${itemLabel} mobile number is required`);
                }

                validateEmail(email, itemLabel);
            });
        };

        switch (stepIndex) {
            case 0:
                if (courtSource === "supremecourt") {
                    if (!normalizeText(caseData?.eCourt?.caseTypeCode)) {
                        errors.push("Case type is required");
                    }
                } else {
                    if (!normalizeText(caseData?.eCourt?.stateCode)) {
                        errors.push("State is required");
                    }
                    if (!normalizeText(caseData?.eCourt?.districtCode)) {
                        errors.push(
                            courtSource === "highcourts"
                                ? "High Court is required"
                                : "District is required"
                        );
                    }
                    if (!normalizeText(caseData?.eCourt?.complexCode)) {
                        errors.push(
                            courtSource === "highcourts"
                                ? "Bench is required"
                                : "Court complex is required"
                        );
                    }
                    if (!normalizeText(caseData?.eCourt?.courtCode)) {
                        errors.push("Court selection is required");
                    }
                    if (!normalizeText(caseData?.eCourt?.caseTypeCode)) {
                        errors.push("Case type is required");
                    }
                }
                break;
            case 1:
                if (!normalizeText(caseData?.title)) {
                    errors.push("Case title is required");
                } else if (normalizeText(caseData?.title).length < 3) {
                    errors.push("Case title must be at least 3 characters");
                }
                if (!normalizeText(caseData?.caseNumberMiddle)) {
                    errors.push("Filing number is required");
                }

                const normalizedCnrNumber = normalizeText(caseData?.cnrNumber).toUpperCase();
                if (!normalizedCnrNumber) {
                    errors.push("CNR number is required");
                } else if (!CNR_NUMBER_PATTERN.test(normalizedCnrNumber)) {
                    errors.push("Enter a valid CNR number like MHAU019999992015");
                }

                if (!normalizeText(caseData?.caseYear)) {
                    errors.push("Case year is required");
                }
                if (!normalizeText(caseData?.caseType)) {
                    errors.push("Select case type in Court Information first");
                }
                if (!caseData?.status) {
                    errors.push("Status is required");
                }
                if (!normalizeText(caseData?.description)) {
                    errors.push("Case description is required");
                }
                if (!normalizeText(caseData?.actSections)) {
                    errors.push("Act and sections are required");
                }
                if (!normalizeText(caseData?.reliefSought)) {
                    errors.push("Relief sought is required");
                }
                if (!filingDate) {
                    errors.push("Filing date is required");
                }
                if (filingDate && today && filingDate > today) {
                    errors.push("Filing date cannot be in the future");
                }
                if (!nextHearingDate) {
                    errors.push("First hearing date is required");
                }
                if (filingDate && nextHearingDate && nextHearingDate <= filingDate) {
                    errors.push("First hearing date must be after filing date");
                }
                break;
            case 2:
                if ((caseData?.petitioners || []).length === 0) {
                    errors.push("Add at least one petitioner");
                }
                if ((caseData?.respondents || []).length === 0) {
                    errors.push("Add at least one respondent");
                }
                validateNamedPeople(caseData?.petitioners || [], "Petitioner");
                validateNamedPeople(caseData?.respondents || [], "Respondent");
                break;
            case 3:
                break;
            case 4:
                validateNamedPeople(caseData?.lawyers || [], "Lawyer", {
                    requireEmail: true,
                    requireCompany: true,
                    requireContact: true,
                });
                validateNamedPeople(caseData?.advocates || [], "Advocate", {
                    requireEmail: true,
                    requireCompany: true,
                    requireContact: true,
                });
                validateNamedPeople(caseData?.clients || [], "Client", {
                    requireEmail: true,
                });
                validateNamedPeople(caseData?.stakeholders || [], "Stakeholder");

                if (isLawyer && (caseData?.clients || []).length === 0) {
                    errors.push("Add at least one client to the case");
                }
                if (isLawyer && (caseData?.lawyers || []).length === 0) {
                    errors.push("Add at least one lawyer");
                }
                if (!isLawyer && (caseData?.clients || []).length === 0) {
                    errors.push("Add a client");
                }
                if (!isLawyer && (caseData?.advocates || []).length === 0) {
                    errors.push("Add a lawyer");
                }
                break;
        }

        return { valid: errors.length === 0, errors };
    };

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
                cnrNumber: normalizeText(caseData.cnrNumber).toUpperCase(),
                caseNumber: normalizeFormattedCaseNumber(caseData.caseNumber),
                caseType: caseData.caseType,
                caseSubType: normalizeText(caseData.eCourt?.caseTypeName || caseData.caseSubType),
                status: caseData.status,
                priority: getCasePriority({
                    status: caseData.status,
                    nextHearingDate: caseData.nextHearingDate,
                }),
                caseStage: caseData.caseStage,
                isUrgent: caseData.isUrgent,
                description: normalizeText(caseData.description),
                actSections: normalizeText(caseData.actSections),
                reliefSought: normalizeText(caseData.reliefSought),
                courtState: normalizeText(caseData.eCourt?.state || caseData.courtState),
                district: normalizeText(caseData.eCourt?.district || caseData.district),
                courtType: caseData.courtType || "district_court",
                bench: caseData.bench,
                court: normalizeText(caseData.eCourt?.court || caseData.court),
                courtHall: normalizeText(caseData.courtHall),
                courtComplex: normalizeText(caseData.eCourt?.complex || caseData.courtComplex),
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
            case 1:
                return (
                    <CaseDetailsStep
                        caseData={caseData}
                        handleChange={handleChange}
                        handleSelectChange={handleSelectChange}
                        handleDateChange={handleDateChange}
                        handleCheckboxChange={handleCheckboxChange}
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
                                            Alert.alert(
                                                "Required Fields",
                                                validation.errors.join("\n")
                                            );
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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {renderStepContent()}
            </ScrollView>

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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
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
