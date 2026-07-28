import test from "node:test";
import assert from "node:assert/strict";
import {
  formatMonthDisplayValue,
  isCurrentDateValue,
  normalizeActivityDateFields,
  normalizeDateInputValue,
  normalizeMonthInputValue,
  normalizeResumeDateValue,
  parseMonthDisplayValue,
} from "../src/utils/dateInput.js";

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

test("normalizes resume month values and recognizes ongoing activities", () => {
  assert.equal(normalizeMonthInputValue("2021-08"), "2021-08");
  assert.equal(normalizeMonthInputValue("2021-08-15"), "2021-08");
  assert.equal(normalizeMonthInputValue("15/08/2021"), "2021-08");
  assert.equal(normalizeMonthInputValue("Hiện tại"), "");
  assert.equal(isCurrentDateValue("Hiện tại"), true);
  assert.equal(isCurrentDateValue("present"), true);
});

test("keeps year-only and year-month resume dates without inventing a day", () => {
  assert.equal(normalizeResumeDateValue("2023"), "2023");
  assert.equal(normalizeResumeDateValue("2022-10"), "2022-10");
  assert.equal(normalizeResumeDateValue("2022-10-15"), "2022-10");
  assert.equal(normalizeResumeDateValue("15/10/2022"), "2022-10");
});

test("converts resume months between storage and numeric display formats", () => {
  assert.equal(formatMonthDisplayValue("2017-09"), "09/2017");
  assert.equal(parseMonthDisplayValue("09/2017"), "2017-09");
  assert.equal(parseMonthDisplayValue("7/2019"), "2019-07");
  assert.equal(normalizeMonthInputValue("07/2019"), "2019-07");
});
