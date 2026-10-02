import { expect, test } from '@playwright/test';
import { captureApplicationResume } from '../server/services/applicationResumeService.js';

const company = { _id: 'company', username: 'company', fullName: 'Doanh nghiệp kiểm thử', role: 'company' };
const candidate = { _id: 'candidate', username: 'candidate', fullName: 'Ứng viên kiểm thử', email: 'candidate@example.test', role: 'employee' };
const job = { _id: 'job', companyId: 'company', title: 'Frontend Developer', company: company.fullName, location: 'Hồ Chí Minh', type: 'Full-time', salary: '10 triệu', status: 'Active' };
const secondJob = { ...job, _id: 'job-second', title: 'React Developer' };
const initialResume = {
  _id: 'cv', userId: 'candidate', title: 'CV kiểm thử', selectedTemplate: 'elegant',
  personalInfo: { fullName: candidate.fullName, jobTitle: 'Frontend Developer', email: candidate.email },
  bio: '<p>Nội dung tại thời điểm nộp lần một.</p>',
  skill: [{ title: 'React' }], education: [{ title: 'Cử nhân trước khi nộp' }],
  customSections: [{ id: 'custom', title: 'Hoạt động cộng đồng', items: [{ title: 'Hướng dẫn lập trình trước khi nộp' }] }],
  layout: { version: 1, customizedTemplates: ['elegant'], byTemplate: { elegant: { main: ['bio', 'education', 'custom:custom'], sidebar: ['skill'] } } },
};

async function installMocks(page) {
  let currentUser = candidate;
  let resume = structuredClone(initialResume);
  const applications = [];
  let liveResumeReads = 0;
  await page.route('**/socket.io/**', (route) => route.abort());
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    let status = 200;
    let body = {};
    if (pathname === '/api/me') body = { user: currentUser };
    else if (pathname === '/api/jobs/apply') {
      expect(request.postDataJSON()).toMatchObject({ jobId: 'job', resumeId: 'cv' });
      const application = {
        _id: 'first', jobId: job, candidateId: 'candidate', resumeId: 'cv', status: 'Pending',
        fullName: candidate.fullName, email: candidate.email, createdAt: '2026-10-02',
        ...captureApplicationResume(resume),
      };
      applications.push(application);
      status = 201;
      body = { application };
    } else if (pathname === '/api/jobs/my') body = [job, secondJob];
    else if (pathname === '/api/jobs/job') body = job;
    else if (pathname === '/api/jobs') body = [job];
    else if (pathname === '/api/resumes') body = resume ? [resume] : [];
    else if (pathname === '/api/jobs/applications') body = applications.map(({ resumeSnapshot: _snapshot, ...summary }) => summary);
    else if (/\/api\/jobs\/applications\/(first|second)\/resume$/.test(pathname)) {
      const application = applications.find((item) => item._id === pathname.split('/')[4]);
      body = {
        ...application.resumeSnapshot, userId: application.candidateId, applicationId: application._id,
        resumeSnapshotOrigin: application.resumeSnapshotOrigin,
      };
    } else if (pathname.startsWith('/api/resumes/view/')) {
      liveResumeReads += 1;
      status = 410;
      body = { message: 'Không được đọc CV gốc khi xem hồ sơ đã nộp.' };
    } else if (pathname.endsWith('/unread-count')) body = { count: 0 };
    else if (pathname === '/api/saved-jobs') body = [];
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return {
    applications,
    liveResumeReads: () => liveResumeReads,
    becomeCompany: () => { currentUser = company; },
    editAndSubmitAgain() {
      resume.bio = '<p>Nội dung tại thời điểm nộp lần hai.</p>';
      resume.selectedTemplate = 'compact';
      applications.push({ ...applications[0], _id: 'second', jobId: secondJob, ...captureApplicationResume(resume) });
      resume.bio = '<p>Nội dung thay đổi sau tất cả lần nộp.</p>';
      resume.customSections[0].items[0].title = 'Nội dung mới sau khi nộp';
      resume = null;
    },
  };
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`employer views the specific submitted CV after original edits and deletion (${viewport.width}px)`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const mocks = await installMocks(page);
    await page.goto('/jobs/job');
    await page.getByRole('button', { name: 'Ứng tuyển bằng CV đã lưu', exact: true }).click();
    await expect.poll(() => mocks.applications.length).toBe(1);
    await expect(page.getByText(`Đã nộp hồ sơ thành công cho ${company.fullName}!`, { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/Jobs$/);
    mocks.editAndSubmitAgain();
    mocks.becomeCompany();
    await page.goto('/CompanyDashboard');
    await page.getByRole('button', { name: 'Xem CV', exact: true }).first().click();
    await expect(page).toHaveURL(/\/resume\/view\/application\/first$/);
    const preview = page.locator('.cv-wrapper');
    await expect(preview).toContainText('Nội dung tại thời điểm nộp lần một.');
    await expect(preview).toContainText('Hướng dẫn lập trình trước khi nộp');
    await expect(preview).not.toContainText('Nội dung mới sau khi nộp');
    await expect(page.getByText('CV đã nộp khi ứng tuyển', { exact: true })).toBeVisible();
    await page.reload();
    await expect(preview).toContainText('Nội dung tại thời điểm nộp lần một.');
    await page.screenshot({ path: testInfo.outputPath('submitted-cv.png'), fullPage: true });
    await page.goto('/CompanyDashboard');
    await page.getByRole('heading', { name: 'Ứng viên gần đây', exact: true })
      .locator('..').getByRole('button', { name: 'Xem tất cả', exact: true }).click();
    await page.getByRole('button', { name: 'Xem CV', exact: true }).last().click();
    await expect(page).toHaveURL(/\/resume\/view\/application\/second$/);
    await expect(preview).toContainText('Nội dung tại thời điểm nộp lần hai.');
    await expect(preview).not.toContainText('Nội dung thay đổi sau tất cả lần nộp.');
    expect(mocks.liveResumeReads()).toBe(0);
  });
}

test('legacy application CV clearly indicates that original submission content cannot be recovered', async ({ page }) => {
  const mocks = await installMocks(page);
  mocks.becomeCompany();
  mocks.applications.push({
    _id: 'first', jobId: job, candidateId: 'candidate', resumeId: 'cv',
    ...captureApplicationResume(initialResume, 'legacy'),
  });
  await page.goto('/resume/view/application/first');
  await expect(page.getByText('Hồ sơ cũ: bản CV được lưu từ phiên bản còn tồn tại, không phải bản gốc tại thời điểm ứng tuyển.', { exact: true })).toBeVisible();
  await expect(page.locator('.cv-wrapper')).toContainText('Nội dung tại thời điểm nộp lần một.');
});
