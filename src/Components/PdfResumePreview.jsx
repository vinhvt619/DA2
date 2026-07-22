import { useEffect, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PdfPage({ document, pageNumber }) {
  const canvasRef = useRef(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;
    let renderTask;

    const renderPage = async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (!active || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 2 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        renderTask = page.render({
          canvasContext: context,
          viewport,
          background: "rgb(255, 255, 255)",
        });
        await renderTask.promise;
      } catch (error) {
        if (active && error?.name !== "RenderingCancelledException") {
          console.error(`Không thể hiển thị trang PDF ${pageNumber}:`, error);
          setPageError("Không thể hiển thị trang này.");
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [document, pageNumber]);

  return (
    <div className="cv-wrapper pdf-resume-page relative flex items-center justify-center overflow-hidden rounded-sm border border-gray-100 bg-white shadow-lg print:shadow-none">
      {pageError ? (
        <div className="px-8 text-center text-sm font-semibold text-red-500">
          {pageError}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="pdf-resume-canvas block h-full w-full bg-white"
          role="img"
          aria-label={`Trang ${pageNumber} của CV`}
        />
      )}
    </div>
  );
}

export default function PdfResumePreview({ source }) {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!source) return undefined;

    let active = true;
    const loadingTask = getDocument(source);

    setPdfDocument(null);
    setError("");

    loadingTask.promise
      .then((document) => {
        if (active) setPdfDocument(document);
      })
      .catch((loadError) => {
        if (!active) return;
        console.error("Không thể đọc CV PDF:", loadError);
        setError("Không thể hiển thị CV PDF. Bạn vẫn có thể tải tệp gốc về máy.");
      });

    return () => {
      active = false;
      loadingTask.destroy();
    };
  }, [source]);

  if (error) {
    return (
      <div className="w-full max-w-3xl rounded-2xl border border-red-100 bg-white px-8 py-12 text-center text-sm font-semibold text-red-500 shadow-sm">
        {error}
      </div>
    );
  }

  if (!pdfDocument) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white px-8 py-12 shadow-sm">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#9346F5] border-t-transparent" />
        <p className="text-sm font-semibold text-gray-500">Đang dựng CV theo khổ giấy...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 pb-10 print:gap-0 print:pb-0">
      {Array.from({ length: pdfDocument.numPages }, (_, index) => (
        <PdfPage
          key={`${pdfDocument.fingerprints?.[0] || "pdf"}-${index + 1}`}
          document={pdfDocument}
          pageNumber={index + 1}
        />
      ))}
    </div>
  );
}
