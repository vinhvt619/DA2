import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const distDir = path.join(rootDir, "dist");
const vercelJsonPath = path.join(rootDir, "vercel.json");

const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".gz": "application/gzip",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon",
};

export function createProductionServer({ port = 4199 } = {}) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf8"));
  const headerRules = (vercelConfig.headers || []).map((rule) => {
    let regex;
    if (rule.source.startsWith("/((?!")) {
      regex = new RegExp("^" + rule.source + "$");
    } else if (rule.source.includes("(.*)")) {
      regex = new RegExp("^" + rule.source.replace(/\(\.\*\)/g, ".*") + "$");
    } else {
      regex = new RegExp("^" + rule.source + "$");
    }
    return {
      source: rule.source,
      regex,
      headers: rule.headers,
    };
  });

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const pathname = parsedUrl.pathname;

    // Apply headers from matching vercel.json rules
    for (const rule of headerRules) {
      if (rule.regex.test(pathname)) {
        for (const header of rule.headers) {
          res.setHeader(header.key, header.value);
        }
      }
    }

    // Static file serving from distDir
    let filePath = path.join(distDir, pathname.replace(/^\/+/, ""));
    let isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

    if (!isFile && pathname.startsWith("/api/")) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    if (!isFile) {
      // SPA fallback to dist/index.html
      filePath = path.join(distDir, "index.html");
      isFile = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    }

    if (!isFile) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    const stat = fs.statSync(filePath);
    res.setHeader("Content-Length", String(stat.size));
    res.statusCode = 200;
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({
        port,
        baseURL: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
    server.on("error", reject);
  });
}
