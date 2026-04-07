// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  retries: 2,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["json", { outputFile: "test-results/results.json" }]
  ],
  use: {
    baseURL: "https://agentic-flow-designer.vercel.app",
    trace: "on-first-retry",
    screenshot: "on",
    video: "on-first-retry",
    actionTimeout: 15000,
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Desktop Firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
