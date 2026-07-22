import test from "node:test";
import assert from "node:assert/strict";
import { isJobDeleted, isJobUnavailable } from "../server/utils/jobAvailability.js";

test("deleted jobs are unavailable but retain their data", () => {
  const job = { status: "Deleted", title: "Frontend Developer", deletedAt: new Date() };

  assert.equal(isJobDeleted(job), true);
  assert.equal(isJobUnavailable(job), true);
  assert.equal(job.title, "Frontend Developer");
});

test("active unexpired jobs remain available", () => {
  const job = { status: "Active", expiryDate: "2099-01-01T00:00:00.000Z" };

  assert.equal(isJobDeleted(job), false);
  assert.equal(isJobUnavailable(job, new Date("2026-01-01T00:00:00.000Z")), false);
});

test("expired jobs cannot receive new applications", () => {
  const job = { status: "Active", expiryDate: "2025-12-31T23:59:59.000Z" };

  assert.equal(isJobUnavailable(job, new Date("2026-01-01T00:00:00.000Z")), true);
});
