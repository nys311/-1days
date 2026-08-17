import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// -1 DAYS client — Vite config.
// Talks to exactly one backend origin at runtime (the gateway, via Socket.IO) plus
// the auth service directly over REST for login. See .env.example.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
