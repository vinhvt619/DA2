export async function requestAi(path, body) {
  const response = await fetch(`/api/ai${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || "Không thể xử lý yêu cầu AI lúc này.",
    );
    error.code = data.code;
    error.status = response.status;
    throw error;
  }

  return data;
}
