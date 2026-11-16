import test from "node:test";
import assert from "node:assert/strict";
import {
  APPLICATION_COVER_LETTER_MAX_LENGTH,
  classifyApplicationSubmitOutcome,
  extractConfirmedApplicationId,
  findApplicationForJob,
  formatPdfFileSize,
  getAccountId,
  getApplicationJobInfo,
  getResumeFetchScope,
  getResumeTemplateLabel,
  isCandidateEligible,
  normalizeIdString,
  preparePdfForSubmission,
  sanitizeCoverLetterForSubmit,
  selectScopedResumeState,
  validateCandidatePdfBytes,
  validateCandidatePdfMeta,
  validateCoverLetter,
  verifyCandidatePdfDocument,
} from "../src/utils/applicationSubmission.js";

function buildValidPdfBytes({ pages = 1, label = "RabbitCV Candidate" } = {}) {
  const safeText = String(label).replace(/[()\\]/g, "");
  const streamContent = `BT /F1 16 Tf 72 720 Td (${safeText}) Tj ET\n`;
  const pageCount = Math.max(1, Number(pages) || 1);

  // 1: Catalog, 2: Pages, 3: Content stream, 4: Font, 5..(5+N-1): Page objects
  const pageIds = Array.from({ length: pageCount }, (_, i) => `${5 + i} 0 R`).join(" ");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    `2 0 obj\n<< /Type /Pages /Kids [${pageIds}] /Count ${pageCount} >>\nendobj\n`,
    `3 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "latin1")} >>\nstream\n${streamContent}endstream\nendobj\n`,
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  for (let i = 0; i < pageCount; i += 1) {
    objects.push(
      `${5 + i} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 3 0 R /Resources << /Font << /F1 4 0 R >> >> >>\nendobj\n`,
    );
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf, "latin1"));
}

test("candidate eligibility and account id extraction", () => {
  assert.equal(normalizeIdString(12345), "");
  assert.equal(normalizeIdString(true), "");
  assert.equal(normalizeIdString("undefined"), "");
  assert.equal(normalizeIdString("null"), "");
  assert.equal(normalizeIdString({ _id: 12345 }), "");
  assert.equal(normalizeIdString({ _id: "  u-3  " }), "u-3");

  assert.equal(getAccountId(null), null);
  assert.equal(getAccountId({ _id: 999 }), null);
  assert.equal(getAccountId({ _id: "u-1" }), "u-1");
  assert.equal(getAccountId({ id: "u-2" }), "u-2");

  assert.equal(isCandidateEligible(null), false);
  assert.equal(isCandidateEligible({ _id: "u-1", role: "company" }), false);
  assert.equal(isCandidateEligible({ _id: "u-1", role: "admin" }), false);
  assert.equal(isCandidateEligible({ role: "employee" }), false);
  assert.equal(isCandidateEligible({ _id: 123, role: "employee" }), false);
  assert.equal(isCandidateEligible({ _id: "u-1", role: "employee" }), true);
});

test("pdf size formatting and template label helpers", () => {
  assert.equal(formatPdfFileSize(0), "0 B");
  assert.equal(formatPdfFileSize(512), "512 B");
  assert.equal(formatPdfFileSize(1536), "1.5 KB");
  assert.equal(formatPdfFileSize(2 * 1024 * 1024), "2 MB");

  assert.equal(getResumeTemplateLabel("modern"), "Mẫu hiện đại hai cột");
  assert.equal(getResumeTemplateLabel(""), "Mẫu mặc định");
  assert.equal(getResumeTemplateLabel("custom"), "Mẫu custom");
});

test("cover letter validation enforces plain text 5000 char backend limit", () => {
  const valid = validateCoverLetter("Xin chào,\r\nTôi quan tâm đến vị trí này.");
  assert.equal(valid.valid, true);
  assert.equal(sanitizeCoverLetterForSubmit("  Xin chào\r\nnhà tuyển dụng  "), "Xin chào\nnhà tuyển dụng");

  const maxExact = "a".repeat(APPLICATION_COVER_LETTER_MAX_LENGTH);
  assert.equal(validateCoverLetter(maxExact).valid, true);

  const overLimit = "a".repeat(APPLICATION_COVER_LETTER_MAX_LENGTH + 1);
  const invalid = validateCoverLetter(overLimit);
  assert.equal(invalid.valid, false);
  assert.match(invalid.message, /5\.000/);
});

test("pdf metadata, header, and real PDF structure checks reject broken headers while allowing multi-page CVs and aborting cleanly", async () => {
  assert.equal(validateCandidatePdfMeta({ name: "cv.docx", type: "application/pdf", size: 100 }).valid, false);
  assert.equal(validateCandidatePdfMeta({ name: "cv.pdf", type: "text/plain", size: 100 }).valid, false);
  assert.equal(validateCandidatePdfMeta({ name: "cv.pdf", type: "application/pdf", size: 0 }).valid, false);
  assert.equal(
    validateCandidatePdfMeta({
      name: "cv.pdf",
      type: "application/pdf",
      size: 5 * 1024 * 1024 + 1,
    }).valid,
    false,
  );
  assert.equal(validateCandidatePdfMeta({ name: "cv.pdf", type: "", size: 1024 }).valid, true);

  assert.equal(validateCandidatePdfBytes(new TextEncoder().encode("short")).valid, false);
  assert.equal(validateCandidatePdfBytes(new TextEncoder().encode("NOTPDF12345")).valid, false);
  assert.equal(validateCandidatePdfBytes(new TextEncoder().encode("  %PDF-1.4\n1 0 obj")).valid, false);
  assert.equal(
    validateCandidatePdfBytes(new TextEncoder().encode("%PDF-1.4\n<< /Encrypt 1 0 R >>")).valid,
    false,
  );
  assert.equal(
    validateCandidatePdfBytes(new TextEncoder().encode("%PDF-1.4\n1 0 obj\nendobj")).valid,
    true,
  );

  // Broken PDF with valid %PDF-1.7 header must fail structural validation
  const brokenHeaderOnly = new TextEncoder().encode("%PDF-1.7\nNo PDF object tree or pages\n");
  const brokenFile = {
    name: "broken.pdf",
    type: "application/pdf",
    size: brokenHeaderOnly.byteLength,
    arrayBuffer: async () => brokenHeaderOnly.slice().buffer,
  };
  const brokenPrepared = await preparePdfForSubmission(brokenFile);
  assert.equal(brokenPrepared.ok, false);
  assert.equal(brokenPrepared.code, "INVALID_PDF_CORRUPT");

  // Header-only minimal object without Catalog/Pages must also fail
  const noPagesBytes = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<< >>\nendobj\n");
  const noPagesDoc = await verifyCandidatePdfDocument(noPagesBytes);
  assert.equal(noPagesDoc.valid, false);

  // Encrypted PDF exception reported by PDF reader maps to PDF_ENCRYPTED
  let encryptedDestroyed = 0;
  const encryptedDoc = await verifyCandidatePdfDocument(buildValidPdfBytes(), {
    pdfLoader: async () => ({
      promise: Promise.reject(Object.assign(new Error("Password required"), { name: "PasswordException" })),
      destroy: async () => {
        encryptedDestroyed += 1;
      },
    }),
  });
  assert.equal(encryptedDoc.valid, false);
  assert.equal(encryptedDoc.code, "PDF_ENCRYPTED");
  assert.equal(encryptedDestroyed, 1);

  // Zero-page PDF rejected
  const zeroPageDoc = await verifyCandidatePdfDocument(buildValidPdfBytes(), {
    pdfLoader: async () => ({
      promise: Promise.resolve({ numPages: 0, getPage: async () => ({}) }),
      destroy: async () => {},
    }),
  });
  assert.equal(zeroPageDoc.valid, false);
  assert.equal(zeroPageDoc.code, "INVALID_PDF_PAGES");

  // Multi-page CV (4 pages) is valid and NOT blocked by OCR 3-page limit
  const fourPageBytes = buildValidPdfBytes({ pages: 4, label: "Four Page Resume" });
  const fourPageFile = {
    name: "four-page-cv.pdf",
    type: "application/pdf",
    size: fourPageBytes.byteLength,
    arrayBuffer: async () => fourPageBytes.slice().buffer,
  };
  const preparedFourPage = await preparePdfForSubmission(fourPageFile);
  assert.equal(preparedFourPage.ok, true);
  assert.equal(preparedFourPage.fileName, "four-page-cv.pdf");
  assert.equal(preparedFourPage.pageCount, 4);
  assert.equal(preparedFourPage.bytes.byteLength, fourPageBytes.byteLength);
  assert.ok(preparedFourPage.fileData.startsWith("data:application/pdf;base64,JVBERi0"));

  // Caller bytes stay intact even when pdfLoader simulates worker transfer detaching its input buffer
  const workerValidBytes = buildValidPdfBytes({ pages: 1, label: "Transfer Test" });
  const originalLen = workerValidBytes.byteLength;
  const preparedWithDetachingWorker = await preparePdfForSubmission(
    {
      name: "worker-transfer.pdf",
      type: "application/pdf",
      size: originalLen,
      arrayBuffer: async () => workerValidBytes.slice().buffer,
    },
    {
      pdfLoader: async (receivedBytes) => {
        // Simulate worker transfer mutating/emptying the clone's backing buffer
        receivedBytes.fill(0);
        return {
          promise: Promise.resolve({ numPages: 1, getPage: async () => ({}) }),
          destroy: async () => {},
        };
      },
    },
  );
  assert.equal(preparedWithDetachingWorker.ok, true);
  assert.equal(preparedWithDetachingWorker.bytes.byteLength, originalLen);
  assert.equal(new TextDecoder("latin1").decode(preparedWithDetachingWorker.bytes.subarray(0, 5)), "%PDF-");

  // Abort cleanup also destroys a deferred loadingTask if loader resolves after abort
  let resolveLateLoader;
  let lateDestroyed = 0;
  const abortController = new AbortController();
  const abortPromise = preparePdfForSubmission(fourPageFile, {
    signal: abortController.signal,
    pdfLoader: () =>
      new Promise((resolve) => {
        resolveLateLoader = resolve;
      }),
  });
  await new Promise((r) => setTimeout(r, 10));
  abortController.abort();
  await assert.rejects(
    () => abortPromise,
    (error) => error?.name === "AbortError",
  );
  resolveLateLoader?.({
    promise: Promise.resolve({ numPages: 1, getPage: async () => ({}) }),
    destroy: async () => {
      lateDestroyed += 1;
    },
  });
  await new Promise((r) => setTimeout(r, 15));
  assert.equal(lateDestroyed, 1);
});

test("submission outcome classification enforces strict string IDs, jobId match, and ALREADY_APPLIED 409 code", () => {
  assert.equal(extractConfirmedApplicationId(null, "job-1"), null);
  assert.equal(extractConfirmedApplicationId({ ok: true }, "job-1"), null);
  assert.equal(extractConfirmedApplicationId({ application: { _id: "", jobId: "job-1" } }, "job-1"), null);
  assert.equal(extractConfirmedApplicationId({ application: { _id: 12345, jobId: "job-1" } }, "job-1"), null);
  assert.equal(extractConfirmedApplicationId({ application: { _id: "app-1" } }, "job-1"), null);
  assert.equal(extractConfirmedApplicationId({ application: { _id: "app-1", jobId: 999 } }, "job-1"), null);
  assert.equal(extractConfirmedApplicationId({ application: { _id: "app-1", jobId: "job-1" } }, ""), null);
  assert.equal(
    extractConfirmedApplicationId({ application: { _id: "app-1", jobId: "job-other" } }, "job-1"),
    null,
  );
  assert.equal(
    extractConfirmedApplicationId({ application: { _id: "app-1", jobId: "job-1" } }, "job-1"),
    "app-1",
  );
  assert.equal(
    extractConfirmedApplicationId({ application: { _id: "app-1", jobId: { _id: "job-1" } } }, "job-1"),
    "app-1",
  );

  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: true,
      status: 201,
      payload: { application: { _id: "app-1", jobId: "job-1" } },
      expectedJobId: "job-1",
    }).kind,
    "CONFIRMED",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: true,
      status: 201,
      payload: { application: { _id: 98765, jobId: "job-1" } },
      expectedJobId: "job-1",
    }).kind,
    "AMBIGUOUS_RESPONSE",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: true,
      status: 201,
      payload: { application: { _id: "app-1", jobId: "job-2" } },
      expectedJobId: "job-1",
    }).kind,
    "AMBIGUOUS_RESPONSE",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: true,
      status: 200,
      payload: {},
      expectedJobId: "job-1",
    }).kind,
    "AMBIGUOUS_RESPONSE",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: false,
      status: 409,
      payload: { code: "ALREADY_APPLIED", message: "Duplicate" },
      expectedJobId: "job-1",
    }).kind,
    "ALREADY_APPLIED",
  );
  const unrelatedConflict = classifyApplicationSubmitOutcome({
    ok: false,
    status: 409,
    payload: { code: "UNRELATED_CONFLICT", message: "Xung đột dữ liệu khác" },
    expectedJobId: "job-1",
  });
  assert.equal(unrelatedConflict.kind, "RETRYABLE_ERROR");
  assert.equal(unrelatedConflict.message, "Xung đột dữ liệu khác");
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: false,
      status: 409,
      payload: {},
      expectedJobId: "job-1",
    }).kind,
    "RETRYABLE_ERROR",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: false,
      status: 401,
      payload: {},
      expectedJobId: "job-1",
    }).kind,
    "AUTH_REQUIRED",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: false,
      status: 403,
      payload: { code: "CANDIDATE_ROLE_REQUIRED" },
      expectedJobId: "job-1",
    }).kind,
    "CANDIDATE_ROLE_REQUIRED",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: false,
      status: 410,
      payload: {},
      expectedJobId: "job-1",
    }).kind,
    "JOB_UNAVAILABLE",
  );
  assert.equal(
    classifyApplicationSubmitOutcome({
      ok: false,
      status: 500,
      payload: {},
      expectedJobId: "job-1",
    }).kind,
    "RETRYABLE_ERROR",
  );
});

test("scoped resume selector masks previous account or job resumes while next account loads", () => {
  const scopeA = getResumeFetchScope({
    isAuthChecked: true,
    isCandidate: true,
    accountId: "employee-a",
    job: { _id: "job-1" },
    jobIsUnavailable: false,
  });
  assert.equal(scopeA, "job-1::employee-a");

  const loadedStateA = {
    scope: scopeA,
    items: [{ _id: "cv-a", title: "CV của A" }],
    loading: false,
    error: "",
  };
  assert.equal(selectScopedResumeState(loadedStateA, scopeA).resumes.length, 1);

  // Switching directly to employee-b on same job hides A immediately and enters loading state
  const scopeB = getResumeFetchScope({
    isAuthChecked: true,
    isCandidate: true,
    accountId: "employee-b",
    job: { _id: "job-1" },
    jobIsUnavailable: false,
  });
  assert.equal(scopeB, "job-1::employee-b");
  const maskedForB = selectScopedResumeState(loadedStateA, scopeB);
  assert.deepEqual(maskedForB.resumes, []);
  assert.equal(maskedForB.loading, true);
  assert.equal(maskedForB.error, "");

  // Ineligible / closed job clears scope cleanly
  const unavailableScope = getResumeFetchScope({
    isAuthChecked: true,
    isCandidate: true,
    accountId: "employee-b",
    job: { _id: "job-1" },
    jobIsUnavailable: true,
  });
  assert.equal(unavailableScope, null);
  assert.deepEqual(selectScopedResumeState(loadedStateA, unavailableScope), {
    resumes: [],
    loading: false,
    error: "",
  });
});

test("findApplicationForJob and getApplicationJobInfo handle populated and deleted job snapshots", () => {
  const apps = [
    {
      _id: "app-active",
      jobId: { _id: "job-1", title: "Frontend Dev", company: "Alpha", location: "HN" },
    },
    {
      _id: "app-deleted",
      jobId: null,
      jobSnapshot: {
        jobId: "job-2",
        title: "Backend Dev",
        company: "Beta Snapshot",
        location: "HCM",
      },
    },
    {
      _id: "app-soft-deleted",
      jobId: { _id: "job-3", title: "QA Lead", company: "Gamma", status: "Deleted" },
    },
  ];

  assert.equal(findApplicationForJob(apps, "job-1")?._id, "app-active");
  assert.equal(findApplicationForJob(apps, { _id: "job-2" })?._id, "app-deleted");
  assert.equal(findApplicationForJob(apps, "missing"), null);

  const activeInfo = getApplicationJobInfo(apps[0]);
  assert.equal(activeInfo.isJobDeleted, false);
  assert.equal(activeInfo.canOpenJobDetail, true);
  assert.equal(activeInfo.title, "Frontend Dev");

  const deletedSnapshotInfo = getApplicationJobInfo(apps[1]);
  assert.equal(deletedSnapshotInfo.isJobDeleted, true);
  assert.equal(deletedSnapshotInfo.canOpenJobDetail, false);
  assert.equal(deletedSnapshotInfo.title, "Backend Dev");
  assert.equal(deletedSnapshotInfo.company, "Beta Snapshot");

  const softDeletedInfo = getApplicationJobInfo(apps[2]);
  assert.equal(softDeletedInfo.isJobDeleted, true);
  assert.equal(softDeletedInfo.canOpenJobDetail, false);
});
