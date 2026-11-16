import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import Application from "../server/models/Application.js";
import {
  updateApplicationStatus,
  ApplicationStatusLockedError,
  ApplicationStatusTransitionError,
  createCompanyApplicationsHandler,
  createMyApplicationsHandler,
  createUpdateApplicationStatusHandler,
} from "../server/services/applicationStatusService.js";
import {
  createApplyFileJobHandler,
  createApplyJobHandler,
} from "../server/services/applicationSubmissionService.js";
import {
  APPLICATION_STATUSES,
  getAllowedNextApplicationStatuses,
  getAllowedPreviousStatuses,
  isAllowedApplicationStatusTransition,
} from "../shared/applicationStatusPolicy.js";
import {
  buildApplicationTimeline,
  getApplicationStatusMeta,
  mergeUpdatedApplicationRecord,
} from "../src/utils/applicationStatus.js";

const matchesStatusFilter = (actualStatus, statusFilter) => {
  if (typeof statusFilter === "string") {
    return actualStatus === statusFilter;
  }
  if (Array.isArray(statusFilter?.$in)) {
    return statusFilter.$in.includes(actualStatus);
  }
  return false;
};

const cloneRecord = (record) => ({
  ...record,
  statusHistory: Array.isArray(record.statusHistory)
    ? record.statusHistory.map((item) => ({ ...item }))
    : record.statusHistory,
  resumeSnapshot: record.resumeSnapshot
    ? structuredClone(record.resumeSnapshot)
    : record.resumeSnapshot,
  jobSnapshot: record.jobSnapshot ? { ...record.jobSnapshot } : record.jobSnapshot,
});

const makeModel = (initialStatus = "Pending", hooks = {}) => {
  const initialCreatedAt = hooks.createdAt || new Date("2026-10-01T08:00:00.000Z");
  const initialHistory = Object.prototype.hasOwnProperty.call(hooks, "statusHistory")
    ? hooks.statusHistory
    : [{ status: initialStatus, timestamp: initialCreatedAt }];

  const state = {
    _id: "app",
    jobId: "job-1",
    candidateId: "cand-1",
    status: initialStatus,
    createdAt: initialCreatedAt,
    updatedAt: hooks.updatedAt || initialCreatedAt,
    statusHistory: Array.isArray(initialHistory)
      ? initialHistory.map((item) => ({ ...item }))
      : undefined,
    resumeSnapshot: hooks.resumeSnapshot ?? { title: "CV Chinh", template: "classic" },
    resumeSnapshotCapturedAt: hooks.resumeSnapshotCapturedAt ?? initialCreatedAt,
    resumeSnapshotOrigin: hooks.resumeSnapshotOrigin ?? "submitted",
    jobSnapshot: hooks.jobSnapshot ?? { title: "Frontend Dev", company: "Cong ty A" },
  };
  return {
    getStatus: () => state.status,
    getState: () => cloneRecord(state),
    setStatus: (nextStatus) => {
      state.status = nextStatus;
    },
    async findById(id) {
      if (typeof hooks.onFindById === "function") {
        await hooks.onFindById(id, state);
      }
      return id === state._id ? cloneRecord(state) : null;
    },
    async findOneAndUpdate(filter, update, options) {
      if (typeof hooks.onBeforeUpdate === "function") {
        await hooks.onBeforeUpdate(filter, update, state);
      }
      assert.equal(filter._id, state._id);
      assert.deepEqual(options, { returnDocument: "after", runValidators: true });
      if (!matchesStatusFilter(state.status, filter.status)) {
        return null;
      }
      if (update?.$set && Object.prototype.hasOwnProperty.call(update.$set, "status")) {
        state.status = update.$set.status;
      }
      if (update?.$push?.statusHistory) {
        const entry = { ...update.$push.statusHistory };
        if (!Array.isArray(state.statusHistory)) {
          state.statusHistory = [];
        }
        state.statusHistory.push(entry);
      }
      state.updatedAt = new Date();
      return cloneRecord(state);
    },
  };
};

test("application status policy enforces step-by-step progression and rejection from active states", () => {
  assert.deepEqual(getAllowedNextApplicationStatuses("Pending"), ["Reviewing", "Rejected"]);
  assert.deepEqual(getAllowedNextApplicationStatuses("Reviewing"), ["Interview", "Rejected"]);
  assert.deepEqual(getAllowedNextApplicationStatuses("Interview"), ["Offered", "Rejected"]);
  assert.deepEqual(getAllowedNextApplicationStatuses("Offered"), ["Accepted", "Rejected"]);
  assert.deepEqual(getAllowedNextApplicationStatuses("Accepted"), ["Rejected"]);
  assert.deepEqual(getAllowedNextApplicationStatuses("Rejected"), []);

  assert.equal(isAllowedApplicationStatusTransition("Pending", "Reviewing"), true);
  assert.equal(isAllowedApplicationStatusTransition("Pending", "Interview"), false);
  assert.equal(isAllowedApplicationStatusTransition("Reviewing", "Pending"), false);
  assert.equal(isAllowedApplicationStatusTransition("Offered", "Accepted"), true);
  assert.deepEqual(getAllowedPreviousStatuses("Interview"), ["Reviewing"]);
});

test("an active application can advance step-by-step then be rejected", async () => {
  const model = makeModel();
  assert.equal((await updateApplicationStatus(model, "app", "Reviewing")).status, "Reviewing");
  assert.equal((await updateApplicationStatus(model, "app", "Interview")).status, "Interview");
  assert.equal((await updateApplicationStatus(model, "app", "Offered")).status, "Offered");
  assert.equal((await updateApplicationStatus(model, "app", "Accepted")).status, "Accepted");
  assert.equal((await updateApplicationStatus(model, "app", "Rejected")).status, "Rejected");
});

test("skipping steps or moving backwards throws ApplicationStatusTransitionError", async () => {
  const model = makeModel("Pending");
  await assert.rejects(
    updateApplicationStatus(model, "app", "Interview"),
    (error) => error instanceof ApplicationStatusTransitionError && error.code === "INVALID_APPLICATION_STATUS_TRANSITION",
  );
  await assert.rejects(
    updateApplicationStatus(model, "app", "Offered"),
    { code: "INVALID_APPLICATION_STATUS_TRANSITION" },
  );

  await updateApplicationStatus(model, "app", "Reviewing");
  await assert.rejects(
    updateApplicationStatus(model, "app", "Pending"),
    { code: "INVALID_APPLICATION_STATUS_TRANSITION" },
  );
  await assert.rejects(
    updateApplicationStatus(model, "app", "Accepted"),
    { code: "INVALID_APPLICATION_STATUS_TRANSITION" },
  );
});

test("idempotent same-status update succeeds without marking statusChanged true", async () => {
  const model = makeModel("Reviewing");
  const result = await updateApplicationStatus(model, "app", "Reviewing");
  assert.equal(result.status, "Reviewing");
  assert.equal(result.statusChanged, false);
});

test("observed snapshot is validated and used as exact CAS source before write", async () => {
  let writeAttempts = 0;
  const model = makeModel("Reviewing", {
    onBeforeUpdate: () => {
      writeAttempts += 1;
    },
  });

  // Illegal from observed Pending snapshot even though DB already moved to Reviewing
  await assert.rejects(
    updateApplicationStatus(model, "app", "Interview", { _id: "app", status: "Pending" }),
    (error) =>
      error instanceof ApplicationStatusTransitionError &&
      error.code === "INVALID_APPLICATION_STATUS_TRANSITION" &&
      error.fromStatus === "Pending" &&
      error.toStatus === "Interview",
  );
  assert.equal(writeAttempts, 0);
  assert.equal(model.getStatus(), "Reviewing");

  // Stale-valid-source write: Rejected is valid from Pending and from Reviewing, but CAS on stale Pending must fail
  await assert.rejects(
    updateApplicationStatus(model, "app", "Rejected", { _id: "app", status: "Pending" }),
    (error) =>
      error instanceof ApplicationStatusTransitionError &&
      error.code === "INVALID_APPLICATION_STATUS_TRANSITION" &&
      error.fromStatus === "Reviewing" &&
      error.toStatus === "Rejected",
  );
  assert.equal(writeAttempts, 1);
  assert.equal(model.getStatus(), "Reviewing");
});

test("deterministic interleaving rejects stale-valid-source and illegal-from-observed-source writes and deduplicates same-target notifications", async (t) => {
  let activeBarrier = null;
  const model = makeModel("Pending", {
    onBeforeUpdate: async (filter, update) => {
      if (activeBarrier) {
        await activeBarrier(filter, update);
      }
    },
  });

  const notifications = [];
  const handler = createUpdateApplicationStatusHandler({
    Application: model,
    Job: {
      findById: async (id) => (id === "job-1" ? { _id: "job-1", title: "Frontend Developer", companyId: "company-1" } : null),
    },
    User: {
      findById: async (id) => (id === "admin-1" ? { _id: "admin-1", role: "admin" } : { _id: id, role: "company" }),
    },
    createNotification: async (payload) => {
      notifications.push(payload);
    },
  });

  const app = express();
  app.use(express.json());
  app.put("/api/jobs/applications/:id", (req, _res, next) => {
    req.user = { id: req.get("x-user"), role: req.get("x-role") };
    next();
  }, handler);

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/jobs/applications/app`;

  const putStatus = (status, user = "company-1", role = "company") =>
    fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-user": user, "x-role": role },
      body: JSON.stringify({ status }),
    });

  // 1. Deterministic interleaving: two concurrent Pending -> Reviewing requests both read Pending before either writes
  let enteredCount = 0;
  let releaseBoth;
  const bothReady = new Promise((resolve) => {
    releaseBoth = resolve;
  });
  activeBarrier = async () => {
    enteredCount += 1;
    if (enteredCount === 2) {
      releaseBoth();
    }
    await bothReady;
  };

  const [sameTargetRes1, sameTargetRes2] = await Promise.all([
    putStatus("Reviewing"),
    putStatus("Reviewing"),
  ]);
  activeBarrier = null;

  assert.equal(sameTargetRes1.status, 200);
  assert.equal(sameTargetRes2.status, 200);
  assert.equal(model.getStatus(), "Reviewing");
  assert.equal(notifications.length, 1);

  // 2. Deterministic interleaving: Req A (Reviewing -> Interview) and Req B (Reviewing -> Rejected) both read Reviewing;
  // Req A commits Interview first, then Req B attempts CAS with stale Reviewing snapshot -> must 409 conflict
  enteredCount = 0;
  let releaseReqB;
  const reqBGate = new Promise((resolve) => {
    releaseReqB = resolve;
  });
  activeBarrier = async (_filter, update) => {
    if (update.$set.status === "Rejected") {
      await reqBGate;
    }
  };

  const reqBPromise = putStatus("Rejected");
  const reqARes = await putStatus("Interview");
  releaseReqB();
  const reqBRes = await reqBPromise;
  activeBarrier = null;

  assert.equal(reqARes.status, 200);
  assert.equal(reqBRes.status, 409);
  assert.equal((await reqBRes.json()).code, "INVALID_APPLICATION_STATUS_TRANSITION");
  assert.equal(model.getStatus(), "Interview");
  assert.equal(notifications.length, 2);

  // 3. Admin can advance Interview -> Offered -> Accepted
  const adminOfferedRes = await putStatus("Offered", "admin-1", "admin");
  assert.equal(adminOfferedRes.status, 200);
  const companyAcceptedRes = await putStatus("Accepted", "company-1", "company");
  assert.equal(companyAcceptedRes.status, 200);
  assert.equal(model.getStatus(), "Accepted");
  assert.equal(notifications.length, 4);
});

test("all writes after rejection are blocked, including concurrent requests", async () => {
  let entered = 0;
  let releaseAll;
  const gate = new Promise((resolve) => {
    releaseAll = resolve;
  });
  const model = makeModel("Reviewing", {
    onBeforeUpdate: async () => {
      entered += 1;
      if (entered === 2) {
        releaseAll();
      }
      await gate;
    },
  });

  const results = await Promise.allSettled([
    updateApplicationStatus(model, "app", "Rejected"),
    updateApplicationStatus(model, "app", "Interview"),
  ]);
  assert.equal(results[0].status, "fulfilled");
  assert.ok(results[1].reason instanceof ApplicationStatusLockedError);
  assert.equal(model.getStatus(), "Rejected");
  for (const status of APPLICATION_STATUSES) {
    await assert.rejects(updateApplicationStatus(model, "app", status), { code: "APPLICATION_STATUS_LOCKED" });
  }
});

test("PUT /api/jobs/applications/:id enforces ownership, transitions, idempotent no-notification, and 409 conflicts", async (t) => {
  const model = makeModel("Pending");
  const notifications = [];
  const handler = createUpdateApplicationStatusHandler({
    Application: model,
    Job: {
      findById: async (id) => (id === "job-1" ? { _id: "job-1", title: "Frontend Developer", companyId: "company-1" } : null),
    },
    User: {
      findById: async (id) => (id === "admin-1" ? { _id: "admin-1", role: "admin" } : { _id: id, role: "company" }),
    },
    createNotification: async (payload) => {
      notifications.push(payload);
    },
  });

  const app = express();
  app.use(express.json());
  app.put("/api/jobs/applications/:id", (req, _res, next) => {
    req.user = { id: req.get("x-user"), role: req.get("x-role") };
    next();
  }, handler);

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/jobs/applications/app`;

  // Other company is forbidden
  const forbiddenRes = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-user": "company-2", "x-role": "company" },
    body: JSON.stringify({ status: "Reviewing" }),
  });
  assert.equal(forbiddenRes.status, 403);

  // Illegal skip Pending -> Interview returns 409
  const skipRes = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-user": "company-1", "x-role": "company" },
    body: JSON.stringify({ status: "Interview" }),
  });
  assert.equal(skipRes.status, 409);
  assert.equal((await skipRes.json()).code, "INVALID_APPLICATION_STATUS_TRANSITION");
  assert.equal(notifications.length, 0);

  // Legal step Pending -> Reviewing returns 200 and sends 1 notification
  const step1Res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-user": "company-1", "x-role": "company" },
    body: JSON.stringify({ status: "Reviewing" }),
  });
  assert.equal(step1Res.status, 200);
  assert.equal((await step1Res.json()).application.status, "Reviewing");
  assert.equal(notifications.length, 1);

  // Idempotent repeat Reviewing -> Reviewing returns 200 without duplicate notification
  const repeatRes = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-user": "company-1", "x-role": "company" },
    body: JSON.stringify({ status: "Reviewing" }),
  });
  assert.equal(repeatRes.status, 200);
  assert.equal(notifications.length, 1);

  // Rejecting locks further updates with 409 APPLICATION_STATUS_LOCKED
  const rejectRes = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-user": "company-1", "x-role": "company" },
    body: JSON.stringify({ status: "Rejected" }),
  });
  assert.equal(rejectRes.status, 200);
  assert.equal(notifications.length, 2);

  const lockedRes = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-user": "company-1", "x-role": "company" },
    body: JSON.stringify({ status: "Interview" }),
  });
  assert.equal(lockedRes.status, 409);
  assert.equal((await lockedRes.json()).code, "APPLICATION_STATUS_LOCKED");
});

test("Application schema enforces PII-free statusHistory and omits resumeSnapshot on toJSON", () => {
  const historySchema = Application.schema.path("statusHistory")?.schema;
  assert.ok(historySchema, "statusHistory subdocument schema must exist");
  assert.deepEqual(Object.keys(historySchema.paths).sort(), ["status", "timestamp"]);

  const doc = new Application({
    jobId: "65a100000000000000000001",
    candidateId: "65a100000000000000000002",
    resumeId: "65a100000000000000000003",
    resumeSnapshot: { title: "Secret Snapshot", template: "classic" },
    fullName: "Nguyen Van A",
    email: "a@example.com",
    status: "Pending",
    statusHistory: [{ status: "Pending", timestamp: new Date("2026-10-01T08:00:00.000Z") }],
    jobSnapshot: { title: "Backend Engineer", company: "Acme" },
  });

  const json = doc.toJSON();
  assert.equal("resumeSnapshot" in json, false);
  assert.equal(json.statusHistory.length, 1);
  assert.equal(json.statusHistory[0].status, "Pending");
  assert.deepEqual(Object.keys(json.statusHistory[0]).sort(), ["status", "timestamp"]);
});

test("atomic transitions push one milestone per valid step and never duplicate or fabricate on idempotent, 409, or race", async () => {
  const initialCreatedAt = new Date("2026-10-01T08:00:00.000Z");
  const snapshotBefore = {
    resumeSnapshot: { title: "CV Chinh", template: "modern", summary: "Fullstack" },
    resumeSnapshotCapturedAt: new Date("2026-10-01T08:00:00.000Z"),
    resumeSnapshotOrigin: "submitted",
    jobSnapshot: { title: "React Dev", company: "TechCorp" },
  };
  const model = makeModel("Pending", { createdAt: initialCreatedAt, ...snapshotBefore });

  await updateApplicationStatus(model, "app", "Reviewing");
  await updateApplicationStatus(model, "app", "Reviewing"); // idempotent repeat -> no duplicate
  await assert.rejects(
    updateApplicationStatus(model, "app", "Offered"), // illegal skip
    (err) => err instanceof ApplicationStatusTransitionError,
  );
  await updateApplicationStatus(model, "app", "Interview");
  await updateApplicationStatus(model, "app", "Offered");
  await updateApplicationStatus(model, "app", "Accepted");
  await updateApplicationStatus(model, "app", "Rejected");
  await assert.rejects(
    updateApplicationStatus(model, "app", "Interview"), // locked
    (err) => err instanceof ApplicationStatusLockedError,
  );

  const finalState = model.getState();
  assert.deepEqual(
    finalState.statusHistory.map((item) => item.status),
    ["Pending", "Reviewing", "Interview", "Offered", "Accepted", "Rejected"],
  );
  for (const item of finalState.statusHistory) {
    assert.deepEqual(Object.keys(item).sort(), ["status", "timestamp"]);
    assert.equal(item.timestamp instanceof Date && !Number.isNaN(item.timestamp.getTime()), true);
  }
  assert.deepEqual(finalState.resumeSnapshot, snapshotBefore.resumeSnapshot);
  assert.equal(finalState.resumeSnapshotCapturedAt.getTime(), snapshotBefore.resumeSnapshotCapturedAt.getTime());
  assert.equal(finalState.resumeSnapshotOrigin, snapshotBefore.resumeSnapshotOrigin);
  assert.deepEqual(finalState.jobSnapshot, snapshotBefore.jobSnapshot);
  assert.equal(finalState.createdAt.getTime(), initialCreatedAt.getTime());

  // Concurrent same-target race pushes only one Reviewing entry
  let casInterleaved = false;
  const raceModel = makeModel("Pending", {
    onBeforeUpdate: async (_filter, _update, state) => {
      if (!casInterleaved) {
        casInterleaved = true;
        state.status = "Reviewing";
        state.statusHistory.push({ status: "Reviewing", timestamp: new Date("2026-10-01T09:00:00.000Z") });
      }
    },
  });
  const raceResult = await updateApplicationStatus(raceModel, "app", "Reviewing");
  assert.equal(raceResult.statusChanged, false);
  assert.equal(raceModel.getState().statusHistory.filter((item) => item.status === "Reviewing").length, 1);
});

test("POST /api/jobs/apply and /api/jobs/apply-file initialize statusHistory with [Pending @ createdAt] without PII", async () => {
  const savedApps = [];
  class MockApplication extends Application {
    async save() {
      savedApps.push(this);
      return this;
    }
  }
  MockApplication.findOne = async () => null;

  class MockResume {
    constructor(data) {
      Object.assign(this, data, { _id: "65a100000000000000000099" });
    }
    async save() {
      return this;
    }
  }
  MockResume.findOne = async ({ _id, userId }) => ({
    _id,
    userId,
    title: "CV Chinh",
    template: "classic",
    personalInfo: { fullName: "Candidate One", email: "cand@example.com", phone: "0901234567" },
    toObject() {
      return { ...this };
    },
  });
  MockResume.deleteOne = async () => {};

  const jobDoc = {
    _id: "65a100000000000000000010",
    title: "Fullstack Engineer",
    company: "RabbitTech",
    location: "HCM",
    type: "Full-time",
    salary: "2000",
    companyId: "65a100000000000000000020",
    status: "Active",
    approvalStatus: "Approved",
  };
  const userDoc = {
    _id: "65a100000000000000000030",
    fullName: "Candidate One",
    username: "cand1",
    email: "cand@example.com",
    phoneNumber: "0901234567",
  };

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: userDoc._id, role: "employee" };
    next();
  });
  app.post(
    "/api/jobs/apply",
    createApplyJobHandler({
      Application: MockApplication,
      Resume: MockResume,
      Job: { findById: async () => jobDoc },
      User: { findById: async () => userDoc },
      createNotificationsBulk: async () => {},
    }),
  );
  app.post(
    "/api/jobs/apply-file",
    createApplyFileJobHandler({
      Application: MockApplication,
      Resume: MockResume,
      Job: { findById: async () => jobDoc },
      User: { findById: async () => userDoc },
      createNotificationsBulk: async () => {},
    }),
  );

  const server = app.listen(0);
  const { port } = server.address();
  try {
    const applyRes = await fetch(`http://127.0.0.1:${port}/api/jobs/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: jobDoc._id,
        resumeId: "65a100000000000000000040",
        coverLetter: "Xin chao",
      }),
    });
    assert.equal(applyRes.status, 201);
    const applyBody = await applyRes.json();
    assert.equal(applyBody.application.status, "Pending");
    assert.equal("resumeSnapshot" in applyBody.application, false);
    assert.equal(applyBody.application.statusHistory.length, 1);
    assert.deepEqual(Object.keys(applyBody.application.statusHistory[0]).sort(), ["status", "timestamp"]);
    assert.equal(applyBody.application.statusHistory[0].status, "Pending");
    assert.equal(applyBody.application.statusHistory[0].timestamp, applyBody.application.createdAt);

    const pdfData = `data:application/pdf;base64,${Buffer.from("%PDF-1.4\n%%EOF\n").toString("base64")}`;
    const fileRes = await fetch(`http://127.0.0.1:${port}/api/jobs/apply-file`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: jobDoc._id,
        fileData: pdfData,
        fileName: "candidate-cv.pdf",
        coverLetter: "Kem PDF",
      }),
    });
    assert.equal(fileRes.status, 201);
    const fileBody = await fileRes.json();
    assert.equal(fileBody.application.statusHistory.length, 1);
    assert.equal(fileBody.application.statusHistory[0].status, "Pending");
    assert.equal(fileBody.application.statusHistory[0].timestamp, fileBody.application.createdAt);
    assert.equal(savedApps.length, 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("HTTP GET /api/jobs/applications, /mine and PUT /:id preserve scoping, populate, omit resumeSnapshot, and track statusHistory", async () => {
  const jobs = [
    { _id: "job-c1", companyId: "company-1", title: "Frontend Dev", company: "Acme", status: "Approved" },
    { _id: "job-c2", companyId: "company-2", title: "Data Engineer", company: "Beta", status: "Approved" },
  ];
  const docs = [
    {
      _id: "app-new",
      jobId: "job-c1",
      candidateId: "cand-1",
      fullName: "Ung vien 1",
      email: "u1@example.com",
      status: "Pending",
      statusHistory: [{ status: "Pending", timestamp: "2026-10-05T09:00:00.000Z" }],
      createdAt: "2026-10-05T09:00:00.000Z",
      updatedAt: "2026-10-05T09:00:00.000Z",
      jobSnapshot: { title: "Frontend Dev", company: "Acme" },
      resumeSnapshot: { title: "Private Snapshot" },
    },
    {
      _id: "app-legacy",
      jobId: "job-deleted",
      candidateId: "cand-1",
      fullName: "Ung vien 1",
      email: "u1@example.com",
      status: "Interview",
      createdAt: "2026-09-01T09:00:00.000Z",
      updatedAt: "2026-09-10T10:30:00.000Z",
      jobSnapshot: { title: "Legacy Job", company: "Old Co" },
      resumeSnapshot: { title: "Legacy Snapshot" },
    },
    {
      _id: "app-other",
      jobId: "job-c2",
      candidateId: "cand-2",
      fullName: "Ung vien 2",
      email: "u2@example.com",
      status: "Pending",
      statusHistory: [{ status: "Pending", timestamp: "2026-10-06T09:00:00.000Z" }],
      createdAt: "2026-10-06T09:00:00.000Z",
      updatedAt: "2026-10-06T09:00:00.000Z",
      jobSnapshot: { title: "Data Engineer", company: "Beta" },
    },
  ];

  const sanitizeForList = (doc) => {
    const copy = cloneRecord(doc);
    delete copy.resumeSnapshot;
    const job = jobs.find((item) => item._id === doc.jobId) || null;
    copy.jobId = job ? { _id: job._id, title: job.title, company: job.company, status: job.status } : null;
    return copy;
  };

  const ApplicationStub = {
    find(query) {
      const matched = docs.filter((doc) => {
        if (query.candidateId && doc.candidateId !== query.candidateId) return false;
        if (query.jobId?.$in && !query.jobId.$in.includes(doc.jobId)) return false;
        return true;
      });
      return {
        populate() {
          return this;
        },
        async sort() {
          return matched.map(sanitizeForList);
        },
      };
    },
    async findById(id) {
      const found = docs.find((item) => item._id === id);
      return found ? cloneRecord(found) : null;
    },
    async findOneAndUpdate(filter, update) {
      const found = docs.find(
        (item) => item._id === filter._id && matchesStatusFilter(item.status, filter.status),
      );
      if (!found) return null;
      if (update?.$set?.status) {
        found.status = update.$set.status;
      }
      if (update?.$push?.statusHistory) {
        if (!Array.isArray(found.statusHistory)) found.statusHistory = [];
        found.statusHistory.push({ ...update.$push.statusHistory });
      }
      found.updatedAt = new Date().toISOString();
      const serialized = cloneRecord(found);
      delete serialized.resumeSnapshot;
      return serialized;
    },
  };

  const JobStub = {
    async find(query) {
      return jobs.filter((job) => job.companyId === query.companyId);
    },
    async findById(id) {
      return jobs.find((job) => job._id === id) || null;
    },
  };

  const UserStub = {
    async findById(id) {
      return { _id: id, role: id.startsWith("company") ? "company" : "employee" };
    },
  };

  const serverApp = express();
  serverApp.use(express.json());
  serverApp.use((req, _res, next) => {
    const uid = req.headers["x-user"];
    if (uid) req.user = { id: uid, role: req.headers["x-role"] || "employee" };
    next();
  });
  serverApp.get("/api/jobs/applications", createCompanyApplicationsHandler({ Application: ApplicationStub, Job: JobStub }));
  serverApp.get("/api/jobs/applications/mine", createMyApplicationsHandler({ Application: ApplicationStub }));
  serverApp.put(
    "/api/jobs/applications/:id",
    createUpdateApplicationStatusHandler({
      Application: ApplicationStub,
      Job: JobStub,
      User: UserStub,
      createNotification: async () => {},
    }),
  );

  const server = serverApp.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    // Unauthenticated rejected
    assert.equal((await fetch(`${baseUrl}/api/jobs/applications`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/jobs/applications/mine`)).status, 401);

    // Company scoping
    const compRes = await fetch(`${baseUrl}/api/jobs/applications`, { headers: { "x-user": "company-1" } });
    assert.equal(compRes.status, 200);
    const compList = await compRes.json();
    assert.equal(compList.length, 1);
    assert.equal(compList[0]._id, "app-new");
    assert.equal(compList[0].jobId.title, "Frontend Dev");
    assert.equal("resumeSnapshot" in compList[0], false);

    // Wrong company PUT 403 does not mutate statusHistory
    const forbiddenRes = await fetch(`${baseUrl}/api/jobs/applications/app-new`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-user": "company-2" },
      body: JSON.stringify({ status: "Reviewing" }),
    });
    assert.equal(forbiddenRes.status, 403);
    assert.equal(docs[0].statusHistory.length, 1);

    // Invalid status 400 and missing 404 do not mutate
    const badRes = await fetch(`${baseUrl}/api/jobs/applications/app-new`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-user": "company-1" },
      body: JSON.stringify({ status: "Bogus" }),
    });
    assert.equal(badRes.status, 400);
    const missingRes = await fetch(`${baseUrl}/api/jobs/applications/nonexistent`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-user": "company-1" },
      body: JSON.stringify({ status: "Reviewing" }),
    });
    assert.equal(missingRes.status, 404);
    assert.equal(docs[0].statusHistory.length, 1);

    // Valid PUT advances Pending -> Reviewing -> Rejected
    const step1 = await fetch(`${baseUrl}/api/jobs/applications/app-new`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-user": "company-1" },
      body: JSON.stringify({ status: "Reviewing" }),
    });
    assert.equal(step1.status, 200);
    const step1Body = await step1.json();
    assert.deepEqual(
      step1Body.application.statusHistory.map((e) => e.status),
      ["Pending", "Reviewing"],
    );

    const rejectRes = await fetch(`${baseUrl}/api/jobs/applications/app-new`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-user": "company-1" },
      body: JSON.stringify({ status: "Rejected" }),
    });
    assert.equal(rejectRes.status, 200);
    const rejectBody = await rejectRes.json();
    assert.deepEqual(
      rejectBody.application.statusHistory.map((e) => e.status),
      ["Pending", "Reviewing", "Rejected"],
    );

    // Candidate scoping + legacy/new mix
    const mineRes = await fetch(`${baseUrl}/api/jobs/applications/mine`, { headers: { "x-user": "cand-1" } });
    assert.equal(mineRes.status, 200);
    const mineList = await mineRes.json();
    assert.deepEqual(mineList.map((a) => a._id), ["app-new", "app-legacy"]);
    assert.equal(mineList[0].statusHistory.length, 3);
    assert.equal(mineList[1].statusHistory, undefined);
    assert.equal(mineList[1].jobId, null);
    assert.equal(mineList[1].jobSnapshot.title, "Legacy Job");
    assert.equal("resumeSnapshot" in mineList[0], false);
    assert.equal("resumeSnapshot" in mineList[1], false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("buildApplicationTimeline and mergeUpdatedApplicationRecord handle recorded history, early reject, legacy fallback, and unknown states honestly", () => {
  // Full history + early reject without inferred Interview
  const earlyRejectTimeline = buildApplicationTimeline({
    status: "Rejected",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-02T10:00:00.000Z",
    statusHistory: [
      { status: "Pending", timestamp: "2026-10-01T08:00:00.000Z" },
      { status: "Reviewing", timestamp: "2026-10-01T12:00:00.000Z" },
      { status: "Rejected", timestamp: "2026-10-02T10:00:00.000Z" },
    ],
  });
  assert.deepEqual(
    earlyRejectTimeline.milestones.map((m) => m.status),
    ["Pending", "Reviewing", "Rejected"],
  );
  assert.equal(earlyRejectTimeline.isLegacyPartialHistory, false);
  assert.equal(earlyRejectTimeline.milestones[2].isCurrent, true);

  // Legacy record without statusHistory never copies updatedAt onto step timestamp or infers Reviewing
  const legacyTimeline = buildApplicationTimeline({
    status: "Interview",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-10T11:00:00.000Z",
  });
  assert.deepEqual(
    legacyTimeline.milestones.map((m) => ({
      status: m.status,
      timestampKnown: m.timestampKnown,
      timestamp: m.timestamp ? m.timestamp.toISOString() : null,
      isCurrent: m.isCurrent,
    })),
    [
      {
        status: "Pending",
        timestampKnown: true,
        timestamp: "2026-09-01T08:00:00.000Z",
        isCurrent: false,
      },
      {
        status: "Interview",
        timestampKnown: false,
        timestamp: null,
        isCurrent: true,
      },
    ],
  );
  assert.equal(legacyTimeline.lastUpdatedAt.toISOString(), "2026-09-10T11:00:00.000Z");
  assert.equal(legacyTimeline.isLegacyPartialHistory, true);

  // Missing timestamps & unknown status stay honest
  const unknownTimeline = buildApplicationTimeline({ status: "CustomLegacyState" });
  assert.equal(unknownTimeline.submittedAt, null);
  assert.equal(unknownTimeline.lastUpdatedAt, null);
  assert.equal(unknownTimeline.currentMeta.isKnown, false);
  assert.equal(unknownTimeline.currentMeta.label, "Không rõ (CustomLegacyState)");
  assert.equal(getApplicationStatusMeta(null).label, "Chưa rõ trạng thái");

  // CompanyDashboard merge helper preserves populated jobId when PUT returns unpopulated string id
  const existing = {
    _id: "app-1",
    status: "Pending",
    jobId: { _id: "job-1", title: "Backend Dev", company: "Acme", status: "Approved" },
    candidateId: "cand-1",
    jobSnapshot: { title: "Backend Dev", company: "Acme" },
    statusHistory: [{ status: "Pending", timestamp: "2026-10-01T08:00:00.000Z" }],
  };
  const merged = mergeUpdatedApplicationRecord(existing, {
    application: {
      _id: "app-1",
      jobId: "job-1",
      status: "Reviewing",
      statusHistory: [
        { status: "Pending", timestamp: "2026-10-01T08:00:00.000Z" },
        { status: "Reviewing", timestamp: "2026-10-02T09:00:00.000Z" },
      ],
      updatedAt: "2026-10-02T09:00:00.000Z",
    },
  });
  assert.equal(merged.status, "Reviewing");
  assert.deepEqual(merged.jobId, existing.jobId);
  assert.equal(merged.statusHistory.length, 2);
});
