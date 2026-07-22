import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeRichText } from "../server/utils/richTextSanitizer.js";

test("keeps supported resume formatting without HTML attributes", () => {
  const value = '<p class="lead">Xin <strong onclick="bad()">chào</strong></p>';
  assert.equal(sanitizeRichText(value), "<p>Xin <strong>chào</strong></p>");
});

test("removes executable and embedded HTML", () => {
  const value = '<p>An toàn</p><script>alert(1)</script><iframe src="bad"></iframe>';
  assert.equal(sanitizeRichText(value), "<p>An toàn</p>");
});

test("returns an empty value for non-string input", () => {
  assert.equal(sanitizeRichText(null), "");
});
