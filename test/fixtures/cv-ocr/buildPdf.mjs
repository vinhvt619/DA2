export function extractPngIdatInfo(pngBuffer) {
  const png = Buffer.isBuffer(pngBuffer) ? pngBuffer : Buffer.from(pngBuffer);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 2;
  const idatChunks = [];

  while (offset < png.length) {
    const len = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    }
    offset += 12 + len;
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    idatData: Buffer.concat(idatChunks),
  };
}

export function buildPdfFromPages(pageSpecs = []) {
  // Each pageSpec is either:
  // { type: "image", pngBuffer }
  // or { type: "text", lines: string[], watermarkOnly?: boolean }
  const objects = [];
  const addObject = (bodyBufferOrString) => {
    const id = objects.length + 1;
    const buf = Buffer.isBuffer(bodyBufferOrString)
      ? bodyBufferOrString
      : Buffer.from(String(bodyBufferOrString), "latin1");
    objects.push({ id, buf });
    return id;
  };

  // Reserve 1 for Catalog, 2 for Pages, 3 for Font
  addObject(""); // 1: Catalog
  addObject(""); // 2: Pages
  const fontObjId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageObjIds = [];

  for (const spec of pageSpecs) {
    if (spec.type === "image") {
      const info = extractPngIdatInfo(spec.pngBuffer);
      const colors = info.colorType === 0 ? 1 : 3;
      const colorSpace = colors === 1 ? "/DeviceGray" : "/DeviceRGB";
      const imgHeader = Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${info.width} /Height ${info.height} /ColorSpace ${colorSpace} /BitsPerComponent ${info.bitDepth} /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors ${colors} /BitsPerComponent ${info.bitDepth} /Columns ${info.width} >> /Length ${info.idatData.length} >>\nstream\n`,
        "latin1",
      );
      const imgFooter = Buffer.from("\nendstream", "latin1");
      const imgObjId = addObject(Buffer.concat([imgHeader, info.idatData, imgFooter]));

      let contentStream = `q\n595.28 0 0 841.89 0 0 cm\n/Im1 Do\nQ\n`;
      if (spec.extraAsciiText) {
        const escaped = spec.extraAsciiText.replace(/([()\\])/g, "\\$1");
        contentStream += `BT\n/F1 10 Tf\n36 20 Td\n(${escaped}) Tj\nET\n`;
      }
      const contentObjId = addObject(
        `<< /Length ${Buffer.byteLength(contentStream, "latin1")} >>\nstream\n${contentStream}endstream`,
      );

      const pageObjId = addObject(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im1 ${imgObjId} 0 R >> /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`,
      );
      pageObjIds.push(pageObjId);
    } else {
      const lines = spec.lines || [];
      let y = 790;
      const ops = ["BT", "/F1 11 Tf"];
      for (const line of lines) {
        const safeLine = String(line || "")
          .replace(/[^\x20-\x7E]/g, " ")
          .replace(/([()\\])/g, "\\$1");
        ops.push(`1 0 0 1 42 ${y} Tm (${safeLine}) Tj`);
        y -= 16;
      }
      ops.push("ET\n");
      const contentStream = ops.join("\n");
      const contentObjId = addObject(
        `<< /Length ${Buffer.byteLength(contentStream, "latin1")} >>\nstream\n${contentStream}endstream`,
      );
      const pageObjId = addObject(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`,
      );
      pageObjIds.push(pageObjId);
    }
  }

  objects[0].buf = Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1");
  objects[1].buf = Buffer.from(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjIds.length} >>`,
    "latin1",
  );

  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  const offsets = [0];
  let currentOffset = chunks[0].length;

  for (const obj of objects) {
    offsets.push(currentOffset);
    const prefix = Buffer.from(`${obj.id} 0 obj\n`, "latin1");
    const suffix = Buffer.from("\nendobj\n", "latin1");
    chunks.push(prefix, obj.buf, suffix);
    currentOffset += prefix.length + obj.buf.length + suffix.length;
  }

  const xrefOffset = currentOffset;
  const xrefLines = [`xref\n0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let i = 1; i <= objects.length; i += 1) {
    xrefLines.push(`${String(offsets[i]).padStart(10, "0")} 00000 n `);
  }
  const trailer = `${xrefLines.join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(trailer, "latin1"));

  return Buffer.concat(chunks);
}
