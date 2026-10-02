import { setTimeout as sleep } from "node:timers/promises";
import { createServer } from "node:net";

export async function assertDevPortsAvailable({ frontendPort = 4000, backendPort = 5000, host = "0.0.0.0" } = {}) {
  for (const [label, port] of [["Frontend", frontendPort], ["Backend", backendPort]]) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Cổng ${label} không hợp lệ: ${port}.`);
    }
    await new Promise((resolve, reject) => {
      const probe = createServer();
      probe.once("error", (error) => {
        if (error.code === "EADDRINUSE") {
          reject(new Error(`${label}: cổng ${port} đang được sử dụng. Dừng phiên RabbitCV cũ bằng Ctrl+C trong terminal đã chạy, rồi chạy lại npm run start:all.`));
        } else reject(error);
      });
      probe.listen({ host, port, exclusive: true }, () => probe.close((error) => error ? reject(error) : resolve()));
    });
  }
}

export async function waitForBackendHealth({
  url, timeoutMs = 60_000, intervalMs = 500, requestTimeoutMs = 6_000,
  fetchImpl = fetch, sleepImpl = sleep, now = Date.now, isStopping = () => false,
}) {
  const deadline = now() + timeoutMs;
  while (!isStopping() && now() < deadline) {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(Math.max(1, Math.min(requestTimeoutMs, deadline - now()))) });
      if (response.ok && (await response.json()).ok === true) return;
    } catch {
      // The process may still be loading modules or connecting to MongoDB.
    }
    if (!isStopping()) await sleepImpl(Math.min(intervalMs, Math.max(0, deadline - now())));
  }
  if (isStopping()) return;
  throw new Error(`Backend chưa sẵn sàng tại ${url} sau ${timeoutMs / 1000} giây. Kiểm tra log backend và kết nối MongoDB.`);
}

export async function startDevServices({ start, waitForBackend, checkPorts = async () => {}, onBackendReady = () => {}, isStopping = () => false }) {
  await checkPorts();
  if (isStopping()) return;
  start("start");
  await waitForBackend();
  if (!isStopping()) {
    onBackendReady();
    start("dev");
  }
}
