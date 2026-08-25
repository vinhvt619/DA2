import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import React, { useMemo } from "react";

const extensions = [StarterKit];

function toTiptapDocument(content) {
  if (content && typeof content === "object") return content;
  if (typeof content !== "string" || !content.trim()) return null;
  return generateJSON(content, extensions);
}

export default function RichTextContent({ content, className = "" }) {
  const renderedContent = useMemo(() => {
    try {
      const document = toTiptapDocument(content);
      if (!document) return null;
      return renderToReactElement({ content: document, extensions });
    } catch (error) {
      console.error("Không thể render rich text:", error);
      return typeof content === "string" ? content : null;
    }
  }, [content]);

  if (!renderedContent) return null;
  return <div className={className}>{renderedContent}</div>;
}
