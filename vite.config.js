import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
