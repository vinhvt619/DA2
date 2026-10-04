import { generateJSON, getSchema } from "@tiptap/core";
import { Node } from '@tiptap/pm/model';
import StarterKit from "@tiptap/starter-kit";
import Image from '@tiptap/extension-image';
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import React, { useMemo } from "react";

const extensions = [StarterKit];
const newsExtensions = [StarterKit, Image.configure({ allowBase64: true })];

function toTiptapDocument(content, activeExtensions) {
  if (content && typeof content === "object") return content;
  if (typeof content !== "string" || !content.trim()) return null;
  return generateJSON(content, activeExtensions);
}

export default function RichTextContent({ content, className = "", article = false }) {
  const renderedContent = useMemo(() => {
    try {
      const activeExtensions = article ? newsExtensions : extensions;
      const document = toTiptapDocument(content, activeExtensions);
      if (!document) return null;
      const renderDocument = article ? Node.fromJSON(getSchema(activeExtensions), document) : document;
      const headingIds = new WeakMap();
      if (article) {
        let index = 0;
        renderDocument.descendants((node) => { if (node.type.name === 'heading') headingIds.set(node, `section-${index++}`); });
      }
      return renderToReactElement({ content: renderDocument, extensions: activeExtensions, options: article ? {
        nodeMapping: {
          heading: ({ node, children }) => React.createElement(`h${node.attrs.level}`, { id: headingIds.get(node) }, children),
        },
      } : undefined });
    } catch (error) {
      console.error("Không thể render rich text:", error);
      return typeof content === "string" ? content : null;
    }
  }, [content, article]);

  if (!renderedContent) return null;
  return <div className={className}>{renderedContent}</div>;
}
