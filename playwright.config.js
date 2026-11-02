// Browser tests against the playground: real CSS, layout and focus, which jsdom cannot show.
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.js",
  use: { baseURL: "http://localhost:5173", browserName: "chromium" },
  webServer: [
    { command: "npm run build && npx --yes serve -l 5173 .", url: "http://localhost:5173/playground/", reuseExistingServer: true },
    // The assembled Pages site with _site as root, so /docs/ resolves as on gridselect.im (npm run test:e2e builds it first).
    { command: "npx --yes serve -l 5174 _site", url: "http://localhost:5174/docs/", reuseExistingServer: true },
  ],
});
