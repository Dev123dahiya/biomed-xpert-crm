import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks so a deploy only re-downloads app code.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["motion/react"],
          data: ["@tanstack/react-query", "axios", "react-hook-form"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/uploads": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
