import { caseTypes } from "./caseTypes";

const CASE_TYPE_CATEGORY_TO_VALUE: Record<string, string> = {
  Civil: "civil",
  Criminal: "criminal",
  Family: "family",
  Commercial: "commercial",
  Consumer: "consumer",
  Labour: "labour",
  Tribunal: "tribunal",
  Special: "special",
  Writ: "writ",
  Appeal: "appeal",
  Revision: "revision",
  Execution: "execution",
  Arbitration: "arbitration",
  Revenue: "revenue",
  "Motor Accident Claims": "motor_accident",
  Other: "other",
};

const STOP_WORDS = new Set([
  "and",
  "application",
  "case",
  "civil",
  "criminal",
  "for",
  "in",
  "main",
  "misc",
  "miscellaneous",
  "of",
  "original",
  "petition",
  "the",
]);

export const normalizeCaseNumber = (value = "") =>
  typeof value === "string"
    ? value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    : "";

export const normalizeCaseTypePrefix = (value = "") =>
  typeof value === "string"
    ? value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    : "";

export const normalizeFormattedCaseNumber = (value = "") =>
  typeof value === "string"
    ? value
        .toUpperCase()
        .replace(/[^A-Z0-9/]/g, "")
        .replace(/\/+/g, "/")
        .replace(/^\/|\/$/g, "")
    : "";

const normalizeLookupValue = (value = "") =>
  typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    : "";

const getLookupTokens = (value = "") =>
  normalizeLookupValue(value)
    .split(" ")
    .filter((token) => token.length > 1);

const buildCaseTypeInitials = (value = "") => {
  const tokens = normalizeLookupValue(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));

  if (tokens.length === 0) return "";
  if (tokens.length === 1) return tokens[0].slice(0, 3).toUpperCase();
  if (tokens.length === 2) {
    return `${tokens[0].slice(0, 2)}${tokens[1].slice(0, 1)}`.toUpperCase();
  }

  return tokens
    .slice(0, 4)
    .map((token) => token[0])
    .join("")
    .toUpperCase();
};

const findBestEcourtCaseTypeMatch = ({
  caseTypeName = "",
  caseTypeCode = "",
}: {
  caseTypeName?: string;
  caseTypeCode?: string;
} = {}) => {
  const normalizedName = normalizeLookupValue(caseTypeName);
  const normalizedCode = normalizeCaseNumber(caseTypeCode);

  if (!normalizedName && !normalizedCode) return null;

  const caseTypeEntries = Object.entries(caseTypes);

  const exactMatch = caseTypeEntries.find(([, types]) =>
    types.some((type) => {
      const normalizedLabel = normalizeLookupValue(type.label);
      const normalizedTypeCode = normalizeCaseNumber(type.code);

      return (
        (normalizedName && normalizedLabel === normalizedName) ||
        (normalizedCode && normalizedTypeCode === normalizedCode)
      );
    })
  );

  if (exactMatch) {
    const matchedType = exactMatch[1].find((type) => {
      const normalizedLabel = normalizeLookupValue(type.label);
      const normalizedTypeCode = normalizeCaseNumber(type.code);

      return (
        (normalizedName && normalizedLabel === normalizedName) ||
        (normalizedCode && normalizedTypeCode === normalizedCode)
      );
    });

    return {
      category: exactMatch[0],
      type: matchedType,
    };
  }

  const nameTokens = getLookupTokens(caseTypeName);
  let bestMatch: { category: string; type: { label: string; code: string } } | null =
    null;
  let bestScore = 0;

  caseTypeEntries.forEach(([category, types]) => {
    types.forEach((type) => {
      const normalizedLabel = normalizeLookupValue(type.label);

      if (
        normalizedName &&
        (normalizedName.includes(normalizedLabel) ||
          normalizedLabel.includes(normalizedName))
      ) {
        bestMatch = { category, type };
        bestScore = Number.MAX_SAFE_INTEGER;
        return;
      }

      if (!normalizedName || bestScore === Number.MAX_SAFE_INTEGER) return;

      const labelTokens = getLookupTokens(type.label);
      const overlap = labelTokens.filter((token) =>
        nameTokens.includes(token)
      ).length;

      if (overlap > bestScore) {
        bestMatch = { category, type };
        bestScore = overlap;
      }
    });
  });

  return bestMatch && bestScore > 0 ? bestMatch : null;
};

const inferCaseCategoryFromEcourt = ({
  caseTypeName = "",
  caseTypeCode = "",
}: {
  caseTypeName?: string;
  caseTypeCode?: string;
} = {}) => {
  const matchedCaseType = findBestEcourtCaseTypeMatch({
    caseTypeName,
    caseTypeCode,
  });

  if (matchedCaseType?.category) {
    return matchedCaseType.category;
  }

  const normalizedName = normalizeLookupValue(caseTypeName);
  if (!normalizedName) return "";
  if (normalizedName.includes("family")) return "Family";
  if (normalizedName.includes("writ") || normalizedName.includes("pil")) return "Writ";
  if (
    normalizedName.includes("bail") ||
    normalizedName.includes("criminal") ||
    normalizedName.includes("sessions")
  ) {
    return "Criminal";
  }
  if (normalizedName.includes("commercial") || normalizedName.includes("company")) {
    return "Commercial";
  }
  if (normalizedName.includes("consumer")) return "Consumer";
  if (normalizedName.includes("labour") || normalizedName.includes("industrial")) {
    return "Labour";
  }
  if (
    normalizedName.includes("tribunal") ||
    normalizedName.includes("rera") ||
    normalizedName.includes("nclt")
  ) {
    return "Tribunal";
  }
  if (
    normalizedName.includes("civil") ||
    normalizedName.includes("execution") ||
    normalizedName.includes("injunction")
  ) {
    return "Civil";
  }

  return "Other";
};

export const getBackendCaseType = (category = "") =>
  CASE_TYPE_CATEGORY_TO_VALUE[category] || "other";

export const getEcourtCaseTypeReference = ({
  caseTypeName = "",
  caseTypeCode = "",
}: {
  caseTypeName?: string;
  caseTypeCode?: string;
} = {}) => {
  const matchedCaseType = findBestEcourtCaseTypeMatch({
    caseTypeName,
    caseTypeCode,
  });
  const normalizedEcourtCode = normalizeCaseTypePrefix(caseTypeCode);
  const ecourtCodeHasLetters = /[A-Z]/.test(normalizedEcourtCode);
  const normalizedName =
    typeof caseTypeName === "string" ? caseTypeName.trim() : "";
  const resolvedCode =
    normalizeCaseTypePrefix(matchedCaseType?.type?.code) ||
    (ecourtCodeHasLetters ? normalizedEcourtCode : "") ||
    buildCaseTypeInitials(caseTypeName);

  return {
    caseCode: resolvedCode,
    caseTypeLabel:
      normalizedName.toUpperCase() ||
      matchedCaseType?.type?.label?.toUpperCase() ||
      "",
    category:
      matchedCaseType?.category ||
      inferCaseCategoryFromEcourt({ caseTypeName, caseTypeCode }),
  };
};

export const buildCaseNumber = ({
  caseCode = "",
  caseNumberMiddle = "",
  caseYear = "",
}: {
  caseCode?: string;
  caseNumberMiddle?: string;
  caseYear?: string;
} = {}) => {
  const normalizedCode = normalizeCaseTypePrefix(caseCode);
  const normalizedMiddle = normalizeCaseNumber(caseNumberMiddle);
  const normalizedYear = normalizeCaseNumber(caseYear);

  if (!normalizedCode || !normalizedMiddle || !normalizedYear) {
    return "";
  }

  return `${normalizedCode}/${normalizedMiddle}/${normalizedYear}`;
};

export const formatDisplayCaseNumber = ({
  caseNumber = "",
  caseTypeName = "",
  caseTypeCode = "",
}: {
  caseNumber?: string;
  caseTypeName?: string;
  caseTypeCode?: string;
} = {}) => {
  const normalizedNumber = normalizeFormattedCaseNumber(caseNumber);

  if (!normalizedNumber) {
    return "";
  }

  if (normalizedNumber.includes("/")) {
    return normalizedNumber;
  }

  const normalizedRawNumber = normalizedNumber.replace(/\//g, "");
  const caseTypeReference = getEcourtCaseTypeReference({
    caseTypeName,
    caseTypeCode,
  });
  const expectedPrefix = normalizeCaseTypePrefix(caseTypeReference.caseCode);

  if (
    expectedPrefix &&
    normalizedRawNumber.startsWith(expectedPrefix) &&
    normalizedRawNumber.length > expectedPrefix.length + 4
  ) {
    const middleAndYear = normalizedRawNumber.slice(expectedPrefix.length);
    const year = middleAndYear.slice(-4);
    const middle = middleAndYear.slice(0, -4);

    if (middle && year.length === 4) {
      return `${expectedPrefix}/${middle}/${year}`;
    }
  }

  const genericPatternMatch = normalizedRawNumber.match(
    /^([A-Z]+[A-Z0-9]*?)(\d+)(\d{4})$/
  );

  if (genericPatternMatch) {
    const [, prefix, middle, year] = genericPatternMatch;
    return `${prefix}/${middle}/${year}`;
  }

  return normalizedNumber;
};

export const parseCaseNumberParts = ({
  caseNumber = "",
  caseTypeName = "",
  caseTypeCode = "",
}: {
  caseNumber?: string;
  caseTypeName?: string;
  caseTypeCode?: string;
} = {}) => {
  const normalizedCaseNumber = normalizeFormattedCaseNumber(caseNumber);
  const caseTypeReference = getEcourtCaseTypeReference({
    caseTypeName,
    caseTypeCode,
  });
  const fallbackCode = normalizeCaseTypePrefix(caseTypeReference.caseCode);

  if (!normalizedCaseNumber) {
    return {
      caseCode: fallbackCode,
      caseNumberMiddle: "",
      caseYear: "",
    };
  }

  if (normalizedCaseNumber.includes("/")) {
    const [rawCode = "", rawMiddle = "", rawYear = ""] =
      normalizedCaseNumber.split("/");

    return {
      caseCode: fallbackCode || normalizeCaseTypePrefix(rawCode),
      caseNumberMiddle: normalizeCaseNumber(rawMiddle),
      caseYear: normalizeCaseNumber(rawYear),
    };
  }

  const normalizedRawNumber = normalizedCaseNumber.replace(/\//g, "");

  if (
    fallbackCode &&
    normalizedRawNumber.startsWith(fallbackCode) &&
    normalizedRawNumber.length > fallbackCode.length + 4
  ) {
    const middleAndYear = normalizedRawNumber.slice(fallbackCode.length);
    return {
      caseCode: fallbackCode,
      caseNumberMiddle: normalizeCaseNumber(middleAndYear.slice(0, -4)),
      caseYear: normalizeCaseNumber(middleAndYear.slice(-4)),
    };
  }

  const genericPatternMatch = normalizedRawNumber.match(
    /^([A-Z]+[A-Z0-9]*?)(\d+)(\d{4})$/
  );

  if (genericPatternMatch) {
    const [, rawCode, rawMiddle, rawYear] = genericPatternMatch;
    return {
      caseCode: fallbackCode || normalizeCaseTypePrefix(rawCode),
      caseNumberMiddle: normalizeCaseNumber(rawMiddle),
      caseYear: normalizeCaseNumber(rawYear),
    };
  }

  return {
    caseCode: fallbackCode,
    caseNumberMiddle: "",
    caseYear: "",
  };
};

export const formatCaseTypeLabel = (value = "") => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";

  if (!normalizedValue) {
    return "";
  }

  return Object.entries(CASE_TYPE_CATEGORY_TO_VALUE).find(
    ([, typeValue]) => typeValue === normalizedValue
  )?.[0] || normalizedValue;
};

export const getDisplayCaseType = (caseItem: {
  caseSubType?: string;
  caseType?: string;
  type?: string;
}) =>
  formatCaseTypeLabel(
    caseItem.caseSubType || caseItem.caseType || caseItem.type || ""
  );

export const getCaseIdentifier = (caseItem: {
  caseNumber?: string;
  number?: string;
  caseSubType?: string;
  caseType?: string;
  type?: string;
  eCourt?: { caseTypeName?: string; caseTypeCode?: string };
  caseCode?: string;
}) => {
  const caseNumber = formatDisplayCaseNumber({
    caseNumber: caseItem.caseNumber || caseItem.number || "",
    caseTypeName:
      caseItem.caseSubType || caseItem.eCourt?.caseTypeName || caseItem.type || "",
    caseTypeCode: caseItem.eCourt?.caseTypeCode || caseItem.caseCode || "",
  });
  const caseType = getDisplayCaseType(caseItem);

  if (caseNumber && caseType) {
    return `${caseNumber} • ${caseType}`;
  }

  return caseNumber || caseType || "";
};
