import { useReactToPrint } from "react-to-print";
import { showToast } from "../utils/toast.js";

const PRINT_PAGE_STYLE = `
  @page { size: A4; margin: 0; }
  @media print {
    html, body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
`;

export const SINGLE_PAGE_OVERFLOW_MESSAGE =
  "Nội dung vượt quá 1 trang A4. Hãy chọn bố cục 2 trang hoặc rút gọn nội dung trước khi xuất PDF.";
export const TWO_PAGE_OVERFLOW_MESSAGE =
  "Nội dung vượt quá 2 trang A4. Hãy rút gọn nội dung trước khi xuất PDF.";
export const PRINT_NOT_READY_MESSAGE =
  "CV chưa sẵn sàng để in. Vui lòng thử lại.";

export function getResumePrintTitle(title) {
  return (String(title || "CV-cua-toi").trim() || "CV-cua-toi")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ");
}

export default function useResumePrint({
  contentRef,
  title,
  onAfterPrint,
}) {
  return useReactToPrint({
    contentRef,
    documentTitle: () => getResumePrintTitle(title),
    onAfterPrint,
    onBeforePrint: async () => {
      await document.fonts?.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const deadline = performance.now() + 2500;
      for (let attempt = 0; attempt < 60 && performance.now() < deadline; attempt += 1) {
        const root = contentRef.current;
        const pages = root?.querySelector(".cv-resume-pages");
        const fitPage = root?.querySelector("[data-fit-ready]");
        const hasLayoutNode = Boolean(pages || fitPage);
        const pagesReady = !pages || pages.dataset.paginationReady === "true";
        const fitReady = !fitPage || fitPage.dataset.fitReady === "true";
        const imagesReady = Array.from(root?.querySelectorAll("img") || []).every((img) => img.complete);
        if (hasLayoutNode && pagesReady && fitReady && imagesReady) {
          break;
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      const root = contentRef.current;
      const pages = root?.querySelector(".cv-resume-pages");
      const fitPage = root?.querySelector("[data-fit-ready]");
      if (!root || (!pages && !fitPage)) {
        throw new Error(PRINT_NOT_READY_MESSAGE);
      }

      if (fitPage) {
        if (fitPage.dataset.fitReady !== "true" || !fitPage.clientHeight || !fitPage.clientWidth) {
          throw new Error(PRINT_NOT_READY_MESSAGE);
        }
        if (fitPage.dataset.resumeOverflow === "true") {
          throw new Error(SINGLE_PAGE_OVERFLOW_MESSAGE);
        }
      }

      if (pages) {
        const renderedPages = Array.from(pages.querySelectorAll(".cv-resume-page"));
        if (
          pages.dataset.paginationReady !== "true" ||
          renderedPages.length === 0 ||
          renderedPages.some((page) => !page.clientHeight || !page.clientWidth)
        ) {
          throw new Error(PRINT_NOT_READY_MESSAGE);
        }
        if (pages.dataset.resumeOverflow === "true") {
          throw new Error(TWO_PAGE_OVERFLOW_MESSAGE);
        }
      }
    },
    onPrintError: (_location, error) => {
      showToast(error?.message || "Không thể mở hộp thoại in CV lúc này.", "error");
      onAfterPrint?.();
    },
    pageStyle: PRINT_PAGE_STYLE,
  });
}
