import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("company job and profile forms use Vietnamese labels", async () => {
  const source = await readFile(
    new URL("../src/Pages/CompanyDashboard.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Chỉnh sửa việc làm/);
  assert.match(source, /Đăng việc làm mới/);
  assert.match(source, /Lưu bản nháp/);
  assert.match(source, /Hồ sơ doanh nghiệp/);
  assert.match(source, /src="\/RabbitCV\.png"/);
  assert.match(source, /RabbitCV<br \/>Business/);
  assert.match(source, /JobStatusToggle/);
  assert.match(source, /handleJobStatusToggle/);
  assert.match(source, /role="switch"/);
  assert.match(source, /aria-label=\{isActive \? "Đóng bài đăng" : "Mở nhận ứng viên"\}/);
  assert.match(source, /onClick=\{\(\) => handleStartEdit\(job\)\}/);
  assert.match(source, /Trạng thái bài đăng/);
  assert.match(source, /Lưu thay đổi/);
  assert.match(source, /name="experience"/);
  assert.match(source, /name="education"/);
  assert.match(source, /name="workModel"/);
  assert.doesNotMatch(source, /Save Draft|Save Changes|Post a New Job|Company Profile/);
});

test("job detail normalizes complete job information without empty values", async () => {
  const [detail, schema, server] = await Promise.all([
    readFile(new URL("../src/Pages/JobDetail.jsx", import.meta.url), "utf8"),
    readFile(new URL("../server/models/Job.js", import.meta.url), "utf8"),
    readFile(new URL("../server/server.js", import.meta.url), "utf8"),
  ]);

  assert.match(detail, /formatJobDeadline/);
  assert.match(detail, /workModel:\s*data\.workModel/);
  assert.match(detail, /job\.workModel/);
  assert.match(schema, /experience:/);
  assert.match(schema, /education:/);
  assert.match(schema, /workModel:/);
  assert.match(server, /experience:\s*experience/);
  assert.match(server, /education:\s*education/);
  assert.match(server, /workModel:\s*workModel/);
});

test("public profile formats education and experience dates in Vietnamese", async () => {
  const source = await readFile(
    new URL("../src/Pages/PublicProfile.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Intl\.DateTimeFormat\("vi-VN"/);
  assert.match(source, /formatDateRange\(edu\.startDate, edu\.endDate/);
  assert.match(source, /formatDateRange\(exp\.startDate, exp\.endDate\)/);
});
