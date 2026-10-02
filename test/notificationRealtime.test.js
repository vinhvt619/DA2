import test from "node:test";
import assert from "node:assert/strict";
import { createNotificationPublisher, createNotificationRelayHandler } from "../server/services/notificationRealtime.js";
import Notification from "../server/models/Notification.js";
import { createNotification, createNotificationsBulk, setNotificationPublisher } from "../server/utils/notificationService.js";

const notification = {
  _id: "507f1f77bcf86cd799439011",
  recipient: "507f1f77bcf86cd799439012",
  recipientRole: "employee",
  type: "APPLICATION_STATUS_CHANGED",
  title: "Trạng thái hồ sơ đã thay đổi",
  message: "Hồ sơ chuyển sang Interview",
};
const makeIo = () => {
  const events = [];
  return { events, to(room) { return { emit(event, payload) { events.push({ room, event, payload }); } }; } };
};

test("local notification delivery targets only the recipient's authenticated room", async () => {
  const io = makeIo();
  await createNotificationPublisher({ io })(notification);
  assert.deepEqual(io.events, [{ room: `user_${notification.recipient}`, event: "newNotification", payload: notification }]);
});

test("Vercel forwards saved notifications to Render using the shared secret", async () => {
  const io = makeIo();
  const publish = createNotificationPublisher({ io, serverUrl: "https://realtime.example", sharedSecret: "test-secret", fetchImpl: async (url, options) => {
    assert.equal(url, "https://realtime.example/api/realtime/notifications");
    assert.equal(options.headers["X-Realtime-Secret"], "test-secret");
    assert.deepEqual(JSON.parse(options.body), { receiverId: notification.recipient, notification });
    return { ok: true };
  } });
  await publish(notification);
  assert.equal(io.events.length, 0);
});

test("failed remote delivery still attempts local delivery", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const fetchImpl of [async () => { throw new Error("timeout"); }, async () => ({ ok: false, status: 503 })]) {
    const io = makeIo();
    await createNotificationPublisher({ io, serverUrl: "https://realtime.example", sharedSecret: "secret", fetchImpl })(notification);
    assert.equal(io.events.length, 1);
  }
});

test("relay rejects unauthorized and mismatched recipients before emitting", () => {
  const io = makeIo();
  const handler = createNotificationRelayHandler({ io, sharedSecret: "secret" });
  const invoke = (secret, body) => {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    handler({ get: () => secret, body }, res);
    return res;
  };
  const body = { receiverId: notification.recipient, notification };
  assert.equal(invoke("wrong", body).statusCode, 401);
  assert.equal(invoke("secret", { ...body, receiverId: "507f1f77bcf86cd799439013" }).statusCode, 400);
  assert.equal(invoke("secret", { receiverId: notification.recipient, notification: {} }).statusCode, 400);
  assert.equal(io.events.length, 0);
  assert.equal(invoke("secret", body).statusCode, 202);
  assert.equal(io.events[0].room, `user_${notification.recipient}`);
});

test("notification creation persists before emission and preserves the record if emission fails", async (t) => {
  const actions = [];
  t.mock.method(Notification.prototype, "save", async function () { actions.push("save"); return this; });
  t.mock.method(console, "error", () => {});
  setNotificationPublisher(async (record) => {
    actions.push("emit");
    assert.equal(String(record.recipient), notification.recipient);
    throw new Error("disconnected");
  });
  t.after(() => setNotificationPublisher(async () => {}));
  const result = await createNotification(notification);
  assert.deepEqual(actions, ["save", "emit"]);
  assert.equal(result.title, notification.title);
});

test("bulk notifications publish once per saved record; failed saves never emit", async (t) => {
  const records = [notification, { ...notification, _id: "507f1f77bcf86cd799439013" }];
  const emitted = [];
  t.mock.method(Notification, "insertMany", async () => records);
  t.mock.method(console, "error", () => {});
  setNotificationPublisher(async (record) => emitted.push(record));
  t.after(() => setNotificationPublisher(async () => {}));
  assert.deepEqual(await createNotificationsBulk(records), records);
  assert.deepEqual(emitted, records);
  t.mock.method(Notification.prototype, "save", async () => { throw new Error("save failed"); });
  assert.equal(await createNotification(notification), null);
  assert.equal(emitted.length, 2);
});
