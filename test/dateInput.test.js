import test from "node:test";
import assert from "node:assert/strict";
import { normalizeActivityDateFields, normalizeDateInputValue } from "../src/utils/dateInput.js";

test("normalizes legacy date strings for native date inputs", () => {
  assert.equal(normalizeDateInputValue("Sat Feb 01 2020 07:00:00 GMT+0700"), "2020-02-01");
  assert.equal(normalizeDateInputValue("01/11/2026"), "2026-11-01");
  assert.equal(normalizeDateInputValue("2026/11/12"), "2026-11-12");
});

test("normalizes education and experience date fields together", () => {
  assert.deepEqual(
    normalizeActivityDateFields({ school: "Bách Khoa", startDate: "2020-02-01", endDate: "12/11/2026" }),
    { school: "Bách Khoa", startDate: "2020-02-01", endDate: "2026-11-12" },
  );
});
