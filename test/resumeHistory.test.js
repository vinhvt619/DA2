import test from "node:test";
import assert from "node:assert/strict";
import { createResumeHistory, resumeHistoryReducer as reduce } from "../src/utils/resumeHistory.js";

const edit = (state, value, timestamp = 1000, group = null) => reduce(state, { type: "update", value, timestamp, group });

test("undo and redo restore CV content and layout as one document", () => {
  const initial = { title: "CV", customSections: [], layout: {} };
  const next = { ...initial, customSections: [{ id: "a", title: "Volunteer", content: "<p>Mentoring</p>" }], layout: { main: ["custom:a"] } };
  let state = edit(createResumeHistory(initial), next);
  state = reduce(state, { type: "undo" });
  assert.deepEqual(state.present, initial);
  state = reduce(state, { type: "redo" });
  assert.deepEqual(state.present, next);
});

test("typing is grouped but a different field or a pause creates a new undo step", () => {
  let state = createResumeHistory({ title: "", bio: "" });
  state = edit(state, { title: "a", bio: "" }, 1000, "title");
  state = edit(state, { title: "ab", bio: "" }, 1100, "title");
  assert.equal(state.past.length, 1);
  state = edit(state, { title: "abc", bio: "" }, 2000, "title");
  state = edit(state, { title: "abc", bio: "bio" }, 2100, "bio");
  assert.equal(state.past.length, 3);
  assert.equal(reduce(state, { type: "undo" }).present.bio, "");
});

test("new edits after undo discard redo, identical edits preserve it, loading resets history", () => {
  let state = edit(createResumeHistory({ title: "a" }), { title: "b" });
  state = reduce(state, { type: "undo" });
  assert.equal(edit(state, { title: "a" }).future.length, 1);
  state = edit(state, (current) => ({ ...current, title: "c" }));
  assert.equal(state.future.length, 0);
  assert.deepEqual(reduce(state, { type: "reset", value: { title: "loaded" } }), createResumeHistory({ title: "loaded" }));
});

test("history is bounded and an AI fill can be undone as a single change", () => {
  let state = createResumeHistory({ title: "0" });
  for (let index = 1; index <= 110; index++) state = edit(state, { title: String(index) });
  assert.equal(state.past.length, 100);
  const before = state.present;
  state = edit(state, { ...before, bio: "Generated", skill: [{ title: "React" }] });
  assert.deepEqual(reduce(state, { type: "undo" }).present, before);
});
