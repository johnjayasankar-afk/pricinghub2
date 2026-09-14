import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  root: import.meta.dirname,
  test: {
    environment: "node",
    dir: "src",
  },
});
