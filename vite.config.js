import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  optimizeDeps: {
    include: ["@mui/material/Tooltip", "@emotion/styled"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: { port: 4000, strictPort: true },
});
