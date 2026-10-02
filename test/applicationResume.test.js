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
