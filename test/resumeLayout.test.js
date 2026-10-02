import test from "node:test";
import assert from "node:assert/strict";
import { getTemplateLayout, setTemplateLayout, resetTemplateLayout, normalizeResumeLayout } from "../src/utils/resumeLayout.js";
import { sanitizeResumeLayout } from "../server/utils/resumeLayout.js";
import { sanitizeCustomSections } from "../server/utils/resumeCustomSections.js";
import { sanitizeResumeForAi } from "../server/utils/aiDataSanitizer.js";
import Resume from "../server/models/Resume.js";
import { normalizeCustomSections, normalizeSkillNames, DEFAULT_CUSTOM_FIELDS } from "../shared/resumeCustomSections.js";

test("layouts remove duplicate and unknown sections and preserve custom sections across client/server", () => {
  const sections = [{ id: "volunteer", title: "Volunteer", content: "<p>Mentor</p>" }];
  const layout = setTemplateLayout(null, "modern", { main: ["education", "education", "unknown"], sidebar: ["custom:volunteer", "skill"] }, sections);
  assert.equal(layout.byTemplate.modern.main[0], "education");
  assert.equal(layout.byTemplate.modern.sidebar[0], "custom:volunteer");
  assert.equal([...layout.byTemplate.modern.main, ...layout.byTemplate.modern.sidebar].length, 10);
  assert.deepEqual(sanitizeResumeLayout(layout, sections), layout);
  assert.deepEqual(normalizeResumeLayout(sanitizeResumeLayout(layout, sections), sections), layout);
  assert.deepEqual(resetTemplateLayout(layout, "modern", sections).customizedTemplates, []);
});

test("new custom sections are appended and deleted custom sections disappear from every layout", () => {
  const sections = [{ id: "a" }, { id: "b" }];
  const layout = setTemplateLayout(null, "creative", { main: [], sidebar: ["custom:a"] }, sections);
  assert.ok(layout.byTemplate.creative.main.includes("custom:b"));
  const cleaned = normalizeResumeLayout(layout, [{ id: "b" }]);
  assert.ok(!getTemplateLayout(cleaned, "creative", [{ id: "b" }]).sidebar.includes("custom:a"));
});

test("compact layouts keep moved and custom sections in one column", () => {
  const layout = setTemplateLayout(null, "compact", { main: ["education"], sidebar: ["skill", "custom:a"] }, [{ id: "a" }]);
  assert.deepEqual(layout.byTemplate.compact.sidebar, []);
  assert.ok(layout.byTemplate.compact.main.includes("custom:a"));
  assert.deepEqual(sanitizeResumeLayout(layout, [{ id: "a" }]), layout);
});

test("custom content persists in Mongoose, preserves formatting, and participates in AI review", async () => {
  const sections = sanitizeCustomSections([
    { id: "a", title: " Activity ", content: '<p><strong>Mentor</strong><img src=x onerror=alert(1)></p><script>alert(1)</script>' },
    { id: "a", title: "Duplicate" }, { id: "invalid:key", title: "Invalid" },
  ]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].title, "Activity");
  assert.equal(sections[0].items[0].description, "<p><strong>Mentor</strong></p>");
  const document = new Resume({ customSections: sections, layout: setTemplateLayout(null, "elegant", { main: [], sidebar: ["custom:a"] }, sections) });
  await document.validate();
  assert.deepEqual(document.toObject().customSections, sections);
  assert.equal(sanitizeResumeForAi({ customSections: sections }).customSections[0].items[0].description, "Mentor");
});

test("custom groups persist multiple entries, optional fields and arbitrary details", async () => {
  const sections = sanitizeCustomSections([{ id: "research", title: "Nghiên cứu", fields: { ...DEFAULT_CUSTOM_FIELDS, location: false }, items: [
    { id: "first", title: "Đề tài A", organization: "Đại học", location: "Ẩn", startDate: "01/2025", endDate: "Hiện tại", description: "<p>Đề tài</p>", link: "https://example.org/", details: [{ id: "score", label: "Điểm", value: "9/10" }] },
    { id: "second", title: "Đề tài B", link: "javascript:alert(1)" },
  ] }]);
  const document = new Resume({ customSections: sections });
  await document.validate();
  assert.deepEqual(document.toObject().customSections, sections);
  assert.equal(sections[0].items.length, 2);
  assert.equal(sections[0].items[1].link, "");
  const review = sanitizeResumeForAi({ customSections: sections }).customSections[0];
  assert.equal(Object.hasOwn(review.items[0], "location"), false);
  assert.deepEqual(review.items[0].details, [{ label: "Điểm", value: "9/10" }]);
  assert.deepEqual(normalizeCustomSections(sections), sections);
});

test("legacy Mongoose custom content is migrated without being lost to default arrays", () => {
  const document = new Resume({ customSections: [{ id: "legacy", title: "Cũ", content: "<p>Nội dung cũ</p>" }] });
  assert.equal(sanitizeCustomSections(document.toObject().customSections)[0].items[0].description, "<p>Nội dung cũ</p>");
});

test("skills persist and reach AI as names only", async () => {
  const skills = [{ id: "react", title: " React ", description: "Hooks", performance: "Tốt" }, { title: " " }];
  assert.deepEqual(normalizeSkillNames(skills), [{ id: "react", title: "React" }]);
  const document = new Resume({ skill: skills });
  await document.validate();
  assert.equal(Object.hasOwn(document.toObject().skill[0], "description"), false);
  assert.equal(Object.hasOwn(document.toObject().skill[0], "performance"), false);
  assert.deepEqual(sanitizeResumeForAi({ skill: skills }).skills, [{ title: "React" }]);
});
