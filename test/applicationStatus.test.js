import test from "node:test";
import assert from "node:assert/strict";
import { updateApplicationStatus, ApplicationStatusLockedError } from "../server/services/applicationStatusService.js";

const makeModel = (status = "Pending") => {
  const record = { _id: "app", status };
  return { record, async findOneAndUpdate(filter, update, options) {
    assert.equal(filter._id, record._id);
    assert.deepEqual(filter.status, { $ne: "Rejected" });
    assert.deepEqual(options, { returnDocument: 'after', runValidators: true });
    if (record.status === "Rejected") return null;
    record.status = update.$set.status;
    return { ...record };
  } };
};

test("an active application can advance then be rejected", async () => {
  const model = makeModel();
  assert.equal((await updateApplicationStatus(model, "app", "Interview")).status, "Interview");
  assert.equal((await updateApplicationStatus(model, "app", "Rejected")).status, "Rejected");
});

test("all writes after rejection are blocked, including concurrent requests", async () => {
  const model = makeModel();
  const results = await Promise.allSettled([
    updateApplicationStatus(model, "app", "Rejected"),
    updateApplicationStatus(model, "app", "Interview"),
  ]);
  assert.equal(results[0].status, "fulfilled");
  assert.ok(results[1].reason instanceof ApplicationStatusLockedError);
  assert.equal(model.record.status, "Rejected");
  for (const status of ["Pending", "Reviewing", "Interview", "Offered", "Accepted", "Rejected"]) {
    await assert.rejects(updateApplicationStatus(model, "app", status), { code: "APPLICATION_STATUS_LOCKED" });
  }
});
