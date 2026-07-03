import { useEffect } from "react";

export default function useCvZoom() {
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 794) {
        const zoomVal = (width - 32) / 794;
        document.documentElement.style.setProperty("--cv-zoom", zoomVal.toString());
      } else {
        document.documentElement.style.setProperty("--cv-zoom", "0.9");
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize immediately

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
}
