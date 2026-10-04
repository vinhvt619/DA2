import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountAuthMiddleware } from '../server/services/accountAuthService.js';
async function check(account, options = {}) {
  let allowed = false; let connected = false;
  const req = { cookies: { token: 'old-valid-cookie' } }; const res = { status(code) { this.code = code; return this; }, json() { return this; } };
  const handler = createAccountAuthMiddleware({ verifyToken: () => ({ id: 'user', role: 'company' }), ensureConnected: async () => { connected = true; if (options.unavailable) throw new Error('DB down'); }, UserModel: { findById: () => ({ select: async () => account }) } });
  await handler(req, res, () => { allowed = true; }); return { allowed, connected, req, res };
}
test('old valid JWT cannot access API after account is deleted or banned', async () => {
  for (const account of [null, { role: 'company', isBanned: true }, { role: 'company', deletedAt: new Date() }]) { const result = await check(account); assert.equal(result.allowed, false); assert.equal(result.res.code, 401); }
});
test('authorization uses current database role and connects before reading account', async () => { const result = await check({ role: 'employee' }); assert.equal(result.allowed, true); assert.equal(result.connected, true); assert.equal(result.req.user.role, 'employee'); });
test('database outage is not reported as invalid password or expired login', async () => { const result = await check({}, { unavailable: true }); assert.equal(result.res.code, 503); assert.equal(result.allowed, false); });
