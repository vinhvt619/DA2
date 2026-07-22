import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PDF_SIZE_BYTES,
  PDF_DATA_URL_PREFIX,
  getPdfSizeBytes,
  validatePdfUpload,
} from "../server/utils/pdfValidation.js";

const createPdfDataUrl = (size = 32) => {
  const header = Buffer.from("%PDF-1.7\n");
  const body = Buffer.alloc(Math.max(0, size - header.length), 0x20);
  return `${PDF_DATA_URL_PREFIX}${Buffer.concat([header, body]).toString("base64")}`;
};

test("accepts a PDF data URL and reports its decoded size", () => {
  const fileData = createPdfDataUrl(128);
  assert.equal(getPdfSizeBytes(fileData), 128);
  assert.deepEqual(validatePdfUpload({ fileData, fileName: "cv.pdf" }), {
    valid: true,
    fileName: "cv.pdf",
    size: 128,
  });
});

test("rejects Word files and non-PDF data", () => {
  assert.equal(validatePdfUpload({ fileData: createPdfDataUrl(), fileName: "cv.docx" }).valid, false);
  assert.equal(
    validatePdfUpload({
      fileData: `${PDF_DATA_URL_PREFIX}${Buffer.from("not a pdf").toString("base64")}`,
      fileName: "cv.pdf",
    }).valid,
    false,
  );
});

test("rejects PDF files larger than 5MB", () => {
  const fileData = createPdfDataUrl(MAX_PDF_SIZE_BYTES + 1);
  assert.equal(validatePdfUpload({ fileData, fileName: "large.pdf" }).valid, false);
});
