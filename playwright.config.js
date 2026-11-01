// Browser tests against the playground: real CSS, layout and focus, which jsdom cannot show.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.js",
  use: { baseURL: "http://localhost:5173", browserName: "chromium" },
  webServer: { command: "npx --yes serve -l 5173 .", url: "http://localhost:5173/playground/", reuseExistingServer: true },
});
