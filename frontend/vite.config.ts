import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      devOptions: {
        enabled: false,
      },

      manifest: {
        name: "Somni",
        short_name: "Somni",

        description:
          "이명으로 잠들기 어려운 사용자를 위한 AI 맞춤 수면 서비스",

        theme_color: "#69F7E9",
        background_color: "#000000",

        display: "standalone",
        start_url: "/",

        icons: [
          {
            src: "/icons/pwa-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],

  server: {
    port: 5273,
    strictPort: true,

    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});