const pad = (value) => String(value).padStart(2, "0");

const toLocalDateInputValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const normalizeDateInputValue = (value) => {
  if (!value) return "";

  const source = String(value).trim();
  if (!source) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return source;

  const yearFirst = source.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
  if (yearFirst) {
    const [, year, month, day] = yearFirst;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const dayFirst = source.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const parsed = value instanceof Date ? value : new Date(source);
  return Number.isNaN(parsed.getTime()) ? "" : toLocalDateInputValue(parsed);
};

export const isCurrentDateValue = (value) =>
  /^(hiện tại|hien tai|present|now)$/i.test(String(value || "").trim());

export const parseMonthDisplayValue = (value) => {
  const source = String(value || "").trim();
  if (!source) return "";

  const monthFirst = source.match(/^(\d{1,2})[/.](\d{4})$/);
  if (monthFirst) {
    const [, month, year] = monthFirst;
    const monthNumber = Number(month);
    return monthNumber >= 1 && monthNumber <= 12
      ? `${year}-${pad(monthNumber)}`
      : source;
  }

  const yearFirst = source.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (yearFirst) {
    const [, year, month] = yearFirst;
    const monthNumber = Number(month);
    return monthNumber >= 1 && monthNumber <= 12
      ? `${year}-${pad(monthNumber)}`
      : source;
  }

  return source;
};

export const formatMonthDisplayValue = (value) => {
  const normalized = parseMonthDisplayValue(value);
  const parts = normalized.match(/^(\d{4})-(\d{2})$/);
  return parts ? `${parts[2]}/${parts[1]}` : normalized;
};

export const normalizeMonthInputValue = (value) => {
  if (!value || isCurrentDateValue(value)) return "";

  const source = parseMonthDisplayValue(value);
  if (/^\d{4}-\d{2}$/.test(source)) return source;

  const normalizedDate = normalizeDateInputValue(value);
  return normalizedDate ? normalizedDate.slice(0, 7) : "";
};

export const normalizeResumeDateValue = (value) => {
  if (!value) return "";

  const source = String(value).trim();
  if (!source) return "";
  if (/^\d{4}(?:-\d{2})?$/.test(source)) return source;

  const normalizedDate = normalizeDateInputValue(value);
  return normalizedDate ? normalizedDate.slice(0, 7) : source;
};

export const normalizeActivityDateFields = (data = {}) => ({
  ...data,
  startDate: normalizeDateInputValue(data.startDate),
  endDate: normalizeDateInputValue(data.endDate),
});
