import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoPasswordResetHandler, isDemoPasswordResetEnabled } from '../server/services/passwordChangeService.js';

const account = { _id: 'demo-account', username: 'demo-user', email: 'Owner+cv@example.test', phoneNumber: '+84 912-345-678', password: 'old-hash' };
const body = { username: 'demo-user', contact: 'owner+cv@example.test', newPassword: 'new-password', confirmPassword: 'new-password' };
async function request(payload = body, options = {}) {
  let lookups = 0; let writes = 0; let filter; let change;
  const res = { status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  const handler = createDemoPasswordResetHandler({
    enabled: options.enabled ?? true,
    UserModel: {
      find(query) {
        lookups++;
        return { select: () => ({ limit: async (count) => {
          assert.equal(count, 2);
          if (options.offline) throw new Error('private database details');
          return options.users || ((query.username === account.username && query.email?.test(account.email)) ? [account] : []);
        } }) };
      },
      findOneAndUpdate(query, update) { writes++; filter = query; change = update; return { select: async () => options.stale ? null : { _id: account._id } }; },
    },
    comparePassword: async (value) => value === 'old-password', hashPassword: async () => 'new-hash',
  });
  await handler({ body: payload }, res);
  return { res, lookups, writes, filter, change };
}

test('direct reset is disabled in production unless explicitly enabled for demo', async () => {
  assert.equal(isDemoPasswordResetEnabled({ NODE_ENV: 'production' }), false);
  assert.equal(isDemoPasswordResetEnabled({ NODE_ENV: 'development' }), true);
  assert.equal(isDemoPasswordResetEnabled({ NODE_ENV: 'production', ALLOW_DEMO_PASSWORD_RESET: 'true' }), true);
  assert.equal(isDemoPasswordResetEnabled({ NODE_ENV: 'development', ALLOW_DEMO_PASSWORD_RESET: 'false' }), false);
  const result = await request(body, { enabled: false });
  assert.equal(result.res.code, 403); assert.equal(result.lookups, 0); assert.equal(result.writes, 0);
});

test('demo requires the username and its registered email without a session/current password', async () => {
  for (const contact of ['Owner+CV@EXAMPLE.test', ' owner+cv@example.test ']) {
    const result = await request({ ...body, username: ' demo-user ', contact });
    assert.equal(result.res.code, 200); assert.equal(result.writes, 1);
    assert.equal(result.filter._id, account._id); assert.equal(result.filter.password, account.password);
    assert.equal(result.filter.username, account.username);
    assert.deepEqual(result.change, { $set: { password: 'new-hash' } });
  }
});

test('invalid, mismatched or oversized new passwords never reach the database', async () => {
  for (const payload of [null, {}, { ...body, username: undefined }, { ...body, username: '' }, { ...body, username: {} }, { ...body, username: 'a'.repeat(255) }, { ...body, confirmPassword: '' }, { ...body, confirmPassword: 'mismatch' }, { ...body, contact: {} }, { ...body, contact: '0912345678' }, { ...body, newPassword: 'short' }, { ...body, newPassword: 'a'.repeat(73) }]) {
    const result = await request(payload); assert.equal(result.res.code, 400); assert.equal(result.lookups, 0); assert.equal(result.writes, 0);
  }
});

test('unknown, ambiguous, banned or deleted contacts cannot change a password', async () => {
  for (const users of [[], [account, { ...account, _id: 'another' }], [{ ...account, isBanned: true }], [{ ...account, deletedAt: new Date() }]]) {
    const result = await request(body, { users }); assert.equal(result.res.code, 400); assert.equal(result.writes, 0);
  }
  for (const contact of ['owner.cv@example.test', 'unknown@example.test', '0999999999', '.*@example.test', '0912x345678']) {
    const result = await request({ ...body, contact }); assert.equal(result.res.code, 400); assert.equal(result.writes, 0);
  }
});

test('demo rejects password reuse and concurrent writes without leaking database details', async () => {
  const reused = await request({ ...body, newPassword: 'old-password', confirmPassword: 'old-password' });
  assert.equal(reused.res.code, 400); assert.equal(reused.writes, 0);
  assert.equal((await request(body, { stale: true })).res.code, 409);
  const offline = await request(body, { offline: true });
  assert.equal(offline.res.code, 503); assert.doesNotMatch(offline.res.body.message, /private database/);
});

test('a valid email cannot reset another username or bypass the account match', async () => {
  for (const username of ['another-user', '.*', 'DEMO-USER']) {
    const result = await request({ ...body, username });
    assert.equal(result.res.code, 400); assert.equal(result.writes, 0);
    assert.equal(result.res.body.message, 'Tên đăng nhập hoặc email không khớp với tài khoản khả dụng.');
  }
  const wrongAccount = await request(body, { users: [{ ...account, username: 'another-user' }] });
  assert.equal(wrongAccount.res.code, 400); assert.equal(wrongAccount.writes, 0);
});
