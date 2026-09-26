import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const viteCli = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);
const playwrightCli = fileURLToPath(
  new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
);
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:4000";

let devServer;
let testRunner;
let isStopping = false;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForExit = (child) =>
  new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });

async function isServerReady() {
  try {
    const response = await fetch(baseURL, {
      signal: AbortSignal.timeout(1_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (devServer?.exitCode !== null) {
      throw new Error("Vite đã dừng trước khi trang kiểm thử sẵn sàng.");
    }
    if (await isServerReady()) return;
    await wait(250);
  }

  throw new Error(`Không thể mở ${baseURL} sau 120 giây.`);
}

async function stopDevServer() {
  if (!devServer || devServer.exitCode !== null) return;

  devServer.kill();
  const exited = await Promise.race([
    waitForExit(devServer).then(() => true),
    wait(3_000).then(() => false),
  ]);

  if (!exited && devServer.exitCode === null) {
    devServer.kill("SIGKILL");
  }
}

async function stopAll(exitCode = 1) {
  if (isStopping) return;
  isStopping = true;
  if (testRunner?.exitCode === null) testRunner.kill();
  await stopDevServer();
  process.exit(exitCode);
}

process.once("SIGINT", () => void stopAll(130));
process.once("SIGTERM", () => void stopAll(143));

try {
  if (!(await isServerReady())) {
    devServer = spawn(process.execPath, [viteCli], {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    });
    await waitForServer();
  }

  testRunner = spawn(
    process.execPath,
    [playwrightCli, "test", ...process.argv.slice(2)],
    {
      cwd: projectRoot,
      env: { ...process.env, E2E_BASE_URL: baseURL },
      stdio: "inherit",
    },
  );

  const { code } = await waitForExit(testRunner);
  process.exitCode = code ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await stopDevServer();
}
