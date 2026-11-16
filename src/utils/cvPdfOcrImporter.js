import {
  computeBoundedRasterViewport,
  CvOcrImportError,
  DEFAULT_OCR_INIT_TIMEOUT_MS,
  DEFAULT_OCR_PAGE_TIMEOUT_MS,
  DEFAULT_OCR_TOTAL_TIMEOUT_MS,
  evaluatePageTextSufficiency,
  mapExtractedTextToResumeDraft,
  MAX_OCR_TOTAL_RASTER_PIXELS,
  OCR_COLUMN_BREAK,
  reconstructLinesFromPdfTextItems,
  sanitizePlainText,
  splitResumeColumns,
  stitchExtractedPages,
  validatePdfHeaderBytes,
  validatePdfPageCount,
  validatePdfUploadInput,
} from "../../shared/resumeOcrPolicy.js";

export const OCR_ENGINE_METADATA = {
  engine: "tesseract.js",
  version: "7.0.0",
  core: "tesseract.js-core@7.0.0 (LSTM WASM)",
  languages: "vie+eng (@tesseract.js-data/vie@1.0.0 + @tesseract.js-data/eng@1.0.0 4.0.0_best_int)",
  license: "Apache-2.0",
};

export function createAbortError() {
  return new CvOcrImportError("OCR_ABORTED", "Đã hủy quá trình đọc tệp PDF.");
}

export function safelyInvokeCleanup(fn) {
  if (typeof fn !== "function") return;
  try {
    const res = fn();
    if (res && typeof res.catch === "function") {
      res.catch(() => {});
    }
  } catch {
    // Ignore synchronous cleanup errors
  }
}

export function withStepTimeout(promise, timeoutMs, timeoutCode, timeoutMessage, onTimeoutCleanup, signal) {
  let timerId = null;
  let abortListener = null;
  let cleanupExecuted = false;

  const executeCleanupOnce = () => {
    if (cleanupExecuted) return;
    cleanupExecuted = true;
    safelyInvokeCleanup(onTimeoutCleanup);
  };

  const controlPromise = new Promise((_, reject) => {
    if (signal?.aborted) {
      executeCleanupOnce();
      reject(createAbortError());
      return;
    }
    if (signal) {
      abortListener = () => {
        executeCleanupOnce();
        reject(createAbortError());
      };
      signal.addEventListener("abort", abortListener, { once: true });
    }
    timerId = setTimeout(() => {
      executeCleanupOnce();
      reject(new CvOcrImportError(timeoutCode, timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, controlPromise]).finally(() => {
    if (timerId !== null) clearTimeout(timerId);
    if (signal && abortListener) {
      signal.removeEventListener("abort", abortListener);
    }
  });
}

async function defaultBrowserPdfLoader(bytes) {
  let pdfjs;
  if (typeof window === "undefined" && typeof globalThis.DOMMatrix === "undefined") {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } else {
    pdfjs = await import("pdfjs-dist");
    if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = "/ocr/pdf.worker.min.mjs";
    }
  }
  return pdfjs.getDocument({
    data: new Uint8Array(bytes),
  });
}

async function defaultBrowserRasterizePage(pdfPage, boundedViewport, registerCleanup) {
  if (typeof document === "undefined") {
    throw new CvOcrImportError(
      "RASTERIZER_UNAVAILABLE",
      "Môi trường hiện tại không hỗ trợ vẽ trang PDF sang vùng đệm ảnh.",
    );
  }
  const viewport = pdfPage.getViewport({ scale: boundedViewport.scale });
  const canvas = document.createElement("canvas");
  canvas.width = boundedViewport.width;
  canvas.height = boundedViewport.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new CvOcrImportError("CANVAS_CONTEXT_FAILED", "Không thể khởi tạo bộ dựng hình trang PDF.");
  }

  const renderTask = pdfPage.render({
    canvasContext: context,
    viewport,
    background: "rgb(255, 255, 255)",
  });

  registerCleanup?.(() => {
    try {
      renderTask.cancel();
    } catch {
      // Ignore cancel errors
    }
    canvas.width = 0;
    canvas.height = 0;
  });

  await renderTask.promise;
  const dataUrl = canvas.toDataURL("image/png");
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}

async function defaultBrowserCreateOcrWorker(onWorkerProgress) {
  if (typeof window !== "undefined" && typeof window.__MOCK_CV_OCR_WORKER_FACTORY__ === "function") {
    return window.__MOCK_CV_OCR_WORKER_FACTORY__(onWorkerProgress);
  }
  const { createWorker } = await import("tesseract.js");
  return createWorker("vie+eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/tesseract-core-lstm.wasm.js",
    langPath: "/ocr/lang-data",
    workerBlobURL: false,
    cacheMethod: "none",
    logger: (message) => {
      if (typeof onWorkerProgress === "function" && message && typeof message.progress === "number") {
        onWorkerProgress(message);
      }
    },
  });
}

function getOcrLines(data, viewport) {
  const rows = data?.blocks?.flatMap((block) =>
    block.paragraphs.flatMap((paragraph) => paragraph.lines),
  ) ?? [];
  if (rows.length && rows.every(({ bbox }) => bbox && bbox.y1 > bbox.y0)) {
    const toLines = (column) => column.flatMap((row, index) => {
      const text = sanitizePlainText(row.text);
      if (!text) return [];
      const previous = column[index - 1]?.bbox;
      if (!previous) return [text];
      const { y0, y1 } = row.bbox;
      const lineHeight = Math.max(y1 - y0, previous.y1 - previous.y0);
      // Tesseract can insert a blank between wrapped lines. Use the visible gap instead.
      return y0 - previous.y1 >= lineHeight * 0.9 ? ["", text] : [text];
    });
    const pointsPerPixel = viewport.widthPt / viewport.width;
    const columns = splitResumeColumns(rows.map((row) => ({
      ...row,
      x: row.bbox.x0 * pointsPerPixel,
      top: row.bbox.y0 * pointsPerPixel,
      width: (row.bbox.x1 - row.bbox.x0) * pointsPerPixel,
    })), viewport.widthPt);
    if (!columns) return toLines(rows);
    const [header, left, right] = columns;
    const inReadingOrder = (column) => [...column].sort((a, b) => a.top - b.top || a.x - b.x);
    return [
      ...toLines(inReadingOrder(header)),
      ...toLines(inReadingOrder(left)),
      OCR_COLUMN_BREAK,
      ...toLines(inReadingOrder(right)),
    ];
  }
  return String(data?.text || "").split(/\r?\n/).map(sanitizePlainText);
}

export async function importResumeFromPdfBytes(
  {
    fileMeta,
    bytes,
  },
  {
    signal,
    onProgress,
    pdfLoader = defaultBrowserPdfLoader,
    rasterizePage = defaultBrowserRasterizePage,
    createOcrWorker = defaultBrowserCreateOcrWorker,
    initTimeoutMs = DEFAULT_OCR_INIT_TIMEOUT_MS,
    pageTimeoutMs = DEFAULT_OCR_PAGE_TIMEOUT_MS,
    totalTimeoutMs = DEFAULT_OCR_TOTAL_TIMEOUT_MS,
    selectedTemplate = "modern",
  } = {},
) {
  const startedAt = Date.now();
  let loadingTask = null;
  let ocrWorker = null;
  let isDisposed = false;
  let pendingPdfLoaderPromise = null;
  let pendingWorkerFactoryPromise = null;
  const terminatedWorkers = new WeakSet();
  const destroyedLoadingTasks = new WeakSet();
  const activeCleanups = new Set();

  const registerCleanup = (fn) => {
    if (typeof fn === "function") activeCleanups.add(fn);
  };

  const safeDestroyLoadingTask = (task) => {
    if (!task || typeof task !== "object") return;
    if (destroyedLoadingTasks.has(task)) return;
    destroyedLoadingTasks.add(task);
    try {
      if (typeof task.destroy === "function") {
        const res = task.destroy();
        if (res && typeof res.catch === "function") {
          res.catch(() => {});
        }
      }
    } catch {
      // Ignore synchronous destroy errors
    }
  };

  const safeTerminateWorker = (worker) => {
    if (!worker || typeof worker !== "object") return;
    if (terminatedWorkers.has(worker)) return;
    terminatedWorkers.add(worker);
    try {
      if (typeof worker.terminate === "function") {
        const res = worker.terminate();
        if (res && typeof res.catch === "function") {
          res.catch(() => {});
        }
      }
    } catch {
      // Ignore synchronous termination errors
    }
  };

  const reportProgress = (progressData) => {
    if (isDisposed || signal?.aborted) return;
    if (typeof onProgress === "function") {
      try {
        onProgress(progressData);
      } catch {
        // Ignore subscriber errors
      }
    }
  };

  const runCleanups = () => {
    isDisposed = true;

    for (const fn of activeCleanups) {
      safelyInvokeCleanup(fn);
    }
    activeCleanups.clear();

    if (loadingTask) {
      const taskToDestroy = loadingTask;
      loadingTask = null;
      safeDestroyLoadingTask(taskToDestroy);
    }

    if (ocrWorker) {
      const workerToTerminate = ocrWorker;
      ocrWorker = null;
      safeTerminateWorker(workerToTerminate);
    }

    if (pendingPdfLoaderPromise) {
      Promise.resolve(pendingPdfLoaderPromise)
        .then((lateTask) => safeDestroyLoadingTask(lateTask))
        .catch(() => {});
    }

    if (pendingWorkerFactoryPromise) {
      Promise.resolve(pendingWorkerFactoryPromise)
        .then((lateWorker) => safeTerminateWorker(lateWorker))
        .catch(() => {});
    }
  };

  const getRemainingDeadlineMs = () => {
    const elapsed = Date.now() - startedAt;
    const remaining = totalTimeoutMs - elapsed;
    if (remaining <= 0) {
      throw new CvOcrImportError(
        "OCR_TIMEOUT",
        "Quá thời gian xử lý tệp PDF. Vui lòng thử lại với tệp rõ nét hơn hoặc ít trang hơn.",
      );
    }
    return remaining;
  };

  const checkAlive = () => {
    if (isDisposed || signal?.aborted) {
      throw createAbortError();
    }
    getRemainingDeadlineMs();
  };

  const withDeadline = (promise, stepTimeout, code, message, onTimeoutCleanup) => {
    checkAlive();
    const remainingTotal = getRemainingDeadlineMs();
    const deadlineMs = Math.min(stepTimeout, remainingTotal);
    return withStepTimeout(promise, deadlineMs, code, message, onTimeoutCleanup, signal);
  };

  let globalAbortListener = null;
  if (signal) {
    if (signal.aborted) throw createAbortError();
    globalAbortListener = () => {
      runCleanups();
    };
    signal.addEventListener("abort", globalAbortListener, { once: true });
  }

  try {
    const validatedMeta = validatePdfUploadInput(fileMeta);
    const byteArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    validatePdfHeaderBytes(byteArray);
    checkAlive();

    reportProgress({
      stage: "loading_pdf",
      pageNumber: 0,
      totalPages: 0,
      percent: 8,
      message: "Đang kiểm tra cấu trúc tệp PDF...",
    });

    const acquireLoadingTask = () => {
      const p = Promise.resolve().then(() => pdfLoader(byteArray));
      pendingPdfLoaderPromise = p;
      p.catch(() => {});
      p.then((lateTask) => {
        if (isDisposed || signal?.aborted) {
          safeDestroyLoadingTask(lateTask);
        }
      }).catch(() => {});
      return p;
    };

    loadingTask = await withDeadline(
      acquireLoadingTask(),
      initTimeoutMs,
      "OCR_TIMEOUT",
      "Quá thời gian đọc tệp PDF. Vui lòng thử lại.",
      () => {
        isDisposed = true;
      },
    );

    if (isDisposed || signal?.aborted) {
      safeDestroyLoadingTask(loadingTask);
      throw createAbortError();
    }

    let pdfDocument;
    try {
      pdfDocument = await withDeadline(
        loadingTask.promise,
        initTimeoutMs,
        "OCR_TIMEOUT",
        "Quá thời gian đọc cấu trúc tệp PDF. Vui lòng thử lại.",
        () => safeDestroyLoadingTask(loadingTask),
      );
    } catch (loadErr) {
      safeDestroyLoadingTask(loadingTask);
      if (loadErr instanceof CvOcrImportError) throw loadErr;
      if (
        loadErr?.name === "PasswordException" ||
        /password|encrypted/i.test(String(loadErr?.message || ""))
      ) {
        throw new CvOcrImportError(
          "PDF_ENCRYPTED",
          "Tệp PDF được đặt mật khẩu hoặc mã hóa. Vui lòng mở khóa tệp trước khi tải lên.",
        );
      }
      throw new CvOcrImportError(
        "INVALID_PDF_CORRUPT",
        "Không thể đọc tệp PDF. Tệp có thể bị hỏng hoặc sai định dạng.",
      );
    }

    checkAlive();
    const totalPages = validatePdfPageCount(pdfDocument.numPages);
    const extractedPages = [];
    let totalRasterPixels = 0;
    let ocrInitMs = 0;
    let ocrRecognizeMs = 0;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      checkAlive();
      const basePercent = Math.round(12 + ((pageNumber - 1) / totalPages) * 75);
      reportProgress({
        stage: "extracting_text",
        pageNumber,
        totalPages,
        percent: basePercent,
        message: `Đang đọc lớp văn bản trang ${pageNumber}/${totalPages}...`,
      });

      const pdfPage = await withDeadline(
        pdfDocument.getPage(pageNumber),
        pageTimeoutMs,
        "OCR_TIMEOUT",
        `Quá thời gian tải trang ${pageNumber}/${totalPages}.`,
      );
      checkAlive();

      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const textContent = await withDeadline(
        pdfPage.getTextContent(),
        pageTimeoutMs,
        "OCR_TIMEOUT",
        `Quá thời gian đọc lớp văn bản trang ${pageNumber}/${totalPages}.`,
      );
      checkAlive();

      const directLines = reconstructLinesFromPdfTextItems(
        textContent?.items || [],
        baseViewport.width,
        baseViewport.height,
      );
      const sufficiency = evaluatePageTextSufficiency(directLines);

      if (sufficiency.isSufficient) {
        extractedPages.push({
          pageNumber,
          source: "text",
          lines: sufficiency.cleanedLines,
          text: sufficiency.cleanedLines.join("\n"),
          confidence: 100,
        });
        continue;
      }

      // Tier 2: OCR for scanned or insufficient-text page
      const boundedViewport = computeBoundedRasterViewport({
        widthPt: baseViewport.width,
        heightPt: baseViewport.height,
        desiredScale: 2,
      });
      totalRasterPixels += boundedViewport.pixels;
      if (totalRasterPixels > MAX_OCR_TOTAL_RASTER_PIXELS) {
        throw new CvOcrImportError(
          "RASTER_BUDGET_EXCEEDED",
          "Tổng độ phân giải hình ảnh các trang vượt quá ngân sách bộ nhớ cho phép.",
        );
      }

      reportProgress({
        stage: "rendering_page",
        pageNumber,
        totalPages,
        percent: basePercent + Math.round(15 / totalPages),
        message: `Trang ${pageNumber}/${totalPages} là trang quét ảnh — đang chuẩn bị nhận diện OCR...`,
      });

      const imageInput = await withDeadline(
        rasterizePage(pdfPage, boundedViewport, registerCleanup),
        pageTimeoutMs,
        "OCR_TIMEOUT",
        `Quá thời gian dựng ảnh trang ${pageNumber}/${totalPages}.`,
      );
      checkAlive();

      if (!ocrWorker) {
        reportProgress({
          stage: "initializing_ocr",
          pageNumber,
          totalPages,
          percent: basePercent + Math.round(25 / totalPages),
          message: `Đang khởi tạo bộ nhận diện tiếng Việt & tiếng Anh (trang ${pageNumber}/${totalPages})...`,
        });
        const initStart = Date.now();

        const acquireWorker = () => {
          if (ocrWorker) return Promise.resolve(ocrWorker);
          if (isDisposed || signal?.aborted) {
            throw createAbortError();
          }

          const factoryPromise = Promise.resolve().then(() =>
            createOcrWorker((workerMsg) => {
              if (signal?.aborted || isDisposed) return;
              const subProgress = Math.round((workerMsg.progress || 0) * 100);
              reportProgress({
                stage: "ocr_recognizing",
                pageNumber,
                totalPages,
                percent: Math.min(88, basePercent + Math.round(((workerMsg.progress || 0) * 55) / totalPages)),
                message: `Đang nhận diện chữ (OCR) trang ${pageNumber}/${totalPages} (${subProgress}%)...`,
              });
            }),
          );

          pendingWorkerFactoryPromise = factoryPromise;
          factoryPromise.catch(() => {});

          factoryPromise
            .then((createdWorker) => {
              if (isDisposed || signal?.aborted) {
                safeTerminateWorker(createdWorker);
              }
            })
            .catch(() => {});

          return factoryPromise;
        };

        const created = await withDeadline(
          acquireWorker(),
          initTimeoutMs,
          "OCR_TIMEOUT",
          "Quá thời gian khởi tạo bộ nhận diện OCR. Vui lòng thử lại.",
          () => {
            isDisposed = true;
          },
        );

        if (isDisposed || signal?.aborted) {
          safeTerminateWorker(created);
          throw createAbortError();
        }

        ocrWorker = created;
        ocrInitMs += Date.now() - initStart;
        checkAlive();
      }

      reportProgress({
        stage: "ocr_recognizing",
        pageNumber,
        totalPages,
        percent: basePercent + Math.round(35 / totalPages),
        message: `Đang nhận diện chữ (OCR) trang ${pageNumber}/${totalPages}...`,
      });

      const recStart = Date.now();
      const recognitionResult = await withDeadline(
        ocrWorker.recognize(imageInput, {}, { text: true, blocks: true }),
        pageTimeoutMs,
        "OCR_TIMEOUT",
        `Quá thời gian nhận diện OCR tại trang ${pageNumber}/${totalPages}. Vui lòng thử lại.`,
      );
      ocrRecognizeMs += Date.now() - recStart;
      checkAlive();

      const ocrLines = getOcrLines(recognitionResult?.data, {
        widthPt: baseViewport.width,
        width: boundedViewport.width,
      });

      const unmatchedDirectLines = sufficiency.cleanedLines.filter((line) =>
        line?.length >= 4 &&
        !ocrLines.some((ocrLine) => ocrLine?.toLowerCase().includes(line.toLowerCase())),
      );
      // The remaining text layer is detached from the OCR reading order.
      const mergedLines = ocrLines.some(Boolean) && unmatchedDirectLines.length
        ? [...ocrLines, OCR_COLUMN_BREAK, ...unmatchedDirectLines]
        : [...ocrLines, ...unmatchedDirectLines];

      extractedPages.push({
        pageNumber,
        source: "ocr",
        lines: mergedLines,
        text: mergedLines.join("\n"),
        confidence:
          typeof recognitionResult?.data?.confidence === "number"
            ? recognitionResult.data.confidence
            : null,
      });
    }

    checkAlive();
    reportProgress({
      stage: "mapping_fields",
      pageNumber: totalPages,
      totalPages,
      percent: 92,
      message: "Đang ghép nối văn bản và phân tích các mục hồ sơ CV...",
    });

    const stitched = stitchExtractedPages(extractedPages);
      if (!stitched.fullText.trim()) {
      throw new CvOcrImportError(
        "EMPTY_EXTRACTED_TEXT",
        "Không trích xuất được văn bản từ tệp PDF này. Vui lòng kiểm tra chất lượng bản quét hoặc thử tệp khác.",
      );
    }

    const mapped = mapExtractedTextToResumeDraft(stitched.lines, {
      fileName: validatedMeta.name,
      selectedTemplate,
      pageCount: totalPages >= 2 ? 2 : 1,
      pageSummaries: stitched.pageSummaries,
    });

    reportProgress({
      stage: "completed",
      pageNumber: totalPages,
      totalPages,
      percent: 100,
      message: "Hoàn tất trích xuất dữ liệu CV!",
    });

    return {
      draft: mapped.draft,
      reviewNotes: mapped.reviewNotes,
      pageSummaries: stitched.pageSummaries,
      fullText: stitched.fullText,
      metrics: {
        totalMs: Date.now() - startedAt,
        ocrInitMs,
        ocrRecognizeMs,
        totalPages,
        ocrPageCount: stitched.pageSummaries.filter((p) => p.source === "ocr").length,
        textPageCount: stitched.pageSummaries.filter((p) => p.source === "text").length,
        totalRasterPixels,
      },
    };
  } finally {
    if (signal && globalAbortListener) {
      signal.removeEventListener("abort", globalAbortListener);
    }
    runCleanups();
  }
}

export function createCvOcrJobManager() {
  let currentRequestId = 0;
  let currentAbortController = null;

  const cancelActive = () => {
    currentRequestId += 1;
    if (currentAbortController) {
      try {
        currentAbortController.abort();
      } catch {
        // Ignore abort error
      }
      currentAbortController = null;
    }
    return currentRequestId;
  };

  const runJob = async (input, options = {}) => {
    const requestId = cancelActive();
    const abortController = new AbortController();
    currentAbortController = abortController;

    const isCurrent = () => currentRequestId === requestId && !abortController.signal.aborted;

    try {
      const result = await importResumeFromPdfBytes(input, {
        ...options,
        signal: abortController.signal,
        onProgress: (progressPayload) => {
          if (!isCurrent()) return;
          options.onProgress?.({ ...progressPayload, requestId });
        },
      });

      if (!isCurrent()) {
        throw createAbortError();
      }

      return { ...result, requestId };
    } catch (error) {
      if (!isCurrent()) {
        throw createAbortError();
      }
      throw error;
    } finally {
      if (currentAbortController === abortController) {
        currentAbortController = null;
      }
    }
  };

  return {
    runJob,
    cancelActive,
    getActiveRequestId: () => currentRequestId,
  };
}
