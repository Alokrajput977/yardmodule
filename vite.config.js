import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://kycl.in",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});