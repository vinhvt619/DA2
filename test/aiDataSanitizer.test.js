import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanAiText,
  looksLikeExecutableText,
  sanitizeResumeForAi,
} from "../server/utils/aiDataSanitizer.js";

test("AI text sanitizer removes executable HTML and clamps content", () => {
  const source = '<p>React &amp; Node</p><script>alert("bad")</script>';

  assert.equal(cleanAiText(source, 12), "React & Node");
  assert.equal(cleanAiText(null), "");
});

test("AI sanitizer recognizes executable code stored as CV text", () => {
  assert.equal(
    looksLikeExecutableText(
      "const parser = new DOMParser(); document.querySelector('img').outerHTML",
    ),
    true,
  );
  assert.equal(
    looksLikeExecutableText(
      "Xây dựng giao diện React, tích hợp REST API và tối ưu hiệu suất.",
    ),
    false,
  );
});

test("resume AI payload excludes direct contact information", () => {
  const payload = sanitizeResumeForAi({
    personalInfo: {
      fullName: "Nguyen Van A",
      email: "a@example.com",
      phone: "0900000000",
      address: "Ho Chi Minh City",
      jobTitle: "Frontend Developer",
    },
    bio: "<p>Ba năm kinh nghiệm React.</p>",
    experience: [
      {
        title: "Developer",
        company: "RabbitCV",
        description: "<b>Xây dựng giao diện tuyển dụng.</b>",
      },
    ],
    skill: [
      {
        title: "ReactJS",
        description: "Hooks, API",
        performance: "Xuất sắc",
      },
    ],
    certificate: [
      {
        title: "AWS Developer",
        date: "2022-10",
      },
    ],
    education: [
      {
        title: "Cử nhân Công nghệ Thông tin",
        company: "Đại học ABC",
        score: "3.2/4.0",
      },
    ],
  });

  assert.deepEqual(Object.keys(payload), [
    "targetRole",
    "contactCompleteness",
    "summary",
    "customSections",
    "experience",
    "education",
    "skills",
    "projects",
    "certificates",
    "languages",
    "awards",
    "hobbies",
    "profiles",
  ]);
  assert.equal(payload.targetRole, "Frontend Developer");
  assert.deepEqual(payload.contactCompleteness, {
    fullName: true,
    email: true,
    phone: true,
    location: false,
    website: false,
  });
  assert.equal(payload.summary, "Ba năm kinh nghiệm React.");
  assert.equal(payload.experience[0].description, "Xây dựng giao diện tuyển dụng.");
  assert.deepEqual(Object.keys(payload.skills[0]), ["title"]);
  assert.equal(payload.certificates[0].date, "10/2022");
  assert.equal(payload.education[0].score, "3.2/4.0");
  assert.doesNotMatch(JSON.stringify(payload), /candidate@example\.com|0900000000/);
});

test("resume AI payload removes skills containing executable code", () => {
  const payload = sanitizeResumeForAi({
    skill: [
      {
        title: "XSS Test",
        description:
          "const parser = new DOMParser(); document.querySelector('img')",
      },
      {
        title: "React",
        description: "Xây dựng component và quản lý state.",
        performance: "Tốt",
      },
    ],
  });

  assert.deepEqual(payload.skills, [
    {
      title: "React",
    },
  ]);
});
