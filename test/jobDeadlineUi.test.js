import test from "node:test";
import assert from "node:assert/strict";
import {
  formatJobDeadline,
  isJobExpired,
  isJobUnavailable,
} from "../src/utils/jobAvailability.js";

const now = new Date("2026-07-22T12:00:00.000+07:00");

test("expired status overrides a stale relative deadline", () => {
  const job = { status: "Expired", deadline: "Còn 14 ngày" };

  assert.equal(isJobExpired(job, now), true);
  assert.equal(isJobUnavailable(job, now), true);
  assert.equal(formatJobDeadline(job, now), "Đã hết hạn");
});

test("a past expiry date blocks applications before status synchronization", () => {
  const job = {
    status: "Active",
    expiryDate: "2026-07-20T23:59:59.999+07:00",
  };

  assert.equal(isJobExpired(job, now), true);
  assert.equal(isJobUnavailable(job, now), true);
  assert.equal(formatJobDeadline(job, now), "Đã hết hạn");
});

test("an active future job still accepts applications", () => {
  const job = {
    status: "Active",
    expiryDate: "2026-07-24T23:59:59.999+07:00",
  };

  assert.equal(isJobExpired(job, now), false);
  assert.equal(isJobUnavailable(job, now), false);
  assert.match(formatJobDeadline(job, now), /còn 3 ngày/);
});
