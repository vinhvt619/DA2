import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("../", import.meta.url));

export const OCR_ASSET_MAP = {
  "/ocr/pdf.worker.min.mjs": {
    file: path.join(rootDir, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
    contentType: "application/javascript; charset=utf-8",
  },
  "/ocr/worker.min.js": {
    file: path.join(rootDir, "node_modules/tesseract.js/dist/worker.min.js"),
    contentType: "application/javascript; charset=utf-8",
  },
  "/ocr/tesseract-core-lstm.wasm.js": {
    file: path.join(rootDir, "node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js"),
    contentType: "application/javascript; charset=utf-8",
  },
  "/ocr/lang-data/vie.traineddata.gz": {
    file: path.join(rootDir, "node_modules/@tesseract.js-data/vie/4.0.0_best_int/vie.traineddata.gz"),
    contentType: "application/gzip",
  },
  "/ocr/lang-data/eng.traineddata.gz": {
    file: path.join(rootDir, "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz"),
    contentType: "application/gzip",
  },
};

function createOcrMiddleware() {
  return (req, res, next) => {
    const cleanUrl = (req.url || "").split("?")[0];
    const asset = OCR_ASSET_MAP[cleanUrl];
    if (!asset || !fs.existsSync(asset.file)) {
      return next();
    }
    const stat = fs.statSync(asset.file);
    res.statusCode = 200;
    res.setHeader("Content-Type", asset.contentType);
    res.setHeader("Content-Length", String(stat.size));
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self' 'wasm-unsafe-eval'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'",
    );
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    fs.createReadStream(asset.file).pipe(res);
    return undefined;
  };
}

export function viteOcrAssets() {
  return {
    name: "vite-ocr-assets",
    configureServer(server) {
      server.middlewares.use(createOcrMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createOcrMiddleware());
    },
    generateBundle() {
      for (const [routePath, asset] of Object.entries(OCR_ASSET_MAP)) {
        if (fs.existsSync(asset.file)) {
          this.emitFile({
            type: "asset",
            fileName: routePath.replace(/^\/+/, ""),
            source: fs.readFileSync(asset.file),
          });
        }
      }
    },
  };
}
