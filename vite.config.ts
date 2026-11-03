import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxies http://localhost:5173/app/* -> https://hrms.scoobies.ai/app/*
      // Eliminates browser CORS preflight blocking in local development
      "/app": {
        target: "https://hrms.scoobies.ai",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

