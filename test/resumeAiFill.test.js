import test from "node:test";
import assert from "node:assert/strict";
import {
  applySelectedAiProposals,
  buildAiFillProposals,
  cleanAiFillResult,
  DEFAULT_RESUME_TITLE,
  hasExistingFieldValue,
  hasMeaningfulRichText,
  isSuspiciousResumeText,
  mergeAiSection,
  mergeAiSkills,
  prepareAiFillInput,
} from "../src/utils/resumeAiFill.js";
import { isValidAiFillResult, requestAi } from "../src/utils/aiApi.js";

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
  assert.deepEqual(result.find((item) => item.title === "React"), { id: "react", title: "React" });
  assert.ok(result.every((item) => !Object.hasOwn(item, "description") && !Object.hasOwn(item, "performance")));
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

test("AI skills append new names without consuming unrelated suggestions or truncating existing skills", () => {
  const existing = Array.from({ length: 10 }, (_, index) => ({ id: `existing-${index}`, title: `Skill ${index}` }));
  const result = mergeAiSkills(existing, [{ title: "React" }, { title: "react" }, { title: "DOMParser" }]);
  assert.equal(result.length, 11);
  assert.equal(result.at(-1).title, "React");
  assert.ok(result.at(-1).id);
  assert.deepEqual(result.slice(0, 10), existing);
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

test("mergeAiSection never pairs unrelated items by positional array index or different companies", () => {
  const existing = [
    {
      id: "exp-1",
      title: "Backend Developer",
      company: "Alpha Corp",
      description: "",
    },
    {
      id: "exp-2",
      title: "Frontend Developer",
      company: "Gamma JSC",
      description: "",
    },
  ];
  const generated = [
    {
      title: "UI Designer",
      company: "Beta Studio",
      description: "Thiết kế giao diện Figma.",
    },
    {
      title: "Frontend Developer",
      company: "Other Company",
      description: "Phát triển ứng dụng tại công ty khác.",
    },
  ];

  const merged = mergeAiSection(
    existing,
    generated,
    ["title", "company", "description"],
    "experience",
  );

  assert.equal(merged.length, 2);
  assert.equal(merged[0].description, "");
  assert.equal(merged[1].description, "");
});

test("prepareAiFillInput treats empty Tiptap bio as blank, avoids mutation, and minimizes PII payload", () => {
  const resume = {
    _id: "doc-secret-id",
    title: DEFAULT_RESUME_TITLE,
    image: "data:image/png;base64,AAA",
    personalInfo: {
      fullName: "Nguyen Van A",
      jobTitle: "",
      email: "user@example.com",
      phone: "0909123456",
      location: "TP.HCM",
      website: "https://example.com",
    },
    bio: "<p></p>",
    experience: [],
    education: [],
    skill: [{ id: "s1", title: "React" }],
    language: [],
    certificate: [],
    project: [],
    award: [],
    hobby: [],
    profile: [{ id: "p1", networkName: "GitHub", link: "https://github.com/user" }],
  };

  const beforeSnapshot = JSON.stringify(resume);
  const prepared = prepareAiFillInput({
    resumeData: resume,
    currentUser: {
      _id: "user-secret-id",
      token: "secret-jwt",
      fullName: "Nguyen Van A",
      email: "user@example.com",
      phoneNumber: "0909123456",
      experiences: [
        { _id: "exp-db-1", position: "Frontend Intern", company: "ACME", description: "" },
      ],
    },
    requestedTargetRole: "Frontend Developer",
  });

  assert.equal(hasMeaningfulRichText("<p></p>"), false);
  assert.equal(JSON.stringify(resume), beforeSnapshot);
  assert.equal(prepared.hasCareerContext, true);
  assert.equal(prepared.resumeContext.personalInfo.jobTitle, "Frontend Developer");
  assert.equal(prepared.resumeContext.personalInfo.email, undefined);
  assert.equal(prepared.resumeContext.personalInfo.phone, undefined);
  assert.equal(prepared.resumeContext.personalInfo.fullName, undefined);
  assert.equal(prepared.resumeContext.image, undefined);
  assert.equal(prepared.resumeContext._id, undefined);
  assert.equal(prepared.resumeContext.experience[0].id, undefined);
  assert.equal(prepared.resumeContext.profile[0].link, undefined);
});

test("buildAiFillProposals distinguishes origins and enforces strict defaultSelected vs requiresReview rules", () => {
  const resume = {
    title: DEFAULT_RESUME_TITLE,
    personalInfo: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
    },
    bio: "<p></p>",
    experience: [],
    education: [],
    skill: [],
    language: [],
    certificate: [],
    project: [],
    award: [],
    hobby: [],
  };

  const currentUser = {
    fullName: "Tran Thi B",
    email: "b@example.com",
    phoneNumber: "0912345678",
    address: "Hà Nội",
    experiences: [
      {
        _id: "acc-exp-1",
        position: "Frontend Intern",
        company: "VN Tech",
        startDate: "2024-01",
        endDate: "",
        description: "",
      },
    ],
  };

  const generatedResult = {
    targetRole: "Senior Frontend Lead",
    bio: "Lập trình viên giao diện web tập trung vào React và hiệu năng.",
    skills: [{ title: "React", description: "DOM", performance: "Tốt" }],
    experiences: [
      {
        title: "Frontend Intern",
        company: "VN Tech",
        location: "Hà Nội",
        startDate: "",
        endDate: "",
        description: "Xây dựng component giao diện người dùng.",
      },
      {
        title: "Staff Engineer",
        company: "Invented Corp",
        location: "Singapore",
        startDate: "2020-01",
        endDate: "2024-01",
        description: "Quản lý đội ngũ.",
      },
    ],
    education: [
      {
        title: "Cử nhân CNTT",
        major: "Kỹ thuật phần mềm",
        company: "Đại học Mẫu",
        location: "",
        startDate: "2019-09",
        endDate: "2023-06",
        score: "3.8/4.0",
        description: "",
      },
    ],
    languages: [{ title: "Tiếng Anh", description: "IELTS 7.5" }],
    certificates: [{ title: "AWS Certified", date: "2024-05", publisher: "Amazon", description: "" }],
    awards: [{ title: "Nhân viên xuất sắc", awarder: "VN Tech", date: "2024-06", description: "" }],
    projects: [
      {
        title: "Unsafe Link Project",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        date: "",
        link: "javascript:alert(1)",
        description: "Demo",
      },
    ],
    hobbies: [{ title: "Đọc sách" }],
  };

  const { proposals } = buildAiFillProposals({
    resumeData: resume,
    currentUser,
    requestedTargetRole: "",
    generatedResult,
  });

  const byId = (prefix) => proposals.find((p) => p.id.startsWith(prefix));

  // Grounded profile items stay default-selected, while AI-authored bio starts opt-in for review
  assert.equal(byId("personalInfo:fullName")?.origin, "profile");
  assert.equal(byId("personalInfo:fullName")?.defaultSelected, true);
  assert.equal(byId("profile-item:experience:")?.origin, "profile");
  assert.equal(byId("profile-item:experience:")?.defaultSelected, true);
  assert.equal(byId("bio")?.origin, "ai");
  assert.equal(byId("bio")?.defaultSelected, false);
  assert.equal(byId("bio")?.requiresReview, true);

  // Blank AI-authored description on matched account experience starts opt-in for review
  const matchedExpDesc = proposals.find(
    (p) => p.kind === "item_field" && p.sectionKey === "experience" && p.field === "description",
  );
  assert.equal(matchedExpDesc?.defaultSelected, false);
  assert.equal(matchedExpDesc?.requiresReview, true);

  // Factual AI location on matched item requires review
  const matchedExpLocation = proposals.find(
    (p) => p.kind === "item_field" && p.sectionKey === "experience" && p.field === "location",
  );
  assert.equal(matchedExpLocation?.defaultSelected, false);
  assert.equal(matchedExpLocation?.requiresReview, true);

  // Ungrounded new AI skills, experiences, education, languages, certificates, awards, hobbies MUST NOT default-select
  for (const section of ["skill", "language", "certificate", "award", "education", "hobby"]) {
    const item = proposals.find((p) => p.sectionKey === section && p.kind === "new_item");
    assert.ok(item, `Expected new_item proposal for ${section}`);
    assert.equal(item.defaultSelected, false, `${section} must not be defaultSelected`);
    assert.equal(item.requiresReview, true, `${section} must require review`);
  }

  const ungroundedAiExp = proposals.find(
    (p) => p.kind === "new_item" && p.sectionKey === "experience" && p.itemLabel === "Staff Engineer",
  );
  assert.equal(ungroundedAiExp?.defaultSelected, false);
  assert.equal(ungroundedAiExp?.requiresReview, true);

  // Sanitized unsafe link on AI project
  const unsafeProject = proposals.find((p) => p.sectionKey === "project" && p.kind === "new_item");
  assert.equal(unsafeProject?.item?.link, "");
});

test("buildAiFillProposals flags bio containing ungrounded numbers as requiresReview and defaultSelected=false", () => {
  const { proposals } = buildAiFillProposals({
    resumeData: {
      title: "CV Dev",
      personalInfo: { jobTitle: "Frontend Developer" },
      bio: "",
      experience: [],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
    },
    currentUser: null,
    generatedResult: {
      bio: "Hơn 5 năm kinh nghiệm tối ưu 45% hiệu năng tải trang.",
      skills: [],
    },
  });

  const bioProposal = proposals.find((p) => p.id === "bio");
  assert.ok(bioProposal);
  assert.equal(bioProposal.defaultSelected, false);
  assert.equal(bioProposal.requiresReview, true);
});

test("cleanAiFillResult strips dangerous links and encoded XSS payloads across all fields", () => {
  const cleaned = cleanAiFillResult({
    targetRole: "<script>alert(1)</script>Frontend Dev",
    bio: "&lt;img src=x onerror=alert(1)&gt;",
    skills: [
      { title: "React", description: "Good" },
      { title: "onclick=alert(1)" },
    ],
    certificates: [{ title: "Cert A", publisher: "eval('x')", date: "invalid", description: "Valid" }],
    projects: [{ title: "Proj", link: "vbscript:msgbox(1)", description: "Safe" }],
  });

  assert.equal(cleaned.targetRole, "Frontend Dev");
  assert.equal(cleaned.bio, "");
  assert.deepEqual(cleaned.skills, [{ title: "React" }]);
  assert.equal(cleaned.certificates[0].publisher, "");
  assert.equal(cleaned.certificates[0].date, "");
  assert.equal(cleaned.projects[0].link, "");
});

test("applySelectedAiProposals rechecks latest state, skips conflicts, preserves user edits and layout, and handles 0-selection no-op", () => {
  const initialResume = {
    title: DEFAULT_RESUME_TITLE,
    selectedTemplate: "classic",
    pageCount: 2,
    layout: { classic: { left: ["bio"] } },
    customSections: [{ id: "custom-1", title: "Custom", items: [] }],
    personalInfo: { fullName: "", email: "", phone: "", location: "", jobTitle: "Frontend Dev" },
    bio: "",
    experience: [{ id: "exp-fixed", title: "Frontend Dev", company: "ACME", description: "" }],
    education: [],
    skill: [],
    language: [],
    certificate: [],
    project: [],
    award: [],
    hobby: [],
  };

  const { proposals } = buildAiFillProposals({
    resumeData: initialResume,
    currentUser: { fullName: "Nguyen A" },
    generatedResult: {
      bio: "Tóm tắt mới từ AI.",
      skills: [{ title: "React" }],
      experiences: [{ title: "Frontend Dev", company: "ACME", description: "AI exp desc" }],
    },
  });

  // 0 selection is exact no-op
  const noop = applySelectedAiProposals(initialResume, proposals, []);
  assert.equal(noop.changed, false);
  assert.equal(noop.nextResume, initialResume);

  // User manually fills bio before clicking Apply
  const concurrentlyEdited = {
    ...initialResume,
    bio: "<p>User bio written manually</p>",
    personalInfo: { ...initialResume.personalInfo, fullName: "Tên vừa sửa" },
  };

  const allIds = proposals.map((p) => p.id);
  const applied = applySelectedAiProposals(concurrentlyEdited, proposals, allIds);

  assert.equal(applied.changed, true);
  assert.equal(applied.nextResume.bio, "<p>User bio written manually</p>");
  assert.equal(applied.nextResume.personalInfo.fullName, "Tên vừa sửa");
  assert.equal(applied.nextResume.experience[0].id, "exp-fixed");
  assert.equal(applied.nextResume.experience[0].description, "AI exp desc");
  assert.equal(applied.nextResume.skill.length, 1);
  assert.deepEqual(Object.keys(applied.nextResume.skill[0]).sort(), ["id", "title"]);
  assert.equal(applied.nextResume.skill[0].title, "React");
  assert.equal(applied.nextResume.selectedTemplate, "classic");
  assert.equal(applied.nextResume.pageCount, 2);
  assert.deepEqual(applied.nextResume.layout, initialResume.layout);
  assert.deepEqual(applied.nextResume.customSections, initialResume.customSections);
  assert.equal(applied.conflicts.length, 2);
});

test("requestAi passes AbortSignal to fetch and preserves AbortError on cancellation", async () => {
  const originalFetch = globalThis.fetch;
  let receivedSignal = null;
  globalThis.fetch = async (_url, init) => {
    receivedSignal = init.signal;
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    throw abortError;
  };

  try {
    const controller = new AbortController();
    await assert.rejects(
      () => requestAi("/resume/fill", { resumeContext: {} }, { signal: controller.signal }),
      (err) => err?.name === "AbortError",
    );
    assert.ok(receivedSignal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("hasExistingFieldValue and rich-text vacancy checks preserve DOMParser technical prose and non-text markup", () => {
  const domParserHtml = "<p>Tối ưu xử lý XML bằng DOMParser.</p>";
  assert.equal(hasExistingFieldValue(domParserHtml), true);
  assert.equal(hasMeaningfulRichText(domParserHtml), true);
  assert.equal(hasExistingFieldValue('<img src="diagram.png" alt="sơ đồ">'), true);
  assert.equal(hasExistingFieldValue("<hr>"), true);

  for (const blankHtml of ["", "   ", "<p></p>", "<p><br></p>", "<p><br /></p>", "<p>&nbsp;</p>", "<div> \n </div>"]) {
    assert.equal(hasExistingFieldValue(blankHtml), false, `Expected blank shell to be empty: ${blankHtml}`);
    assert.equal(hasMeaningfulRichText(blankHtml), false, `Expected blank shell to be empty: ${blankHtml}`);
  }

  assert.equal(isSuspiciousResumeText("const parser = new DOMParser(); document.querySelector('img')"), true);

  const resume = {
    title: "CV Technical",
    personalInfo: { jobTitle: "Frontend Developer" },
    bio: domParserHtml,
    experience: [
      {
        id: "exp-dom",
        title: "Frontend Developer",
        company: "Example",
        location: "Hà Nội",
        startDate: "2022-01",
        endDate: "",
        description: domParserHtml,
      },
    ],
    education: [],
    skill: [],
    language: [],
    certificate: [],
    project: [],
    award: [],
    hobby: [],
  };

  const prepared = prepareAiFillInput({ resumeData: resume });
  assert.equal(prepared.hasCareerContext, true);
  assert.equal(prepared.resumeContext.personalInfo.jobTitle, "Frontend Developer");

  const domOnlyContext = prepareAiFillInput({
    resumeData: { ...resume, personalInfo: { jobTitle: "" }, experience: [] },
  });
  assert.equal(domOnlyContext.hasCareerContext, true);

  const { proposals } = buildAiFillProposals({
    resumeData: resume,
    currentUser: null,
    generatedResult: {
      bio: "Bio AI không được phép ghi đè DOMParser.",
      experiences: [
        {
          title: "Frontend Developer",
          company: "Example",
          description: "Mô tả AI không được phép ghi đè DOMParser.",
        },
      ],
    },
  });

  assert.equal(proposals.some((p) => p.id === "bio"), false);
  assert.equal(proposals.some((p) => p.kind === "item_field" && p.field === "description"), false);

  // Even at apply time, existing DOMParser prose cannot be overwritten by stale proposals
  const staleBioOverride = applySelectedAiProposals(
    resume,
    [{ id: "bio", kind: "bio", origin: "ai", value: "Ghi đè bio", defaultSelected: false, requiresReview: true }],
    ["bio"],
  );
  assert.equal(staleBioOverride.changed, false);
  assert.equal(staleBioOverride.conflicts.length, 1);
  assert.equal(staleBioOverride.nextResume.bio, domParserHtml);

  const mergedExp = mergeAiSection(
    resume.experience,
    [
      {
        title: "Frontend Developer",
        company: "Example",
        description: "Mô tả mới không được ghi đè.",
      },
    ],
    ["title", "company", "location", "startDate", "endDate", "description"],
    "experience",
  );
  assert.equal(mergedExp[0].description, domParserHtml);
});

test("buildAiFillProposals keeps all AI-authored prose opt-in even without numbers while preserving safe profile and user_role defaults", () => {
  const { proposals: matchedSectionProposals } = buildAiFillProposals({
    resumeData: {
      title: DEFAULT_RESUME_TITLE,
      personalInfo: { fullName: "", jobTitle: "" },
      bio: "<p><br></p>",
      experience: [
        {
          id: "exp-1",
          title: "Backend Engineer",
          company: "Example",
          location: "TP.HCM",
          startDate: "2021-03",
          endDate: "",
          description: "<p>&nbsp;</p>",
        },
      ],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
    },
    currentUser: {
      fullName: "Trần Thị Bảo",
    },
    requestedTargetRole: "Backend Engineer",
    generatedResult: {
      bio: "Tôi từng dẫn dắt đội ngũ và quản lý hệ thống thanh toán quốc tế.",
      experiences: [
        {
          title: "Backend Engineer",
          company: "Example",
          description: "Từng phụ trách kiểm toán và quản lý nhóm kỹ thuật.",
        },
        {
          title: "Lead Architect",
          company: "Future Corp",
          description: "Thiết kế kiến trúc phân tán.",
        },
      ],
    },
  });

  const jobTitleProposal = matchedSectionProposals.find((p) => p.id === "personalInfo:jobTitle");
  const fullNameProposal = matchedSectionProposals.find((p) => p.id === "personalInfo:fullName");
  const bioProposal = matchedSectionProposals.find((p) => p.id === "bio");
  const matchedDescProposal = matchedSectionProposals.find(
    (p) => p.kind === "item_field" && p.sectionKey === "experience" && p.field === "description",
  );
  const newExpProposal = matchedSectionProposals.find(
    (p) => p.kind === "new_item" && p.sectionKey === "experience" && p.itemLabel === "Lead Architect",
  );

  assert.equal(jobTitleProposal?.origin, "user_role");
  assert.equal(jobTitleProposal?.defaultSelected, true);
  assert.equal(jobTitleProposal?.requiresReview, false);

  assert.equal(fullNameProposal?.origin, "profile");
  assert.equal(fullNameProposal?.defaultSelected, true);
  assert.equal(fullNameProposal?.requiresReview, false);

  assert.equal(bioProposal?.origin, "ai");
  assert.equal(bioProposal?.defaultSelected, false);
  assert.equal(bioProposal?.requiresReview, true);

  assert.equal(matchedDescProposal?.origin, "ai");
  assert.equal(matchedDescProposal?.defaultSelected, false);
  assert.equal(matchedDescProposal?.requiresReview, true);

  assert.equal(newExpProposal?.origin, "ai");
  assert.equal(newExpProposal?.defaultSelected, false);
  assert.equal(newExpProposal?.requiresReview, true);

  // When CV experience is empty, grounded account experience still defaults selected
  const { proposals: emptyExpProposals } = buildAiFillProposals({
    resumeData: {
      title: DEFAULT_RESUME_TITLE,
      personalInfo: { fullName: "Trần Thị Bảo", jobTitle: "Backend Engineer" },
      bio: "",
      experience: [],
      education: [],
      skill: [],
      language: [],
      certificate: [],
      project: [],
      award: [],
      hobby: [],
    },
    currentUser: {
      experiences: [
        {
          position: "API Engineer",
          company: "Acme VN",
          startDate: "2020-01",
          endDate: "2021-02",
          description: "Kinh nghiệm xác thực từ tài khoản.",
        },
      ],
    },
    generatedResult: {
      bio: "Tôi từng dẫn dắt đội ngũ.",
    },
  });
  const profileExpProposal = emptyExpProposals.find((p) => p.kind === "profile_item" && p.sectionKey === "experience");
  assert.equal(profileExpProposal?.origin, "profile");
  assert.equal(profileExpProposal?.defaultSelected, true);
  assert.equal(profileExpProposal?.requiresReview, false);
  assert.equal(emptyExpProposals.find((p) => p.id === "bio")?.defaultSelected, false);
  assert.equal(emptyExpProposals.find((p) => p.id === "bio")?.requiresReview, true);
});

test("item_field target binding prevents ID replacement, context mutation, wildcard matching, ambiguity, and orphan profile enrichment", () => {
  const baseResume = {
    title: "CV Dev",
    personalInfo: { jobTitle: "Developer" },
    bio: "Đã có bio",
    experience: [
      {
        id: "original",
        title: "Developer",
        company: "Example",
        location: "Hà Nội",
        startDate: "2022-01",
        endDate: "",
        description: "",
      },
    ],
    education: [],
    skill: [],
    language: [],
    certificate: [],
    project: [],
    award: [],
    hobby: [],
  };

  // 1. Wildcard removal & conflicting employer rejection
  const { proposals: wildcardProposals } = buildAiFillProposals({
    resumeData: baseResume,
    currentUser: null,
    generatedResult: {
      experiences: [
        { title: "Developer", company: "", description: "Không rõ công ty không được ghép vào Example." },
        { title: "Developer", company: "Other Corp", description: "Khác công ty không được ghép." },
      ],
    },
  });
  assert.equal(
    wildcardProposals.some((p) => p.kind === "item_field" && p.field === "description"),
    false,
  );

  // 2. Preview against "original"
  const { proposals: boundProposals } = buildAiFillProposals({
    resumeData: baseResume,
    currentUser: null,
    generatedResult: {
      experiences: [
        {
          title: "Developer",
          company: "Example",
          description: "Phát triển API Node.js.",
        },
      ],
    },
  });
  const boundDesc = boundProposals.find(
    (p) => p.kind === "item_field" && p.sectionKey === "experience" && p.field === "description",
  );
  assert.ok(boundDesc);
  assert.equal(boundDesc.targetItemId, "original");
  assert.equal(boundDesc.targetSourceKind, "existing");

  // 2a. Replaced ID with identical title/company MUST conflict and stay untouched
  const replacedResume = {
    ...baseResume,
    experience: [{ ...baseResume.experience[0], id: "replacement" }],
  };
  const replacedApply = applySelectedAiProposals(replacedResume, boundProposals, [boundDesc.id]);
  assert.equal(replacedApply.changed, false);
  assert.equal(replacedApply.conflicts.length, 1);
  assert.equal(replacedApply.nextResume.experience[0].id, "replacement");
  assert.equal(replacedApply.nextResume.experience[0].description, "");

  // 2b. Modified context field on same ID MUST conflict and stay untouched
  const contextEditedResume = {
    ...baseResume,
    experience: [{ ...baseResume.experience[0], location: "Đà Nẵng" }],
  };
  const contextEditedApply = applySelectedAiProposals(contextEditedResume, boundProposals, [boundDesc.id]);
  assert.equal(contextEditedApply.changed, false);
  assert.equal(contextEditedApply.conflicts.length, 1);
  assert.equal(contextEditedApply.nextResume.experience[0].description, "");

  // 2c. Unchanged valid target applies cleanly preserving ID and context fields
  const validApply = applySelectedAiProposals(baseResume, boundProposals, [boundDesc.id]);
  assert.equal(validApply.changed, true);
  assert.equal(validApply.conflicts.length, 0);
  assert.equal(validApply.nextResume.experience[0].id, "original");
  assert.equal(validApply.nextResume.experience[0].location, "Hà Nội");
  assert.equal(validApply.nextResume.experience[0].description, "Phát triển API Node.js.");

  // 3. Legacy no-ID item without secondary context skips unsafe merge; with secondary context refuses ID-bearing replacement
  const noIdWithoutContext = {
    ...baseResume,
    experience: [{ title: "Developer", company: "", location: "", startDate: "", endDate: "", description: "" }],
  };
  const noIdWithoutContextResult = buildAiFillProposals({
    resumeData: noIdWithoutContext,
    currentUser: null,
    generatedResult: {
      experiences: [{ title: "Developer", company: "", description: "Không đủ ngữ cảnh định danh." }],
    },
  });
  assert.equal(
    noIdWithoutContextResult.proposals.some((p) => p.kind === "item_field"),
    false,
  );

  const noIdWithContext = {
    ...baseResume,
    experience: [
      { title: "Developer", company: "Example", location: "", startDate: "2021-01", endDate: "", description: "" },
    ],
  };
  const noIdPreview = buildAiFillProposals({
    resumeData: noIdWithContext,
    currentUser: null,
    generatedResult: {
      experiences: [{ title: "Developer", company: "Example", description: "Mô tả hợp lệ." }],
    },
  });
  const noIdDesc = noIdPreview.proposals.find((p) => p.kind === "item_field" && p.field === "description");
  assert.ok(noIdDesc);
  const swappedWithId = {
    ...noIdWithContext,
    experience: [{ ...noIdWithContext.experience[0], id: "new-id" }],
  };
  const noIdApply = applySelectedAiProposals(swappedWithId, noIdPreview.proposals, [noIdDesc.id]);
  assert.equal(noIdApply.changed, false);
  assert.equal(noIdApply.conflicts.length, 1);
  assert.equal(noIdApply.nextResume.experience[0].description, "");

  // 4. Duplicate ambiguous items skip enrichment
  const duplicatedResume = {
    ...baseResume,
    experience: [
      { id: "dup-1", title: "Developer", company: "Example", location: "", startDate: "", endDate: "", description: "" },
      { id: "dup-2", title: "Developer", company: "Example", location: "", startDate: "", endDate: "", description: "" },
    ],
  };
  const dupPreview = buildAiFillProposals({
    resumeData: duplicatedResume,
    currentUser: null,
    generatedResult: {
      experiences: [{ title: "Developer", company: "Example", description: "Không đoán mục trùng." }],
    },
  });
  assert.equal(
    dupPreview.proposals.some((p) => p.kind === "item_field"),
    false,
  );

  // 5. profile_item + linked AI item_field: succeeds together, conflicts cleanly when profile_item unchecked
  const profileLinkedResume = {
    ...baseResume,
    experience: [],
  };
  const profilePreview = buildAiFillProposals({
    resumeData: profileLinkedResume,
    currentUser: {
      experiences: [{ position: "QA Lead", company: "Beta JSC", startDate: "2020-01", endDate: "", description: "" }],
    },
    generatedResult: {
      experiences: [{ title: "QA Lead", company: "Beta JSC", location: "TP.HCM", description: "Kiểm thử API." }],
    },
  });
  const profileExp = profilePreview.proposals.find((p) => p.kind === "profile_item");
  const linkedLocation = profilePreview.proposals.find(
    (p) => p.kind === "item_field" && p.targetSourceKind === "profile_item" && p.field === "location",
  );
  assert.ok(profileExp);
  assert.ok(linkedLocation);
  assert.equal(linkedLocation.profileProposalId, profileExp.id);

  const orphanOnly = applySelectedAiProposals(profileLinkedResume, profilePreview.proposals, [linkedLocation.id]);
  assert.equal(orphanOnly.changed, false);
  assert.equal(orphanOnly.conflicts.length, 1);
  assert.equal(orphanOnly.nextResume.experience.length, 0);

  const combinedApply = applySelectedAiProposals(
    profileLinkedResume,
    profilePreview.proposals,
    [profileExp.id, linkedLocation.id],
  );
  assert.equal(combinedApply.changed, true);
  assert.equal(combinedApply.conflicts.length, 0);
  assert.equal(combinedApply.nextResume.experience.length, 1);
  assert.equal(combinedApply.nextResume.experience[0].location, "TP.HCM");
});

test("requestAi validates HTTP 200 AI fill payloads and preserves compatible behavior for other routes", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const invalidBodies = [
      "<html>Bad Gateway</html>",
      JSON.stringify({}),
      JSON.stringify({ result: null }),
      JSON.stringify({ result: [] }),
      JSON.stringify({ result: { bio: 123 } }),
      JSON.stringify({ result: { skills: "oops" } }),
    ];

    for (const rawBody of invalidBodies) {
      globalThis.fetch = async () =>
        new Response(rawBody, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      await assert.rejects(
        () => requestAi("/resume/fill", { resumeContext: {} }),
        (err) => err?.code === "INVALID_AI_RESPONSE",
      );
    }

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ result: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const emptyFill = await requestAi("/resume/fill", { resumeContext: {} });
    assert.deepEqual(emptyFill, { result: {} });
    assert.equal(isValidAiFillResult(emptyFill.result), true);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ score: 88 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const reviewPayload = await requestAi("/resume/review", { resumeText: "CV" });
    assert.deepEqual(reviewPayload, { score: 88 });

    globalThis.fetch = async () =>
      new Response("<html>502</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    await assert.rejects(
      () => requestAi("/resume/review", { resumeText: "CV" }),
      (err) => err?.code === "INVALID_AI_RESPONSE",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
