function hasText(value) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function hasMeaningfulItem(items, keys) {
  return Array.isArray(items) && items.some((item) => keys.some((key) => hasText(item?.[key])));
}

export function getProfileCompletion(user) {
  if (!user) {
    return 0;
  }

  const checks = [
    hasText(user.fullName || user.username),
    hasText(user.email || user.phoneNumber),
    hasText(user.address || user.hometown || user.country),
    hasText(user.birthDate),
    hasMeaningfulItem(user.educations, ["school", "degree", "major"]),
    hasMeaningfulItem(user.experiences, ["company", "position"]),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
