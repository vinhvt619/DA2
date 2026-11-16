const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const AI_FILL_STRING_FIELDS = ["targetRole", "bio"];
const AI_FILL_ARRAY_FIELDS = [
  "skills",
  "experiences",
  "education",
  "languages",
  "certificates",
  "projects",
  "awards",
  "hobbies",
];

export const isValidAiFillResult = (result) => {
  if (!isPlainObject(result)) return false;

  for (const field of AI_FILL_STRING_FIELDS) {
    if (result[field] !== undefined && typeof result[field] !== "string") {
      return false;
    }
  }

  for (const field of AI_FILL_ARRAY_FIELDS) {
    if (result[field] !== undefined) {
      if (
        !Array.isArray(result[field]) ||
        !result[field].every((item) => isPlainObject(item))
      ) {
        return false;
      }
    }
  }

  return true;
};

const createInvalidAiResponseError = (message, status) => {
  const error = new Error(message);
  error.code = "INVALID_AI_RESPONSE";
  error.status = status;
  return error;
};

export async function requestAi(path, body, options = {}) {
  const { signal, requireResultObject } = options || {};
  const response = await fetch(`/api/ai${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });

  if (signal?.aborted) {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    throw abortError;
  }

  if (!response.ok) {
    const errorData = await response.json().catch((error) => {
      if (signal?.aborted || error?.name === "AbortError") {
        throw error;
      }
      return {};
    });

    if (signal?.aborted) {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      throw abortError;
    }

    const error = new Error(
      errorData?.message || "Không thể xử lý yêu cầu AI lúc này.",
    );
    error.code = errorData?.code;
    error.status = response.status;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (signal?.aborted || error?.name === "AbortError") {
      throw error;
    }
    throw createInvalidAiResponseError(
      "Phản hồi từ dịch vụ AI không đúng định dạng JSON.",
      response.status,
    );
  }

  if (signal?.aborted) {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    throw abortError;
  }

  if (!isPlainObject(data)) {
    throw createInvalidAiResponseError(
      "Phản hồi từ dịch vụ AI không hợp lệ.",
      response.status,
    );
  }

  if (requireResultObject || path === "/resume/fill") {
    if (!isValidAiFillResult(data.result)) {
      throw createInvalidAiResponseError(
        "Phản hồi từ dịch vụ AI không đúng cấu trúc dữ liệu CV.",
        response.status,
      );
    }
  }

  return data;
}
