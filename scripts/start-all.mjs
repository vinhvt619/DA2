import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const processes = ["dev", "start"].map((script) => {
  const command = isWindows ? (process.env.ComSpec || "cmd.exe") : npmCommand;
  const args = isWindows
    ? ["/d", "/s", "/c", `${npmCommand} run ${script}`]
    : ["run", script];
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
  });

  child.on("error", (error) => {
    console.error(`[start:all] Không thể chạy npm run ${script}:`, error.message);
  });

  return child;
});

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

for (const child of processes) {
  child.on("exit", (code, signal) => {
    if (!stopping && (code !== 0 || signal)) {
      stopAll(code ?? 1);
    }
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
