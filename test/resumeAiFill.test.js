import test from "node:test";
import assert from "node:assert/strict";
import {
  isSuspiciousResumeText,
  mergeAiSection,
  mergeAiSkills,
} from "../src/utils/resumeAiFill.js";

test("AI skill merge removes executable descriptions and keeps useful skills", () => {
  const result = mergeAiSkills(
    [
      {
        id: "unsafe",
        title: "XSS Test",
        description:
          "const parser = new DOMParser(); document.querySelector('img')",
        performance: "Trung bình",
      },
      {
        id: "react",
        title: "React",
        description: "",
        performance: "",
      },
    ],
    [
      {
        title: "React",
        description: "Xây dựng component tái sử dụng và quản lý state.",
        performance: "Tốt",
      },
      {
        title: "JavaScript",
        description: "Phát triển logic giao diện và tích hợp API.",
        performance: "Tốt",
      },
    ],
  );

  assert.equal(result.some((item) => item.title === "XSS Test"), false);
  assert.equal(result.length, 2);
  assert.equal(
    result.find((item) => item.title === "React")?.description,
    "Xây dựng component tái sử dụng và quản lý state.",
  );
});

test("AI section merge fills blanks without adding facts to an existing section", () => {
  const result = mergeAiSection(
    [{ id: "project-1", title: "RabbitCV", description: "" }],
    [
      {
        title: "RabbitCV",
        description: "Nền tảng tạo CV và tìm việc trực tuyến.",
      },
      {
        title: "Portfolio cá nhân",
        description: "Giới thiệu dự án và kỹ năng nổi bật.",
      },
    ],
    ["title", "description"],
    "project",
  );

  assert.equal(result[0].id, "project-1");
  assert.equal(
    result[0].description,
    "Nền tảng tạo CV và tìm việc trực tuyến.",
  );
  assert.equal(result.length, 1);
});

test("AI section merge fills a completely empty section", () => {
  const result = mergeAiSection(
    [],
    [
      {
        title: "Portfolio cá nhân",
        description: "Giới thiệu dự án và kỹ năng nổi bật.",
      },
    ],
    ["title", "description"],
    "project",
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Portfolio cá nhân");
  assert.match(result[0].id, /^ai-project-/);
});

test("resume text detector allows normal technical descriptions", () => {
  assert.equal(
    isSuspiciousResumeText(
      "Thành thạo JavaScript, ReactJS và tích hợp REST API.",
    ),
    false,
  );
  assert.equal(
    isSuspiciousResumeText(
      "r.text()).then(html => { const parser = new DOMParser(); })",
    ),
    true,
  );
});
