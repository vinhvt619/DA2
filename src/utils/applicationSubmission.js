import {
  CvOcrImportError,
  MAX_OCR_PDF_BYTES,
  validatePdfHeaderBytes,
  validatePdfUploadInput,
} from "../../shared/resumeOcrPolicy.js";
import { RESUME_TEMPLATE_NAMES } from "../../shared/resumeTemplates.js";

export const APPLICATION_MAX_PDF_BYTES = MAX_OCR_PDF_BYTES;
export const APPLICATION_COVER_LETTER_MAX_LENGTH = 5000;
export const EMPTY_RESUME_LIST = Object.freeze([]);

export const APPLICATION_STEPS = Object.freeze({
  SELECT: 1,
  REVIEW: 2,
  CONFIRM: 3,
});

export const APPLICATION_STEP_ITEMS = Object.freeze([
  { step: 1, label: "Chọn nguồn CV", shortLabel: "Chọn CV" },
  { step: 2, label: "Kiểm tra thông tin", shortLabel: "Kiểm tra" },
  { step: 3, label: "Xác nhận gửi", shortLabel: "Xác nhận" },
]);

function normalizeNonEmptyStringId(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return "";
  }
  return trimmed;
}

export function normalizeIdString(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return normalizeNonEmptyStringId(value);
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return (
      normalizeNonEmptyStringId(value._id) ||
      normalizeNonEmptyStringId(value.id)
    );
  }
  return "";
}

export function getAccountId(user) {
  const id = normalizeIdString(user);
  return id || null;
}

export function isCandidateEligible(user) {
  return Boolean(user && user.role === "employee" && getAccountId(user));
}

export function getResumeFetchScope({
  isAuthChecked,
  isCandidate,
  accountId,
  job,
  jobIsUnavailable,
}) {
  const targetJobId = normalizeIdString(job);
  if (!isAuthChecked || !isCandidate || !accountId || !job || !targetJobId || jobIsUnavailable) {
    return null;
  }
  return `${targetJobId}::${accountId}`;
}

export function selectScopedResumeState(resumesState, expectedScope) {
  if (!expectedScope) {
    return {
      resumes: EMPTY_RESUME_LIST,
      loading: false,
      error: "",
    };
  }
  if (!resumesState || resumesState.scope !== expectedScope) {
    return {
      resumes: EMPTY_RESUME_LIST,
      loading: true,
      error: "",
    };
  }
  return {
    resumes: Array.isArray(resumesState.items) ? resumesState.items : EMPTY_RESUME_LIST,
    loading: Boolean(resumesState.loading),
    error: resumesState.error || "",
  };
}

export function getResumeTemplateLabel(templateKey) {
  if (!templateKey) return "Mẫu mặc định";
  return RESUME_TEMPLATE_NAMES[templateKey] || `Mẫu ${templateKey}`;
}

export function formatPdfFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  if (size < 1024) return `${Math.round(size)} B`;
  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb >= 100 ? Math.round(kb) : Number(kb.toFixed(1))} KB`;
  }
  const mb = kb / 1024;
  return `${Number(mb.toFixed(2))} MB`;
}

export function validateCoverLetter(value) {
  const normalized = String(value ?? "").replace(/\r\n/g, "\n");
  if (normalized.length > APPLICATION_COVER_LETTER_MAX_LENGTH) {
    return {
      valid: false,
      length: normalized.length,
      message: `Thư ứng tuyển tối đa ${APPLICATION_COVER_LETTER_MAX_LENGTH.toLocaleString("vi-VN")} ký tự.`,
    };
  }
  return {
    valid: true,
    length: normalized.length,
    message: "",
  };
}

export function sanitizeCoverLetterForSubmit(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, APPLICATION_COVER_LETTER_MAX_LENGTH);
}

export function validateCandidatePdfMeta(fileMeta) {
  try {
    const validated = validatePdfUploadInput(fileMeta);
    return { valid: true, meta: validated, code: "", message: "" };
  } catch (error) {
    if (error instanceof CvOcrImportError) {
      return { valid: false, code: error.code, message: error.message };
    }
    return {
      valid: false,
      code: "INVALID_PDF",
      message: error?.message || "Tệp PDF không hợp lệ.",
    };
  }
}

export function validateCandidatePdfBytes(bytes) {
  try {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    validatePdfHeaderBytes(view);
    // Backend /api/jobs/apply-file requires the decoded PDF bytes to begin directly with %PDF-.
    const head = new TextDecoder("latin1").decode(view.subarray(0, 5));
    if (head !== "%PDF-") {
      return {
        valid: false,
        code: "INVALID_PDF_MAGIC",
        message: "Tệp được chọn không phải là tài liệu PDF hợp lệ (thiếu chữ ký %PDF- ở đầu tệp).",
      };
    }
    return { valid: true, code: "", message: "" };
  } catch (error) {
    if (error instanceof CvOcrImportError) {
      return { valid: false, code: error.code, message: error.message };
    }
    return {
      valid: false,
      code: "INVALID_PDF",
      message: error?.message || "Không thể xác thực nội dung tệp PDF.",
    };
  }
}

export function createAbortError() {
  try {
    return new DOMException("The operation was aborted.", "AbortError");
  } catch {
    const error = new Error("The operation was aborted.");
    error.name = "AbortError";
    return error;
  }
}

export async function defaultPdfDocumentLoader(bytes) {
  let pdfjs;
  if (typeof window === "undefined" && typeof globalThis.DOMMatrix === "undefined") {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } else {
    pdfjs = await import("pdfjs-dist");
    if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = "/ocr/pdf.worker.min.mjs";
    }
  }
  const safeCopy = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes || []).slice();
  return pdfjs.getDocument({
    data: safeCopy,
    verbosity: 0,
  });
}

async function safeDestroyPdfTask(task, destroyedSet) {
  if (!task || typeof task !== "object" || destroyedSet.has(task)) {
    return;
  }
  destroyedSet.add(task);
  if (typeof task.destroy === "function") {
    try {
      await task.destroy();
    } catch {
      // Ignore cleanup failures after cancel/abort.
    }
  }
}

function raceWithAbort(promise, signal, onAbort) {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    onAbort?.();
    return Promise.reject(createAbortError());
  }
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      onAbort?.();
      reject(createAbortError());
    };
    signal.addEventListener("abort", handleAbort, { once: true });
    Promise.resolve(promise).then(
      (value) => {
        signal.removeEventListener("abort", handleAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", handleAbort);
        reject(error);
      },
    );
  });
}

export async function verifyCandidatePdfDocument(
  bytes,
  { signal, pdfLoader = defaultPdfDocumentLoader } = {},
) {
  if (signal?.aborted) {
    throw createAbortError();
  }

  let loadingTask = null;
  let disposed = false;
  const destroyedTasks = new WeakSet();
  const byteCopy =
    bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes || []).slice();

  const destroyCurrentTask = () => {
    disposed = true;
    return safeDestroyPdfTask(loadingTask, destroyedTasks);
  };

  try {
    const loaderPromise = Promise.resolve().then(() => pdfLoader(byteCopy));
    loaderPromise
      .then((lateTask) => {
        if (disposed || signal?.aborted) {
          return safeDestroyPdfTask(lateTask, destroyedTasks);
        }
        return undefined;
      })
      .catch(() => {});

    loadingTask = await raceWithAbort(loaderPromise, signal, () => {
      disposed = true;
    });

    if (signal?.aborted || disposed) {
      await safeDestroyPdfTask(loadingTask, destroyedTasks);
      throw createAbortError();
    }

    if (!loadingTask || !loadingTask.promise) {
      return {
        valid: false,
        code: "INVALID_PDF_CORRUPT",
        message: "Không thể đọc nội dung tệp PDF. Tệp có thể bị hỏng hoặc không có trang hợp lệ.",
      };
    }

    const pdfDocument = await raceWithAbort(loadingTask.promise, signal, () => {
      void destroyCurrentTask();
    });

    if (signal?.aborted || disposed) {
      throw createAbortError();
    }

    const pageCount = Number(pdfDocument?.numPages);
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      return {
        valid: false,
        code: "INVALID_PDF_PAGES",
        message: "Tệp PDF không chứa trang nào hợp lệ để gửi ứng tuyển.",
      };
    }

    await raceWithAbort(pdfDocument.getPage(1), signal, () => {
      void destroyCurrentTask();
    });

    if (signal?.aborted || disposed) {
      throw createAbortError();
    }

    return {
      valid: true,
      pageCount,
      code: "",
      message: "",
    };
  } catch (error) {
    if (error?.name === "AbortError" || signal?.aborted) {
      throw error?.name === "AbortError" ? error : createAbortError();
    }
    if (
      error?.name === "PasswordException" ||
      /password|encrypted/i.test(String(error?.message || ""))
    ) {
      return {
        valid: false,
        code: "PDF_ENCRYPTED",
        message: "Tệp PDF được đặt mật khẩu hoặc mã hóa. Vui lòng mở khóa tệp trước khi tải lên.",
      };
    }
    return {
      valid: false,
      code: "INVALID_PDF_CORRUPT",
      message: "Không thể đọc nội dung tệp PDF. Tệp có thể bị hỏng hoặc không có trang hợp lệ.",
    };
  } finally {
    disposed = true;
    await safeDestroyPdfTask(loadingTask, destroyedTasks);
  }
}

export async function readFileBytesWithAbort(file, { signal } = {}) {
  if (signal?.aborted) {
    throw createAbortError();
  }
  if (!file) {
    throw new Error("Không tìm thấy tệp PDF đã chọn.");
  }

  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    if (signal?.aborted) {
      throw createAbortError();
    }
    return new Uint8Array(buffer);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };
    const onAbort = () => {
      cleanup();
      try {
        reader.abort();
      } catch {
        // Ignore abort race after completion.
      }
      reject(createAbortError());
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
    reader.onload = () => {
      cleanup();
      resolve(new Uint8Array(reader.result));
    };
    reader.onerror = () => {
      cleanup();
      reject(reader.error || new Error("Không thể đọc dữ liệu tệp PDF."));
    };
    reader.readAsArrayBuffer(file);
  });
}

function uint8ArrayToBase64(bytes) {
  const chunkSize = 0x8000;
  const parts = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    parts.push(String.fromCharCode(...chunk));
  }
  if (typeof btoa === "function") {
    return btoa(parts.join(""));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  throw new Error("Trình duyệt không hỗ trợ mã hóa tệp PDF.");
}

export async function encodePdfBytesToDataUrl(bytes, { signal } = {}) {
  if (signal?.aborted) {
    throw createAbortError();
  }

  if (typeof FileReader !== "undefined" && typeof Blob !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const cleanup = () => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
      };
      const onAbort = () => {
        cleanup();
        try {
          reader.abort();
        } catch {
          // Ignore abort race after completion.
        }
        reject(createAbortError());
      };

      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }
      reader.onload = () => {
        cleanup();
        if (typeof reader.result !== "string" || !reader.result.startsWith("data:application/pdf;base64,")) {
          reject(new Error("Không thể chuyển đổi tệp PDF sang định dạng hợp lệ."));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => {
        cleanup();
        reject(reader.error || new Error("Không thể đọc tệp PDF."));
      };
      reader.readAsDataURL(new Blob([bytes], { type: "application/pdf" }));
    });
  }

  return `data:application/pdf;base64,${uint8ArrayToBase64(bytes)}`;
}

/**
 * Validates file metadata, verifies PDF header/structure/readable page, and prepares submission bytes + base64 data URL.
 */
export async function preparePdfForSubmission(file, { signal, pdfLoader } = {}) {
  if (signal?.aborted) {
    throw createAbortError();
  }

  const metaCheck = validateCandidatePdfMeta(file);
  if (!metaCheck.valid) {
    return {
      ok: false,
      code: metaCheck.code,
      message: metaCheck.message,
    };
  }

  const bytes = await readFileBytesWithAbort(file, { signal });
  const bytesCheck = validateCandidatePdfBytes(bytes);
  if (!bytesCheck.valid) {
    return {
      ok: false,
      code: bytesCheck.code,
      message: bytesCheck.message,
    };
  }

  const docCheck = await verifyCandidatePdfDocument(bytes, { signal, pdfLoader });
  if (!docCheck.valid) {
    return {
      ok: false,
      code: docCheck.code,
      message: docCheck.message,
    };
  }

  const fileData = await encodePdfBytesToDataUrl(bytes, { signal });
  if (signal?.aborted) {
    throw createAbortError();
  }

  return {
    ok: true,
    fileName: metaCheck.meta.name,
    size: bytes.byteLength,
    pageCount: docCheck.pageCount,
    bytes,
    fileData,
  };
}

export function extractConfirmedApplicationId(payload, expectedJobId = "") {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const application = payload.application;
  if (!application || typeof application !== "object" || Array.isArray(application)) {
    return null;
  }
  const appId = normalizeNonEmptyStringId(application._id);
  const expected = normalizeIdString(expectedJobId);
  const responseJobId = normalizeIdString(application.jobId);
  if (!appId || !expected || !responseJobId || responseJobId !== expected) {
    return null;
  }
  return appId;
}

export function classifyApplicationSubmitOutcome({
  ok,
  status,
  payload,
  expectedJobId,
}) {
  if (!ok) {
    if (status === 401) {
      return {
        kind: "AUTH_REQUIRED",
        status,
        code: payload?.code || "",
        message: payload?.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
      };
    }
    if (status === 403 || payload?.code === "CANDIDATE_ROLE_REQUIRED") {
      return {
        kind: "CANDIDATE_ROLE_REQUIRED",
        status,
        code: payload?.code || "",
        message: payload?.message || "Chỉ tài khoản ứng viên mới có quyền gửi hồ sơ ứng tuyển.",
      };
    }
    if (status === 409 && payload?.code === "ALREADY_APPLIED") {
      return {
        kind: "ALREADY_APPLIED",
        status,
        code: payload.code,
        message: payload?.message || "Bạn đã ứng tuyển công việc này trước đó.",
      };
    }
    if (status === 410) {
      return {
        kind: "JOB_UNAVAILABLE",
        status,
        code: payload?.code || "",
        message: payload?.message || "Tin tuyển dụng này đã đóng, hết hạn hoặc không còn tồn tại.",
      };
    }
    if (status === 400 || status === 404) {
      return {
        kind: "VALIDATION_ERROR",
        status,
        code: payload?.code || "",
        message: payload?.message || "Thông tin hồ sơ hoặc tin tuyển dụng chưa hợp lệ. Vui lòng kiểm tra lại.",
      };
    }
    return {
      kind: "RETRYABLE_ERROR",
      status,
      code: payload?.code || "",
      message:
        payload?.message ||
        (status === 409
          ? "Yêu cầu đang xung đột trạng thái trên máy chủ. Dữ liệu bạn đã nhập vẫn được giữ nguyên để thử lại."
          : "Máy chủ chưa thể tiếp nhận hồ sơ lúc này. Dữ liệu bạn đã nhập vẫn được giữ nguyên để thử lại."),
    };
  }

  const applicationId = extractConfirmedApplicationId(payload, expectedJobId);
  if (!applicationId) {
    return {
      kind: "AMBIGUOUS_RESPONSE",
      status,
      message:
        "Phản hồi từ máy chủ không đầy đủ nên chưa thể xác nhận hồ sơ đã được lưu. Vui lòng kiểm tra tại mục Hồ sơ đã nộp hoặc thử gửi lại.",
    };
  }

  return {
    kind: "CONFIRMED",
    status,
    applicationId,
    application: payload.application,
    message: payload?.message || "Nộp hồ sơ ứng tuyển thành công!",
  };
}

export function findApplicationForJob(applications, jobOrId) {
  if (!Array.isArray(applications) || applications.length === 0) {
    return null;
  }
  const targetJobId = normalizeIdString(jobOrId);
  if (!targetJobId) {
    return null;
  }
  return (
    applications.find((application) => {
      const directJobId = normalizeIdString(application?.jobId);
      const snapshotJobId = normalizeIdString(application?.jobSnapshot?.jobId);
      return directJobId === targetJobId || snapshotJobId === targetJobId;
    }) || null
  );
}

export function getApplicationJobInfo(application) {
  const populatedJob =
    application?.jobId && typeof application.jobId === "object"
      ? application.jobId
      : null;
  const snapshot =
    application?.jobSnapshot && typeof application.jobSnapshot === "object"
      ? application.jobSnapshot
      : null;

  const isJobDeleted =
    !populatedJob ||
    populatedJob.status === "Deleted" ||
    Boolean(populatedJob.deletedAt);
  const title = populatedJob?.title || snapshot?.title || "Vị trí không còn hiển thị";
  const company =
    populatedJob?.company || snapshot?.company || "Công việc không còn tồn tại";
  const location = populatedJob?.location || snapshot?.location || "Không xác định";
  const salary = populatedJob?.salary || snapshot?.salary || "Thỏa thuận";
  const rawJobId = normalizeIdString(populatedJob || application?.jobId);

  return {
    title,
    company,
    location,
    salary,
    jobId: rawJobId || null,
    isJobDeleted,
    canOpenJobDetail: Boolean(populatedJob?._id && !isJobDeleted),
  };
}
