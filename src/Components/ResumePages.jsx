import React, { useLayoutEffect, useRef, useState } from "react";
import "./ResumePages.css";

const preservedLayout = ["display", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin-top", "margin-right", "margin-bottom", "margin-left", "gap", "grid-template-columns"];

function clonePrintLayout(source) {
  const clone = source.cloneNode(true);
  const originals = [source, ...source.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  originals.forEach((element, index) => {
    const style = getComputedStyle(element);
    // Keep preview geometry when legacy print rules change template spacing.
    preservedLayout.forEach((property) => copies[index].style.setProperty(property, style.getPropertyValue(property), "important"));
    if (element.matches("img, .cv-avatar, .cv-reference-avatar")) {
      copies[index].style.setProperty("width", style.width, "important");
      copies[index].style.setProperty("height", style.height, "important");
    }
    copies[index].removeAttribute("id");
  });
  return clone;
}

function preparePage(page, source, continuation) {
  const template = clonePrintLayout(source);
  page.replaceChildren(template);
  if (continuation) {
    template.querySelectorAll("header, [data-resume-static]").forEach((element) => {
      const next = element.nextElementSibling;
      if (next?.matches("[data-resume-zone], .resume-two-column-grid, .cv-new-grid")) next.style.setProperty("margin-top", "0", "important");
      element.remove();
    });
    if (template.matches(".cv-new-graduate")) template.style.setProperty("padding-top", "32px", "important");
  }
  const pageRect = page.getBoundingClientRect();
  const zoom = pageRect.width / page.clientWidth;
  const zones = new Map();
  for (const zone of template.querySelectorAll("[data-resume-zone]")) {
    const sections = [...zone.children].filter((element) => element.tagName === "SECTION" && !element.hasAttribute("data-resume-static"));
    if (!sections.length) continue;
    const window = document.createElement("div");
    window.className = "cv-paged-window";
    const flow = document.createElement("div");
    flow.className = "cv-paged-flow";
    zone.insertBefore(window, sections[0]);
    window.append(flow);
    flow.append(...sections);
    const style = getComputedStyle(zone);
    const width = zone.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    let bottomPadding = 0;
    for (let ancestor = zone; ancestor && ancestor !== page; ancestor = ancestor.parentElement) {
      bottomPadding += parseFloat(getComputedStyle(ancestor).paddingBottom) || 0;
    }
    const top = (window.getBoundingClientRect().top - pageRect.top) / zoom;
    const height = Math.max(1, page.clientHeight - top - bottomPadding - 2);
    zones.set(zone.dataset.resumeZone, { window, flow, width, height });
  }
  return zones;
}

function paginatePages(pages, source) {
  const layouts = pages.map((page, index) => preparePage(page, source, index > 0));
  let overflow = false;
  for (const [key, first] of layouts[0]) {
    const second = layouts[1].get(key);
    const height = Math.max(first.height, second.height);
    const spacerHeight = height - first.height;
    [first, second].forEach(({ window, flow, width, height: availableHeight }, index) => {
      for (const entry of flow.querySelectorAll(".break-inside-avoid")) {
        if (entry.scrollHeight > first.height) {
          entry.style.setProperty("break-inside", "auto", "important");
          entry.style.setProperty("page-break-inside", "auto", "important");
        }
      }
      // A first-column spacer allows page two to use the space freed by its header.
      const spacer = document.createElement("div");
      spacer.style.height = `${spacerHeight}px`;
      spacer.style.breakInside = "avoid";
      flow.prepend(spacer);
      window.style.height = `${availableHeight}px`;
      flow.style.width = `${width * 2}px`;
      flow.style.height = `${height}px`;
      flow.style.columnWidth = `${width}px`;
      flow.style.transform = `translate(-${width * index}px, -${index === 0 ? spacerHeight : 0}px)`;
      overflow ||= flow.scrollWidth > width * 2 + 3;
    });
  }
  return overflow;
}

export default function ResumePages({ children }) {
  const sourceRef = useRef(null);
  const pageRefs = useRef([]);
  const [status, setStatus] = useState({ ready: false, overflow: false });

  useLayoutEffect(() => {
    const source = sourceRef.current?.firstElementChild;
    if (!source) return undefined;
    let cancelled = false;
    let frame;
    const updatePages = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (cancelled) return;
        const overflow = paginatePages(pageRefs.current, source);
        setStatus({ ready: true, overflow });
      });
    };
    updatePages();
    document.fonts?.ready.then(updatePages);
    const images = [...source.querySelectorAll("img")];
    images.forEach((image) => image.addEventListener("load", updatePages));
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      images.forEach((image) => image.removeEventListener("load", updatePages));
    };
  }, [children]);

  return (
    <div className="cv-resume-pages" data-pagination-ready={status.ready} data-resume-overflow={status.overflow}>
      <div ref={sourceRef} className="cv-pagination-source">{children}</div>
      {[0, 1].map((index) => <div key={index} ref={(node) => { pageRefs.current[index] = node; }} className="cv-resume-page" data-cv-page={index + 1} aria-hidden="true" />)}
      {status.overflow && <p role="alert" className="cv-pagination-error print:hidden">Nội dung vượt quá 2 trang A4. Hãy rút gọn nội dung trước khi xuất PDF.</p>}
    </div>
  );
}
