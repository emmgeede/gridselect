// Only for npm run screenshots: renders README images from the demo page.
import base from "./playwright.config.js";
import { defineConfig } from "@playwright/test";

export default defineConfig({ ...base, testDir: "scripts", testMatch: "screenshots.js" });
