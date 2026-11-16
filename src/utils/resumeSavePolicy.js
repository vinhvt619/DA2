import { RESUME_TEMPLATE_NAMES } from "../../shared/resumeTemplates.js";

export const AUTOSAVE_IDLE_DELAY_MS = 1200;
export const SAVE_REQUEST_TIMEOUT_MS = 15000;
export const TRANSIENT_RETRY_DELAY_MS = 2000;
export const MAX_TRANSIENT_AUTO_RETRIES = 1;

export function getResumeSignature(resumeData) {
  return JSON.stringify(resumeData ?? null);
}

export function validateResumeDraftForSave(
  resumeData,
  templateNames = RESUME_TEMPLATE_NAMES,
) {
  const cleanTitle =
    typeof resumeData?.title === "string" ? resumeData.title.trim() : "";
  if (!cleanTitle) {
    return {
      isValid: false,
      cleanTitle: "",
      field: "title",
      validationError: "Vui lòng nhập tên CV.",
    };
  }

  const template = resumeData?.selectedTemplate;
  if (!template || !Object.hasOwn(templateNames, template)) {
    return {
      isValid: false,
      cleanTitle,
      field: "selectedTemplate",
      validationError: "Mẫu CV không hợp lệ.",
    };
  }

  return {
    isValid: true,
    cleanTitle,
    field: null,
    validationError: "",
  };
}

export function buildResumeSavePayload(resumeData, resumeId) {
  const cleanTitle =
    typeof resumeData?.title === "string" ? resumeData.title.trim() : "";
  const payload = {
    ...resumeData,
    title: cleanTitle,
  };
  if (typeof resumeId === "string" && resumeId.trim()) {
    payload._id = resumeId.trim();
  } else {
    delete payload._id;
  }
  return payload;
}

export function isDuplicateTitleFailure({ code, message } = {}) {
  if (code === "DUPLICATE_RESUME_TITLE") return true;
  if (typeof message !== "string") return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("tên cv này đã tồn tại") ||
    lower.includes("ten cv nay da ton tai") ||
    lower.includes("tên cv đã tồn tại") ||
    lower.includes("ten cv da ton tai")
  );
}

export function classifyResumeSaveError({
  status = 0,
  code = "",
  message = "",
  isNetworkError = false,
  isTimeout = false,
  isOffline = false,
  isCreate = false,
  isUnconfirmedResponse = false,
} = {}) {
  if (isOffline) {
    return {
      kind: "offline",
      retryable: true,
      isDuplicateTitle: false,
      statusBadge: "Đang ngoại tuyến",
      userMessage: isCreate
        ? "Đang ngoại tuyến. Thay đổi chưa được lưu; vui lòng bấm Lưu CV sau khi có kết nối mạng."
        : "Đang ngoại tuyến. Thay đổi chưa được lưu và sẽ lưu lại khi có kết nối.",
    };
  }

  if (isDuplicateTitleFailure({ code, message })) {
    return {
      kind: "duplicate_title",
      retryable: false,
      isDuplicateTitle: true,
      statusBadge: "Trùng tên CV",
      userMessage:
        "Tên CV này đã tồn tại. Hãy đổi sang tên khác hoặc mở CV cũ để chỉnh sửa.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: "unauthorized",
      retryable: false,
      isDuplicateTitle: false,
      statusBadge: "Cần đăng nhập lại",
      userMessage:
        message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để lưu CV.",
    };
  }

  if (status === 404) {
    return {
      kind: "not_found",
      retryable: false,
      isDuplicateTitle: false,
      statusBadge: "Không tìm thấy CV",
      userMessage: message || "CV này không còn tồn tại trong tài khoản của bạn.",
    };
  }

  if (status === 400 || status === 422) {
    return {
      kind: "validation",
      retryable: false,
      isDuplicateTitle: false,
      statusBadge: "Dữ liệu chưa hợp lệ",
      userMessage: message || "Dữ liệu CV chưa hợp lệ. Vui lòng kiểm tra lại.",
    };
  }

  if (isTimeout) {
    return {
      kind: "timeout",
      retryable: !isCreate,
      isDuplicateTitle: false,
      statusBadge: "Quá thời gian lưu",
      userMessage: isCreate
        ? "Lưu CV quá thời gian. Vui lòng kiểm tra Thư viện CV trước khi thử lại để tránh tạo trùng bản ghi."
        : "Lưu CV quá thời gian. Kiểm tra kết nối mạng và thử lại.",
    };
  }

  if (isNetworkError || status >= 500 || status === 429 || status === 408) {
    return {
      kind: "transient",
      retryable: !isCreate,
      isDuplicateTitle: false,
      statusBadge: isCreate ? "Tạo CV thất bại" : "Lưu tự động thất bại",
      userMessage: isCreate
        ? message ||
          "Không thể tạo CV mới lúc này. Vui lòng kiểm tra Thư viện CV trước khi thử lại."
        : message ||
          "Không thể lưu thay đổi lúc này. Dữ liệu vẫn được giữ trên màn hình để thử lại.",
    };
  }

  if (isUnconfirmedResponse) {
    return {
      kind: isCreate ? "ambiguous_create" : "invalid_response",
      retryable: !isCreate,
      isDuplicateTitle: false,
      statusBadge: isCreate ? "Chưa xác nhận tạo CV" : "Phản hồi không hợp lệ",
      userMessage: isCreate
        ? "Không thể xác nhận CV đã được lưu trên máy chủ. Vui lòng kiểm tra Thư viện CV trước khi thử lưu lại để tránh tạo trùng bản ghi."
        : message ||
          "Phản hồi từ máy chủ không hợp lệ nên thay đổi chưa được xác nhận. Vui lòng thử lại.",
    };
  }

  return {
    kind: "unknown",
    retryable: !isCreate,
    isDuplicateTitle: false,
    statusBadge: "Lưu thất bại",
    userMessage: message || "Không thể kết nối đến server để lưu CV.",
  };
}

/**
 * Parses a fetch Response for /api/resume without swallowing AbortError or
 * invalid/malformed JSON on HTTP 2xx responses.
 */
export async function parseResumeSaveHttpResponse(response, { signal } = {}) {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (signal?.aborted || err?.name === "AbortError") {
      throw err;
    }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: {},
      };
    }
    return {
      ok: false,
      status: response.status,
      isUnconfirmedResponse: true,
      data: {
        message: "Phản hồi từ máy chủ không hợp lệ.",
      },
    };
  }

  if (signal?.aborted) {
    const abortError = new Error("Save request aborted");
    abortError.name = "AbortError";
    throw abortError;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      ok: false,
      status: response.status,
      isUnconfirmedResponse: Boolean(response.ok),
      data: {},
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}
