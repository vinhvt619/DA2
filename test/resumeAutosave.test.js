import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AUTOSAVE_IDLE_DELAY_MS,
  SAVE_REQUEST_TIMEOUT_MS,
  TRANSIENT_RETRY_DELAY_MS,
  buildResumeSavePayload,
  classifyResumeSaveError,
  getResumeSignature,
  parseResumeSaveHttpResponse,
  validateResumeDraftForSave,
} from "../src/utils/resumeSavePolicy.js";
import { createResumeSaveCoordinator } from "../src/utils/resumeSaveCoordinator.js";

function createFakeEnv({ initialTime = 1_000, online = true } = {}) {
  let clock = initialTime;
  let nextTimerId = 1;
  let networkOnline = online;
  const timers = new Map();

  const flushMicrotasks = async (rounds = 8) => {
    for (let i = 0; i < rounds; i += 1) {
      await Promise.resolve();
    }
  };

  return {
    now: () => clock,
    isOnline: () => networkOnline,
    setOnline(value) {
      networkOnline = Boolean(value);
    },
    scheduleTimer(fn, ms) {
      const id = nextTimerId;
      nextTimerId += 1;
      timers.set(id, {
        id,
        fn,
        runAt: clock + Math.max(0, Number(ms) || 0),
      });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    async advanceBy(ms) {
      const targetTime = clock + Math.max(0, ms);
      while (true) {
        let nextTimer = null;
        for (const entry of timers.values()) {
          if (entry.runAt <= targetTime) {
            if (!nextTimer || entry.runAt < nextTimer.runAt || (entry.runAt === nextTimer.runAt && entry.id < nextTimer.id)) {
              nextTimer = entry;
            }
          }
        }
        if (!nextTimer) break;
        timers.delete(nextTimer.id);
        clock = nextTimer.runAt;
        nextTimer.fn();
        await flushMicrotasks();
      }
      clock = targetTime;
      await flushMicrotasks();
    },
    flushMicrotasks,
    pendingTimerCount: () => timers.size,
  };
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeDraft(overrides = {}) {
  return {
    title: "CV Backend Developer",
    selectedTemplate: "modern",
    fullName: "Nguyễn Văn An",
    email: "an@example.com",
    ...overrides,
  };
}

test("resumeSavePolicy validates draft, builds clean payload, and classifies errors accurately", () => {
  const emptyTitle = validateResumeDraftForSave(makeDraft({ title: "   " }));
  assert.equal(emptyTitle.isValid, false);
  assert.equal(emptyTitle.field, "title");

  const badTemplate = validateResumeDraftForSave(makeDraft({ selectedTemplate: "UnknownTpl" }));
  assert.equal(badTemplate.isValid, false);
  assert.equal(badTemplate.field, "selectedTemplate");

  const valid = validateResumeDraftForSave(makeDraft({ title: "  CV Mới  " }));
  assert.equal(valid.isValid, true);
  assert.equal(valid.cleanTitle, "CV Mới");

  const createPayload = buildResumeSavePayload(
    { _id: "stale-id", title: "  CV Tạo  ", selectedTemplate: "modern" },
    null
  );
  assert.equal("_id" in createPayload, false);
  assert.equal(createPayload.title, "CV Tạo");

  const updatePayload = buildResumeSavePayload(makeDraft({ title: "  CV Sửa  " }), "cv-123");
  assert.equal(updatePayload._id, "cv-123");
  assert.equal(updatePayload.title, "CV Sửa");

  const dupByCode = classifyResumeSaveError({ status: 400, code: "DUPLICATE_RESUME_TITLE" });
  assert.equal(dupByCode.kind, "duplicate_title");
  assert.equal(dupByCode.isDuplicateTitle, true);
  assert.equal(dupByCode.retryable, false);

  const dupByMsg = classifyResumeSaveError({
    status: 400,
    message: "Tên CV này đã tồn tại trong tài khoản của bạn.",
  });
  assert.equal(dupByMsg.kind, "duplicate_title");

  const createTimeout = classifyResumeSaveError({ isTimeout: true, isCreate: true });
  assert.equal(createTimeout.kind, "timeout");
  assert.equal(createTimeout.retryable, false);

  const updateTimeout = classifyResumeSaveError({ isTimeout: true, isCreate: false });
  assert.equal(updateTimeout.retryable, true);

  const offline = classifyResumeSaveError({ isOffline: true, isCreate: true });
  assert.equal(offline.kind, "offline");
  assert.equal(offline.retryable, true);
});

test("debounces edits on existing CV without saving on hydrate/no-op/revert", async () => {
  const env = createFakeEnv();
  const requests = [];
  const committed = [];

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onCommitted: (info) => committed.push(info),
    saveRequest: async ({ payload, mode }) => {
      requests.push({ payload, mode });
      return { ok: true, status: 200, data: { resume: { _id: "cv-1", ...payload } } };
    },
  });

  const base = makeDraft();
  coordinator.hydrateClean({ accountId: "user-1", docId: "cv-1", resumeData: base });

  // No-op draft sync (e.g., initial re-render with identical values) does not save
  coordinator.syncDraft({ ...base });
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS * 2);
  assert.equal(requests.length, 0);
  assert.equal(coordinator.getSnapshot().isDirty, false);
  assert.equal(coordinator.getSnapshot().status, "idle");

  // Rapid edits reset the idle debounce window until typing stops
  coordinator.syncDraft(makeDraft({ fullName: "Nguyễn A" }));
  await env.advanceBy(800);
  assert.equal(requests.length, 0);

  coordinator.syncDraft(makeDraft({ fullName: "Nguyễn B" }));
  await env.advanceBy(800);
  assert.equal(requests.length, 0);

  await env.advanceBy(400);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].mode, "auto");
  assert.equal(requests[0].payload._id, "cv-1");
  assert.equal(requests[0].payload.fullName, "Nguyễn B");
  assert.equal(committed.length, 1);
  assert.equal(coordinator.getSnapshot().isDirty, false);
  assert.equal(coordinator.getSnapshot().status, "saved");

  // Editing and reverting back to the saved snapshot cancels autosave and becomes clean
  coordinator.syncDraft(makeDraft({ fullName: "Nguyễn C" }));
  assert.equal(coordinator.getSnapshot().isDirty, true);
  await env.advanceBy(500);
  coordinator.syncDraft(makeDraft({ fullName: "Nguyễn B" }));
  assert.equal(coordinator.getSnapshot().isDirty, false);
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS * 2);
  assert.equal(requests.length, 1);

  coordinator.dispose();
});

test("new CV without _id never autosaves, deduplicates manual double-click, promotes _id, and coalesces edits made during slow create", async () => {
  const env = createFakeEnv();
  const requests = [];
  const committed = [];
  const firstCreateBarrier = createDeferred();

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onCommitted: (info) => committed.push(info),
    saveRequest: async ({ payload, mode }) => {
      requests.push({ payload, mode });
      if (requests.length === 1) {
        return firstCreateBarrier.promise;
      }
      return {
        ok: true,
        status: 200,
        data: { resume: { _id: "cv-new-1", ...payload } },
      };
    },
  });

  coordinator.hydrateClean({
    accountId: "user-1",
    docId: null,
    resumeData: makeDraft({ title: "" }),
  });

  // Edits on unsaved /resume draft stay dirty and do not trigger background autosave
  coordinator.syncDraft(makeDraft({ title: "CV Tạo Đầu Tiên", fullName: "Bản V1" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS * 4);
  assert.equal(requests.length, 0);
  assert.equal(coordinator.getSnapshot().isDirty, true);
  assert.equal(coordinator.getSnapshot().status, "dirty");

  // Rapid double manual save sends only ONE create request
  const firstManualPromise = coordinator.triggerManualSave();
  const secondManualPromise = coordinator.triggerManualSave();
  await env.flushMicrotasks();
  assert.equal(requests.length, 1);
  assert.equal("_id" in requests[0].payload, false);
  assert.equal(await secondManualPromise, false);

  // User continues editing while first create POST is still held in flight
  coordinator.syncDraft(makeDraft({ title: "CV Tạo Đầu Tiên", fullName: "Bản V2 Mới Hơn" }));
  assert.equal(coordinator.getSnapshot().status, "saving");
  assert.equal(coordinator.getSnapshot().isManualSaving, true);
  assert.equal(coordinator.getSnapshot().isDirty, true);

  // Resolve slow first create with generated _id
  firstCreateBarrier.resolve({
    ok: true,
    status: 200,
    data: { resume: { _id: "cv-new-1", title: "CV Tạo Đầu Tiên", fullName: "Bản V1" } },
  });
  assert.equal(await firstManualPromise, true);
  await env.flushMicrotasks();

  // Promoted docId uses captured V1 signature, leaving V2 dirty until follow-up autosave
  assert.equal(committed.length, 1);
  assert.equal(committed[0].isFirstCreate, true);
  assert.equal(committed[0].savedId, "cv-new-1");
  assert.equal(committed[0].hasNewerEdits, true);

  const afterCreate = coordinator.getSnapshot();
  assert.equal(afterCreate.docId, "cv-new-1");
  assert.equal(afterCreate.isDirty, true);
  assert.equal(afterCreate.status, "dirty");
  assert.equal(
    afterCreate.savedSignature,
    getResumeSignature(makeDraft({ title: "CV Tạo Đầu Tiên", fullName: "Bản V1" }))
  );

  // Subsequent idle period now autosaves V2 under the promoted _id
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS + 50);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].mode, "auto");
  assert.equal(requests[1].payload._id, "cv-new-1");
  assert.equal(requests[1].payload.fullName, "Bản V2 Mới Hơn");
  assert.equal(coordinator.getSnapshot().isDirty, false);
  assert.equal(coordinator.getSnapshot().status, "saved");

  coordinator.dispose();
});

test("single-flight lock queues manual save during active autosave and coalesces newer edits without overlap", async () => {
  const env = createFakeEnv();
  const requests = [];
  const inFlightResponses = [];
  const firstBarrier = createDeferred();

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    saveRequest: async ({ payload, mode }) => {
      requests.push({ payload, mode });
      if (requests.length === 1) {
        return firstBarrier.promise;
      }
      const d = createDeferred();
      inFlightResponses.push(d);
      return d.promise;
    },
  });

  coordinator.hydrateClean({ accountId: "user-1", docId: "cv-1", resumeData: makeDraft({ fullName: "V0" }) });
  coordinator.syncDraft(makeDraft({ fullName: "V1" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].payload.fullName, "V1");

  // While request #1 is held, user makes V2, V3 and clicks manual Save
  coordinator.syncDraft(makeDraft({ fullName: "V2" }));
  coordinator.syncDraft(makeDraft({ fullName: "V3" }));
  const queuedOk = await coordinator.triggerManualSave();
  assert.equal(queuedOk, true);
  assert.equal(requests.length, 1); // No overlapping second POST while #1 is active

  // Release #1 -> queued manual save starts immediately for V3 (V2 skipped/coalesced)
  firstBarrier.resolve({
    ok: true,
    status: 200,
    data: { resume: { _id: "cv-1", fullName: "V1" } },
  });
  await env.flushMicrotasks();

  assert.equal(requests.length, 2);
  assert.equal(requests[1].mode, "manual");
  assert.equal(requests[1].payload.fullName, "V3");
  assert.equal(coordinator.getSnapshot().isDirty, true);

  inFlightResponses[0].resolve({
    ok: true,
    status: 200,
    data: { resume: { _id: "cv-1", fullName: "V3" } },
  });
  await env.flushMicrotasks();
  assert.equal(coordinator.getSnapshot().isDirty, false);
  assert.equal(coordinator.getSnapshot().status, "saved");

  coordinator.dispose();
});

test("coalesces background edits made while autosave is in flight and respects remaining debounce delay", async () => {
  const env = createFakeEnv();
  const requests = [];
  const committed = [];
  const firstBarrier = createDeferred();

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onCommitted: (evt) => committed.push(evt),
    saveRequest: async ({ payload, mode }) => {
      requests.push({ payload, mode });
      if (requests.length === 1) {
        return firstBarrier.promise;
      }
      return { ok: true, status: 200, data: { resume: { _id: "cv-1", ...payload } } };
    },
  });

  const v0 = makeDraft({ fullName: "V0" });
  const v1 = makeDraft({ fullName: "V1" });
  const v2 = makeDraft({ fullName: "V2" });
  const v3 = makeDraft({ fullName: "V3" });

  coordinator.hydrateClean({ accountId: "user-1", docId: "cv-1", resumeData: v0 });
  coordinator.syncDraft(v1);
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(requests.length, 1);

  // Edit at +400ms and +500ms while #1 is held; release #1 at +600ms (remaining debounce = 1200 - 100 = 1100ms)
  await env.advanceBy(400);
  coordinator.syncDraft(v2);
  await env.advanceBy(100);
  coordinator.syncDraft(v3);
  await env.advanceBy(100);

  firstBarrier.resolve({ ok: true, status: 200, data: { resume: { _id: "cv-1", ...v1 } } });
  await env.flushMicrotasks();

  assert.equal(committed.length, 1);
  assert.equal(committed[0].hasNewerEdits, true);
  assert.equal(coordinator.getSnapshot().savedSignature, getResumeSignature(v1));
  assert.equal(coordinator.getSnapshot().isDirty, true);
  assert.equal(coordinator.getSnapshot().status, "dirty");
  assert.equal(requests.length, 1);

  // Before remaining 1100ms expires -> still no follow-up request
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS - 200);
  assert.equal(requests.length, 1);

  // Remaining ~100ms expires -> single coalesced autosave with V3
  await env.advanceBy(150);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].mode, "auto");
  assert.equal(requests[1].payload.fullName, "V3");
  assert.equal(coordinator.getSnapshot().savedSignature, getResumeSignature(v3));
  assert.equal(coordinator.getSnapshot().isDirty, false);
  assert.equal(coordinator.getSnapshot().status, "saved");

  coordinator.dispose();
});

test("stops loop on DUPLICATE_RESUME_TITLE and empty title validation until fixed", async () => {
  const env = createFakeEnv();
  const requests = [];
  const failures = [];

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onFailureFeedback: (evt) => failures.push(evt),
    saveRequest: async ({ payload }) => {
      requests.push(payload);
      if (payload.title === "CV Trùng Tên") {
        return {
          ok: false,
          status: 400,
          data: {
            code: "DUPLICATE_RESUME_TITLE",
            message: "Tên CV này đã tồn tại",
          },
        };
      }
      return { ok: true, status: 200, data: { resume: { _id: "cv-1", ...payload } } };
    },
  });

  coordinator.hydrateClean({ accountId: "user-1", docId: "cv-1", resumeData: makeDraft() });

  // Empty title surfaces validation failure without calling API
  coordinator.syncDraft(makeDraft({ title: "   " }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS + 100);
  assert.equal(requests.length, 0);
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.kind, "validation");

  // Duplicate title stops retrying, even if unrelated fields change while title stays duplicate
  coordinator.syncDraft(makeDraft({ title: "CV Trùng Tên" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(requests.length, 1);
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.isDuplicateTitle, true);
  assert.equal(coordinator.getSnapshot().isDirty, true);

  coordinator.syncDraft(makeDraft({ title: "CV Trùng Tên", fullName: "Đổi Tên Người" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS * 3);
  assert.equal(requests.length, 1);
  assert.equal(coordinator.getSnapshot().status, "failed");

  // Changing title to a unique value clears duplicate lock and saves successfully
  coordinator.syncDraft(makeDraft({ title: "CV Độc Nhất", fullName: "Đổi Tên Người" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].title, "CV Độc Nhất");
  assert.equal(coordinator.getSnapshot().status, "saved");
  assert.equal(coordinator.getSnapshot().isDirty, false);
  assert.equal(failures.length >= 1, true);

  coordinator.dispose();
});

test("enforces bounded transient retry on existing CV, zero auto-retry on create failure, and offline/online recovery", async () => {
  const env = createFakeEnv({ online: true });
  let createCalls = 0;
  let serverFail = true;

  // Part A: Create (!_id) timeout/500 must NEVER auto-retry automatically
  const createCoordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    saveRequest: async ({ payload }) => {
      createCalls += 1;
      if (serverFail) {
        return { ok: false, status: 500, data: { message: "Server busy" } };
      }
      return { ok: true, status: 200, data: { resume: { _id: "cv-created", ...payload } } };
    },
  });

  createCoordinator.hydrateClean({ accountId: "user-1", docId: null, resumeData: makeDraft() });
  createCoordinator.syncDraft(makeDraft({ fullName: "Draft 1" }));
  const initialSaveOk = await createCoordinator.triggerManualSave();
  assert.equal(initialSaveOk, false);
  assert.equal(createCalls, 1);
  assert.equal(createCoordinator.getSnapshot().lastError.retryable, false);

  await env.advanceBy(TRANSIENT_RETRY_DELAY_MS * 3);
  assert.equal(createCalls, 1);

  serverFail = false;
  assert.equal(await createCoordinator.triggerRetry(), true);
  assert.equal(createCalls, 2);
  assert.equal(createCoordinator.getSnapshot().docId, "cv-created");
  createCoordinator.dispose();

  // Part B: Existing CV autosave retries once (bounded), settles on failed, then recovers on online/retry
  let updateCalls = 0;
  let failUpdates = true;
  const updateCoordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    saveRequest: async ({ payload }) => {
      updateCalls += 1;
      if (failUpdates) {
        return { ok: false, status: 500, data: { message: "Transient failure" } };
      }
      return { ok: true, status: 200, data: { resume: { _id: "cv-1", ...payload } } };
    },
  });

  updateCoordinator.hydrateClean({ accountId: "user-1", docId: "cv-1", resumeData: makeDraft({ fullName: "Init" }) });
  updateCoordinator.syncDraft(makeDraft({ fullName: "Updated" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(updateCalls, 1);
  assert.equal(updateCoordinator.getSnapshot().status, "retrying");

  await env.advanceBy(TRANSIENT_RETRY_DELAY_MS);
  assert.equal(updateCalls, 2);
  assert.equal(updateCoordinator.getSnapshot().status, "failed");

  // Must not loop after exceeding MAX_TRANSIENT_AUTO_RETRIES
  await env.advanceBy(TRANSIENT_RETRY_DELAY_MS * 4);
  assert.equal(updateCalls, 2);

  // Offline blocks network dispatch until browser comes back online
  env.setOnline(false);
  updateCoordinator.syncDraft(makeDraft({ fullName: "Updated Offline" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(updateCalls, 2);
  assert.equal(updateCoordinator.getSnapshot().status, "failed");
  assert.equal(updateCoordinator.getSnapshot().lastError.kind, "offline");

  failUpdates = false;
  env.setOnline(true);
  updateCoordinator.handleOnline();
  await env.flushMicrotasks();
  assert.equal(updateCalls, 3);
  assert.equal(updateCoordinator.getSnapshot().status, "saved");
  assert.equal(updateCoordinator.getSnapshot().isDirty, false);
  updateCoordinator.dispose();
});

test("generation, account change, doc switch, and cancelPendingWork abort stale saves and pause while confirm dialog is open", async () => {
  const env = createFakeEnv();
  const capturedSignals = [];
  const barriers = [];
  const committed = [];
  const failures = [];

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onCommitted: (evt) => committed.push(evt),
    onFailureFeedback: (evt) => failures.push(evt),
    saveRequest: async ({ payload, signal }) => {
      capturedSignals.push(signal);
      const barrier = createDeferred();
      barriers.push(barrier);
      const response = await barrier.promise;
      return { ...response, payload };
    },
  });

  coordinator.hydrateClean({ accountId: "user-1", docId: "cv-1", resumeData: makeDraft({ fullName: "U1 CV1" }) });
  coordinator.syncDraft(makeDraft({ fullName: "U1 CV1 Edited" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(barriers.length, 1);
  assert.equal(capturedSignals[0].aborted, false);

  // Switch active document / account while request #1 is in flight
  coordinator.hydrateClean({ accountId: "user-2", docId: "cv-2", resumeData: makeDraft({ fullName: "U2 CV2" }) });
  assert.equal(capturedSignals[0].aborted, true);

  // Late response from cancelled generation must be ignored completely
  barriers[0].resolve({
    ok: true,
    status: 200,
    data: { resume: { _id: "cv-1", fullName: "U1 CV1 Edited" } },
  });
  await env.flushMicrotasks();
  assert.equal(committed.length, 0);
  assert.equal(failures.length, 0);
  assert.equal(coordinator.getSnapshot().accountId, "user-2");
  assert.equal(coordinator.getSnapshot().docId, "cv-2");
  assert.equal(coordinator.getSnapshot().isDirty, false);

  // Confirm dialog pause stops debounce until dialog closes cleanly
  coordinator.syncDraft(makeDraft({ fullName: "U2 Dirty" }));
  coordinator.setContext({ accountId: "user-2", docId: "cv-2", blockedPromptOpen: true });
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS * 2);
  assert.equal(barriers.length, 1);

  coordinator.setContext({ accountId: "user-2", docId: "cv-2", blockedPromptOpen: false });
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(barriers.length, 2);

  coordinator.cancelPendingWork();
  assert.equal(capturedSignals[1].aborted, true);
  barriers[1].reject(new Error("Network error after cancel"));
  await env.flushMicrotasks();
  assert.equal(failures.length, 0);

  coordinator.dispose();
});

test("App router and Resume editor integrate Data Router guard, ConfirmPopUp, beforeunload, and forbid localStorage drafts", async () => {
  const [appSource, resumeSource, hookSource] = await Promise.all([
    readFile(new URL("../src/Pages/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Pages/Resume.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useResumeAutosave.js", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /createBrowserRouter/);
  assert.match(appSource, /RouterProvider/);
  assert.match(appSource, /<RoleAccessGuard\s*\/>/);
  assert.match(appSource, /path="\/ai-interview"/);

  assert.match(resumeSource, /useBlocker/);
  assert.match(resumeSource, /<ConfirmPopUp/);
  assert.match(resumeSource, /beforeunload/);
  assert.match(resumeSource, /useResumeAutosave/);
  assert.doesNotMatch(resumeSource, /localStorage/);
  assert.doesNotMatch(hookSource, /localStorage/);
});

test("parseResumeSaveHttpResponse preserves AbortError and invalid-JSON semantics on HTTP responses", async () => {
  const validRes = await parseResumeSaveHttpResponse({
    ok: true,
    status: 200,
    json: async () => ({ resume: { _id: "editing-cv", title: "Valid" } }),
  });
  assert.equal(validRes.ok, true);
  assert.equal(validRes.data.resume._id, "editing-cv");

  const malformed200 = await parseResumeSaveHttpResponse({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("Unexpected end of JSON input");
    },
  });
  assert.equal(malformed200.ok, false);
  assert.equal(malformed200.status, 200);
  assert.equal(malformed200.isUnconfirmedResponse, true);

  const nonObject200 = await parseResumeSaveHttpResponse({
    ok: true,
    status: 200,
    json: async () => null,
  });
  assert.equal(nonObject200.ok, false);
  assert.equal(nonObject200.isUnconfirmedResponse, true);

  const html500 = await parseResumeSaveHttpResponse({
    ok: false,
    status: 502,
    json: async () => {
      throw new SyntaxError("Unexpected token <");
    },
  });
  assert.equal(html500.ok, false);
  assert.equal(html500.status, 502);
  assert.equal(html500.isUnconfirmedResponse, undefined);

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () =>
      parseResumeSaveHttpResponse(
        {
          ok: true,
          status: 200,
          json: async () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            throw err;
          },
        },
        { signal: controller.signal },
      ),
    (err) => err?.name === "AbortError",
  );

  await assert.rejects(
    () =>
      parseResumeSaveHttpResponse(
        {
          ok: true,
          status: 200,
          json: async () => ({}),
        },
        { signal: controller.signal },
      ),
    (err) => err?.name === "AbortError",
  );
});

test("rejects unconfirmed, missing-ID, mismatched-ID, and timed-out aborted responses without false saved state", async () => {
  const env = createFakeEnv();
  const committed = [];
  const failures = [];
  let mode = "empty-create";

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onCommitted: (evt) => committed.push(evt),
    onFailureFeedback: (evt) => failures.push(evt),
    saveRequest: async ({ signal }) => {
      if (mode === "empty-create") {
        return { ok: true, status: 200, data: {} };
      }
      if (mode === "missing-id") {
        return { ok: true, status: 200, data: { resume: { title: "No ID" } } };
      }
      if (mode === "blank-id") {
        return { ok: true, status: 200, data: { resume: { _id: "   " } } };
      }
      if (mode === "fake-browser-id") {
        return { ok: true, status: 200, data: { resume: { _id: "editing-cv" } } };
      }
      if (mode === "timeout-swallowed-body") {
        return new Promise((resolve) => {
          signal.addEventListener("abort", () => {
            // Repro B: even if body read swallows AbortError and resolves { ok: true, data: {} }
            resolve({ ok: true, status: 200, data: {} });
          });
        });
      }
      if (mode === "timeout-body-abort") {
        return new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            parseResumeSaveHttpResponse(
              {
                ok: true,
                status: 200,
                json: async () => {
                  const err = new Error("Aborted body");
                  err.name = "AbortError";
                  throw err;
                },
              },
              { signal },
            ).then(resolve, reject);
          });
        });
      }
      if (mode === "mismatched-id") {
        return { ok: true, status: 200, data: { resume: { _id: "wrong-cv-id" } } };
      }
      return { ok: true, status: 200, data: { resume: { _id: "editing-cv" } } };
    },
  });

  // Repro A: create with { ok: true, status: 200, data: {} }
  coordinator.hydrateClean({ accountId: "user-1", docId: null, resumeData: makeDraft({ fullName: "Mới" }) });
  coordinator.syncDraft(makeDraft({ fullName: "Mới Sửa" }));
  const okEmpty = await coordinator.triggerManualSave();
  assert.equal(okEmpty, false);
  assert.equal(committed.length, 0);
  assert.equal(coordinator.getSnapshot().docId, null);
  assert.equal(coordinator.getSnapshot().isDirty, true);
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.kind, "ambiguous_create");
  assert.equal(coordinator.getSnapshot().lastError.retryable, false);
  assert.match(coordinator.getSnapshot().lastError.userMessage, /Thư viện CV/);
  assert.equal(failures.length, 1);

  await env.advanceBy(TRANSIENT_RETRY_DELAY_MS * 3);
  assert.equal(committed.length, 0);

  mode = "missing-id";
  assert.equal(await coordinator.triggerManualSave(), false);
  assert.equal(coordinator.getSnapshot().status, "failed");

  mode = "blank-id";
  assert.equal(await coordinator.triggerManualSave(), false);
  assert.equal(coordinator.getSnapshot().status, "failed");

  // Fake non-ObjectId test IDs like "editing-cv" must still be accepted
  mode = "fake-browser-id";
  assert.equal(await coordinator.triggerManualSave(), true);
  assert.equal(committed.length, 1);
  assert.equal(coordinator.getSnapshot().docId, "editing-cv");
  assert.equal(coordinator.getSnapshot().status, "saved");
  assert.equal(coordinator.getSnapshot().isDirty, false);

  // Repro B1: timed-out persisted save whose promise still resolves { ok: true, data: {} } on abort
  mode = "timeout-swallowed-body";
  coordinator.syncDraft(makeDraft({ fullName: "Timed Out Swallowed" }));
  const manualPromise = coordinator.triggerManualSave();
  await env.advanceBy(SAVE_REQUEST_TIMEOUT_MS);
  const timeoutResult1 = await manualPromise;
  assert.equal(timeoutResult1, false);
  assert.equal(committed.length, 1);
  assert.equal(coordinator.getSnapshot().isDirty, true);
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.kind, "timeout");

  // Repro B2: timed-out body read rejecting AbortError via parseResumeSaveHttpResponse
  mode = "timeout-body-abort";
  const bodyAbortPromise = coordinator.triggerRetry();
  await env.advanceBy(SAVE_REQUEST_TIMEOUT_MS);
  assert.equal(await bodyAbortPromise, false);
  assert.equal(coordinator.getSnapshot().isDirty, true);
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.kind, "timeout");

  // Mismatched update resume._id must fail without committing
  mode = "mismatched-id";
  assert.equal(await coordinator.triggerManualSave(), false);
  assert.equal(committed.length, 1);
  assert.equal(coordinator.getSnapshot().isDirty, true);
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.kind, "invalid_response");

  coordinator.dispose();
});

test("preserves latest edits and surfaces failed create error when user edits during failing first create", async () => {
  const env = createFakeEnv();
  const requests = [];
  const barriers = [];
  const committed = [];
  const failures = [];

  const offlineCreate = classifyResumeSaveError({ isOffline: true, isCreate: true });
  assert.match(offlineCreate.userMessage, /Lưu CV/);

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onCommitted: (evt) => committed.push(evt),
    onFailureFeedback: (evt) => failures.push(evt),
    saveRequest: ({ payload }) => {
      requests.push(payload);
      const barrier = createDeferred();
      barriers.push(barrier);
      return barrier.promise;
    },
  });

  // Case 1: Slow first create fails with 500 after newer edit
  coordinator.hydrateClean({ accountId: "user-1", docId: null, resumeData: makeDraft({ title: "Title Init" }) });
  coordinator.syncDraft(makeDraft({ title: "Title A", fullName: "Name A" }));
  const firstSave = coordinator.triggerManualSave();
  await env.flushMicrotasks();
  assert.equal(barriers.length, 1);

  coordinator.syncDraft(makeDraft({ title: "Title B", fullName: "Name B" }));
  assert.equal(coordinator.getSnapshot().status, "saving");

  barriers[0].resolve({ ok: false, status: 500, data: { message: "Server down" } });
  assert.equal(await firstSave, false);
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS * 3);

  assert.equal(barriers.length, 1); // Never auto-retries first create
  assert.equal(committed.length, 0);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].field, null);
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().isDirty, true);
  assert.equal(coordinator.getSnapshot().docId, null);
  assert.equal(coordinator.getSnapshot().lastError.kind, "transient");

  // Case 2: Slow first create fails with DUPLICATE_RESUME_TITLE after title was already changed
  const dupCreate = coordinator.triggerManualSave();
  await env.flushMicrotasks();
  assert.equal(barriers.length, 2);
  assert.equal(requests[1].title, "Title B");

  coordinator.syncDraft(makeDraft({ title: "Title C Unique", fullName: "Name B" }));
  barriers[1].resolve({
    ok: false,
    status: 400,
    data: { code: "DUPLICATE_RESUME_TITLE", message: "Tên CV đã tồn tại" },
  });
  assert.equal(await dupCreate, false);
  await env.flushMicrotasks();

  assert.equal(failures.length, 2);
  assert.equal(failures[1].field, null); // Stale per-field duplicate lock cleared for new title
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.isDuplicateTitle, false);
  assert.equal(coordinator.getSnapshot().lastError.kind, "create_failed");

  // Case 3: Duplicate-title failure while ONLY bio changed keeps per-field title error
  const sameTitleDup = coordinator.triggerRetry();
  await env.flushMicrotasks();
  assert.equal(barriers.length, 3);
  coordinator.syncDraft(makeDraft({ title: "Title C Unique", fullName: "Name B Edited" }));
  barriers[2].resolve({
    ok: false,
    status: 400,
    data: { code: "DUPLICATE_RESUME_TITLE", message: "Tên CV đã tồn tại" },
  });
  assert.equal(await sameTitleDup, false);
  assert.equal(failures.length, 3);
  assert.equal(failures[2].field, "title");
  assert.equal(coordinator.getSnapshot().lastError.isDuplicateTitle, true);

  // Manual retry now sends newest draft and succeeds
  const finalSave = coordinator.triggerManualSave();
  await env.flushMicrotasks();
  assert.equal(requests[3].fullName, "Name B Edited");
  barriers[3].resolve({
    ok: true,
    status: 200,
    data: { resume: { _id: "cv-created-after-fail", ...requests[3] } },
  });
  assert.equal(await finalSave, true);
  assert.equal(coordinator.getSnapshot().status, "saved");
  assert.equal(coordinator.getSnapshot().docId, "cv-created-after-fail");
  coordinator.dispose();
});

test("pauses and resumes retrying state across confirm/AI guards, failure-during-pause, offline resume, and cancellation", async () => {
  const env = createFakeEnv({ initialTime: 1_000 });
  const requests = [];
  const barriers = [];
  const committed = [];
  const failures = [];

  const coordinator = createResumeSaveCoordinator({
    scheduleTimer: env.scheduleTimer,
    clearTimer: env.clearTimer,
    now: env.now,
    isOnline: env.isOnline,
    onCommitted: (evt) => committed.push(evt),
    onFailureFeedback: (evt) => failures.push(evt),
    saveRequest: ({ payload }) => {
      requests.push(payload);
      const barrier = createDeferred();
      barriers.push(barrier);
      return barrier.promise;
    },
  });

  // Scenario A: autosave 500 -> retrying -> repeated pause/resume preserves remaining deadline and retry budget
  coordinator.hydrateClean({ accountId: "user-1", docId: "cv-1", resumeData: makeDraft({ fullName: "Base" }) });
  coordinator.syncDraft(makeDraft({ fullName: "Edit 1" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(barriers.length, 1);

  barriers[0].resolve({ ok: false, status: 500, data: { message: "Transient" } });
  await env.flushMicrotasks();
  assert.equal(coordinator.getSnapshot().status, "retrying");
  assert.equal(coordinator.getSnapshot().transientRetryCount, 1);
  assert.equal(env.pendingTimerCount(), 1);

  await env.advanceBy(600);
  coordinator.setContext({ accountId: "user-1", docId: "cv-1", blockedPromptOpen: true });
  assert.equal(env.pendingTimerCount(), 0);
  assert.equal(coordinator.getSnapshot().status, "retrying");

  // Nothing fires behind confirm dialog even well past original deadline
  await env.advanceBy(400);
  assert.equal(barriers.length, 1);

  // Resume #1 -> remaining deadline is 2000 - (600 + 400) = 1000ms
  coordinator.setContext({ accountId: "user-1", docId: "cv-1", blockedPromptOpen: false });
  assert.equal(env.pendingTimerCount(), 1);

  // Pause #2 at +300ms -> Resume #2 at +200ms -> remaining is 500ms, budget NOT reset
  await env.advanceBy(300);
  coordinator.setContext({ accountId: "user-1", docId: "cv-1", blockedPromptOpen: true });
  assert.equal(env.pendingTimerCount(), 0);
  await env.advanceBy(200);
  coordinator.setContext({ accountId: "user-1", docId: "cv-1", blockedPromptOpen: false });
  assert.equal(coordinator.getSnapshot().transientRetryCount, 1);
  assert.equal(env.pendingTimerCount(), 1);

  await env.advanceBy(499);
  assert.equal(barriers.length, 1);
  await env.advanceBy(1);
  assert.equal(barriers.length, 2);

  // If retry #1 also fails 500, must settle honestly to "failed" with 0 extra retries
  barriers[1].resolve({ ok: false, status: 500, data: { message: "Still failing" } });
  await env.flushMicrotasks();
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(env.pendingTimerCount(), 0);
  assert.equal(failures.length, 1);

  // Scenario B: 500 arrives WHILE blockedPromptOpen is already true -> waits quietly -> resumes on Hủy bỏ and succeeds
  coordinator.syncDraft(makeDraft({ fullName: "Edit 2" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(barriers.length, 3);

  coordinator.setContext({ accountId: "user-1", docId: "cv-1", blockedPromptOpen: true });
  barriers[2].resolve({ ok: false, status: 500, data: { message: "Paused 500" } });
  await env.flushMicrotasks();
  assert.equal(coordinator.getSnapshot().status, "retrying");
  assert.equal(env.pendingTimerCount(), 0);

  await env.advanceBy(TRANSIENT_RETRY_DELAY_MS * 3);
  assert.equal(barriers.length, 3);

  coordinator.setContext({ accountId: "user-1", docId: "cv-1", blockedPromptOpen: false });
  await env.advanceBy(0);
  assert.equal(barriers.length, 4);
  barriers[3].resolve({ ok: true, status: 200, data: { resume: { _id: "cv-1", fullName: "Edit 2" } } });
  await env.flushMicrotasks();
  assert.equal(coordinator.getSnapshot().status, "saved");
  assert.equal(committed.length, 1);

  // Scenario C: aiFilling pause transitions to failed honestly if offline when unpaused
  coordinator.syncDraft(makeDraft({ fullName: "Edit 3" }));
  await env.advanceBy(AUTOSAVE_IDLE_DELAY_MS);
  assert.equal(barriers.length, 5);
  coordinator.setContext({ accountId: "user-1", docId: "cv-1", aiFilling: true });
  barriers[4].resolve({ ok: false, status: 500, data: { message: "500 during AI" } });
  await env.flushMicrotasks();
  assert.equal(coordinator.getSnapshot().status, "retrying");

  env.setOnline(false);
  coordinator.setContext({ accountId: "user-1", docId: "cv-1", aiFilling: false });
  assert.equal(coordinator.getSnapshot().status, "failed");
  assert.equal(coordinator.getSnapshot().lastError.kind, "offline");
  assert.equal(env.pendingTimerCount(), 0);

  // Scenario D: Confirmed departure (cancelPendingWork) never leaves retrying and never resurrects timers
  env.setOnline(true);
  coordinator.handleOnline();
  await env.flushMicrotasks();
  assert.equal(barriers.length, 6);
  barriers[5].resolve({ ok: false, status: 500, data: { message: "500 before cancel" } });
  await env.flushMicrotasks();
  assert.equal(coordinator.getSnapshot().status, "retrying");
  assert.equal(env.pendingTimerCount(), 1);

  coordinator.cancelPendingWork();
  assert.notEqual(coordinator.getSnapshot().status, "retrying");
  assert.equal(env.pendingTimerCount(), 0);
  coordinator.setContext({ accountId: "user-1", docId: "cv-1", blockedPromptOpen: false });
  await env.advanceBy(TRANSIENT_RETRY_DELAY_MS * 2);
  assert.equal(barriers.length, 6);

  coordinator.dispose();
});
