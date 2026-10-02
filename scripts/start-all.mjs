import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { assertDevPortsAvailable, startDevServices, waitForBackendHealth } from "./devStartup.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const processes = [];
const start = (script) => {
  const command = isWindows ? (process.env.ComSpec || "cmd.exe") : npmCommand;
  const args = isWindows
    ? ["/d", "/s", "/c", `${npmCommand} run ${script}`]
    : ["run", script];
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
  processes.push(child);

  child.on("error", (error) => {
    console.error(`[start:all] Không thể chạy npm run ${script}:`, error.message);
    stopAll(1);
  });

  child.on("exit", (code, signal) => {
    if (!stopping) stopAll(signal ? 1 : code ?? 1);
  });

  return child;
};

let stopping = false;
const stopAll = (exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (child.killed || !child.pid) continue;
    if (isWindows) {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      child.kill("SIGTERM");
    }
  }
  process.exitCode = exitCode;
};

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

try {
  console.log("[start:all] Đang kiểm tra cổng frontend và backend...");
  await startDevServices({
    start,
    isStopping: () => stopping,
    checkPorts: async () => {
      await assertDevPortsAvailable({ backendPort: Number(process.env.PORT || 5000) });
      console.log("[start:all] Đang khởi động backend, chờ API và MongoDB sẵn sàng...");
    },
    onBackendReady: () => console.log("[start:all] Backend đã sẵn sàng, đang mở frontend..."),
    waitForBackend: () => waitForBackendHealth({
      url: `http://127.0.0.1:${process.env.PORT || 5000}/api/health`,
      isStopping: () => stopping,
    }),
  });
} catch (error) {
  console.error(`[start:all] ${error.message}`);
  stopAll(1);
}
