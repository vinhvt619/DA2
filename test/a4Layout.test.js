import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

test("CV wrapper and print page use A4 dimensions", async () => {
  const [css, preview] = await Promise.all([
    readFile(new URL("../src/App.css", import.meta.url), "utf8"),
    readFile(
      new URL("../src/Components/ResumePreview.jsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(css, /@page\s*{[\s\S]*?size:\s*A4\s*;/);
  assert.match(css, /\.cv-wrapper\s*{[\s\S]*?width:\s*210mm\s*;/);
  assert.match(css, /\.cv-wrapper\s*{[\s\S]*?height:\s*297mm\s*;/);
  assert.match(preview, /function AutoFitResumePage/);
  assert.match(preview, /requiredHeight\s*=\s*template\.scrollHeight/);
  assert.match(preview, /content\.style\.transform\s*=\s*`scale\(\$\{scale\}\)`/);
  assert.doesNotMatch(preview, /content\.style\.zoom/);
  assert.match(preview, /<AutoFitResumePage>/);
  assert.ok(Math.abs(A4_WIDTH_MM / A4_HEIGHT_MM - 1 / 1.414) < 0.001);
});

test("CV column helpers preserve the twelve-column grid used by template spans", async () => {
  const css = await readFile(
    new URL("../src/App.css", import.meta.url),
    "utf8",
  );

  const basicGrid = css.match(/\.resume-basic-grid\s*{[\s\S]*?}/)?.[0];
  const twoColumnGrid = css.match(
    /\.resume-two-column-grid\s*{[\s\S]*?}/,
  )?.[0];

  assert.match(basicGrid, /grid-template-columns:\s*repeat\(12,/);
  assert.match(twoColumnGrid, /grid-template-columns:\s*repeat\(12,/);
});

test("CV editor and library expose PDF download actions backed by shared print hook", async () => {
  const [editor, library, printHook] = await Promise.all([
    readFile(new URL("../src/Pages/Resume.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Pages/ResumeSelection.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useResumePrint.js", import.meta.url), "utf8"),
  ]);

  assert.match(editor, /Tải PDF/);
  assert.match(editor, /useResumePrint/);
  assert.match(editor, /ref={printContentRef}/);
  assert.match(library, /Tải PDF/);
  assert.match(library, /resume-library-print-root/);
  assert.match(library, /useResumePrint/);
  assert.match(printHook, /useReactToPrint/);
  assert.doesNotMatch(editor, /window\.print\(\)/);
  assert.doesNotMatch(library, /window\.print\(\)/);
});

test("uploaded PDF resumes render as clean A4 pages without a native iframe viewer", async () => {
  const [viewer, pdfPreview] = await Promise.all([
    readFile(new URL("../src/Pages/ViewResume.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Components/PdfResumePreview.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(viewer, /<PdfResumePreview source={pdfBlobUrl} \/>/);
  assert.doesNotMatch(viewer, /<iframe/);
  assert.match(pdfPreview, /getDocument\(source\)/);
  assert.match(pdfPreview, /className="cv-wrapper pdf-resume-page/);
});

test("elegant CV keeps education in the wider left column", async () => {
  const preview = await readFile(
    new URL("../src/Components/ResumePreview.jsx", import.meta.url),
    "utf8",
  );
  const elegantTemplate = preview.replace(/\r\n/g, "\n").match(
    /const ElegantTemplate = \([\s\S]*?\n\);\n\nconst CreativeTemplate/,
  )?.[0];

  assert.ok(elegantTemplate, "ElegantTemplate should exist");

  const mainColumn = elegantTemplate.match(
    /<main className="col-span-8[\s\S]*?<\/main>/,
  )?.[0];
  const sidebarColumn = elegantTemplate.match(
    /<aside className="col-span-4[\s\S]*?<\/aside>/,
  )?.[0];

  assert.match(mainColumn, /<TemplateEducation items={education}/);
  assert.doesNotMatch(sidebarColumn, /<TemplateEducation items={education}/);
});
