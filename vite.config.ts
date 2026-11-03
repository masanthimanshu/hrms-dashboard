import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@mui/icons-material")) return "vendor-icons";
            if (id.includes("@mui") || id.includes("@emotion"))
              return "vendor-mui";
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            )
              return "vendor-react";
            if (id.includes("axios")) return "vendor-axios";
            return "vendor-core";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/app": {
        target: "https://hrms.scoobies.ai",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
