import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanAiText,
  looksLikeExecutableText,
  looksLikeEditorialBioAdvice,
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

test("bio result validator separates editorial advice from final CV content", () => {
  assert.equal(
    looksLikeEditorialBioAdvice(
      "Tập trung vào kỹ năng Frontend. Loại bỏ thông tin không liên quan và sắp xếp lại phần mô tả.",
    ),
    true,
  );
  assert.equal(
    looksLikeEditorialBioAdvice(
      "Cập nhật phần Tiểu sử ngắn gọn hơn, nhấn mạnh kinh nghiệm và thêm từ khóa phù hợp.",
    ),
    true,
  );
  assert.equal(
    looksLikeEditorialBioAdvice(
      "Frontend Developer có kinh nghiệm phát triển giao diện với ReactJS, chú trọng UI/UX và khả năng phối hợp trong dự án.",
    ),
    false,
  );
});

test("resume AI payload excludes direct contact information", () => {
  const payload = sanitizeResumeForAi({
    personalInfo: {
      fullName: "Nguyen Van A",
      email: "candidate@example.com",
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
        description: "Hooks, Context API",
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
  assert.equal(payload.skills[0].level, "Xuất sắc");
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
      description: "Xây dựng component và quản lý state.",
      level: "Tốt",
    },
  ]);
});
