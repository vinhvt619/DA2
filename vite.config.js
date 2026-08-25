import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("pdfjs-dist")) return "pdf-vendor";
          if (
            id.includes("@tiptap") ||
            id.includes("prosemirror") ||
            id.includes("@remirror")
          ) {
            return "rich-text-vendor";
          }
          if (id.includes("@radix-ui") || id.includes("@floating-ui")) {
            return "ui-vendor";
          }
          if (id.includes("date-fns")) return "date-vendor";
          if (id.includes("socket.io")) return "realtime-vendor";
          if (id.includes("react-router")) return "router-vendor";
          if (id.includes("@tanstack/react-query")) return "query-vendor";
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform/resolvers") ||
            id.includes("zod")
          ) {
            return "form-vendor";
          }
          if (
            id.includes("/node_modules/react/") ||
            id.includes("react-dom") ||
            id.includes("scheduler") ||
            id.includes("use-sync-external-store") ||
            id.includes("react-error-boundary") ||
            id.includes("react-to-print") ||
            id.includes("sonner")
          ) {
            return "react-vendor";
          }
          return undefined;
        },
      },
    },
  },
  resolve: {
    // Tiptap uses React hooks internally. Dedupe these packages so Vite never
    // serves Tiptap with a second React instance during local development.
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "@tiptap/react",
      "@tiptap/react/menus",
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 4000,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/socket.io": { target: "http://localhost:5000", ws: true },
    },
  },
});
