import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import Resume from '../server/models/Resume.js';
import Application from '../server/models/Application.js';
import {
  captureApplicationResume, freezeLegacyResumeApplications,
  ensureApplicationResumeSnapshot, applicationResumeData, createApplicationResumeHandler,
} from '../server/services/applicationResumeService.js';
import {
  createApplyJobHandler,
  createApplyFileJobHandler,
  isDuplicateApplicationError,
} from '../server/services/applicationSubmissionService.js';

const id = () => new mongoose.Types.ObjectId();
const makeResume = () => new Resume({
  userId: id(), title: 'Submitted CV', selectedTemplate: 'elegant', image: 'original-image',
  personalInfo: { fullName: 'Candidate', email: 'candidate@example.test', jobTitle: 'Developer' },
  bio: '<p>Original introduction</p>',
  experience: [{ title: 'Original experience', description: '<p>Original work</p>' }],
  education: [{ title: 'Original education' }], skill: [{ title: 'React' }],
  profile: [{ networkName: 'GitHub', link: 'https://github.com/example' }],
  project: [{ title: 'Original project' }], certificate: [{ title: 'Original certificate' }],
  award: [{ title: 'Original award' }], hobby: [{ title: 'Reading' }], language: [{ title: 'Vietnamese' }],
  customSections: [{ id: 'custom', title: 'Volunteering', items: [{ id: 'entry', title: 'Mentor', details: [{ label: 'Hours', value: '40' }] }] }],
  layout: { customizedTemplates: ['elegant'], byTemplate: { elegant: { main: ['bio', 'education', 'custom:custom'], sidebar: ['skill'] } } },
});
const makeApplication = (resume, snapshot = true) => new Application({
  jobId: id(), candidateId: resume.userId, resumeId: resume._id,
  fullName: 'Candidate', email: 'candidate@example.test', createdAt: new Date('2026-10-01T00:00:00Z'),
  ...(snapshot ? captureApplicationResume(resume) : {}),
});
const selected = (result) => ({ select: () => Promise.resolve(result) });

test('submitted CV copies every content field, layout and template independently of the original', async () => {
  const resume = makeResume();
  const application = makeApplication(resume);
  await application.validate();
  const before = applicationResumeData(application);
  resume.title = 'Edited CV';
  resume.bio = 'Edited introduction';
  resume.image = 'edited-image';
  resume.personalInfo.fullName = 'Edited name';
  resume.experience[0].title = 'Edited experience';
  resume.customSections[0].items[0].details[0].value = '100';
  resume.layout.byTemplate.elegant.main = ['skill'];
  resume.selectedTemplate = 'compact';
  assert.deepEqual(applicationResumeData(application), before);
  assert.equal(before.selectedTemplate, 'elegant');
  assert.equal(before.customSections[0].items[0].details[0].value, '40');
  assert.deepEqual(before.layout.byTemplate.elegant.main, ['bio', 'education', 'custom:custom']);
  assert.equal(application.resumeSnapshot.userId, undefined);
  assert.equal(application.resumeSnapshot._id, undefined);
  assert.equal(application.resumeSnapshotOrigin, 'submitted');
});

test('two applications using one CV retain distinct versions and do not read a deleted original', async () => {
  const resume = makeResume();
  const first = makeApplication(resume);
  resume.bio = '<p>Second version</p>';
  const second = makeApplication(resume);
  const deletedResume = { findById() { throw new Error('must not read the live CV'); } };
  assert.equal(await ensureApplicationResumeSnapshot({}, deletedResume, first), first);
  assert.equal(await ensureApplicationResumeSnapshot({}, deletedResume, second), second);
  assert.equal(applicationResumeData(first).bio, '<p>Original introduction</p>');
  assert.equal(applicationResumeData(second).bio, '<p>Second version</p>');
});

test('PDF submission captures the file bytes and name and does not put CV payloads in application lists', async () => {
  const resume = makeResume();
  resume.isVirtual = true;
  resume.pdfData = 'data:application/pdf;base64,JVBERi0xLjQ=';
  resume.fileName = 'original.pdf';
  const application = makeApplication(resume);
  await application.validate();
  resume.pdfData = 'changed';
  resume.fileName = 'changed.pdf';
  const saved = Application.hydrate(application.toObject());
  assert.equal(applicationResumeData(saved).pdfData, 'data:application/pdf;base64,JVBERi0xLjQ=');
  assert.equal(applicationResumeData(saved).fileName, 'original.pdf');
  assert.equal(saved.toJSON().resumeSnapshot, undefined);
  assert.equal(Application.schema.path('resumeSnapshot').options.select, false);
});

test('legacy snapshots are captured only once without changing application submission or status timestamps', async () => {
  const resume = makeResume();
  const legacy = makeApplication(resume, false);
  const submittedAt = legacy.createdAt;
  const model = {
    findOneAndUpdate(filter, update, options) {
      assert.deepEqual(filter, { _id: legacy._id, resumeSnapshot: null });
      assert.equal(options.timestamps, false);
      assert.equal(options.returnDocument, 'after');
      legacy.set(update.$set);
      return selected(legacy);
    },
  };
  await ensureApplicationResumeSnapshot(model, { findById: async () => resume }, legacy);
  assert.equal(legacy.resumeSnapshotOrigin, 'legacy');
  assert.equal(legacy.createdAt, submittedAt);
  resume.bio = 'Changed';
  await ensureApplicationResumeSnapshot(model, { findById() { throw new Error('already frozen'); } }, legacy);
  assert.equal(legacy.resumeSnapshot.bio, '<p>Original introduction</p>');
  await freezeLegacyResumeApplications({ updateMany(filter, update, options) {
    assert.deepEqual(filter, { resumeId: resume._id, resumeSnapshot: null });
    assert.equal(update.$set.resumeSnapshotOrigin, 'legacy');
    assert.equal(options.timestamps, false);
  } }, resume);
});

test('concurrent legacy capture returns the winning copy instead of replacing it', async () => {
  const resume = makeResume();
  const legacy = makeApplication(resume, false);
  const winner = makeApplication(resume);
  const model = {
    findOneAndUpdate: () => selected(null),
    findById: () => selected(winner),
  };
  assert.equal(await ensureApplicationResumeSnapshot(model, { findById: async () => resume }, legacy), winner);
  assert.equal(await ensureApplicationResumeSnapshot(model, { findById: async () => null }, legacy), null);
});

test('application CV HTTP endpoint authorizes the exact job and serves snapshots even after source deletion', async (t) => {
  const resume = makeResume();
  const application = makeApplication(resume);
  const companyId = String(id());
  const handler = createApplicationResumeHandler({
    Application: { findById: (value) => selected(value === String(application._id) ? application : null) },
    Resume: { findById() { throw new Error('snapshot must not depend on original'); } },
    Job: { exists: async (query) => String(query._id) === String(application.jobId) && query.companyId === companyId },
    sanitizeResumeData: (value) => value,
  });
  const app = express();
  app.get('/:id', (req, res, next) => {
    req.user = { id: req.get('x-user'), role: req.get('x-role') };
    next();
  }, handler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/${application._id}`;
  for (const [userId, role, status] of [
    [companyId, 'company', 200], [String(resume.userId), 'employee', 200],
    ['admin', 'admin', 200], ['another-company', 'company', 403], ['another-candidate', 'employee', 403],
  ]) {
    const response = await fetch(url, { headers: { 'x-user': userId, 'x-role': role } });
    assert.equal(response.status, status);
    if (status === 200) {
      const body = await response.json();
      assert.equal(body.bio, '<p>Original introduction</p>');
      assert.equal(body.userId, String(resume.userId));
      assert.equal(body.applicationId, String(application._id));
    }
  }
  assert.equal((await fetch(url.replace(String(application._id), 'missing'), { headers: { 'x-user': companyId, 'x-role': 'company' } })).status, 404);
});

test('Application schema declares unique compound index and only one resumeId index', () => {
  const indexes = Application.schema.indexes();
  const resumeIdIndexes = indexes.filter(([fields]) => Object.keys(fields).length === 1 && fields.resumeId === 1);
  const jobCandidateIndexes = indexes.filter(([fields, opts]) => fields.jobId === 1 && fields.candidateId === 1 && opts?.unique === true);
  assert.equal(resumeIdIndexes.length, 1);
  assert.equal(jobCandidateIndexes.length, 1);
});

test('isDuplicateApplicationError is fail-closed and distinguishes exact { jobId, candidateId } duplicate keys from unknown or unrelated 11000 errors', () => {
  assert.equal(isDuplicateApplicationError({ code: 11000, keyPattern: { jobId: 1, candidateId: 1 } }), true);
  assert.equal(isDuplicateApplicationError({ code: 11000, keyValue: { jobId: 'j1', candidateId: 'c1' } }), true);
  assert.equal(isDuplicateApplicationError({ code: 11000, message: 'E11000 duplicate key error collection: da2.applications index: jobId_1_candidateId_1 dup key: { jobId: "j1", candidateId: "c1" }' }), true);
  assert.equal(isDuplicateApplicationError({ code: 11000 }), false);
  assert.equal(isDuplicateApplicationError({ code: 11000, keyPattern: {} }), false);
  assert.equal(isDuplicateApplicationError({ code: 11000, keyValue: {} }), false);
  assert.equal(isDuplicateApplicationError({ code: 11000, keyPattern: { email: 1 } }), false);
  assert.equal(isDuplicateApplicationError({ code: 11000, keyValue: { resumeId: 'r1' } }), false);
  assert.equal(isDuplicateApplicationError({ code: 11000, keyPattern: { jobId: 1, candidateId: 1, resumeId: 1 } }), false);
  assert.equal(isDuplicateApplicationError({ code: 11000, message: 'E11000 duplicate key error collection: applications index: custom_1 dup key: { note: "jobId and candidateId" }' }), false);
  assert.equal(isDuplicateApplicationError({ code: 500 }), false);
});

test('POST /api/jobs/apply and /api/jobs/apply-file enforce employee role, return 409 ALREADY_APPLIED on preflight/11000 race, and clean up virtualResume', async (t) => {
  const resume = makeResume();
  const candidateId = String(resume.userId);
  const jobId = String(id());
  const companyId = String(id());
  const validPdfData = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF', 'utf8').toString('base64')}`;

  let dbLookups = 0;
  let preflightDuplicate = false;
  let postSaveDuplicate = false;
  let applicationSaveError = null;
  let resumeSaveError = null;
  let findOneCallsForCurrentRequest = 0;
  const savedResumes = [];
  const deletedResumeIds = [];
  const savedApplications = [];
  const notifications = [];

  class MockResume extends Resume {
    async save() {
      if (resumeSaveError) throw resumeSaveError;
      savedResumes.push(this);
      return this;
    }
    static async findOne(query) {
      dbLookups += 1;
      if (String(query._id) === String(resume._id) && String(query.userId) === candidateId) {
        return resume;
      }
      return null;
    }
    static async deleteOne(query) {
      deletedResumeIds.push(String(query._id));
      return { deletedCount: 1 };
    }
  }

  class MockApplication extends Application {
    async save() {
      if (applicationSaveError) {
        throw applicationSaveError;
      }
      savedApplications.push(this);
      return this;
    }
    static async findOne() {
      dbLookups += 1;
      findOneCallsForCurrentRequest += 1;
      if (preflightDuplicate) {
        return { _id: id() };
      }
      if (postSaveDuplicate && findOneCallsForCurrentRequest > 1) {
        return { _id: id() };
      }
      return null;
    }
  }

  const dependencies = {
    Application: MockApplication,
    Resume: MockResume,
    Job: {
      findById: async (value) => {
        dbLookups += 1;
        return String(value) === jobId
          ? { _id: jobId, companyId, title: 'Backend Engineer', company: 'RabbitCV', location: 'Hà Nội', type: 'Full-time', salary: '30M', status: 'Active', approvalStatus: 'Approved' }
          : null;
      },
    },
    User: {
      findById: async (value) => {
        dbLookups += 1;
        return String(value) === candidateId
          ? { _id: candidateId, username: 'candidate', fullName: 'Nguyễn Văn A', email: 'candidate@example.test', phoneNumber: '0901234567', role: 'employee' }
          : null;
      },
    },
    createNotificationsBulk: async (items) => {
      notifications.push(...items);
    },
  };

  const app = express();
  app.use(express.json());
  const attachAuth = (req, _res, next) => {
    findOneCallsForCurrentRequest = 0;
    const userId = req.get('x-user');
    const role = req.get('x-role');
    if (userId) req.user = { id: userId, role };
    next();
  };
  app.post('/api/jobs/apply', attachAuth, createApplyJobHandler(dependencies));
  app.post('/api/jobs/apply-file', attachAuth, createApplyFileJobHandler(dependencies));

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  // 1. Unauthenticated guest -> 401
  const guestRes = await fetch(`${baseUrl}/api/jobs/apply`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jobId, resumeId: String(resume._id) }),
  });
  assert.equal(guestRes.status, 401);
  assert.equal(dbLookups, 0);

  // 2. Company & Admin roles -> 403 before any DB lookups or virtualResume save
  for (const role of ['company', 'admin']) {
    for (const [endpoint, payload] of [
      ['/api/jobs/apply', { jobId, resumeId: String(resume._id) }],
      ['/api/jobs/apply-file', { jobId, fileName: 'cv.pdf', fileData: validPdfData }],
    ]) {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user': 'non-employee', 'x-role': role },
        body: JSON.stringify(payload),
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.code, 'CANDIDATE_ROLE_REQUIRED');
    }
  }
  assert.equal(dbLookups, 0);
  assert.equal(savedResumes.length, 0);

  // 3. Employee happy path for /api/jobs/apply
  const applyRes = await fetch(`${baseUrl}/api/jobs/apply`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
    body: JSON.stringify({ jobId, resumeId: String(resume._id), coverLetter: 'Xin ứng tuyển' }),
  });
  assert.equal(applyRes.status, 201);
  assert.equal(savedApplications.length, 1);
  assert.equal(savedApplications[0].resumeSnapshotOrigin, 'submitted');
  assert.equal(savedApplications[0].jobSnapshot.title, 'Backend Engineer');

  // 4. Preflight duplicate -> 409 ALREADY_APPLIED
  preflightDuplicate = true;
  for (const [endpoint, payload] of [
    ['/api/jobs/apply', { jobId, resumeId: String(resume._id) }],
    ['/api/jobs/apply-file', { jobId, fileName: 'cv.pdf', fileData: validPdfData }],
  ]) {
    const dupRes = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
      body: JSON.stringify(payload),
    });
    assert.equal(dupRes.status, 409);
    assert.equal((await dupRes.json()).code, 'ALREADY_APPLIED');
  }
  preflightDuplicate = false;

  // 5. Concurrent Mongo 11000 race on Application.save() -> 409 ALREADY_APPLIED + virtualResume cleanup
  const raceErr = new Error('E11000 duplicate key error collection: applications index: jobId_1_candidateId_1');
  raceErr.code = 11000;
  raceErr.keyPattern = { jobId: 1, candidateId: 1 };
  applicationSaveError = raceErr;

  const raceApplyRes = await fetch(`${baseUrl}/api/jobs/apply`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
    body: JSON.stringify({ jobId, resumeId: String(resume._id) }),
  });
  assert.equal(raceApplyRes.status, 409);
  assert.equal((await raceApplyRes.json()).code, 'ALREADY_APPLIED');

  const raceFileRes = await fetch(`${baseUrl}/api/jobs/apply-file`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
    body: JSON.stringify({ jobId, fileName: 'cv.pdf', fileData: validPdfData }),
  });
  assert.equal(raceFileRes.status, 409);
  assert.equal((await raceFileRes.json()).code, 'ALREADY_APPLIED');
  assert.equal(savedResumes.length, 1);
  assert.equal(deletedResumeIds.length, 1);
  assert.equal(deletedResumeIds[0], String(savedResumes[0]._id));
  applicationSaveError = null;

  // 6. Unrelated or unknown 11000 on Application.save() is NOT misclassified as ALREADY_APPLIED, and cleans up virtualResume
  for (const errCase of [
    Object.assign(new Error('Unrelated index'), { code: 11000, keyPattern: { resumeId: 1 } }),
    Object.assign(new Error('E11000 duplicate key error collection: applications index: custom_1 dup key: { note: "jobId candidateId" }'), { code: 11000 }),
    Object.assign(new Error('Unknown 11000 without metadata'), { code: 11000, keyPattern: {} }),
  ]) {
    applicationSaveError = errCase;
    const errApplyRes = await fetch(`${baseUrl}/api/jobs/apply`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
      body: JSON.stringify({ jobId, resumeId: String(resume._id) }),
    });
    assert.equal(errApplyRes.status, 500);

    const prevSavedCount = savedResumes.length;
    const prevDeletedCount = deletedResumeIds.length;
    const errFileRes = await fetch(`${baseUrl}/api/jobs/apply-file`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
      body: JSON.stringify({ jobId, fileName: 'cv.pdf', fileData: validPdfData }),
    });
    assert.equal(errFileRes.status, 500);
    assert.equal(savedResumes.length, prevSavedCount + 1);
    assert.equal(deletedResumeIds.length, prevDeletedCount + 1);
    assert.equal(deletedResumeIds.at(-1), String(savedResumes.at(-1)._id));
  }
  applicationSaveError = null;

  // 7. Unknown 11000 confirmed by targeted requery on { jobId, candidateId } returns 409 ALREADY_APPLIED
  applicationSaveError = Object.assign(new Error('Write conflict 11000'), { code: 11000 });
  postSaveDuplicate = true;
  const confirmedRaceRes = await fetch(`${baseUrl}/api/jobs/apply`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
    body: JSON.stringify({ jobId, resumeId: String(resume._id) }),
  });
  assert.equal(confirmedRaceRes.status, 409);
  assert.equal((await confirmedRaceRes.json()).code, 'ALREADY_APPLIED');
  postSaveDuplicate = false;
  applicationSaveError = null;

  // 8. Unrelated 11000 on Resume.save() is not misclassified as ALREADY_APPLIED (returns 500)
  const unrelatedErr = new Error('Resume duplicate');
  unrelatedErr.code = 11000;
  unrelatedErr.keyPattern = { title: 1 };
  resumeSaveError = unrelatedErr;
  const resumeErrRes = await fetch(`${baseUrl}/api/jobs/apply-file`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user': candidateId, 'x-role': 'employee' },
    body: JSON.stringify({ jobId, fileName: 'cv.pdf', fileData: validPdfData }),
  });
  assert.equal(resumeErrRes.status, 500);
  resumeSaveError = null;
});
