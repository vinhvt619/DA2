import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { createPasswordChangeHandler, matchesAccountContact } from "../server/services/passwordChangeService.js";

const account = { _id: "self", email: "Owner@example.test", phoneNumber: "0912345678", password: "old-hash" };
const body = { contact: "owner@example.test", newPassword: "new-password", confirmPassword: "new-password" };
async function request(payload = body, options = {}) {
  let writes = 0;
  let update;
  let filter;
  const res = { status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  const handler = createPasswordChangeHandler({
    UserModel: {
      findById(id) {
        assert.equal(id, "self");
        return { select: async () => { if (options.offline) throw new Error("private database details"); return "user" in options ? options.user : account; } };
      },
      findOneAndUpdate(query, data) {
        writes += 1; filter = query; update = data;
        return { select: async () => options.stale ? null : { _id: "self" } };
      },
    },
    comparePassword: options.real ? bcrypt.compare : async (plain) => plain === "old-password",
    hashPassword: options.real ? bcrypt.hash : async () => "new-hash",
  });
  await handler({ user: options.unauthenticated ? null : { id: "self" }, body: payload }, res);
  return { res, writes, update, filter };
}

test("contact must match the signed-in account; email case and Vietnamese phone formatting are normalized", () => {
  for (const value of [" Owner@EXAMPLE.test ", "0912 345 678", "+84 912-345-678"]) assert.equal(matchesAccountContact(value, account), true);
  for (const value of ["", " ", null, {}, "other@example.test", "0912345679", "abc0912345678", "0912x345678"]) assert.equal(matchesAccountContact(value, account), false);
  assert.equal(matchesAccountContact("0912345678", { email: account.email, phoneNumber: "" }), false);
});

test("missing contact, malformed password and weak or oversized new passwords never write", async () => {
  for (const payload of [null, {}, { ...body, contact: "" }, { ...body, contact: {} },
    { ...body, confirmPassword: [] }, { ...body, confirmPassword: '' }, { ...body, confirmPassword: 'not-matching' }, { ...body, newPassword: "short" },
    { ...body, newPassword: "a".repeat(73) }, { ...body, newPassword: "ệ".repeat(25) }]) {
    const result = await request(payload);
    assert.equal(result.res.code, 400); assert.equal(result.writes, 0);
  }
});

test("wrong contact and unchanged password are rejected without updates", async () => {
  for (const payload of [{ ...body, contact: "other@example.test" }, { ...body, contact: "0999999999" },
    { ...body, newPassword: "old-password", confirmPassword: 'old-password' }]) {
    const result = await request(payload);
    assert.equal(result.res.code, 400); assert.equal(result.writes, 0);
  }
});

test("correct account contact and matching new passwords allow a change without the current password", async () => {
  for (const contact of [body.contact, "+84912345678"]) {
    const result = await request({ ...body, contact });
    assert.equal(result.res.code, 200); assert.equal(result.writes, 1);
    assert.deepEqual(result.update, { $set: { password: "new-hash" } });
    assert.equal(result.filter._id, "self"); assert.equal(result.filter.password, "old-hash");
    assert.equal(result.filter.email, account.email); assert.equal(result.filter.phoneNumber, account.phoneNumber);
  }
  const password = await bcrypt.hash('old-password', 4);
  const result = await request(body, { real: true, user: { ...account, password } });
  assert.equal(result.res.code, 200);
  assert.notEqual(result.update.$set.password, body.newPassword);
  assert.equal(await bcrypt.compare(body.newPassword, result.update.$set.password), true);
  assert.equal(await bcrypt.compare('old-password', result.update.$set.password), false);
});

test("missing or disabled accounts and database failures cannot change passwords or leak errors", async () => {
  for (const user of [null, { ...account, isBanned: true }, { ...account, deletedAt: new Date() }]) {
    const result = await request(body, { user });
    assert.equal(result.res.code, 401); assert.equal(result.writes, 0);
  }
  const offline = await request(body, { offline: true });
  assert.equal(offline.res.code, 503); assert.equal(offline.writes, 0);
  assert.doesNotMatch(offline.res.body.message, /private database/);
});

test("concurrent password or contact changes return conflict instead of a false success", async () => {
  const result = await request(body, { stale: true });
  assert.equal(result.res.code, 409);
});

test('account password change still requires an authenticated account', async () => {
  const result = await request(body, { unauthenticated: true });
  assert.equal(result.res.code, 401); assert.equal(result.writes, 0);
});
