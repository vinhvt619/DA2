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

export const mergeAiSkills = (existingItems, generatedItems) => {
  const safe = (items) => (Array.isArray(items) ? items : []).filter((item) =>
    cleanGeneratedText(item?.title, 200) &&
    !isSuspiciousResumeText(`${item?.title || ""} ${item?.description || ""}`));
  const seen = new Set();
  return [...safe(existingItems), ...safe(generatedItems).slice(0, 8)].flatMap((item) => {
    const title = cleanGeneratedText(item.title, 200);
    const key = normalizeTitle(title);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: item.id || crypto.randomUUID(), title }];
  });
};
