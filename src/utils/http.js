export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || "Không thể xử lý yêu cầu lúc này.",
    );
  }

  return data;
}
