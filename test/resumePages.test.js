import test from 'node:test';
import assert from 'node:assert/strict';
import Resume from '../server/models/Resume.js';
import Application from '../server/models/Application.js';
import { normalizeResumePageCount, RESUME_PAGE_COUNTS } from '../shared/resumePages.js';
import { captureApplicationResume, applicationResumeData } from '../server/services/applicationResumeService.js';
import { createResumeHistory, resumeHistoryReducer } from '../src/utils/resumeHistory.js';

test('page count defaults to one and supports only one or two A4 pages', async () => {
  assert.deepEqual(RESUME_PAGE_COUNTS, [1, 2]);
  for (const value of [undefined, null, 0, 1, 3, '2', {}, []]) assert.equal(normalizeResumePageCount(value), 1);
  assert.equal(normalizeResumePageCount(2), 2);
  assert.equal(new Resume({}).pageCount, 1);
  await new Resume({ pageCount: 2 }).validate();
  await assert.rejects(new Resume({ pageCount: 3 }).validate(), (error) => Boolean(error.errors.pageCount));
});

test('page count is part of undo/redo and is preserved in submitted CV snapshots', () => {
  let history = createResumeHistory({ pageCount: 1 });
  history = resumeHistoryReducer(history, { type: 'update', value: { pageCount: 2 }, timestamp: 1 });
  assert.equal(history.present.pageCount, 2);
  history = resumeHistoryReducer(history, { type: 'undo' });
  assert.equal(history.present.pageCount, 1);
  history = resumeHistoryReducer(history, { type: 'redo' });
  assert.equal(history.present.pageCount, 2);
  const resume = new Resume({ pageCount: 2, selectedTemplate: 'editorial' });
  const captured = captureApplicationResume(resume);
  resume.pageCount = 1;
  const application = new Application({ ...captured, resumeId: resume._id });
  assert.equal(application.resumeSnapshot.pageCount, 2);
  assert.equal(applicationResumeData(application).pageCount, 2);
});
