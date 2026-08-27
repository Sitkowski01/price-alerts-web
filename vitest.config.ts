import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    // jsdom, bo część testów montuje komponenty i sięga do DOM.
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
