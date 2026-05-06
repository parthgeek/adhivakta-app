const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDate = (value: string | Date | null | undefined) => {
  if (!value) return null;

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getNextCaseHearingDate = (caseItem: {
  nextHearingDate?: string | Date | null;
  nextHearing?: string | Date | null;
  hearingDate?: string | Date | null;
} = {}) =>
  toDate(caseItem.nextHearingDate || caseItem.nextHearing || caseItem.hearingDate || null);

export const getCasePriority = (
  caseItem: {
    status?: string;
    nextHearingDate?: string | Date | null;
    nextHearing?: string | Date | null;
    hearingDate?: string | Date | null;
  } = {},
  options: {
    now?: Date;
    hearingDate?: string | Date | null;
  } = {}
) => {
  const now = options.now instanceof Date ? options.now : new Date();
  const hearingDate =
    options.hearingDate !== undefined
      ? toDate(options.hearingDate)
      : getNextCaseHearingDate(caseItem);
  const status = (caseItem.status || "").toLowerCase();

  if (status === "closed" || !hearingDate) {
    return "normal";
  }

  const daysUntilHearing = Math.ceil(
    (hearingDate.getTime() - now.getTime()) / MS_PER_DAY
  );

  if (daysUntilHearing <= 3) {
    return "urgent";
  }

  if (daysUntilHearing <= 7) {
    return "high";
  }

  return "normal";
};
