const EXECUTABLE_TEXT_PATTERN =
  /\b(?:DOMParser|innerHTML|outerHTML|querySelector|eval|document\.|window\.|console\.log)\b/i;

export const isSuspiciousResumeText = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;

  return (
    EXECUTABLE_TEXT_PATTERN.test(value) ||
    /\bon\w+\s*=/i.test(value) ||
    (/(?:=>|\bfunction\b|\bconst\b|\blet\b|\bvar\b)/.test(value) &&
      /[{};]/.test(value))
  );
};

const cleanGeneratedText = (value, maxLength = 2000) =>
  typeof value === "string"
    ? value
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength)
    : "";

const normalizeTitle = (value) =>
  cleanGeneratedText(value, 200).toLocaleLowerCase("vi-VN");

const cleanGeneratedItem = (item, fields) =>
  fields.reduce(
    (result, field) => ({
      ...result,
      [field]: cleanGeneratedText(item?.[field]),
    }),
    {},
  );

export const mergeAiSection = (
  existingItems,
  generatedItems,
  fields,
  idPrefix,
  options = {},
) => {
  const existing = Array.isArray(existingItems) ? existingItems : [];
  const generated = (Array.isArray(generatedItems) ? generatedItems : [])
    .map((item) => cleanGeneratedItem(item, fields))
    .filter((item) => item.title && !isSuspiciousResumeText(item.description));
  const usedGeneratedIndexes = new Set();

  const mergedExisting = existing.map((item, index) => {
    const normalizedTitle = normalizeTitle(item?.title);
    let generatedIndex = generated.findIndex(
      (candidate, candidateIndex) =>
        !usedGeneratedIndexes.has(candidateIndex) &&
        normalizeTitle(candidate.title) === normalizedTitle,
    );
    if (generatedIndex < 0 && generated[index]) {
      generatedIndex = index;
    }

    const suggestion = generated[generatedIndex] || {};
    if (generatedIndex >= 0) usedGeneratedIndexes.add(generatedIndex);

    return fields.reduce((result, field) => {
      const currentValue = result[field];
      const shouldReplace =
        !String(currentValue || "").trim() ||
        (field === "description" &&
          isSuspiciousResumeText(String(currentValue || "")));
      return shouldReplace && suggestion[field]
        ? { ...result, [field]: suggestion[field] }
        : result;
    }, item);
  });

  const additions = generated
    .filter((_, index) => !usedGeneratedIndexes.has(index))
    .map((item, index) => ({
      ...item,
      id: `ai-${idPrefix}-${Date.now()}-${index}`,
    }));

  const appendGenerated =
    options.appendGenerated ?? existing.length === 0;

  return appendGenerated ? [...mergedExisting, ...additions] : mergedExisting;
};

const SKILL_LEVELS = new Set([
  "Tệ",
  "Trung bình",
  "Tạm được",
  "Tốt",
  "Xuất sắc",
]);

export const mergeAiSkills = (existingItems, generatedItems) => {
  const safeExisting = (Array.isArray(existingItems) ? existingItems : []).filter(
    (item) =>
      cleanGeneratedText(item?.title, 120) &&
      !isSuspiciousResumeText(`${item?.title || ""} ${item?.description || ""}`),
  );
  const merged = mergeAiSection(
    safeExisting,
    generatedItems,
    ["title", "description", "performance"],
    "skill",
    { appendGenerated: true },
  );

  return merged.slice(0, 8).map((item) => ({
    ...item,
    performance: SKILL_LEVELS.has(item.performance)
      ? item.performance
      : "Tốt",
  }));
};
