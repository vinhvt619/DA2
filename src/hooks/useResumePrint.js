import { useReactToPrint } from "react-to-print";
import { showToast } from "../utils/toast.js";

const PRINT_PAGE_STYLE = `
  @page { size: A4; margin: 0; }
  @media print {
    html, body { margin: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
`;

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
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const pages = contentRef.current?.querySelector(".cv-resume-pages");
        if (!pages || pages.dataset.paginationReady === "true") break;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      const pages = contentRef.current?.querySelector(".cv-resume-pages");
      if (pages?.dataset.paginationReady === "false") throw new Error("CV chưa sẵn sàng để in. Vui lòng thử lại.");
      if (pages?.dataset.resumeOverflow === "true") throw new Error("Nội dung vượt quá 2 trang A4. Hãy rút gọn nội dung trước khi xuất PDF.");
    },
    onPrintError: (_location, error) => {
      showToast(error?.message || "Không thể mở hộp thoại in CV lúc này.", "error");
      onAfterPrint?.();
    },
    pageStyle: PRINT_PAGE_STYLE,
  });
}
