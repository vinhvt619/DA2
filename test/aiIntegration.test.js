import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
      return entry.isDirectory() ? collectFiles(url) : [url];
    }),
  );
  return nested.flat();
};

test("AI routes are authenticated and Groq requests use structured outputs", async () => {
  const [server, service, usageModel] = await Promise.all([
    readFile(new URL("../server/server.js", import.meta.url), "utf8"),
    readFile(new URL("../server/services/aiService.js", import.meta.url), "utf8"),
    readFile(new URL("../server/models/AiUsage.js", import.meta.url), "utf8"),
  ]);

  assert.match(server, /app\.use\("\/api\/ai", authMiddleware, aiRoutes\)/);
  assert.match(service, /https:\/\/api\.groq\.com\/openai\/v1/);
  assert.match(service, /GROQ_API_KEY/);
  assert.match(service, /type:\s*"json_schema"/);
  assert.match(service, /strict:\s*true/);
  assert.match(service, /GROQ_RATE_LIMIT/);
  assert.match(service, /validateResult/);
  assert.match(service, /retryInstructions/);
  assert.match(usageModel, /"resume_review"/);
  assert.match(usageModel, /"resume_fill"/);
  assert.match(usageModel, /"interview_practice"/);
  assert.match(usageModel, /default:\s*"groq"/);
});

test("frontend exposes bio assistant, AI fill, and resume scoring workflows", async () => {
  const [resume, resumeForm, jobDetail, company, aiRoutes, files] = await Promise.all([
    readFile(new URL("../src/Pages/Resume.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Components/ResumeForm.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Pages/JobDetail.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Pages/CompanyDashboard.jsx", import.meta.url), "utf8"),
    readFile(new URL("../server/routes/aiRoutes.js", import.meta.url), "utf8"),
    collectFiles(new URL("../src/", import.meta.url)),
  ]);
  const frontendSource = (
    await Promise.all(files.map((file) => readFile(file, "utf8")))
  ).join("\n");

  assert.match(resume, /requestAi\("\/resume\/improve"/);
  assert.match(resume, /requestAi\("\/resume\/review"/);
  assert.match(resume, /requestAi\("\/resume\/fill"/);
  assert.match(resumeForm, /Viết mới/);
  assert.match(resumeForm, /Rút gọn/);
  assert.doesNotMatch(resumeForm, /Tối ưu ATS|Tối ưu tiểu sử cho ATS/);
  assert.match(resumeForm, /Cải thiện tiểu sử/);
  assert.match(resumeForm, /Bản tiểu sử đã cải thiện/);
  assert.match(resumeForm, /Điểm đã cải thiện/);
  assert.match(resumeForm, /Review toàn bộ CV/);
  assert.match(resumeForm, /Điểm tốt/);
  assert.match(resumeForm, /Điểm cần sửa và cách sửa/);
  assert.match(resumeForm, /createPortal\(content,\s*document\.body\)/);
  assert.match(resume, /AI điền CV/);
  assert.doesNotMatch(resume, /handleFillSample|SAMPLE_CVS|>Điền mẫu</);
  assert.doesNotMatch(resumeForm, />Tạo gợi ý</);
  assert.match(jobDetail, /requestAi\("\/resume\/score"/);
  assert.match(jobDetail, /"Chấm điểm"/);
  assert.doesNotMatch(jobDetail, /requestAi\("\/cover-letter"|Viết thư AI/);
  assert.doesNotMatch(company, /requestAi\("\/job-description"|Viết bằng AI/);
  assert.doesNotMatch(aiRoutes, /router\.post\("\/(?:cover-letter|job-description)"/);
  assert.match(aiRoutes, /router\.post\("\/resume\/review"/);
  assert.match(aiRoutes, /router\.post\("\/resume\/fill"/);
  assert.match(aiRoutes, /router\.post\("\/interview\/turn"/);
  assert.doesNotMatch(
    frontendSource,
    /(?:OPENAI|GROQ)_API_KEY|(?:sk|gsk)_[A-Za-z0-9_-]{16,}/,
  );
});

test("candidate navigation exposes the AI interview practice page", async () => {
  const [app, header, publicHeader, mainMenu, interview] = await Promise.all([
    readFile(new URL("../src/Pages/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Components/Header.jsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/Components/HeaderNoUser.jsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/Pages/MainMenu.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Pages/AiInterview.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /path="\/ai-interview"/);
  assert.match(header, /Phỏng vấn AI/);
  assert.match(publicHeader, /Phỏng vấn AI/);
  assert.match(mainMenu, /Phỏng vấn với AI/);
  assert.match(interview, /requestAi\("\/interview\/turn"/);
  assert.match(interview, /Kết quả buổi phỏng vấn/);
  assert.match(interview, /Gửi câu trả lời/);
  assert.match(interview, /\{ value: 12, duration: "30–35 phút" \}/);
  assert.ok(header.indexOf("Tin tức") < header.indexOf("Phỏng vấn AI"));
  assert.ok(publicHeader.indexOf("Tin tức") < publicHeader.indexOf("Phỏng vấn AI"));
  assert.doesNotMatch(interview, /Còn \{remaining\} lượt AI/);
});

test("role access guard sends company and admin accounts to their portals", async () => {
  const guard = await readFile(
    new URL("../src/Components/RoleAccessGuard.jsx", import.meta.url),
    "utf8",
  );

  assert.match(guard, /currentUser\?\.role === "admin"/);
  assert.match(guard, /<Navigate to="\/admin" replace/);
  assert.match(guard, /currentUser\?\.role === "company"/);
  assert.match(guard, /<Navigate to="\/CompanyDashboard" replace/);
  assert.match(
    guard,
    /isAdminPath\(pathname\) && currentUser\?\.role !== "admin"/,
  );
});
