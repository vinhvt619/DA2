import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("message badge is persisted as read instead of only hidden in React state", async () => {
  const [server, socketContext, header, messagePage] = await Promise.all([
    readFile(new URL("../server/server.js", import.meta.url), "utf8"),
    readFile(new URL("../src/context/SocketContext.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Components/Header.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Pages/Message.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(server, /app\.patch\("\/api\/chat\/mark-all-read"/);
  assert.match(server, /ChatReadState\.bulkWrite/);
  assert.match(socketContext, /fetch\("\/api\/chat\/mark-all-read"/);
  assert.match(header, /markAllMessagesAsRead\(\)/);
  assert.match(messagePage, /markRoomAsRead\(activeRoom\)/);
});

test("notification menu persists read state before refreshing its list", async () => {
  const [bell, hook] = await Promise.all([
    readFile(new URL("../src/Components/NotificationBell.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useNotifications.js", import.meta.url), "utf8"),
  ]);

  assert.match(bell, /await markAllAsRead\(\);[\s\S]*await fetchNotifications\(\);/);
  assert.match(hook, /\/api\/notifications\/mark-all-read/);
  assert.match(hook, /keepalive:\s*true/);
});
