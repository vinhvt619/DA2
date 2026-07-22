export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;
export const PDF_DATA_URL_PREFIX = "data:application/pdf;base64,";

export const getPdfSizeBytes = (fileData) => {
  if (typeof fileData !== "string" || !fileData.startsWith(PDF_DATA_URL_PREFIX)) {
    return null;
  }

  const base64 = fileData.slice(PDF_DATA_URL_PREFIX.length).replace(/\s/g, "");
  if (!base64.startsWith("JVBERi0") || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return null;
  }

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

export const validatePdfUpload = ({ fileData, fileName }) => {
  const normalizedFileName = String(fileName || "").trim();
  const size = getPdfSizeBytes(fileData);

  if (!normalizedFileName.toLowerCase().endsWith(".pdf") || size === null) {
    return { valid: false, message: "Chi ho tro CV dinh dang PDF." };
  }

  if (size > MAX_PDF_SIZE_BYTES) {
    return { valid: false, message: "File PDF vuot qua gioi han 5MB." };
  }

  return { valid: true, fileName: normalizedFileName, size };
};
