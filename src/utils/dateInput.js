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

export const normalizeActivityDateFields = (data = {}) => ({
  ...data,
  startDate: normalizeDateInputValue(data.startDate),
  endDate: normalizeDateInputValue(data.endDate),
});
