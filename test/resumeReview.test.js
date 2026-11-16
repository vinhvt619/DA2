import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  REVIEW_SECTION_TARGETS,
  buildReviewSnapshotSignature,
  hasReviewableResumeContent,
  isReviewResultEmpty,
  normalizeReviewSectionKey,
  resolveReviewSectionTarget,
  validateAndNormalizeReviewResult,
} from "../src/utils/resumeReview.js";

const BASE_VALID_REVIEW = {
  overallScore: 82.4,
  summary: "  CV có bố cục rõ ràng nhưng cần bổ sung số liệu ở phần kinh nghiệm. ",
  categories: {
    content: 80,
    clarity: 84.6,
    impact: 72,
    completeness: 78,
    ats: 88,
  },
  strengths: [" Bố cục mạch lạc ", "", "Nêu rõ kỹ năng Frontend"],
  improvements: [
    {
      section: " Kinh nghiệm ",
      issue: " Thiếu số liệu đo lường kết quả công việc. ",
      fix: " Bổ sung tỷ lệ tăng tốc độ tải trang hoặc số người dùng. ",
      priority: "high",
    },
    {
      section: "   ",
      issue: " Lưu ý chung về giọng văn. ",
      fix: " Giữ động từ hành động nhất quán. ",
      priority: "low",
    },
    {
      section: "Khác",
      issue: "   ",
      fix: "",
      priority: "low",
    },
  ],
  missingSections: ["Chứng chỉ", "chung chi", "  Dự án ", ""],
};

describe("resumeReview utilities", () => {
  it("resolves all 10 canonical Vietnamese review sections accurately", () => {
    const expected = [
      ["Thông tin liên hệ", "personalInfo", "editor_section"],
      ["Tiểu sử", "bio", "editor_section"],
      ["Kinh nghiệm", "experience", "editor_section"],
      ["Học vấn", "education", "editor_section"],
      ["Kỹ năng", "skill", "editor_section"],
      ["Dự án", "project", "editor_section"],
      ["Chứng chỉ", "certificate", "editor_section"],
      ["Ngoại ngữ", "language", "editor_section"],
      ["Giải thưởng", "award", "editor_section"],
      ["Bố cục và ATS", "layout", "layout_editor"],
    ];

    assert.equal(Object.keys(REVIEW_SECTION_TARGETS).length, expected.length);

    for (const [label, key, type] of expected) {
      const target = resolveReviewSectionTarget(label);
      assert.ok(target, `Expected target for canonical section "${label}"`);
      assert.equal(target.key, key);
      assert.equal(target.sectionKey, key);
      assert.equal(target.type, type);
      assert.equal(target.actionLabel, "Mở mục để sửa");
    }
  });

  it("handles normalized diacritics, punctuation, and curated aliases safely", () => {
    assert.equal(normalizeReviewSectionKey("  ĐỊA   điểm: (ATS) —  "), "dia diem ats");
    assert.equal(resolveReviewSectionTarget("tieu su:")?.key, "bio");
    assert.equal(resolveReviewSectionTarget("Mục tiêu nghề nghiệp")?.key, "bio");
    assert.equal(resolveReviewSectionTarget("Kinh nghiệm làm việc")?.key, "experience");
    assert.equal(resolveReviewSectionTarget("Trình độ học vấn")?.key, "education");
    assert.equal(resolveReviewSectionTarget("Kỹ năng chuyên môn")?.key, "skill");
    assert.equal(resolveReviewSectionTarget("Dự án nổi bật")?.key, "project");
    assert.equal(resolveReviewSectionTarget("Ngôn ngữ")?.key, "language");
    assert.equal(resolveReviewSectionTarget("Thông tin cá nhân")?.key, "personalInfo");
    assert.equal(resolveReviewSectionTarget("ATS")?.key, "layout");
    assert.equal(resolveReviewSectionTarget("Bố cục CV")?.type, "layout_editor");
  });

  it("returns null for Khác, empty values, custom sections, or unknown labels", () => {
    for (const value of [
      "Khác",
      "khac.",
      "other",
      "",
      "   ",
      null,
      undefined,
      "Mục tùy biến Hoạt động xã hội",
      "Sở thích cá nhân",
      "Tham khảo",
    ]) {
      assert.equal(
        resolveReviewSectionTarget(value),
        null,
        `Expected null target for unmapped label "${String(value)}"`,
      );
    }
  });

  it("validates and normalizes valid AI review payloads", () => {
    const normalized = validateAndNormalizeReviewResult(BASE_VALID_REVIEW);
    assert.equal(normalized.overallScore, 82);
    assert.equal(
      normalized.summary,
      "CV có bố cục rõ ràng nhưng cần bổ sung số liệu ở phần kinh nghiệm.",
    );
    assert.equal(normalized.categories.clarity, 85);
    assert.deepEqual(normalized.strengths, [
      "Bố cục mạch lạc",
      "Nêu rõ kỹ năng Frontend",
    ]);
    assert.equal(normalized.improvements.length, 2);
    assert.deepEqual(normalized.improvements[0], {
      section: "Kinh nghiệm",
      issue: "Thiếu số liệu đo lường kết quả công việc.",
      fix: "Bổ sung tỷ lệ tăng tốc độ tải trang hoặc số người dùng.",
      priority: "high",
    });
    assert.equal(normalized.improvements[1].section, "Khác");
    assert.deepEqual(normalized.missingSections, ["Chứng chỉ", "Dự án"]);

    const clamped = validateAndNormalizeReviewResult({
      ...BASE_VALID_REVIEW,
      overallScore: 145,
      categories: {
        content: -5,
        clarity: 105,
        impact: 50,
        completeness: 50,
        ats: 50,
      },
    });
    assert.equal(clamped.overallScore, 100);
    assert.equal(clamped.categories.content, 0);
    assert.equal(clamped.categories.clarity, 100);
  });

  it("rejects malformed or missing AI review fields strictly", () => {
    const invalidPayloads = [
      null,
      [],
      "not-an-object",
      {},
      { ...BASE_VALID_REVIEW, overallScore: "82" },
      { ...BASE_VALID_REVIEW, overallScore: Number.NaN },
      { ...BASE_VALID_REVIEW, summary: 123 },
      { ...BASE_VALID_REVIEW, categories: null },
      {
        ...BASE_VALID_REVIEW,
        categories: { ...BASE_VALID_REVIEW.categories, ats: null },
      },
      { ...BASE_VALID_REVIEW, strengths: "good" },
      { ...BASE_VALID_REVIEW, strengths: [123] },
      { ...BASE_VALID_REVIEW, improvements: "invalid" },
      {
        ...BASE_VALID_REVIEW,
        improvements: [{ section: "Tiểu sử", issue: "a", fix: "b", priority: "urgent" }],
      },
      {
        ...BASE_VALID_REVIEW,
        improvements: [{ section: "Tiểu sử", issue: 42, fix: "b", priority: "high" }],
      },
      { ...BASE_VALID_REVIEW, missingSections: ["Kỹ năng", 99] },
    ];

    for (const payload of invalidPayloads) {
      assert.throws(() => validateAndNormalizeReviewResult(payload));
    }
  });

  it("detects empty review feedback honestly", () => {
    assert.equal(isReviewResultEmpty(null), true);
    assert.equal(
      isReviewResultEmpty({
        overallScore: 75,
        summary: "",
        categories: {
          content: 75,
          clarity: 75,
          impact: 75,
          completeness: 75,
          ats: 75,
        },
        strengths: [],
        improvements: [],
        missingSections: [],
      }),
      true,
    );
    assert.equal(
      isReviewResultEmpty({
        overallScore: 75,
        summary: "",
        categories: {
          content: 75,
          clarity: 75,
          impact: 75,
          completeness: 75,
          ats: 75,
        },
        strengths: [],
        improvements: [
          { section: "Tiểu sử", issue: "Ngắn", fix: "Viết thêm", priority: "low" },
        ],
        missingSections: [],
      }),
      false,
    );
  });

  it("tracks snapshot signatures accurately across manual edits and undo reverts", () => {
    const initial = {
      title: "Frontend CV",
      selectedTemplate: "modern",
      pageCount: 1,
      layout: { sectionsOrder: ["bio", "experience"] },
      personalInfo: { fullName: "Nguyễn Văn A", jobTitle: "Frontend" },
      bio: "<p>Lập trình viên React</p>",
      experience: [],
      skill: [{ id: "1", title: "React" }],
      customSections: [],
    };
    const editedBio = { ...initial, bio: "<p>Lập trình viên React 3 năm</p>" };
    const editedLayout = {
      ...initial,
      layout: { sectionsOrder: ["experience", "bio"] },
    };
    const editedCustom = {
      ...initial,
      customSections: [{ id: "c1", title: "Hoạt động", fields: {}, items: [] }],
    };

    const sigInitial = buildReviewSnapshotSignature(initial);
    assert.notEqual(buildReviewSnapshotSignature(editedBio), sigInitial);
    assert.notEqual(buildReviewSnapshotSignature(editedLayout), sigInitial);
    assert.notEqual(buildReviewSnapshotSignature(editedCustom), sigInitial);
    assert.equal(buildReviewSnapshotSignature({ ...initial }), sigInitial);
  });

  it("checks whether resume has reviewable content beyond empty rich-text markup", () => {
    assert.equal(hasReviewableResumeContent({}), false);
    assert.equal(
      hasReviewableResumeContent({
        personalInfo: { fullName: "Nguyễn Văn A", jobTitle: "   " },
        bio: "<p></p><p>   </p>",
        experience: [],
        education: [],
        skill: [],
        project: [],
        certificate: [],
        customSections: [{ id: "1", title: "Mục trống", items: [] }],
      }),
      false,
    );
    assert.equal(
      hasReviewableResumeContent({
        bio: "<p>Kinh nghiệm React</p>",
      }),
      true,
    );
    assert.equal(
      hasReviewableResumeContent({
        personalInfo: { jobTitle: "Backend Engineer" },
      }),
      true,
    );
  });
});
