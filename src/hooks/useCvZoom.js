import { useCallback, useEffect, useState } from "react";

const A4_WIDTH_IN_PIXELS = 794;
const MAX_ZOOM = 0.9;
const MIN_ZOOM = 0.35;
const CANVAS_GUTTER = 32;

export default function useCvZoom() {
  const [container, setContainer] = useState(null);
  const containerRef = useCallback((node) => setContainer(node), []);

  useEffect(() => {
    const updateZoom = () => {
      const containerWidth = container?.clientWidth || window.innerWidth;
      const availableWidth = Math.max(0, containerWidth - CANVAS_GUTTER);
      const zoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, availableWidth / A4_WIDTH_IN_PIXELS),
      );

      document.documentElement.style.setProperty("--cv-zoom", String(zoom));
    };

    const observer =
      container && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateZoom)
        : null;

    if (observer) observer.observe(container);
    window.addEventListener("resize", updateZoom);
    updateZoom();

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateZoom);
    };
  }, [container]);

  return containerRef;
}
